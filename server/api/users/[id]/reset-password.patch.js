import { prisma } from "../../../utils/prisma";
import { hashAppPassword } from "../../../utils/password";

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

  if (!["DEVELOPER", "ADMIN"].includes(session.user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Only Developer or Admin can reset password",
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

  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
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
