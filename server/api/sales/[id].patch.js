import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);

  const name = body?.name?.trim();
  const phone = body?.phone?.trim() || null;
  const notes = body?.notes?.trim() || null;
  const status = body?.status || "ACTIVE";

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Sales id is required",
    });
  }

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Sales name is required",
    });
  }

  if (!["ACTIVE", "INACTIVE"].includes(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid sales status",
    });
  }

  const existingSales = await prisma.sales.findUnique({
    where: { id },
  });

  if (!existingSales) {
    throw createError({
      statusCode: 404,
      statusMessage: "Sales not found",
    });
  }

  const updatedSales = await prisma.sales.update({
    where: { id },
    data: {
      name,
      phone,
      notes,
      status,
    },
  });

  return {
    success: true,
    data: updatedSales,
  };
});
