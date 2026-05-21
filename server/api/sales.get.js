import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const search = query.search?.toString().trim() || "";
  const status = query.status?.toString() || "";
  const page = Number(query.page || 1);
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = {};

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        phone: {
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

  if (status) {
    where.status = status;
  }

  const [sales, totalItems] = await Promise.all([
    prisma.sales.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        name: "asc",
      },
    }),

    prisma.sales.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    success: true,
    data: sales,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
    },
  };
});
