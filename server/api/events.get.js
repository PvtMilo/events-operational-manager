import { prisma } from "../utils/prisma";

function getMonthRange(year, month) {
  if (!year || !month) return null;

  const start = new Date(Number(year), Number(month) - 1, 1);
  const end = new Date(Number(year), Number(month), 1);

  return { start, end };
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const search = query.search?.toString().trim() || "";
  const status = query.status?.toString() || "";
  const serviceTypeId = query.serviceTypeId?.toString() || "";
  const year = query.year ? Number(query.year) : null;
  const month = query.month ? Number(query.month) : null;

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

  const monthRange = getMonthRange(year, month);

  if (monthRange) {
    where.eventDate = {
      gte: monthRange.start,
      lt: monthRange.end,
    };
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
          include: {
            staff: true,
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
