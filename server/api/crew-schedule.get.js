import { prisma } from "../utils/prisma";

const activeAssignmentStatuses = ["ASSIGNED", "CONFIRMED"];

function getNumber(value, fallback) {
  const number = Number(value);

  if (Number.isNaN(number) || number < 1) {
    return fallback;
  }

  return number;
}

function getDateRange(yearValue, monthValue) {
  if (!yearValue || yearValue === "ALL") {
    return null;
  }

  const year = Number(yearValue);

  if (Number.isNaN(year)) {
    return null;
  }

  if (!monthValue || monthValue === "ALL") {
    return {
      gte: new Date(Date.UTC(year, 0, 1)),
      lt: new Date(Date.UTC(year + 1, 0, 1)),
    };
  }

  const month = Number(monthValue);

  if (Number.isNaN(month) || month < 1 || month > 12) {
    return null;
  }

  return {
    gte: new Date(Date.UTC(year, month - 1, 1)),
    lt: new Date(Date.UTC(year, month, 1)),
  };
}

function parseDateOnly(value) {
  const match = value?.toString().match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const query = getQuery(event);

  const page = getNumber(query.page, 1);
  const limit = Math.min(getNumber(query.limit, 20), 100);
  const skip = (page - 1) * limit;

  const search = query.search?.toString().trim() || "";
  const role = query.role?.toString() || "ALL";
  const assignmentStatus = query.assignmentStatus?.toString() || "ALL_ACTIVE";
  const eventStatus = query.eventStatus?.toString() || "ALL";

  const year = query.year?.toString() || "ALL";
  const month = query.month?.toString() || "ALL";
  const dateFrom = parseDateOnly(query.dateFrom);
  const dateTo = parseDateOnly(query.dateTo || query.dateFrom);

  let dateRange = null;

  if (dateFrom || dateTo) {
    dateRange = {};
    if (dateFrom) dateRange.gte = dateFrom;
    if (dateTo) dateRange.lt = addDays(dateTo, 1);
  } else {
    dateRange = getDateRange(year, month);
  }

  const eventWhere = {
    status: {
      not: "CANCELLED",
    },
  };

  if (eventStatus !== "ALL") {
    eventWhere.status = eventStatus;
  }

  if (dateRange) {
    eventWhere.eventDate = dateRange;
  }

  const where = {
    event: eventWhere,
  };

  if (assignmentStatus === "ALL_ACTIVE") {
    where.assignmentStatus = {
      in: activeAssignmentStatuses,
    };
  } else {
    where.assignmentStatus = assignmentStatus;
  }

  if (role !== "ALL") {
    where.roleInEvent = role;
  }

  if (search) {
    where.OR = [
      {
        staff: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        event: {
          eventName: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        event: {
          clientName: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        event: {
          location: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        event: {
          serviceType: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
    ];
  }

  const workloadEventWhere = {
    status: {
      not: "CANCELLED",
    },
  };

  if (dateRange) {
    workloadEventWhere.eventDate = dateRange;
  }

  const workloadWhere = {
    assignmentStatus: {
      in: activeAssignmentStatuses,
    },
    event: workloadEventWhere,
  };

  const [
    assignments,
    totalItems,
    workloadRows,
    picWorkloadRows,
  ] = await prisma.$transaction([
    prisma.eventAssignment.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        {
          event: {
            eventDate: "asc",
          },
        },
        {
          event: {
            startTime: "asc",
          },
        },
        {
          roleInEvent: "asc",
        },
        {
          staff: {
            name: "asc",
          },
        },
      ],
      include: {
        staff: true,
        event: {
          include: {
            serviceType: true,
            sales: true,
          },
        },
      },
    }),

    prisma.eventAssignment.count({
      where,
    }),

    prisma.eventAssignment.groupBy({
      by: ["staffId"],
      where: workloadWhere,
      _count: {
        id: true,
      },
    }),

    prisma.eventAssignment.groupBy({
      by: ["staffId"],
      where: {
        ...workloadWhere,
        roleInEvent: "PIC",
      },
      _count: {
        id: true,
      },
    }),
  ]);

  const workloadMap = new Map(
    workloadRows.map((item) => [item.staffId, item._count.id]),
  );

  const picWorkloadMap = new Map(
    picWorkloadRows.map((item) => [item.staffId, item._count.id]),
  );

  const data = assignments.map((assignment) => {
    return {
      id: assignment.id,

      staffId: assignment.staffId,
      staffName: assignment.staff?.name || "-",
      staffDefaultRole: assignment.staff?.defaultRole || "-",

      roleInEvent: assignment.roleInEvent,
      assignmentStatus: assignment.assignmentStatus,
      notes: assignment.notes || "",

      eventId: assignment.eventId,
      eventName: assignment.event?.eventName || "-",
      clientName: assignment.event?.clientName || "-",
      clientPhone: assignment.event?.clientPhone || "",
      serviceTypeName: assignment.event?.serviceType?.name || "-",
      salesName: assignment.event?.sales?.name || "-",

      eventDate: assignment.event?.eventDate || null,
      startTime: assignment.event?.startTime || "",
      endTime: assignment.event?.endTime || "",
      loadingDate: assignment.event?.loadingDate || null,
      loadingTime: assignment.event?.loadingTime || "",
      location: assignment.event?.location || "-",
      eventStatus: assignment.event?.status || "-",

      equipmentSetup: assignment.event?.equipmentSetup || "-",
      vendorSewa: assignment.event?.vendorSewa || "-",

      periodEventCount: workloadMap.get(assignment.staffId) || 0,
      periodPicCount: picWorkloadMap.get(assignment.staffId) || 0,
    };
  });

  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
    },
    filters: {
      search,
      role,
      assignmentStatus,
      eventStatus,
      year,
      month,
      dateFrom: dateFrom?.toISOString() || "",
      dateTo: dateTo?.toISOString() || "",
    },
  };
});
