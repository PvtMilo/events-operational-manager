import { prisma } from "../../utils/prisma";
import { createEventLog } from "../../utils/event-log";
import {
  canTransitionEventStatus,
  cancelActiveAssignments,
} from "../../utils/event-lifecycle";

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

  if (eventData.status === "CANCELLED") {
    throw createError({
      statusCode: 400,
      statusMessage: "Event is already cancelled",
    });
  }

  if (!canTransitionEventStatus(eventData.status, "CANCELLED")) {
    throw createError({
      statusCode: 400,
      statusMessage: `${eventData.status} event cannot be cancelled`,
    });
  }

  const { updatedEvent, cancelledAssignments } = await prisma.$transaction(
    async (tx) => {
      const cancelled = await cancelActiveAssignments(tx, id);

      const updated = await tx.event.update({
        where: { id },
        data: {
          status: "CANCELLED",
        },
      });

      return { updatedEvent: updated, cancelledAssignments: cancelled };
    },
  );

  await createEventLog(event, {
    eventId: id,
    action: "EVENT_CANCELLED",
    description: "Event cancelled",
    metadata: {
      previousStatus: eventData.status,
      newStatus: "CANCELLED",
      cancelledAssignments,
    },
  });

  return {
    success: true,
    message: "Event cancelled successfully",
    data: updatedEvent,
  };
});
