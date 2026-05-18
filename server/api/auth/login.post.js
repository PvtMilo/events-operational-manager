import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const email = body?.email;
  const password = body?.password;

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email and password are required",
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid email or password",
    });
  }

  if (user.status !== "ACTIVE") {
    throw createError({
      statusCode: 403,
      statusMessage: "User account is inactive",
    });
  }

  const isPasswordValid = await verifyAppPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid email or password",
    });
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
});