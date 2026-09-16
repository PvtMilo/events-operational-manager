import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Service type id is required",
    });
  }

  const serviceType = await prisma.serviceType.findUnique({
    where: { id },
  });

  if (!serviceType) {
    throw createError({
      statusCode: 404,
      statusMessage: "Service type not found",
    });
  }

  const eventCount = await prisma.event.count({
    where: {
      serviceTypeId: id,
    },
  });

  if (eventCount > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Service type is used by ${eventCount} event(s) and cannot be deleted`,
    });
  }

  await prisma.serviceType.delete({
    where: {
      id,
    },
  });

  return {
    success: true,
    message: "Service type deleted successfully",
  };
});
