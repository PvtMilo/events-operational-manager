import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Event id is required",
    });
  }

  await prisma.event.delete({
    where: {
      id,
    },
  });

  return {
    success: true,
    message: "Event deleted successfully",
  };
});