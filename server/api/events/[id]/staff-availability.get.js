import { prisma } from "../../../utils/prisma";
import {
  getEventDutyWindow,
  isSameDate,
  isTimeOverlap,
} from "../../../utils/availability";

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, "id");

  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Event id is required",
    });
  }

  const targetEvent = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!targetEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: "Event not found",
    });
  }

  const { dutyStart: targetStart, dutyEnd: targetEnd } =
    getEventDutyWindow(targetEvent);

  const staffList = await prisma.staff.findMany({
    where: {
      status: "ACTIVE",
      canBeAssignedToEvent: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const existingAssignments = await prisma.eventAssignment.findMany({
    where: {
      eventId: {
        not: eventId,
      },
      assignmentStatus: {
        not: "CANCELLED",
      },
    },
    include: {
      event: true,
    },
  });

  const result = staffList.map((staff) => {
    const staffAssignments = existingAssignments.filter((assignment) => {
      return assignment.staffId === staff.id;
    });

    let availabilityStatus = "AVAILABLE";
    let conflictEvent = null;
    let sameDayEvent = null;

    for (const assignment of staffAssignments) {
      if (!assignment.event) continue;

      const existingEvent = assignment.event;

      const { dutyStart: existingStart, dutyEnd: existingEnd } =
        getEventDutyWindow(existingEvent);

      const hasOverlap = isTimeOverlap(
        targetStart,
        targetEnd,
        existingStart,
        existingEnd,
      );

      if (hasOverlap) {
        availabilityStatus = "TIME_CONFLICT";
        conflictEvent = {
          id: existingEvent.id,
          eventName: existingEvent.eventName,
          eventDate: existingEvent.eventDate,
          startTime: existingEvent.startTime,
          endTime: existingEvent.endTime,
        };
        break;
      }

      const targetSameDay = isSameDate(targetStart, existingStart);

      if (targetSameDay && availabilityStatus !== "TIME_CONFLICT") {
        availabilityStatus = "SAME_DAY_AVAILABLE";
        sameDayEvent = {
          id: existingEvent.id,
          eventName: existingEvent.eventName,
          eventDate: existingEvent.eventDate,
          startTime: existingEvent.startTime,
          endTime: existingEvent.endTime,
        };
      }
    }

    return {
      ...staff,
      availabilityStatus,
      conflictEvent,
      sameDayEvent,
    };
  });

  return {
    success: true,
    data: result,
  };
});