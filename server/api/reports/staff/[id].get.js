import { prisma } from "../../../utils/prisma";

function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return {
    start,
    end,
  };
}

export default defineEventHandler(async (event) => {
  const staffId = getRouterParam(event, "id");
  const query = getQuery(event);

  const now = new Date();

  const year = Number(query.year || now.getFullYear());
  const month = Number(query.month || now.getMonth() + 1);

  if (!staffId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Staff id is required",
    });
  }

  if (!year || !month || month < 1 || month > 12) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid year or month",
    });
  }

  const { start, end } = getMonthRange(year, month);

  const staff = await prisma.staff.findUnique({
    where: {
      id: staffId,
    },
  });

  if (!staff) {
    throw createError({
      statusCode: 404,
      statusMessage: "Staff not found",
    });
  }

  const assignments = await prisma.eventAssignment.findMany({
    where: {
      staffId,
      assignmentStatus: {
        in: ["ASSIGNED", "CONFIRMED"],
      },
      event: {
        eventDate: {
          gte: start,
          lt: end,
        },
      },
    },
    include: {
      event: {
        include: {
          serviceType: true,
          sales: true,
          eventEvaluation: true,
        },
      },
    },
    orderBy: {
      event: {
        eventDate: "asc",
      },
    },
  });

  const staffEvaluations = await prisma.staffEventEvaluation.findMany({
    where: {
      staffId,
      event: {
        eventDate: {
          gte: start,
          lt: end,
        },
      },
    },
  });

  const rows = assignments.map((assignment) => {
    const evaluation = staffEvaluations.find((item) => {
      return item.eventId === assignment.eventId;
    });

    return {
      assignmentId: assignment.id,
      eventId: assignment.eventId,
      eventName: assignment.event.eventName,
      clientName: assignment.event.clientName,
      serviceTypeName: assignment.event.serviceType?.name || null,
      salesName: assignment.event.sales?.name || null,
      eventDate: assignment.event.eventDate,
      startTime: assignment.event.startTime,
      endTime: assignment.event.endTime,
      eventStatus: assignment.event.status,
      roleInEvent: assignment.roleInEvent,
      assignmentStatus: assignment.assignmentStatus,
      clientSatisfactionOk:
        assignment.event.eventEvaluation?.clientSatisfactionOk ?? null,
      sopOk: evaluation?.sopOk ?? null,
      warehouseOk: evaluation?.warehouseOk ?? null,
      groomingOk: evaluation?.groomingOk ?? null,
      dataCollectionOk: evaluation?.dataCollectionOk ?? null,
      isSuccess: evaluation?.isSuccess ?? null,
      evaluationNotes: evaluation?.notes || null,
    };
  });

  const totalAssigned = assignments.length;

  const totalPic = assignments.filter((assignment) => {
    return assignment.roleInEvent === "PIC";
  }).length;

  const evaluatedRows = rows.filter((row) => {
    return row.isSuccess !== null;
  });

  const totalEvaluated = evaluatedRows.length;

  const totalSuccess = rows.filter((row) => {
    return row.isSuccess === true;
  }).length;

  const totalFailed = totalEvaluated - totalSuccess;

  const successRate =
    totalEvaluated > 0 ? Math.round((totalSuccess / totalEvaluated) * 100) : 0;

  return {
    success: true,
    meta: {
      year,
      month,
      start,
      end,
    },
    data: {
      staff,
      summary: {
        totalAssigned,
        totalPic,
        totalEvaluated,
        totalSuccess,
        totalFailed,
        successRate,
      },
      events: rows,
    },
  };
});
