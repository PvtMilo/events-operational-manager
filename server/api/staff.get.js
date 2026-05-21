import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const search = query.search?.toString().trim() || "";
  const defaultRole = query.defaultRole?.toString() || "";
  const status = query.status?.toString() || "";
  const canBeAssigned = query.canBeAssigned?.toString() || "";
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

  if (defaultRole) {
    where.defaultRole = defaultRole;
  }

  if (status) {
    where.status = status;
  }

  if (canBeAssigned === "true") {
    where.canBeAssignedToEvent = true;
  }

  if (canBeAssigned === "false") {
    where.canBeAssignedToEvent = false;
  }

  const [staff, totalItems] = await Promise.all([
    prisma.staff.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        name: "asc",
      },
    }),

    prisma.staff.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    success: true,
    data: staff,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
    },
  };
});
