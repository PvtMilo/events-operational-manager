const publicApiPaths = new Set([
  "/api/auth/login",
  "/api/auth/logout",
  "/api/_auth/session",
]);

export default defineEventHandler(async (event) => {
  const { pathname } = getRequestURL(event);

  if (!pathname.startsWith("/api/") || publicApiPaths.has(pathname)) return;

  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }
});
