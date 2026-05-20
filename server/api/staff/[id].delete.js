import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
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

  const updatedStaff = await prisma.staff.update({
    where: { id },
    data: {
      status: "INACTIVE",
      canBeAssignedToEvent: false,
    },
  });

  return {
    success: true,
    message: "Staff deactivated successfully",
    data: updatedStaff,
  };
});
