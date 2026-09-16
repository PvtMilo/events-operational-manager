import { prisma } from "../utils/prisma";
import { createEventLog } from "../utils/event-log";
import { assertValidEventSchedule } from "../utils/availability";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const eventName = body?.eventName?.trim();
  const clientName = body?.clientName?.trim();
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

  if (!eventName) {
    throw createError({
      statusCode: 400,
      statusMessage: "Event name is required",
    });
  }

  if (!clientName) {
    throw createError({
      statusCode: 400,
      statusMessage: "Client name is required",
    });
  }

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

  if (salesId) {
    const sales = await prisma.sales.findUnique({
      where: {
        id: salesId,
      },
    });

    if (!sales) {
      throw createError({
        statusCode: 404,
        statusMessage: "Sales not found",
      });
    }

    if (sales.status !== "ACTIVE") {
      throw createError({
        statusCode: 400,
        statusMessage: `Sales ${sales.name} is inactive and cannot be assigned to a new event`,
      });
    }
  }

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
