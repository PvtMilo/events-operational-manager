import { prisma } from "../../../utils/prisma";
import { requireDeveloper } from "../../../utils/permission";

export default defineEventHandler(async (event) => {
  const currentUser = await requireDeveloper(event);

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "User id is required",
    });
  }

  if (id === currentUser.id) {
    throw createError({
      statusCode: 400,
      statusMessage: "You cannot hard delete your own account",
    });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
    },
  });

  if (!targetUser) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }

  const [staffEvaluationDelete, eventEvaluationDelete] =
    await prisma.$transaction([
      prisma.staffEventEvaluation.deleteMany({
        where: {
          evaluatorUserId: id,
        },
      }),
      prisma.eventEvaluation.deleteMany({
        where: {
          evaluatorUserId: id,
        },
      }),
      prisma.user.delete({
        where: { id },
      }),
    ]);

  return {
    success: true,
    message: "User hard deleted successfully",
    deletedEvaluations: {
      staff: staffEvaluationDelete.count,
      event: eventEvaluationDelete.count,
    },
  };
});
