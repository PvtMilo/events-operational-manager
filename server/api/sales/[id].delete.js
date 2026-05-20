import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
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

  const updatedSales = await prisma.sales.update({
    where: { id },
    data: {
      status: "INACTIVE",
    },
  });

  return {
    success: true,
    message: "Sales deactivated successfully",
    data: updatedSales,
  };
});
