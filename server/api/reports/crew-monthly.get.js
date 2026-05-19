import { prisma } from "../../utils/prisma";

function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return {
    start,
    end,
  };
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const now = new Date();

  const year = Number(query.year || now.getFullYear());
  const month = Number(query.month || now.getMonth() + 1);

  if (!year || !month || month < 1 || month > 12) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid year or month",
    });
  }

  const { start, end } = getMonthRange(year, month);

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
          gte: start,
          lt: end,
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
          gte: start,
          lt: end,
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
      year,
      month,
      start,
      end,
    },
    data: result,
  };
});