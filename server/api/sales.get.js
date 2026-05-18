import { prisma } from "../utils/prisma";

export default defineEventHandler(async () => {
  const sales = await prisma.sales.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    success: true,
    data: sales,
  };
});