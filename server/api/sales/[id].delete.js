import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Sales id is required",
    });
  }

  await prisma.sales.delete({
    where: {
      id,
    },
  });

  return {
    success: true,
    message: "Sales deleted successfully",
  };
});