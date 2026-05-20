import { prisma } from "../utils/prisma";
import { denyStaffUsers } from "../utils/permission";

export default defineEventHandler(async (event) => {
  await denyStaffUsers(event);

  const query = getQuery(event);

  const search = query.search?.toString().trim() || "";
  const role = query.role?.toString() || "";
  const status = query.status?.toString() || "";

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

  const users = await prisma.user.findMany({
    where,
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
  });

  return {
    success: true,
    data: users,
  };
});
