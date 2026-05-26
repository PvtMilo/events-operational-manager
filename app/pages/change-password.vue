<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const currentPassword = ref("");
const newPassword = ref("");
const confirmNewPassword = ref("");

const isSubmitting = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

async function handleChangePassword() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!currentPassword.value) {
    errorMessage.value = "Current password is required";
    return;
  }

  if (!newPassword.value || newPassword.value.length < 8) {
    errorMessage.value = "New password must be at least 8 characters";
    return;
  }

  if (newPassword.value !== confirmNewPassword.value) {
    errorMessage.value = "New password confirmation does not match";
    return;
  }

  isSubmitting.value = true;

  try {
    await $fetch("/api/users/change-password", {
      method: "PATCH",
      body: {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      },
    });

    currentPassword.value = "";
    newPassword.value = "";
    confirmNewPassword.value = "";
    successMessage.value = "Password changed successfully";
  } catch (error) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to change password";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="p-6">
    <div class="mx-auto max-w-xl space-y-6">
      <div>
        <h1 class="text-2xl font-semibold">Change Password</h1>
        <p class="mt-1 text-sm text-muted">
          Update your account password.
        </p>
      </div>

      <UCard>
        <form class="space-y-5" @submit.prevent="handleChangePassword">
          <UFormField label="Current Password" required>
            <UInput
              v-model="currentPassword"
              type="password"
              autocomplete="current-password"
              icon="i-lucide-lock-keyhole"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="New Password"
            description="Minimum 8 characters."
            required
          >
            <UInput
              v-model="newPassword"
              type="password"
              autocomplete="new-password"
              icon="i-lucide-key-round"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Confirm New Password" required>
            <UInput
              v-model="confirmNewPassword"
              type="password"
              autocomplete="new-password"
              icon="i-lucide-key-round"
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="errorMessage"
            color="error"
            variant="soft"
            icon="i-lucide-circle-alert"
            :title="errorMessage"
          />

          <UAlert
            v-if="successMessage"
            color="success"
            variant="soft"
            icon="i-lucide-circle-check"
            :title="successMessage"
          />

          <div class="flex justify-end">
            <UButton
              type="submit"
              color="primary"
              icon="i-lucide-save"
              :loading="isSubmitting"
            >
              Change Password
            </UButton>
          </div>
        </form>
      </UCard>
    </div>
  </div>
</template>
