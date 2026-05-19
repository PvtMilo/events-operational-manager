import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Event id is required",
    });
  }

  const eventData = await prisma.event.findUnique({
    where: {
      id,
    },
    include: {
      serviceType: true,
      sales: true,
      assignments: {
        include: {
          staff: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      eventEvaluation: true,
      staffEvaluations: {
        include: {
          staff: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!eventData) {
    throw createError({
      statusCode: 404,
      statusMessage: "Event not found",
    });
  }

  return {
    success: true,
    data: eventData,
  };
});