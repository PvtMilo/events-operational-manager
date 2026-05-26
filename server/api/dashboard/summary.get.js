import { prisma } from "../../utils/prisma";

function getCurrentMonthRange() {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    start,
    end,
  };
}

function getTodayStart() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default defineEventHandler(async () => {
  const { start: monthStart, end: monthEnd } = getCurrentMonthRange();
  const todayStart = getTodayStart();

  const baseThisMonthWhere = {
    eventDate: {
      gte: monthStart,
      lt: monthEnd,
    },
    status: {
      not: "CANCELLED",
    },
  };

  const [
    upcomingLoadingEvents,
    upcomingEvents,
    completedEvents,
    pendingEvaluationEvents,
    eventsWithoutAssignment,
    recentEvents,
  ] = await Promise.all([
    prisma.event.count({
      where: {
        loadingDate: {
          gte: todayStart,
          lt: monthEnd,
        },
        status: {
          notIn: ["CANCELLED", "COMPLETED"],
        },
      },
    }),

    prisma.event.count({
      where: {
        ...baseThisMonthWhere,
        status: {
          notIn: ["CANCELLED", "COMPLETED"],
        },
      },
    }),

    prisma.event.count({
      where: {
        eventDate: {
          gte: monthStart,
          lt: monthEnd,
        },
        status: "COMPLETED",
      },
    }),

    prisma.event.count({
      where: {
        eventDate: {
          gte: monthStart,
          lt: monthEnd,
        },
        status: "PENDING_EVALUATION",
      },
    }),

    prisma.event.findMany({
      where: {
        ...baseThisMonthWhere,
        assignments: {
          none: {
            assignmentStatus: {
              in: ["ASSIGNED", "CONFIRMED"],
            },
          },
        },
      },
      select: {
        id: true,
        eventName: true,
        clientName: true,
        eventDate: true,
        status: true,
      },
      orderBy: {
        eventDate: "asc",
      },
    }),

    prisma.event.findMany({
      where: baseThisMonthWhere,
      take: 5,
      include: {
        serviceType: true,
        sales: true,
        assignments: {
          where: {
            assignmentStatus: {
              in: ["ASSIGNED", "CONFIRMED"],
            },
          },
          include: {
            staff: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return {
    success: true,
    data: {
      monthStart,
      monthEnd,
      upcomingLoadingEvents,
      upcomingEvents,
      completedEvents,
      pendingEvaluationEvents,
      eventsNeedAssignment: eventsWithoutAssignment.length,
      eventsWithoutAssignment,
      recentEvents,
    },
  };
});
