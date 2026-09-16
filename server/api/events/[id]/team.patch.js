import { prisma } from "../../../utils/prisma";
import {
  assertNoStaffTimeConflict,
  lockStaffRows,
} from "../../../utils/availability";
import { createEventLog } from "../../../utils/event-log";

const activeAssignmentStatuses = ["ASSIGNED", "CONFIRMED"];
const allowedRoles = ["PIC", "CREW"];
const allowedStatuses = ["ASSIGNED", "CONFIRMED"];

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Event id is required",
    });
  }

  const team = Array.isArray(body?.team) ? body.team : [];

  const targetEvent = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!targetEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: "Event not found",
    });
  }

  const selectedStaffIds = new Set();

  for (const item of team) {
    if (!item?.staffId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Staff id is required in team item",
      });
    }

    if (selectedStaffIds.has(item.staffId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Duplicate staff in selected team",
      });
    }

    selectedStaffIds.add(item.staffId);

    if (!allowedRoles.includes(item.roleInEvent)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid role in team item",
      });
    }

    if (!allowedStatuses.includes(item.assignmentStatus)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid assignment status in team item",
      });
    }
  }

  const staffList = await prisma.staff.findMany({
    where: {
      id: {
        in: [...selectedStaffIds],
      },
    },
  });

  if (staffList.length !== selectedStaffIds.size) {
    throw createError({
      statusCode: 400,
      statusMessage: "One or more selected staff were not found",
    });
  }

  const invalidStaff = staffList.find((staff) => {
    return staff.status !== "ACTIVE" || staff.canBeAssignedToEvent !== true;
  });

  if (invalidStaff) {
    throw createError({
      statusCode: 400,
      statusMessage: `${invalidStaff.name} cannot be assigned to event`,
    });
  }

  const created = [];
  const updated = [];
  const cancelled = [];

  await prisma.$transaction(async (tx) => {
    await lockStaffRows(tx, [...selectedStaffIds]);

    for (const item of team) {
      await assertNoStaffTimeConflict(tx, {
        staffId: item.staffId,
        eventId,
        eventData: targetEvent,
      });
    }

    const existingAssignments = await tx.eventAssignment.findMany({
      where: {
        eventId,
      },
      include: {
        staff: true,
      },
    });

    const existingByStaffId = new Map(
      existingAssignments.map((assignment) => [assignment.staffId, assignment]),
    );

    for (const item of team) {
      const existing = existingByStaffId.get(item.staffId);
      const notes = item.notes?.trim() || null;

      if (existing) {
        await tx.eventAssignment.update({
          where: {
            id: existing.id,
          },
          data: {
            roleInEvent: item.roleInEvent,
            assignmentStatus: item.assignmentStatus,
            notes,
          },
        });

        updated.push({
          staffId: item.staffId,
          staffName: existing.staff?.name,
          roleInEvent: item.roleInEvent,
          assignmentStatus: item.assignmentStatus,
        });
      } else {
        const newAssignment = await tx.eventAssignment.create({
          data: {
            eventId,
            staffId: item.staffId,
            roleInEvent: item.roleInEvent,
            assignmentStatus: item.assignmentStatus,
            notes,
          },
          include: {
            staff: true,
          },
        });

        created.push({
          staffId: item.staffId,
          staffName: newAssignment.staff?.name,
          roleInEvent: item.roleInEvent,
          assignmentStatus: item.assignmentStatus,
        });
      }
    }

    for (const assignment of existingAssignments) {
      const isSelected = selectedStaffIds.has(assignment.staffId);
      const isCurrentlyActive = activeAssignmentStatuses.includes(
        assignment.assignmentStatus,
      );

      if (!isSelected && isCurrentlyActive) {
        await tx.eventAssignment.update({
          where: {
            id: assignment.id,
          },
          data: {
            assignmentStatus: "CANCELLED",
          },
        });

        cancelled.push({
          staffId: assignment.staffId,
          staffName: assignment.staff?.name,
          previousStatus: assignment.assignmentStatus,
          newStatus: "CANCELLED",
        });
      }
    }
  });

  await createEventLog(event, {
    eventId,
    action: "EVENT_TEAM_UPDATED",
    description: "Event team updated",
    metadata: {
      created,
      updated,
      cancelled,
    },
  });

  return {
    success: true,
    message: "Event team updated successfully",
    data: {
      created,
      updated,
      cancelled,
    },
  };
});