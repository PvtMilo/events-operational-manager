import { Prisma } from "../../prisma/generated/client";
import { activeEventAssignmentStatuses } from "./event-status-automation";

function combineDateAndTime(dateValue, timeValue) {
  const date = new Date(dateValue);

  const dateOnly = date.toISOString().slice(0, 10);
  const time = timeValue || "00:00";

  return new Date(`${dateOnly}T${time}:00`);
}

export function getEventDutyWindow(eventData) {
  const dutyStart =
    eventData.loadingDate && eventData.loadingTime
      ? combineDateAndTime(eventData.loadingDate, eventData.loadingTime)
      : combineDateAndTime(eventData.eventDate, eventData.startTime);

  const dutyEnd = combineDateAndTime(eventData.eventDate, eventData.endTime);

  return {
    dutyStart,
    dutyEnd,
  };
}

export function isTimeOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

export function isSameDate(dateA, dateB) {
  return dateA.toISOString().slice(0, 10) === dateB.toISOString().slice(0, 10);
}

// Serializes concurrent assignment writes for the same staff; must run inside a transaction.
export async function lockStaffRows(tx, staffIds) {
  const ids = [...new Set(staffIds)].sort();

  if (!ids.length) return;

  await tx.$queryRaw`SELECT id FROM staff WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE`;
}

export async function assertNoStaffTimeConflict(tx, { staffId, eventId, eventData }) {
  const { dutyStart: targetStart, dutyEnd: targetEnd } =
    getEventDutyWindow(eventData);

  const otherAssignments = await tx.eventAssignment.findMany({
    where: {
      staffId,
      eventId: {
        not: eventId,
      },
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

  for (const assignment of otherAssignments) {
    if (!assignment.event) continue;

    const { dutyStart: existingStart, dutyEnd: existingEnd } =
      getEventDutyWindow(assignment.event);

    if (isTimeOverlap(targetStart, targetEnd, existingStart, existingEnd)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Time conflict with event: ${assignment.event.eventName}`,
      });
    }
  }
}
