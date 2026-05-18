import { prisma } from "../utils/prisma";

export default defineEventHandler(async () => {
  const events = await prisma.event.findMany({
    include: {
      serviceType: true,
      sales: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    success: true,
    data: events,
  };
});