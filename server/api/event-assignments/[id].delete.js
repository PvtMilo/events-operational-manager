import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Assignment id is required",
    });
  }

  await prisma.eventAssignment.delete({
    where: {
      id,
    },
  });

  return {
    success: true,
    message: "Assignment deleted successfully",
  };
});