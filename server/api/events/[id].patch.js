import { prisma } from "../../utils/prisma";
import { createEventLog } from "../../utils/event-log";
import {
  assertStaffCanTakeEvent,
  assertValidEventSchedule,
  getDateKey,
  lockEventRows,
  lockStaffRows,
} from "../../utils/availability";
import { getActiveAssignments } from "../../utils/event-lifecycle";

function isSameDateValue(dateA, dateB) {
  if (!dateA && !dateB) return true;
  if (!dateA || !dateB) return false;

  return getDateKey(dateA) === getDateKey(dateB);
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

  assertValidEventSchedule({
    eventDate,
    startTime,
    endTime,
    loadingDate,
    loadingTime,
  });

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

  const nextSchedule = {
    eventDate: new Date(eventDate),
    startTime,
    endTime,
    loadingDate: loadingDate ? new Date(loadingDate) : null,
    loadingTime,
  };

  const scheduleChanged =
    !isSameDateValue(existingEvent.eventDate, nextSchedule.eventDate) ||
    existingEvent.startTime !== startTime ||
    existingEvent.endTime !== endTime ||
    !isSameDateValue(existingEvent.loadingDate, nextSchedule.loadingDate) ||
    (existingEvent.loadingTime || null) !== loadingTime;

  const updatedEvent = await prisma.$transaction(async (tx) => {
    if (scheduleChanged) {
      await lockEventRows(tx, [eventId]);

      const activeAssignments = getActiveAssignments(
        await tx.eventAssignment.findMany({
          where: {
            eventId,
          },
          include: {
            staff: true,
          },
        }),
      );

      await lockStaffRows(
        tx,
        activeAssignments.map((assignment) => assignment.staffId),
      );

      for (const assignment of activeAssignments) {
        await assertStaffCanTakeEvent(tx, {
          staffId: assignment.staffId,
          staffName: assignment.staff?.name,
          eventId,
          eventData: { ...existingEvent, ...nextSchedule },
        });
      }
    }

    return await tx.event.update({
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
        ...nextSchedule,
        location,
        vehicleName,
        driverName,
        vendorSewa,
        notes,
      },
    });
  });

  await createEventLog(event, {
    eventId,
    action: "EVENT_UPDATED",
    description: "Event updated",
    metadata: {
      eventName: updatedEvent.eventName,
      clientName: updatedEvent.clientName,
      scheduleChanged,
      ...(scheduleChanged
        ? {
            previousSchedule: {
              eventDate: existingEvent.eventDate,
              startTime: existingEvent.startTime,
              endTime: existingEvent.endTime,
              loadingDate: existingEvent.loadingDate,
              loadingTime: existingEvent.loadingTime,
            },
            newSchedule: nextSchedule,
          }
        : {}),
    },
  });

  return {
    success: true,
    data: updatedEvent,
  };
});
