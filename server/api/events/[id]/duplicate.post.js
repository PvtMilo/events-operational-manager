import { prisma } from "../../../utils/prisma";
import { createEventLog } from "../../../utils/event-log";

function getDuplicateEventName(eventName) {
  if (eventName.includes("Day 1")) {
    return eventName.replace("Day 1", "Day 2");
  }

  if (eventName.includes("day 1")) {
    return eventName.replace("day 1", "day 2");
  }

  if (eventName.includes("DAY 1")) {
    return eventName.replace("DAY 1", "DAY 2");
  }

  return `${eventName} Copy`;
}

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, "id");

  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Event id is required",
    });
  }

  const sourceEvent = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!sourceEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: "Event not found",
    });
  }

  const newEvent = await prisma.event.create({
    data: {
      eventName: getDuplicateEventName(sourceEvent.eventName),
      clientName: sourceEvent.clientName,
      clientPhone: sourceEvent.clientPhone,
      serviceTypeId: sourceEvent.serviceTypeId,
      equipmentSetup: sourceEvent.equipmentSetup,
      salesId: sourceEvent.salesId,
      eventDate: sourceEvent.eventDate,
      startTime: sourceEvent.startTime,
      endTime: sourceEvent.endTime,
      loadingDate: sourceEvent.loadingDate,
      loadingTime: sourceEvent.loadingTime,
      location: sourceEvent.location,
      vehicleName: sourceEvent.vehicleName,
      driverName: sourceEvent.driverName,
      vendorSewa: sourceEvent.vendorSewa,
      notes: sourceEvent.notes,
      status: "DRAFTED",
      loadingStatus: "NOT_PREPARED",
      ribbonStart: null,
      ribbonEnd: null,
      ribbonUsed: null,
    },
  });

  await createEventLog(event, {
    eventId: newEvent.id,
    action: "EVENT_DUPLICATED",
    description: `Event duplicated from ${sourceEvent.eventName}`,
    metadata: {
      sourceEventId: sourceEvent.id,
      newEventId: newEvent.id,
    },
  });

  return {
    success: true,
    message: "Event duplicated successfully",
    data: newEvent,
  };
});
