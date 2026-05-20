import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Event id is required",
    });
  }

  const eventName = body?.eventName?.trim();
  const clientName = body?.clientName?.trim();
  const clientPhone = body?.clientPhone?.trim() || null;
  const serviceTypeId = body?.serviceTypeId;
  const equipmentSetup = body?.equipmentSetup?.trim();
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

  if (!equipmentSetup) {
    throw createError({
      statusCode: 400,
      statusMessage: "Equipment setup is required",
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
      vehicleName,
      driverName,
      vendorSewa,
      notes,
    },
  });

  return {
    success: true,
    data: updatedEvent,
  };
});