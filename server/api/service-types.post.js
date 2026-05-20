import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const name = body?.name?.trim();
  const description = body?.description?.trim() || null;
  const requiresRibbonTracking = Boolean(body?.requiresRibbonTracking);

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Service type name is required",
    });
  }

  const serviceType = await prisma.serviceType.create({
    data: {
      name,
      description,
      requiresRibbonTracking,
    },
  });

  return {
    success: true,
    data: serviceType,
  };
});