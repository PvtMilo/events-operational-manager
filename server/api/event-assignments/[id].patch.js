import { prisma } from "../../utils/prisma";
import {
  assertNoStaffTimeConflict,
  lockStaffRows,
} from "../../utils/availability";
import { activeEventAssignmentStatuses } from "../../utils/event-status-automation";
import { createEventLog } from "../../utils/event-log";

const allowedRoles = ["PIC", "CREW"];

const allowedStatuses = [
  "ASSIGNED",
  "CONFIRMED",
  "REPLACED",
  "CANCELLED",
];

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);

  const roleInEvent = body?.roleInEvent;
  const assignmentStatus = body?.assignmentStatus;
  const notes = body?.notes?.trim() || null;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Assignment id is required",
    });
  }

  if (!allowedRoles.includes(roleInEvent)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid role in event",
    });
  }

  if (!allowedStatuses.includes(assignmentStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid assignment status",
    });
  }

  const assignment = await prisma.eventAssignment.findUnique({
    where: {
      id,
    },
    include: {
      staff: true,
      event: true,
    },
  });

  if (!assignment) {
    throw createError({
      statusCode: 404,
      statusMessage: "Assignment not found",
    });
  }

  const isReactivating =
    activeEventAssignmentStatuses.includes(assignmentStatus) &&
    !activeEventAssignmentStatuses.includes(assignment.assignmentStatus);

  const updatedAssignment = await prisma.$transaction(async (tx) => {
    if (isReactivating) {
      await lockStaffRows(tx, [assignment.staffId]);
      await assertNoStaffTimeConflict(tx, {
        staffId: assignment.staffId,
        eventId: assignment.eventId,
        eventData: assignment.event,
      });
    }

    return await tx.eventAssignment.update({
      where: {
        id,
      },
      data: {
        roleInEvent,
        assignmentStatus,
        notes,
      },
      include: {
        staff: true,
      },
    });
  });

  await createEventLog(event, {
    eventId: updatedAssignment.eventId,
    action: "ASSIGNMENT_UPDATED",
    description: `${updatedAssignment.staff?.name} assignment updated`,
    metadata: {
      staffId: updatedAssignment.staffId,
      staffName: updatedAssignment.staff?.name,
      roleInEvent,
      assignmentStatus,
    },
  });

  return {
    success: true,
    data: updatedAssignment,
  };
});
