import { prisma } from "../../../utils/prisma";
import { createEventLog } from "../../../utils/event-log";

function isBlankRibbonValue(value) {
  return value === "" || value === null || value === undefined;
}

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Event id is required",
    });
  }

  const existingEvent = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
    include: {
      serviceType: true,
    },
  });

  if (!existingEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: "Event not found",
    });
  }

  const requiresRibbonTracking =
    existingEvent.serviceType?.requiresRibbonTracking === true;
  const startBlank = isBlankRibbonValue(body?.ribbonStart);
  const endBlank = isBlankRibbonValue(body?.ribbonEnd);

  let ribbonStart = 0;
  let ribbonEnd = 0;

  if (!(requiresRibbonTracking === false && startBlank && endBlank)) {
    if (startBlank) {
      throw createError({
        statusCode: 400,
        statusMessage: "Ribbon awal is required",
      });
    }

    if (endBlank) {
      throw createError({
        statusCode: 400,
        statusMessage: "Ribbon akhir is required",
      });
    }

    ribbonStart = Number(body?.ribbonStart);
    ribbonEnd = Number(body?.ribbonEnd);
  }

  if (Number.isNaN(ribbonStart)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Ribbon awal is required",
    });
  }

  if (Number.isNaN(ribbonEnd)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Ribbon akhir is required",
    });
  }

  const ribbonUsed = ribbonStart - ribbonEnd;

  if (ribbonUsed < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Total penggunaan tidak boleh minus. Cek ribbon awal dan akhir.",
    });
  }

  if (requiresRibbonTracking && ribbonUsed <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Total penggunaan must be greater than 0 for this service type.",
    });
  }

  const updatedEvent = await prisma.event.update({
    where: {
      id: eventId,
    },
    data: {
      ribbonStart,
      ribbonEnd,
      ribbonUsed,
    },
  });

  await createEventLog(event, {
    eventId,
    action: "POST_EVENT_DATA_UPDATED",
    description: "Post event data updated",
    metadata: {
      ribbonStart,
      ribbonEnd,
      ribbonUsed,
    },
  });

  return {
    success: true,
    data: updatedEvent,
  };
});
