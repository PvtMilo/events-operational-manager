import { prisma } from "../../../utils/prisma";

const allowedStatuses = [
  "DRAFTED",
  "SCHEDULED",
  "READY",
  "ONGOING",
  "PENDING_EVALUATION",
  "COMPLETED",
  "CANCELLED",
];

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, "id");
  const body = await readBody(event);

  const status = body?.status;

  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Event id is required",
    });
  }

  if (!allowedStatuses.includes(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid event status",
    });
  }

  const eventData = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
    include: {
      assignments: true,
      eventEvaluation: true,
      staffEvaluations: true,
    },
  });

  if (!eventData) {
    throw createError({
      statusCode: 404,
      statusMessage: "Event not found",
    });
  }

  const activeAssignmentStatuses = ["ASSIGNED", "CONFIRMED"];

  const activeAssignments = eventData.assignments.filter((assignment) => {
    return activeAssignmentStatuses.includes(assignment.assignmentStatus);
  });

  const hasAnyAssignment = activeAssignments.length > 0;

  const hasPic = activeAssignments.some((assignment) => {
    return assignment.roleInEvent === "PIC";
  });

  if (status === "READY") {
    if (!hasPic) {
      throw createError({
        statusCode: 400,
        statusMessage: "Event must have at least 1 PIC before set to READY",
      });
    }
  }

  if (status === "ONGOING") {
    if (!hasAnyAssignment) {
      throw createError({
        statusCode: 400,
        statusMessage: "Event must have assigned staff before set to ONGOING",
      });
    }

    if (!hasPic) {
      throw createError({
        statusCode: 400,
        statusMessage: "Event must have at least 1 PIC before set to ONGOING",
      });
    }

    if (!["READY", "ONGOING"].includes(eventData.status)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Event must be READY before set to ONGOING",
      });
    }
  }

  if (status === "PENDING_EVALUATION") {
    if (!hasAnyAssignment) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "Event must have assigned staff before set to PENDING_EVALUATION",
      });
    }

    if (!["ONGOING", "PENDING_EVALUATION"].includes(eventData.status)) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "Event must be ONGOING before set to PENDING_EVALUATION",
      });
    }
  }

  if (status === "COMPLETED") {
    if (!["PENDING_EVALUATION", "COMPLETED"].includes(eventData.status)) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "Event must be PENDING_EVALUATION before set to COMPLETED",
      });
    }

    if (!eventData.eventEvaluation) {
      throw createError({
        statusCode: 400,
        statusMessage: "Event evaluation is required before set to COMPLETED",
      });
    }

    if (
      eventData.ribbonStart === null ||
      eventData.ribbonEnd === null ||
      eventData.ribbonUsed === null
    ) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "Ribbon awal, ribbon akhir, dan total penggunaan wajib diisi before set to COMPLETED",
      });
    }

    const evaluatedStaffIds = eventData.staffEvaluations.map((evaluation) => {
      return evaluation.staffId;
    });

    const allStaffEvaluated = activeAssignments.every((assignment) => {
      return evaluatedStaffIds.includes(assignment.staffId);
    });

    if (!allStaffEvaluated) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "All assigned staff must be evaluated before set to COMPLETED",
      });
    }
  }

  const updatedEvent = await prisma.event.update({
    where: {
      id: eventId,
    },
    data: {
      status,
    },
  });

  return {
    success: true,
    data: updatedEvent,
  };
});