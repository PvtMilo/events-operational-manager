import { prisma } from "../utils/prisma";

export default defineEventHandler(async () => {
  const serviceTypes = await prisma.serviceType.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    success: true,
    data: serviceTypes,
  };
});