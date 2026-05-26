import { prisma } from "../../../utils/prisma";
import { createEventLog } from "../../../utils/event-log";

const allowedRoles = ["DEVELOPER", "ADMIN", "SCHEDULE_MAKER", "HEAD_OPERATIONAL"];

const allowedLoadingStatuses = [
  "NOT_PREPARED",
  "PREPARING",
  "LOADING",
  "LOADED",
];

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  const eventId = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Event id is required",
    });
  }

  const loadingStatus = body?.loadingStatus?.toString() || "";

  if (!allowedLoadingStatuses.includes(loadingStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid loading status",
    });
  }

  const existingEvent = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!existingEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: "Event not found",
    });
  }

  const updatedEvent = await prisma.event.update({
    where: {
      id: eventId,
    },
    data: {
      loadingStatus,
    },
  });

  await createEventLog(event, {
    eventId,
    action: "EVENT_LOADING_STATUS_UPDATED",
    description: `Loading status updated from ${existingEvent.loadingStatus || "NOT_PREPARED"} to ${loadingStatus}`,
    metadata: {
      previousLoadingStatus: existingEvent.loadingStatus || "NOT_PREPARED",
      newLoadingStatus: loadingStatus,
    },
  });

  return {
    success: true,
    message: "Loading status updated successfully",
    data: updatedEvent,
  };
});