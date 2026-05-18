import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Service type id is required",
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