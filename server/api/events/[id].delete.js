import { prisma } from "../../utils/prisma";
import { createEventLog } from "../../utils/event-log";

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

  await createEventLog(event, {
    eventId: id,
    action: "EVENT_CANCELLED",
    description: "Event cancelled",
    metadata: {
      previousStatus: eventData.status,
      newStatus: "CANCELLED",
    },
  });

  return {
    success: true,
    message: "Event cancelled successfully",
    data: updatedEvent,
  };
});
