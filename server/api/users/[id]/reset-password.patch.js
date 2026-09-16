import { prisma } from "../../../utils/prisma";
import { hashAppPassword } from "../../../utils/password";

function canResetPassword(actorRole, targetRole) {
  if (actorRole === "DEVELOPER") {
    return true;
  }

  if (actorRole === "ADMIN") {
    return targetRole !== "DEVELOPER";
  }

  return false;
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const newPassword = body?.newPassword;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "User id is required",
    });
  }

  if (!newPassword || newPassword.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: "New password must be at least 8 characters",
    });
  }

  const targetUser = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!targetUser) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }

  if (!canResetPassword(session.user.role, targetUser.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "You are not allowed to reset this user's password",
    });
  }

  if (process.env.DEMO_MODE === "true") {
    throw createError({
      statusCode: 403,
      statusMessage: "Reset password is disabled in demo mode",
    });
  }

  const passwordHash = await hashAppPassword(newPassword);

  await prisma.user.update({
    where: {
      id,
    },
    data: {
      passwordHash,
    },
  });

  return {
    success: true,
    message: "Password reset successfully",
  };
});
