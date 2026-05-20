import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const search = query.search?.toString().trim() || "";
  const defaultRole = query.defaultRole?.toString() || "";
  const status = query.status?.toString() || "";
  const canBeAssigned = query.canBeAssigned?.toString() || "";

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

  const staff = await prisma.staff.findMany({
    where,
    orderBy: {
      name: "asc",
    },
  });

  return {
    success: true,
    data: staff,
  };
});
