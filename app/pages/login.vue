<script setup>
definePageMeta({
  middleware: "guest",
});

const email = ref("");
const password = ref("");
const isLoading = ref(false);
const errorMessage = ref("");

const { fetch } = useUserSession();

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
      error?.statusMessage || error?.data?.statusMessage || "Login failed";
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <main class="min-h-screen bg-zinc-200 flex items-center justify-center px-4">
    <div class="w-full max-w-md bg-white rounded-lg overflow-hidden shadow-md">
      <div class="text-center w-full bg-primary-400">
        <h1 class="text-2xl font-light p-4 text-white">
          Event Operational Manager
        </h1>
      </div>

      <form class="space-y-4 p-8" @submit.prevent="handleLogin">
        <div>
          <label class="mb-2 block text-md font-medium text-slate-700">
            Email :
          </label>
          <input
            v-model="email"
            type="email"
            class="w-full rounded-lg border border-slate-300 px-4 py-3 text-md outline-none focus:border-slate-900 text-black"
          />
        </div>

        <div>
          <label class="mb-2 block text-md font-medium text-slate-700">
            Password :
          </label>
          <input
            v-model="password"
            type="password"
            class="w-full rounded-lg border border-slate-300 px-4 py-3 text-md outline-none focus:border-slate-900 text-black"
          />
        </div>

        <div
          v-if="errorMessage"
          class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ errorMessage }}
        </div>
        <div class="w-full flex justify-center pt-4">
          <button
            type="submit"
            :disabled="isLoading"
            class=" rounded-lg bg-primary-400 px-6 py-3 text-md font-semibold text-white transition hover:bg-primary-600"
          >
            {{ isLoading ? "Logging in..." : "Log in" }}
          </button>
        </div>
      </form>

      <div class="bg-slate-100 p-4 text-xs text-slate-600">
        <p class="font-semibold text-slate-800">Demo Account</p>
        <p class="mt-1">Email: admin@eventops.test</p>
        <p>Password: admin12345</p>
      </div>
    </div>
  </main>
</template>
