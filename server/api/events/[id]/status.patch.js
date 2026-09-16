import { prisma } from "../../../utils/prisma";
import { createEventLog } from "../../../utils/event-log";
import {
  allowedEventStatuses,
  canTransitionEventStatus,
  cancelActiveAssignments,
  eventStatusesRequiringPic,
  getActiveAssignments,
  hasActivePic,
} from "../../../utils/event-lifecycle";

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

  if (!allowedEventStatuses.includes(status)) {
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
      serviceType: true,
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

  const previousStatus = eventData.status;

  if (status === previousStatus) {
    return {
      success: true,
      message: `Event is already ${status}`,
      data: eventData,
    };
  }

  if (!canTransitionEventStatus(previousStatus, status)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Cannot change status from ${previousStatus} to ${status}`,
    });
  }

  const activeAssignments = getActiveAssignments(eventData.assignments);

  if (eventStatusesRequiringPic.includes(status)) {
    if (!activeAssignments.length) {
      throw createError({
        statusCode: 400,
        statusMessage: `Event must have assigned staff before set to ${status}`,
      });
    }

    if (!hasActivePic(eventData.assignments)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Event must have at least 1 PIC before set to ${status}`,
      });
    }
  }

  if (status === "PENDING_EVALUATION" && !activeAssignments.length) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Event must have assigned staff before set to PENDING_EVALUATION",
    });
  }

  if (status === "COMPLETED") {
    if (!eventData.eventEvaluation) {
      throw createError({
        statusCode: 400,
        statusMessage: "Event evaluation is required before set to COMPLETED",
      });
    }

    const requiresRibbonTracking =
      eventData.serviceType?.requiresRibbonTracking === true;

    if (requiresRibbonTracking) {
      if (
        eventData.ribbonStart === null ||
        eventData.ribbonEnd === null ||
        eventData.ribbonUsed === null ||
        eventData.ribbonUsed <= 0
      ) {
        throw createError({
          statusCode: 400,
          statusMessage:
            "Ribbon awal, ribbon akhir, dan total penggunaan > 0 wajib diisi untuk service type ini before set to COMPLETED",
        });
      }
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

  const { updatedEvent, cancelledAssignments } = await prisma.$transaction(
    async (tx) => {
      const cancelled =
        status === "CANCELLED" ? await cancelActiveAssignments(tx, eventId) : 0;

      const updated = await tx.event.update({
        where: {
          id: eventId,
        },
        data: {
          status,
        },
      });

      return { updatedEvent: updated, cancelledAssignments: cancelled };
    },
  );

  await createEventLog(event, {
    eventId,
    action: "EVENT_STATUS_UPDATED",
    description: `Event status changed from ${previousStatus} to ${status}`,
    metadata: {
      previousStatus,
      newStatus: status,
      ...(status === "CANCELLED" ? { cancelledAssignments } : {}),
    },
  });

  return {
    success: true,
    data: updatedEvent,
  };
});
