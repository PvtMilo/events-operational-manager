export async function denyStaff(event) {
  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (session.user.role === "STAFF") {
    throw createError({
      statusCode: 403,
      statusMessage: "Staff cannot access reports",
    });
  }

  return session.user;
}
