import { prisma } from "../../utils/prisma";

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

  return {
    success: true,
    message: "Assignment cancelled successfully",
    data: updatedAssignment,
  };
});
