import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const name = body?.name?.trim();
  const phone = body?.phone?.trim() || null;
  const notes = body?.notes?.trim() || null;
  const status = body?.status || "ACTIVE";

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Sales name is required",
    });
  }

  const sales = await prisma.sales.create({
    data: {
      name,
      phone,
      notes,
      status,
    },
  });

  return {
    success: true,
    data: sales,
  };
});