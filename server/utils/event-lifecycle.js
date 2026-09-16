export const activeEventAssignmentStatuses = ["ASSIGNED", "CONFIRMED"];

export const allowedEventStatuses = [
  "DRAFTED",
  "SCHEDULED",
  "READY",
  "ONGOING",
  "PENDING_EVALUATION",
  "COMPLETED",
  "CANCELLED",
];

export const eventStatusesRequiringPic = ["SCHEDULED", "READY", "ONGOING"];

// Backward steps (ONGOING -> SCHEDULED, PENDING_EVALUATION -> ONGOING) exist so a
// wrongly entered schedule can be corrected; automation re-advances when due.
const allowedEventStatusTransitions = {
  DRAFTED: ["SCHEDULED", "CANCELLED"],
  SCHEDULED: ["DRAFTED", "READY", "ONGOING", "PENDING_EVALUATION", "CANCELLED"],
  READY: ["SCHEDULED", "ONGOING", "PENDING_EVALUATION", "CANCELLED"],
  ONGOING: ["SCHEDULED", "PENDING_EVALUATION", "CANCELLED"],
  PENDING_EVALUATION: ["ONGOING", "COMPLETED", "CANCELLED"],
  COMPLETED: ["PENDING_EVALUATION"],
  CANCELLED: ["DRAFTED"],
};

export function canTransitionEventStatus(fromStatus, toStatus) {
  return (allowedEventStatusTransitions[fromStatus] || []).includes(toStatus);
}

export function getActiveAssignments(assignments) {
  return (assignments || []).filter((assignment) => {
    return activeEventAssignmentStatuses.includes(assignment.assignmentStatus);
  });
}

export function hasActivePic(assignments) {
  return getActiveAssignments(assignments).some((assignment) => {
    return assignment.roleInEvent === "PIC";
  });
}

export function assertEventKeepsPic(eventData, remainingAssignments) {
  if (!eventStatusesRequiringPic.includes(eventData.status)) return;

  if (!hasActivePic(remainingAssignments)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Event must keep at least 1 PIC while ${eventData.status}. Assign another PIC first.`,
    });
  }
}

export async function cancelActiveAssignments(tx, eventId) {
  const result = await tx.eventAssignment.updateMany({
    where: {
      eventId,
      assignmentStatus: {
        in: activeEventAssignmentStatuses,
      },
    },
    data: {
      assignmentStatus: "CANCELLED",
    },
  });

  return result.count;
}
