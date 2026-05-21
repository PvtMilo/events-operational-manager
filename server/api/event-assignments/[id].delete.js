import { prisma } from "../../utils/prisma";
import { createEventLog } from "../../utils/event-log";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Assignment id is required",
    });
  }

  const assignment = await prisma.eventAssignment.findUnique({
    where: { id },
    include: {
      staff: true,
    },
  });

  if (!assignment) {
    throw createError({
      statusCode: 404,
      statusMessage: "Assignment not found",
    });
  }

  const updatedAssignment = await prisma.eventAssignment.update({
    where: { id },
    data: {
      assignmentStatus: "CANCELLED",
    },
    include: {
      staff: true,
    },
  });

  await createEventLog(event, {
    eventId: assignment.eventId,
    action: "ASSIGNMENT_CANCELLED",
    description: `${assignment.staff?.name || "Staff"} assignment cancelled`,
    metadata: {
      assignmentId: id,
      staffId: assignment.staffId,
      staffName: assignment.staff?.name,
      previousStatus: assignment.assignmentStatus,
      newStatus: "CANCELLED",
    },
  });

  return {
    success: true,
    message: "Assignment cancelled successfully",
    data: updatedAssignment,
  };
});
