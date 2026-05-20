import { prisma } from "../../utils/prisma";
import { denyStaffUsers } from "../../utils/permission";

const allowedRoles = [
  "DEVELOPER",
  "ADMIN",
  "SCHEDULE_MAKER",
  "HEAD_OPERATIONAL",
  "STAFF",
];

const allowedStatuses = ["ACTIVE", "INACTIVE"];

export default defineEventHandler(async (event) => {
  await denyStaffUsers(event);

  const id = getRouterParam(event, "id");
  const body = await readBody(event);

  const name = body?.name?.trim();
  const role = body?.role;
  const status = body?.status;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "User id is required",
    });
  }

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Name is required",
    });
  }

  if (!allowedRoles.includes(role)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid user role",
    });
  }

  if (!allowedStatuses.includes(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid user status",
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!existingUser) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }

  const user = await prisma.user.update({
    where: {
      id,
    },
    data: {
      name,
      role,
      status,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });

  return {
    success: true,
    data: user,
  };
});
