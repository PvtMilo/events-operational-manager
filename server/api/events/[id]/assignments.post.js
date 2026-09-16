import { prisma } from "../../../utils/prisma";
import {
  assertStaffCanTakeEvent,
  lockEventRows,
  lockStaffRows,
} from "../../../utils/availability";
import { createEventLog } from "../../../utils/event-log";

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, "id");
  const body = await readBody(event);

  const staffId = body?.staffId;
  const roleInEvent = body?.roleInEvent || "CREW";
  const notes = body?.notes?.trim() || null;

  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Event id is required",
    });
  }

  if (!staffId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Staff is required",
    });
  }

  const eventData = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!eventData) {
    throw createError({
      statusCode: 404,
      statusMessage: "Event not found",
    });
  }

  const staff = await prisma.staff.findUnique({
    where: {
      id: staffId,
    },
  });

  if (!staff) {
    throw createError({
      statusCode: 404,
      statusMessage: "Staff not found",
    });
  }

  if (staff.status !== "ACTIVE") {
    throw createError({
      statusCode: 400,
      statusMessage: "Staff is not active",
    });
  }

  if (!staff.canBeAssignedToEvent) {
    throw createError({
      statusCode: 400,
      statusMessage: "Staff cannot be assigned to event",
    });
  }

  const assignment = await prisma.$transaction(async (tx) => {
    await lockEventRows(tx, [eventId]);
    await lockStaffRows(tx, [staffId]);

    const currentEvent = await tx.event.findUnique({
      where: {
        id: eventId,
      },
    });

    const existingAssignment = await tx.eventAssignment.findUnique({
      where: {
        eventId_staffId: {
          eventId,
          staffId,
        },
      },
    });

    if (existingAssignment) {
      throw createError({
        statusCode: 400,
        statusMessage: "Staff already assigned to this event",
      });
    }

    await assertStaffCanTakeEvent(tx, {
      staffId,
      eventId,
      eventData: currentEvent,
    });

    return await tx.eventAssignment.create({
      data: {
        eventId,
        staffId,
        roleInEvent,
        assignmentStatus: "ASSIGNED",
        notes,
      },
      include: {
        staff: true,
      },
    });
  });

  await createEventLog(event, {
    eventId,
    action: "STAFF_ASSIGNED",
    description: `${assignment.staff?.name} assigned as ${assignment.roleInEvent}`,
    metadata: {
      staffId,
      staffName: assignment.staff?.name,
      roleInEvent,
    },
  });

  return {
    success: true,
    data: assignment,
  };
});
