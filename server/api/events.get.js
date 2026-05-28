import { prisma } from "../utils/prisma";
import { syncAutomaticEventStatuses } from "../utils/event-status-automation";

function getMonthRange(year, month) {
  if (!year || !month) return null;

  const start = new Date(Number(year), Number(month) - 1, 1);
  const end = new Date(Number(year), Number(month), 1);

  return { start, end };
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
  await syncAutomaticEventStatuses();

  const query = getQuery(event);

  const search = query.search?.toString().trim() || "";
  const status = query.status?.toString() || "";
  const serviceTypeId = query.serviceTypeId?.toString() || "";
  const year = query.year ? Number(query.year) : null;
  const month = query.month ? Number(query.month) : null;
  const dateFrom = parseDateOnly(query.dateFrom);
  const dateTo = parseDateOnly(query.dateTo || query.dateFrom);

  const where = {};

  if (search) {
    where.OR = [
      {
        eventName: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        clientName: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        clientPhone: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        location: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        equipmentSetup: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (serviceTypeId) {
    where.serviceTypeId = serviceTypeId;
  }

  if (dateFrom || dateTo) {
    where.eventDate = {};
    if (dateFrom) where.eventDate.gte = dateFrom;
    if (dateTo) where.eventDate.lt = addDays(dateTo, 1);
  } else {
    const monthRange = getMonthRange(year, month);

    if (monthRange) {
      where.eventDate = {
        gte: monthRange.start,
        lt: monthRange.end,
      };
    }
  }

  if (where.eventDate && Object.keys(where.eventDate).length === 0) {
    delete where.eventDate;
  }

  const page = Number(query.page || 1);
  const limit = 20;
  const skip = (page - 1) * limit;

  const [events, totalItems] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
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
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        eventDate: "desc",
      },
    }),

    prisma.event.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    success: true,
    data: events,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
    },
  };
});
