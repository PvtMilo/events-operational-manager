import { prisma } from "../../../utils/prisma";
import { requireDeveloper } from "../../../utils/permission";

export default defineEventHandler(async (event) => {
  await requireDeveloper(event);

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Sales id is required",
    });
  }

  const sales = await prisma.sales.findUnique({
    where: { id },
  });

  if (!sales) {
    throw createError({
      statusCode: 404,
      statusMessage: "Sales not found",
    });
  }

  await prisma.sales.delete({
    where: { id },
  });

  return {
    success: true,
    message: "Sales hard deleted successfully",
  };
});
