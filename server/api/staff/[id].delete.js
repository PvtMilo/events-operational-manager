import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Staff id is required",
    });
  }

  await prisma.staff.delete({
    where: {
      id,
    },
  });

  return {
    success: true,
    message: "Staff deleted successfully",
  };
});