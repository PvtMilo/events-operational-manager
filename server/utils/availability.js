import { Prisma } from "../../prisma/generated/client";
import { activeEventAssignmentStatuses } from "./event-lifecycle";

// All schedule fields (eventDate + "HH:mm") describe Jakarta wall-clock time,
// so instants are built with an explicit offset instead of the server timezone.
const BUSINESS_TZ_OFFSET = "+07:00";
const BUSINESS_TZ_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTime(value) {
  return TIME_PATTERN.test(value || "");
}

export function getDateKey(dateValue) {
  return new Date(dateValue).toISOString().slice(0, 10);
}

export function getBusinessDateKey(dateValue) {
  return new Date(new Date(dateValue).getTime() + BUSINESS_TZ_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

export function combineDateAndTime(dateValue, timeValue) {
  if (!dateValue) return null;

  const time = timeValue || "00:00";

  return new Date(`${getDateKey(dateValue)}T${time}:00${BUSINESS_TZ_OFFSET}`);
}

function endOfBusinessDay(dateValue) {
  return new Date(`${getDateKey(dateValue)}T23:59:59.999${BUSINESS_TZ_OFFSET}`);
}

export function getEventTimeWindow(eventData) {
  if (!eventData?.eventDate || !eventData?.startTime || !eventData?.endTime) {
    return { start: null, end: null };
  }

  const start = combineDateAndTime(eventData.eventDate, eventData.startTime);
  const end = combineDateAndTime(eventData.eventDate, eventData.endTime);

  if (end <= start) {
    end.setTime(end.getTime() + DAY_MS);
  }

  return { start, end };
}

export function getEventDutyWindow(eventData) {
  const { start: eventStart, end: eventEnd } = getEventTimeWindow(eventData);

  const loadingStart =
    eventData.loadingDate && eventData.loadingTime
      ? combineDateAndTime(eventData.loadingDate, eventData.loadingTime)
      : null;

  const dutyStart =
    loadingStart && loadingStart < eventStart ? loadingStart : eventStart;

  return {
    dutyStart,
    dutyEnd: eventEnd,
  };
}

export function getAvailabilityBlockWindow(block) {
  if (block.isFullDay) {
    return {
      blockStart: combineDateAndTime(block.startDate, "00:00"),
      blockEnd: endOfBusinessDay(block.endDate),
    };
  }

  return {
    blockStart: combineDateAndTime(block.startDate, block.startTime || "00:00"),
    blockEnd: block.endTime
      ? combineDateAndTime(block.endDate, block.endTime)
      : endOfBusinessDay(block.endDate),
  };
}

export function isTimeOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

export function isAvailabilityBlockOverlap(block, targetStart, targetEnd) {
  const { blockStart, blockEnd } = getAvailabilityBlockWindow(block);

  return isTimeOverlap(targetStart, targetEnd, blockStart, blockEnd);
}

export function isSameDate(dateA, dateB) {
  return getBusinessDateKey(dateA) === getBusinessDateKey(dateB);
}

export function assertValidEventSchedule({
  eventDate,
  startTime,
  endTime,
  loadingDate,
  loadingTime,
}) {
  if (Number.isNaN(new Date(eventDate).getTime())) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid event date",
    });
  }

  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Start time and end time must use HH:mm format",
    });
  }

  if (loadingDate && Number.isNaN(new Date(loadingDate).getTime())) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid loading date",
    });
  }

  if (loadingTime && !isValidTime(loadingTime)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Loading time must use HH:mm format",
    });
  }

  if (loadingDate) {
    const eventStart = combineDateAndTime(eventDate, startTime);
    const loadingStart = combineDateAndTime(loadingDate, loadingTime || "00:00");

    if (loadingStart > eventStart) {
      throw createError({
        statusCode: 400,
        statusMessage: "Loading date/time cannot be after the event start",
      });
    }
  }
}

// Row locks serialize concurrent schedule writes; must run inside a transaction.
// Lock order everywhere is events first, then staff, to avoid deadlocks.
export async function lockEventRows(tx, eventIds) {
  const ids = [...new Set(eventIds)].sort();

  if (!ids.length) return;

  await tx.$queryRaw`SELECT id FROM events WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE`;
}

export async function lockStaffRows(tx, staffIds) {
  const ids = [...new Set(staffIds)].sort();

  if (!ids.length) return;

  await tx.$queryRaw`SELECT id FROM staff WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE`;
}

async function findOverlappingAssignments(tx, { staffId, excludeEventId, start, end }) {
  const assignments = await tx.eventAssignment.findMany({
    where: {
      staffId,
      ...(excludeEventId ? { eventId: { not: excludeEventId } } : {}),
      assignmentStatus: {
        in: activeEventAssignmentStatuses,
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

  return assignments.filter((assignment) => {
    if (!assignment.event) return false;

    const { dutyStart, dutyEnd } = getEventDutyWindow(assignment.event);

    return isTimeOverlap(start, end, dutyStart, dutyEnd);
  });
}

async function findOverlappingAvailabilityBlocks(tx, { staffId, start, end }) {
  // startDate/endDate are UTC-midnight dates while the real block window is in
  // Jakarta time, so prefilter one day wide on both sides and compare exactly below.
  const blocks = await tx.staffAvailabilityBlock.findMany({
    where: {
      staffId,
      status: "ACTIVE",
      startDate: {
        lte: new Date(end.getTime() + DAY_MS),
      },
      endDate: {
        gte: new Date(start.getTime() - DAY_MS),
      },
    },
  });

  return blocks.filter((block) => isAvailabilityBlockOverlap(block, start, end));
}

export async function assertStaffCanTakeEvent(
  tx,
  { staffId, staffName, eventId, eventData },
) {
  const { dutyStart, dutyEnd } = getEventDutyWindow(eventData);
  const prefix = staffName ? `${staffName}: ` : "";

  const [conflict] = await findOverlappingAssignments(tx, {
    staffId,
    excludeEventId: eventId,
    start: dutyStart,
    end: dutyEnd,
  });

  if (conflict) {
    throw createError({
      statusCode: 400,
      statusMessage: `${prefix}Time conflict with event: ${conflict.event.eventName}`,
    });
  }

  const [block] = await findOverlappingAvailabilityBlocks(tx, {
    staffId,
    start: dutyStart,
    end: dutyEnd,
  });

  if (block) {
    const reason = block.reason ? ` (${block.reason})` : "";

    throw createError({
      statusCode: 400,
      statusMessage: `${prefix}Staff is unavailable: ${block.type}${reason}`,
    });
  }
}

export async function assertNoActiveAssignmentsInBlock(tx, { staffId, block }) {
  const { blockStart, blockEnd } = getAvailabilityBlockWindow(block);

  const overlapping = await findOverlappingAssignments(tx, {
    staffId,
    start: blockStart,
    end: blockEnd,
  });

  if (overlapping.length) {
    const eventNames = overlapping
      .map((assignment) => assignment.event.eventName)
      .join(", ");

    throw createError({
      statusCode: 400,
      statusMessage: `Staff is still assigned to: ${eventNames}. Cancel or replace the assignment first.`,
    });
  }
}
