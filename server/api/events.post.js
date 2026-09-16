import { prisma } from "../utils/prisma";
import { createEventLog } from "../utils/event-log";
import { assertValidEventSchedule } from "../utils/availability";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const eventName = body?.eventName?.trim() || "Untitled Event";
  const clientName = body?.clientName?.trim() || "Unknown Client";
  const clientPhone = body?.clientPhone?.trim() || null;
  const serviceTypeId = body?.serviceTypeId;
  const equipmentSetup = body?.equipmentSetup?.trim() || "Not specified";
  const salesId = body?.salesId || null;

  const eventDate = body?.eventDate;
  const startTime = body?.startTime;
  const endTime = body?.endTime;

  const loadingDate = body?.loadingDate || null;
  const loadingTime = body?.loadingTime || null;

  const location = body?.location?.trim() || null;

  const vehicleName = body?.vehicleName?.trim() || null;
  const driverName = body?.driverName?.trim() || null;
  const vendorSewa = body?.vendorSewa?.trim() || null;
  const notes = body?.notes?.trim() || null;

  if (!serviceTypeId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Service type is required",
    });
  }

  if (!eventDate) {
    throw createError({
      statusCode: 400,
      statusMessage: "Event date is required",
    });
  }

  if (!startTime || !endTime) {
    throw createError({
      statusCode: 400,
      statusMessage: "Start time and end time are required",
    });
  }

  assertValidEventSchedule({
    eventDate,
    startTime,
    endTime,
    loadingDate,
    loadingTime,
  });

  const createdEvent = await prisma.event.create({
    data: {
      eventName,
      clientName,
      clientPhone,
      serviceTypeId,
      equipmentSetup,
      salesId,
      eventDate: new Date(eventDate),
      startTime,
      endTime,
      loadingDate: loadingDate ? new Date(loadingDate) : null,
      loadingTime,
      location,
      status: "DRAFTED",
      vehicleName,
      driverName,
      vendorSewa,
      notes,
    },
  });

  await createEventLog(event, {
    eventId: createdEvent.id,
    action: "EVENT_CREATED",
    description: "Event created",
    metadata: {
      eventName: createdEvent.eventName,
      clientName: createdEvent.clientName,
    },
  });

  return {
    success: true,
    data: createdEvent,
  };
});
