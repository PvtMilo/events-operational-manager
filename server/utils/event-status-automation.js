import { prisma } from "./prisma";

export const activeEventAssignmentStatuses = ["ASSIGNED", "CONFIRMED"];

export const allowedEventStatuses = [
  "DRAFTED",
  "SCHEDULED",
  "ONGOING",
  "PENDING_EVALUATION",
  "COMPLETED",
  "CANCELLED",
];

function combineEventDateAndTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;

  const dateKey = new Date(dateValue).toISOString().slice(0, 10);

  return new Date(`${dateKey}T${timeValue}:00`);
}

export function getEventTimeWindow(eventData) {
  const start = combineEventDateAndTime(
    eventData?.eventDate,
    eventData?.startTime,
  );
  const end = combineEventDateAndTime(eventData?.eventDate, eventData?.endTime);

  if (!start || !end) return { start: null, end: null };

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
}

export function getActiveEventAssignments(eventData) {
  return (eventData?.assignments || []).filter((assignment) => {
    return activeEventAssignmentStatuses.includes(assignment.assignmentStatus);
  });
}

export function canAutoAdvanceEvent(eventData, targetStatus) {
  const activeAssignments = getActiveEventAssignments(eventData);

  if (targetStatus === "ONGOING") {
    return activeAssignments.some((assignment) => {
      return assignment.roleInEvent === "PIC";
    });
  }

  if (targetStatus === "PENDING_EVALUATION") {
    return activeAssignments.length > 0;
  }

  return true;
}

export function getAutomaticEventStatus(eventData, now = new Date()) {
  if (!eventData) return null;

  const { start, end } = getEventTimeWindow(eventData);

  if (!start || !end) return null;

  if (eventData.status === "SCHEDULED") {
    if (
      now >= end &&
      canAutoAdvanceEvent(eventData, "ONGOING") &&
      canAutoAdvanceEvent(eventData, "PENDING_EVALUATION")
    ) {
      return "PENDING_EVALUATION";
    }

    if (now >= start && canAutoAdvanceEvent(eventData, "ONGOING")) {
      return "ONGOING";
    }
  }

  if (
    eventData.status === "ONGOING" &&
    now >= end &&
    canAutoAdvanceEvent(eventData, "PENDING_EVALUATION")
  ) {
    return "PENDING_EVALUATION";
  }

  return null;
}

async function writeAutomaticStatusLog(tx, eventData, nextStatus) {
  await tx.eventActivityLog.create({
    data: {
      eventId: eventData.id,
      userId: null,
      action: "EVENT_STATUS_AUTO_UPDATED",
      description: `Event status automatically changed from ${eventData.status} to ${nextStatus}`,
      metadata: {
        previousStatus: eventData.status,
        newStatus: nextStatus,
      },
    },
  });
}

export async function syncAutomaticEventStatusById(eventId) {
  if (!eventId) return null;

  const eventData = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
    include: {
      assignments: true,
    },
  });

  if (!eventData) return null;

  const nextStatus = getAutomaticEventStatus(eventData);

  if (!nextStatus || nextStatus === eventData.status) {
    return eventData;
  }

  return await prisma.$transaction(async (tx) => {
    const updateResult = await tx.event.updateMany({
      where: {
        id: eventData.id,
        status: eventData.status,
      },
      data: {
        status: nextStatus,
      },
    });

    if (updateResult.count === 1) {
      await writeAutomaticStatusLog(tx, eventData, nextStatus);
    }

    return await tx.event.findUnique({
      where: {
        id: eventData.id,
      },
    });
  });
}

export async function syncAutomaticEventStatuses() {
  const candidates = await prisma.event.findMany({
    where: {
      status: {
        in: ["SCHEDULED", "ONGOING"],
      },
    },
    include: {
      assignments: true,
    },
  });

  const updates = candidates
    .map((eventData) => ({
      eventData,
      nextStatus: getAutomaticEventStatus(eventData),
    }))
    .filter((item) => item.nextStatus && item.nextStatus !== item.eventData.status);

  if (!updates.length) return 0;

  await prisma.$transaction(async (tx) => {
    for (const { eventData, nextStatus } of updates) {
      const updateResult = await tx.event.updateMany({
        where: {
          id: eventData.id,
          status: eventData.status,
        },
        data: {
          status: nextStatus,
        },
      });

      if (updateResult.count === 1) {
        await writeAutomaticStatusLog(tx, eventData, nextStatus);
      }
    }
  });

  return updates.length;
}
