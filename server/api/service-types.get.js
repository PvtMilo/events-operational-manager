import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const search = query.search?.toString().trim() || "";

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
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  const serviceTypes = await prisma.serviceType.findMany({
    where,
    orderBy: {
      name: "asc",
    },
  });

  return {
    success: true,
    data: serviceTypes,
  };
});
