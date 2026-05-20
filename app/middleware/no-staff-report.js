export default defineNuxtRouteMiddleware(() => {
  const { user } = useUserSession();

  if (user.value?.role === "STAFF") {
    return navigateTo("/dashboard");
  }
});
