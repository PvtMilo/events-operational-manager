import { prisma } from "../../utils/prisma";

const allowedRoles = ["DEVELOPER", "ADMIN", "SCHEDULE_MAKER", "HEAD_OPERATIONAL"];

function requireAccess(session) {
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  requireAccess(session);

  const id = getRouterParam(event, "id");

  const existing = await prisma.staffAvailabilityBlock.findUnique({
    where: {
      id,
    },
  });

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "Availability block not found",
    });
  }

  const updated = await prisma.staffAvailabilityBlock.update({
    where: {
      id,
    },
    data: {
      status: "CANCELLED",
    },
  });

  return {
    success: true,
    message: "Availability block cancelled successfully",
    data: updated,
  };
});