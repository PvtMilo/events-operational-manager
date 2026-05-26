import { prisma } from "../../utils/prisma";

const activeAssignmentStatuses = ["ASSIGNED", "CONFIRMED"];

function getJakartaDateKey(date = new Date()) {
  const jakartaOffsetMs = 7 * 60 * 60 * 1000;
  return new Date(date.getTime() + jakartaOffsetMs).toISOString().slice(0, 10);
}

function addDaysToDateKey(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateFromKey(dateKey) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function getRange(startKey, endExclusiveKey) {
  return {
    gte: dateFromKey(startKey),
    lt: dateFromKey(endExclusiveKey),
  };
}

function getMonthRange(todayKey) {
  const [year, month] = todayKey.split("-").map(Number);
  const startKey = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(Date.UTC(year, month, 1));
  const endKey = endDate.toISOString().slice(0, 10);

  return getRange(startKey, endKey);
}

function getDateKey(dateValue) {
  if (!dateValue) return "";

  return new Date(dateValue).toISOString().slice(0, 10);
}

function diffDays(fromKey, toKey) {
  const from = dateFromKey(fromKey);
  const to = dateFromKey(toKey);

  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

function getLoadingDueLabel(loadingDate, todayKey) {
  if (!loadingDate) return "NO LOADING DATE";

  const loadingKey = getDateKey(loadingDate);
  const diff = diffDays(todayKey, loadingKey);

  if (diff < 0) return "OVERDUE";
  if (diff === 0) return "TODAY";
  if (diff === 1) return "TOMORROW";
  if (diff === 2) return "H+2";

  return `IN ${diff} DAYS`;
}

function getEventLeadLabel(loadingDate, eventDate) {
  if (!loadingDate || !eventDate) return "-";

  const loadingKey = getDateKey(loadingDate);
  const eventKey = getDateKey(eventDate);
  const diff = diffDays(loadingKey, eventKey);

  if (diff === 0) return "Hari H";
  if (diff > 0) return `H-${diff}`;

  return `H+${Math.abs(diff)}`;
}

function getActiveAssignments(event) {
  return (event.assignments || []).filter((assignment) => {
    return activeAssignmentStatuses.includes(assignment.assignmentStatus);
  });
}

function getEventStaff(event) {
  const activeAssignments = getActiveAssignments(event);

  if (!activeAssignments.length) return "-";

  return activeAssignments
    .map((assignment) => {
      return `${assignment.staff?.name || "-"} (${assignment.roleInEvent})`;
    })
    .join(", ");
}

function mapEventRow(event, todayKey) {
  return {
    id: event.id,
    eventName: event.eventName,
    clientName: event.clientName,
    clientPhone: event.clientPhone || "",
    serviceTypeName: event.serviceType?.name || "-",
    loadingDate: event.loadingDate,
    loadingTime: event.loadingTime || "",
    loadingStatus: event.loadingStatus || "NOT_PREPARED",
    eventDate: event.eventDate,
    startTime: event.startTime || "",
    endTime: event.endTime || "",
    staff: getEventStaff(event),
    location: event.location || "-",
    equipmentSetup: event.equipmentSetup || "-",
    dueLabel: getLoadingDueLabel(event.loadingDate, todayKey),
    eventLeadLabel: getEventLeadLabel(event.loadingDate, event.eventDate),
  };
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const todayKey = getJakartaDateKey();
  const tomorrowKey = addDaysToDateKey(todayKey, 1);
  const twoDaysLaterKey = addDaysToDateKey(todayKey, 2);
  const threeDaysLaterKey = addDaysToDateKey(todayKey, 3);

  const todayRange = getRange(todayKey, tomorrowKey);
  const upcomingLoadingRange = getRange(tomorrowKey, threeDaysLaterKey);
  const todayUntilTwoDaysRange = getRange(todayKey, threeDaysLaterKey);
  const monthRange = getMonthRange(todayKey);

  const baseInclude = {
    serviceType: true,
    assignments: {
      where: {
        assignmentStatus: {
          in: activeAssignmentStatuses,
        },
      },
      include: {
        staff: true,
      },
    },
  };

  const [
    loadingTodayEvents,
    upcomingLoadingEvents,
    missingLoadingInfoEvents,
    todayEventsCount,
    pendingEvaluationCount,
    needAssignmentEvents,
  ] = await prisma.$transaction([
    prisma.event.findMany({
      where: {
        status: {
          not: "CANCELLED",
        },
        loadingDate: todayRange,
      },
      orderBy: [
        {
          loadingTime: "asc",
        },
        {
          eventDate: "asc",
        },
      ],
      include: baseInclude,
    }),

    prisma.event.findMany({
      where: {
        status: {
          not: "CANCELLED",
        },
        loadingDate: upcomingLoadingRange,
      },
      orderBy: [
        {
          loadingDate: "asc",
        },
        {
          loadingTime: "asc",
        },
      ],
      include: baseInclude,
    }),

    prisma.event.findMany({
      where: {
        status: {
          notIn: ["CANCELLED", "COMPLETED"],
        },
        eventDate: todayUntilTwoDaysRange,
        OR: [
          {
            loadingDate: null,
          },
          {
            loadingTime: null,
          },
          {
            loadingTime: "",
          },
        ],
      },
      orderBy: [
        {
          eventDate: "asc",
        },
        {
          startTime: "asc",
        },
      ],
      include: baseInclude,
    }),

    prisma.event.count({
      where: {
        status: {
          not: "CANCELLED",
        },
        eventDate: todayRange,
      },
    }),

    prisma.event.count({
      where: {
        status: "PENDING_EVALUATION",
        eventDate: monthRange,
      },
    }),

    prisma.event.findMany({
      where: {
        status: {
          notIn: ["CANCELLED", "COMPLETED"],
        },
        eventDate: monthRange,
        assignments: {
          none: {
            assignmentStatus: {
              in: activeAssignmentStatuses,
            },
          },
        },
      },
      orderBy: [
        {
          eventDate: "asc",
        },
        {
          startTime: "asc",
        },
      ],
      include: baseInclude,
      take: 10,
    }),
  ]);

  const loadingToday = loadingTodayEvents.map((item) => {
    return mapEventRow(item, todayKey);
  });

  const upcomingLoading = upcomingLoadingEvents.map((item) => {
    return mapEventRow(item, todayKey);
  });

  const missingLoadingInfo = missingLoadingInfoEvents.map((item) => {
    return mapEventRow(item, todayKey);
  });

  const needAssignment = needAssignmentEvents.map((item) => {
    return {
      id: item.id,
      eventName: item.eventName,
      clientName: item.clientName,
      eventDate: item.eventDate,
      startTime: item.startTime,
      endTime: item.endTime,
      serviceTypeName: item.serviceType?.name || "-",
      location: item.location || "-",
    };
  });

  return {
    success: true,
    data: {
      summary: {
        loadingToday: loadingToday.length,
        upcomingLoading: upcomingLoading.length,
        needAttention: missingLoadingInfo.length,
        todayEvents: todayEventsCount,
        pendingEvaluation: pendingEvaluationCount,
        needAssignment: needAssignment.length,
      },
      loadingReminders: {
        loadingToday,
        upcomingLoading,
        missingLoadingInfo,
      },
      needAssignment,
      meta: {
        todayKey,
        tomorrowKey,
        twoDaysLaterKey,
      },
    },
  };
});
