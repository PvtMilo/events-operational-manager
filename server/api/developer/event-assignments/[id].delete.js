import { prisma } from "../../../utils/prisma";
import { requireDeveloper } from "../../../utils/permission";

export default defineEventHandler(async (event) => {
  await requireDeveloper(event);

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

  await prisma.eventAssignment.delete({
    where: { id },
  });

  return {
    success: true,
    message: "Assignment hard deleted successfully",
  };
});
