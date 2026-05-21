import { prisma } from "../../../utils/prisma";
import { requireDeveloper } from "../../../utils/permission";

export default defineEventHandler(async (event) => {
  await requireDeveloper(event);

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

  await prisma.serviceType.delete({
    where: { id },
  });

  return {
    success: true,
    message: "Service type hard deleted successfully",
  };
});
