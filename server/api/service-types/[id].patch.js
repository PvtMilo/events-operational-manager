import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);

  const name = body?.name?.trim();
  const description = body?.description?.trim() || null;
  const requiresRibbonTracking = Boolean(body?.requiresRibbonTracking);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Service type id is required",
    });
  }

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Service type name is required",
    });
  }

  const existingServiceType = await prisma.serviceType.findUnique({
    where: {
      id,
    },
  });

  if (!existingServiceType) {
    throw createError({
      statusCode: 404,
      statusMessage: "Service type not found",
    });
  }

  const updatedServiceType = await prisma.serviceType.update({
    where: {
      id,
    },
    data: {
      name,
      description,
      requiresRibbonTracking,
    },
  });

  return {
    success: true,
    data: updatedServiceType,
  };
});
