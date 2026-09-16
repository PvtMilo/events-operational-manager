import { prisma } from "../../../utils/prisma";
import {
  getEventDutyWindow,
  isAvailabilityBlockOverlap,
  isSameDate,
  isTimeOverlap,
} from "../../../utils/availability";

const DAY_MS = 24 * 60 * 60 * 1000;

function getMonthRange(dateValue) {
  const date = new Date(dateValue);

  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));

  return {
    start,
    end,
  };
}

function getAvailabilityBlockLabel(block) {
  if (block.isFullDay) {
    return block.type;
  }

  return `${block.type} (${block.startTime || "-"} - ${block.endTime || "-"})`;
}

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

  const { start: monthStart, end: monthEnd } = getMonthRange(
    targetEvent.eventDate,
  );

  const staffList = await prisma.staff.findMany({
    where: {
      status: "ACTIVE",
      canBeAssignedToEvent: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const staffIds = staffList.map((staff) => staff.id);

  const existingAssignments = await prisma.eventAssignment.findMany({
    where: {
      eventId: {
        not: eventId,
      },
      assignmentStatus: {
        in: ["ASSIGNED", "CONFIRMED"],
      },
      event: {
        status: {
          notIn: ["CANCELLED", "COMPLETED"],
        },
      },
    },
    include: {
      event: true,
    },
  });

  const monthlyAssignments = await prisma.eventAssignment.findMany({
    where: {
      assignmentStatus: {
        in: ["ASSIGNED", "CONFIRMED"],
      },
      event: {
        status: {
          not: "CANCELLED",
        },
        eventDate: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
    },
    include: {
      event: true,
    },
  });

  const availabilityBlocks = await prisma.staffAvailabilityBlock.findMany({
    where: {
      staffId: {
        in: staffIds,
      },
      status: "ACTIVE",
      startDate: {
        lte: new Date(targetEnd.getTime() + DAY_MS),
      },
      endDate: {
        gte: new Date(targetStart.getTime() - DAY_MS),
      },
    },
  });

  const result = staffList.map((staff) => {
    const staffAssignments = existingAssignments.filter((assignment) => {
      return assignment.staffId === staff.id;
    });

    const staffMonthlyAssignments = monthlyAssignments.filter((assignment) => {
      return assignment.staffId === staff.id;
    });

    const staffAvailabilityBlocks = availabilityBlocks.filter((block) => {
      return block.staffId === staff.id;
    });

    const monthlyEventCount = staffMonthlyAssignments.length;

    const monthlyPicCount = staffMonthlyAssignments.filter((assignment) => {
      return assignment.roleInEvent === "PIC";
    }).length;

    let availabilityStatus = "AVAILABLE";
    let conflictEvent = null;
    let sameDayEvent = null;
    let unavailableBlock = null;

    for (const block of staffAvailabilityBlocks) {
      if (isAvailabilityBlockOverlap(block, targetStart, targetEnd)) {
        availabilityStatus = "UNAVAILABLE";
        unavailableBlock = {
          id: block.id,
          type: block.type,
          label: getAvailabilityBlockLabel(block),
          startDate: block.startDate,
          endDate: block.endDate,
          isFullDay: block.isFullDay,
          startTime: block.startTime,
          endTime: block.endTime,
          reason: block.reason || "",
          notes: block.notes || "",
        };

        break;
      }
    }

    if (availabilityStatus !== "UNAVAILABLE") {
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
    }

    return {
      ...staff,
      availabilityStatus,
      conflictEvent,
      sameDayEvent,
      unavailableBlock,
      unavailableType: unavailableBlock?.type || null,
      unavailableReason: unavailableBlock?.reason || "",
      monthlyEventCount,
      monthlyPicCount,
    };
  });

  const availabilityRank = {
    AVAILABLE: 1,
    SAME_DAY_AVAILABLE: 2,
    UNAVAILABLE: 3,
    TIME_CONFLICT: 4,
  };

  result.sort((a, b) => {
    const rankA = availabilityRank[a.availabilityStatus] || 99;
    const rankB = availabilityRank[b.availabilityStatus] || 99;

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    if (a.monthlyEventCount !== b.monthlyEventCount) {
      return a.monthlyEventCount - b.monthlyEventCount;
    }

    if (a.monthlyPicCount !== b.monthlyPicCount) {
      return a.monthlyPicCount - b.monthlyPicCount;
    }

    return a.name.localeCompare(b.name);
  });

  return {
    success: true,
    data: result,
  };
});
