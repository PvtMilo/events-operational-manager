import { prisma } from "../../../utils/prisma";
import { requireDeveloper } from "../../../utils/permission";

export default defineEventHandler(async (event) => {
  await requireDeveloper(event);

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Event id is required",
    });
  }

  const eventData = await prisma.event.findUnique({
    where: { id },
  });

  if (!eventData) {
    throw createError({
      statusCode: 404,
      statusMessage: "Event not found",
    });
  }

  await prisma.event.delete({
    where: { id },
  });

  return {
    success: true,
    message: "Event hard deleted successfully",
  };
});
