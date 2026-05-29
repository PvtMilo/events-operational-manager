import { prisma } from "../utils/prisma";
import { hashAppPassword } from "../utils/password";
import { denyStaffUsers } from "../utils/permission";

const allowedRoles = [
  "DEVELOPER",
  "ADMIN",
  "SCHEDULE_MAKER",
  "HEAD_OPERATIONAL",
  "STAFF",
];

export default defineEventHandler(async (event) => {
  await denyStaffUsers(event);

  if (process.env.DEMO_MODE === "true") {
    throw createError({
      statusCode: 403,
      statusMessage: "Create user is disabled in demo mode",
    });
  }

  const body = await readBody(event);

  const name = body?.name?.trim();
  const email = body?.email?.trim()?.toLowerCase();
  const password = body?.password;
  const role = body?.role || "STAFF";

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Name is required",
    });
  }

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email is required",
    });
  }

  if (!password || password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: "Password must be at least 8 characters",
    });
  }

  if (!allowedRoles.includes(role)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid user role",
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email already exists",
    });
  }

  const passwordHash = await hashAppPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return {
    success: true,
    data: user,
  };
});
