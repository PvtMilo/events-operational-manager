import { prisma } from "../../../utils/prisma";
import { denyStaff } from "../../../utils/permission";
import { getReportRange } from "../../../utils/report-date-range";

export default defineEventHandler(async (event) => {
  await denyStaff(event);

  const staffId = getRouterParam(event, "id");
  const query = getQuery(event);

  if (!staffId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Staff id is required",
    });
  }

  const range = getReportRange(query);

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
          gte: range.start,
          lt: range.end,
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
          gte: range.start,
          lt: range.end,
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
      year: range.year || null,
      month: range.month || null,
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
      start: range.start,
      end: range.end,
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
