import { prisma } from "../../utils/prisma";
import { denyStaff } from "../../utils/permission";
import { getReportRange } from "../../utils/report-date-range";

export default defineEventHandler(async (event) => {
  await denyStaff(event);

  const query = getQuery(event);
  const range = getReportRange(query);

  const staffList = await prisma.staff.findMany({
    where: {
      status: "ACTIVE",
    },
    orderBy: {
      name: "asc",
    },
  });

  const assignments = await prisma.eventAssignment.findMany({
    where: {
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
      event: true,
    },
  });

  const evaluations = await prisma.staffEventEvaluation.findMany({
    where: {
      event: {
        eventDate: {
          gte: range.start,
          lt: range.end,
        },
      },
    },
    include: {
      event: true,
    },
  });

  const result = staffList.map((staff) => {
    const staffAssignments = assignments.filter((assignment) => {
      return assignment.staffId === staff.id;
    });

    const staffEvaluations = evaluations.filter((evaluation) => {
      return evaluation.staffId === staff.id;
    });

    const totalAssigned = staffAssignments.length;

    const totalPic = staffAssignments.filter((assignment) => {
      return assignment.roleInEvent === "PIC";
    }).length;

    const totalSuccess = staffEvaluations.filter((evaluation) => {
      return evaluation.isSuccess === true;
    }).length;

    const totalEvaluated = staffEvaluations.length;
    const totalFailed = totalEvaluated - totalSuccess;

    const successRate =
      totalEvaluated > 0 ? Math.round((totalSuccess / totalEvaluated) * 100) : 0;

    return {
      staffId: staff.id,
      name: staff.name,
      defaultRole: staff.defaultRole,
      totalAssigned,
      totalEvaluated,
      totalSuccess,
      totalFailed,
      totalPic,
      successRate,
    };
  });

  result.sort((a, b) => {
    if (a.totalAssigned !== b.totalAssigned) {
      return b.totalAssigned - a.totalAssigned;
    }

    return a.name.localeCompare(b.name);
  });

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
    data: result,
  };
});
