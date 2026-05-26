import { prisma } from "../../utils/prisma";

const allowedRoles = ["DEVELOPER", "ADMIN", "SCHEDULE_MAKER", "HEAD_OPERATIONAL"];

function requireAccess(session) {
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }
}

function getNumber(value, fallback) {
  const number = Number(value);

  if (Number.isNaN(number) || number < 1) {
    return fallback;
  }

  return number;
}

function toDateOnly(value) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate;
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function getMonthRange(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  return {
    start: new Date(Date.UTC(year, month, 1)),
    end: new Date(Date.UTC(year, month + 1, 0)),
  };
}

function getDurationLabel(block) {
  const start = new Date(block.startDate);
  const end = new Date(block.endDate);

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / 86400000) + 1;

  if (!block.isFullDay && block.startTime && block.endTime) {
    return `${block.startTime} - ${block.endTime}`;
  }

  return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
}

function isDateInsideBlock(date, block) {
  const target = new Date(`${formatDateKey(date)}T00:00:00.000Z`);
  const start = new Date(block.startDate);
  const end = new Date(block.endDate);

  return start <= target && end >= target;
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  requireAccess(session);

  const query = getQuery(event);

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );

  const monthRange = getMonthRange(today);

  const page = getNumber(query.page, 1);
  const limit = Math.min(getNumber(query.limit, 20), 100);
  const skip = (page - 1) * limit;

  const search = query.search?.toString().trim() || "";
  const type = query.type?.toString() || "ALL";
  const status = query.status?.toString() || "ACTIVE";

  const startDate =
    toDateOnly(query.startDate?.toString()) || monthRange.start;
  const endDate = toDateOnly(query.endDate?.toString()) || monthRange.end;

  const where = {
    startDate: {
      lte: endDate,
    },
    endDate: {
      gte: startDate,
    },
  };

  if (status !== "ALL") {
    where.status = status;
  }

  if (type !== "ALL") {
    where.type = type;
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
        reason: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        notes: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  const todayWhere = {
    status: "ACTIVE",
    startDate: {
      lte: today,
    },
    endDate: {
      gte: today,
    },
  };

  const sevenDaysEnd = addDays(today, 6);

  const sevenDaysWhere = {
    status: "ACTIVE",
    startDate: {
      lte: sevenDaysEnd,
    },
    endDate: {
      gte: today,
    },
  };

  const [
    records,
    totalItems,
    allActiveStaff,
    todayBlocks,
    sevenDaysBlocks,
    thisMonthBlocks,
  ] = await prisma.$transaction([
    prisma.staffAvailabilityBlock.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        {
          startDate: "asc",
        },
        {
          staff: {
            name: "asc",
          },
        },
      ],
      include: {
        staff: true,
      },
    }),

    prisma.staffAvailabilityBlock.count({
      where,
    }),

    prisma.staff.findMany({
      where: {
        status: "ACTIVE",
        canBeAssignedToEvent: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.staffAvailabilityBlock.findMany({
      where: todayWhere,
      include: {
        staff: true,
      },
      orderBy: [
        {
          type: "asc",
        },
        {
          staff: {
            name: "asc",
          },
        },
      ],
    }),

    prisma.staffAvailabilityBlock.findMany({
      where: sevenDaysWhere,
      include: {
        staff: true,
      },
    }),

    prisma.staffAvailabilityBlock.count({
      where: {
        status: "ACTIVE",
        startDate: {
          lte: monthRange.end,
        },
        endDate: {
          gte: monthRange.start,
        },
      },
    }),
  ]);

  const todayBlockedStaffIds = new Set(
    todayBlocks.map((block) => block.staffId),
  );

  const availableToday = allActiveStaff.filter((staff) => {
    return !todayBlockedStaffIds.has(staff.id);
  });

  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(today, index);

    return {
      date: formatDateKey(date),
      label: date.toLocaleDateString("en-US", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        timeZone: "UTC",
      }),
    };
  });

  const matrix = allActiveStaff.map((staff) => {
    const staffBlocks = sevenDaysBlocks.filter((block) => {
      return block.staffId === staff.id;
    });

    return {
      staffId: staff.id,
      staffName: staff.name,
      defaultRole: staff.defaultRole,
      days: days.map((day) => {
        const targetDate = new Date(`${day.date}T00:00:00.000Z`);

        const block = staffBlocks.find((item) => {
          return isDateInsideBlock(targetDate, item);
        });

        return {
          date: day.date,
          label: day.label,
          isAvailable: !block,
          type: block?.type || null,
          reason: block?.reason || null,
        };
      }),
    };
  });

  const data = records.map((block) => {
    return {
      id: block.id,
      staffId: block.staffId,
      staffName: block.staff?.name || "-",
      staffDefaultRole: block.staff?.defaultRole || "-",
      type: block.type,
      status: block.status,
      startDate: block.startDate,
      endDate: block.endDate,
      isFullDay: block.isFullDay,
      startTime: block.startTime,
      endTime: block.endTime,
      durationLabel: getDurationLabel(block),
      reason: block.reason || "",
      notes: block.notes || "",
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
    };
  });

  return {
    success: true,
    data,
    summary: {
      totalStaff: allActiveStaff.length,
      availableToday: availableToday.length,
      unavailableToday: todayBlocks.length,
      upcoming7Days: sevenDaysBlocks.length,
      thisMonthBlocks,
    },
    todayUnavailable: todayBlocks.map((block) => ({
      id: block.id,
      staffId: block.staffId,
      staffName: block.staff?.name || "-",
      staffDefaultRole: block.staff?.defaultRole || "-",
      type: block.type,
      startDate: block.startDate,
      endDate: block.endDate,
      isFullDay: block.isFullDay,
      startTime: block.startTime,
      endTime: block.endTime,
      reason: block.reason || "",
      notes: block.notes || "",
      durationLabel: getDurationLabel(block),
    })),
    todayAvailable: availableToday.map((staff) => ({
      id: staff.id,
      name: staff.name,
      defaultRole: staff.defaultRole,
    })),
    days,
    matrix,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.max(Math.ceil(totalItems / limit), 1),
    },
    filters: {
      search,
      type,
      status,
      startDate,
      endDate,
    },
  };
});