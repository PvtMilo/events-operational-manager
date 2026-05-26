<script setup>
definePageMeta({
  middleware: "guest",
});

const email = ref("admin@eventops.test");
const password = ref("admin12345");
const isLoading = ref(false);
const errorMessage = ref("");

const { fetch } = useUserSession();
const { t } = useI18n();

async function handleLogin() {
  errorMessage.value = "";
  isLoading.value = true;

  try {
    await $fetch("/api/auth/login", {
      method: "POST",
      body: {
        email: email.value,
        password: password.value,
      },
    });

    await fetch();

    await navigateTo("/dashboard");
  } catch (error) {
    errorMessage.value =
      error?.statusMessage ||
      error?.data?.statusMessage ||
      t("auth.login.failed");
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <main class="min-h-screen bg-slate-950 flex items-center justify-center px-4">
    <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
      <div class="mb-8">
        <p class="text-sm font-semibold text-slate-500">
          {{ t("common.brand") }}
        </p>
        <h1 class="mt-2 text-2xl font-bold text-slate-900">
          {{ t("auth.login.title") }}
        </h1>
        <p class="mt-2 text-sm text-slate-500">
          {{ t("auth.login.description") }}
        </p>
      </div>

      <form class="space-y-5" @submit.prevent="handleLogin">
        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">
            {{ t("auth.login.email") }}
          </label>
          <input
            v-model="email"
            type="email"
            class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
            placeholder="admin@eventops.test"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">
            {{ t("auth.login.password") }}
          </label>
          <input
            v-model="password"
            type="password"
            class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
            :placeholder="t('auth.login.passwordPlaceholder')"
          />
        </div>

        <div
          v-if="errorMessage"
          class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ isLoading ? t("auth.login.loading") : t("auth.login.submit") }}
        </button>
      </form>

      <div class="mt-6 rounded-xl bg-slate-100 p-4 text-xs text-slate-600">
        <p class="font-semibold text-slate-800">
          {{ t("auth.login.demoAccount") }}
        </p>
        <p class="mt-1">
          {{ t("auth.login.email") }}: admin@eventops.test
        </p>
        <p>{{ t("auth.login.password") }}: admin12345</p>
      </div>
    </div>
  </main>
</template>
