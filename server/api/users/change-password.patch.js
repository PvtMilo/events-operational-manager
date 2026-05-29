import { prisma } from "../../utils/prisma";
import { hashAppPassword, verifyAppPassword } from "../../utils/password";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  const body = await readBody(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (process.env.DEMO_MODE === "true") {
    throw createError({
      statusCode: 403,
      statusMessage: "This action is disabled in demo mode",
    });
  }

  const currentPassword = body?.currentPassword;
  const newPassword = body?.newPassword;

  if (!currentPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: "Current password is required",
    });
  }

  if (!newPassword || newPassword.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: "New password must be at least 8 characters",
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }

  const isCurrentPasswordValid = await verifyAppPassword(
    currentPassword,
    user.passwordHash,
  );

  if (!isCurrentPasswordValid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Current password is incorrect",
    });
  }

  const passwordHash = await hashAppPassword(newPassword);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      passwordHash,
    },
  });

  return {
    success: true,
    message: "Password changed successfully",
  };
});
