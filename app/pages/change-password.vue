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
  <section>
    <h1>Change Password</h1>
    <p>Update your own account password.</p>

    <hr />

    <form @submit.prevent="handleChangePassword">
      <div>
        <label>Current Password</label>
        <br />
        <input v-model="currentPassword" type="password" />
      </div>

      <br />

      <div>
        <label>New Password</label>
        <br />
        <input v-model="newPassword" type="password" />
      </div>

      <br />

      <div>
        <label>Confirm New Password</label>
        <br />
        <input v-model="confirmNewPassword" type="password" />
      </div>

      <br />

      <p v-if="errorMessage" style="color: red">
        {{ errorMessage }}
      </p>

      <p v-if="successMessage" style="color: green">
        {{ successMessage }}
      </p>

      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? "Saving..." : "Change Password" }}
      </button>
    </form>
  </section>
</template>
