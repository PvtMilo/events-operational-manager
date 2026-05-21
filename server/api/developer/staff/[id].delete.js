import { prisma } from "../../../utils/prisma";
import { requireDeveloper } from "../../../utils/permission";

export default defineEventHandler(async (event) => {
  await requireDeveloper(event);

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Staff id is required",
    });
  }

  const staff = await prisma.staff.findUnique({
    where: { id },
  });

  if (!staff) {
    throw createError({
      statusCode: 404,
      statusMessage: "Staff not found",
    });
  }

  await prisma.staff.delete({
    where: { id },
  });

  return {
    success: true,
    message: "Staff hard deleted successfully",
  };
});
