import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
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

  const updatedEvent = await prisma.event.update({
    where: { id },
    data: {
      status: "CANCELLED",
    },
  });

  return {
    success: true,
    message: "Event cancelled successfully",
    data: updatedEvent,
  };
});
