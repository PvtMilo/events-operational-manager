import { prisma } from "../utils/prisma";

export default defineEventHandler(async () => {
  const staff = await prisma.staff.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    success: true,
    data: staff,
  };
});