import { prisma } from "../../utils/prisma";

function getTodayStart() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default defineEventHandler(async () => {
  const todayStart = getTodayStart();

  const [
    totalEvents,
    upcomingEvents,
    completedEvents,
    pendingEvaluationEvents,
    activeStaff,
    activeSales,
    eventsWithoutAssignment,
    recentEvents,
  ] = await Promise.all([
    prisma.event.count(),

    prisma.event.count({
      where: {
        eventDate: {
          gte: todayStart,
        },
        status: {
          not: "CANCELLED",
        },
      },
    }),

    prisma.event.count({
      where: {
        status: "COMPLETED",
      },
    }),

    prisma.event.count({
      where: {
        status: "PENDING_EVALUATION",
      },
    }),

    prisma.staff.count({
      where: {
        status: "ACTIVE",
      },
    }),

    prisma.sales.count({
      where: {
        status: "ACTIVE",
      },
    }),

    prisma.event.findMany({
      where: {
        status: {
          not: "CANCELLED",
        },
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
      take: 5,
      include: {
        serviceType: true,
        sales: true,
        assignments: {
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
      totalEvents,
      upcomingEvents,
      completedEvents,
      pendingEvaluationEvents,
      activeStaff,
      activeSales,
      eventsNeedAssignment: eventsWithoutAssignment.length,
      eventsWithoutAssignment,
      recentEvents,
    },
  };
});
