import { prisma } from "../utils/prisma";
import { denyStaffUsers } from "../utils/permission";

export default defineEventHandler(async (event) => {
  await denyStaffUsers(event);

  const query = getQuery(event);

  const search = query.search?.toString().trim() || "";
  const role = query.role?.toString() || "";
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
        email: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (status) {
    where.status = status;
  }

  const [users, totalItems] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.user.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
    },
  };
});
