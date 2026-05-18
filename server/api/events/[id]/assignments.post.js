import { prisma } from "../../../utils/prisma";
import { getEventDutyWindow, isTimeOverlap } from "../../../utils/availability";

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

  const existingAssignment = await prisma.eventAssignment.findUnique({
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

  const { dutyStart: targetStart, dutyEnd: targetEnd } =
    getEventDutyWindow(eventData);

  const otherAssignments = await prisma.eventAssignment.findMany({
    where: {
      staffId,
      eventId: {
        not: eventId,
      },
      assignmentStatus: {
        not: "CANCELLED",
      },
    },
    include: {
      event: true,
    },
  });

  for (const assignment of otherAssignments) {
    if (!assignment.event) continue;

    const { dutyStart: existingStart, dutyEnd: existingEnd } =
      getEventDutyWindow(assignment.event);

    const hasOverlap = isTimeOverlap(
      targetStart,
      targetEnd,
      existingStart,
      existingEnd
    );

    if (hasOverlap) {
      throw createError({
        statusCode: 400,
        statusMessage: `Time conflict with event: ${assignment.event.eventName}`,
      });
    }
  }

  const assignment = await prisma.eventAssignment.create({
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

  return {
    success: true,
    data: assignment,
  };
});