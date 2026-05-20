<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const name = ref("");
const email = ref("");
const password = ref("");
const role = ref("STAFF");

const isSubmitting = ref(false);
const errorMessage = ref("");

const editingId = ref("");
const editName = ref("");
const editRole = ref("STAFF");
const editStatus = ref("ACTIVE");
const isUpdating = ref(false);
const editErrorMessage = ref("");

const resetPasswordUserId = ref("");
const resetPasswordUserName = ref("");
const newPassword = ref("");
const isResettingPassword = ref(false);
const resetPasswordErrorMessage = ref("");
const resetPasswordSuccessMessage = ref("");

const { data, pending, error, refresh } = await useFetch("/api/users");

function startEdit(user) {
  editingId.value = user.id;
  editName.value = user.name;
  editRole.value = user.role;
  editStatus.value = user.status;
  editErrorMessage.value = "";
}

function cancelEdit() {
  editingId.value = "";
  editName.value = "";
  editRole.value = "STAFF";
  editStatus.value = "ACTIVE";
  editErrorMessage.value = "";
}

function startResetPassword(user) {
  resetPasswordUserId.value = user.id;
  resetPasswordUserName.value = user.name;
  newPassword.value = "";
  resetPasswordErrorMessage.value = "";
  resetPasswordSuccessMessage.value = "";
}

function cancelResetPassword() {
  resetPasswordUserId.value = "";
  resetPasswordUserName.value = "";
  newPassword.value = "";
  resetPasswordErrorMessage.value = "";
  resetPasswordSuccessMessage.value = "";
}

async function handleResetPassword() {
  resetPasswordErrorMessage.value = "";
  resetPasswordSuccessMessage.value = "";

  if (!newPassword.value || newPassword.value.length < 8) {
    resetPasswordErrorMessage.value =
      "New password must be at least 8 characters";
    return;
  }

  isResettingPassword.value = true;

  try {
    await $fetch(`/api/users/${resetPasswordUserId.value}/reset-password`, {
      method: "PATCH",
      body: {
        newPassword: newPassword.value,
      },
    });

    resetPasswordSuccessMessage.value = "Password reset successfully";
    newPassword.value = "";
  } catch (error) {
    resetPasswordErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to reset password";
  } finally {
    isResettingPassword.value = false;
  }
}

async function handleCreate() {
  errorMessage.value = "";

  if (!name.value.trim()) {
    errorMessage.value = "Name is required";
    return;
  }

  if (!email.value.trim()) {
    errorMessage.value = "Email is required";
    return;
  }

  if (!password.value || password.value.length < 8) {
    errorMessage.value = "Password must be at least 8 characters";
    return;
  }

  isSubmitting.value = true;

  try {
    await $fetch("/api/users", {
      method: "POST",
      body: {
        name: name.value,
        email: email.value,
        password: password.value,
        role: role.value,
      },
    });

    name.value = "";
    email.value = "";
    password.value = "";
    role.value = "STAFF";

    await refresh();
  } catch (error) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to create user";
  } finally {
    isSubmitting.value = false;
  }
}

async function handleUpdate() {
  editErrorMessage.value = "";

  if (!editName.value.trim()) {
    editErrorMessage.value = "Name is required";
    return;
  }

  isUpdating.value = true;

  try {
    await $fetch(`/api/users/${editingId.value}`, {
      method: "PATCH",
      body: {
        name: editName.value,
        role: editRole.value,
        status: editStatus.value,
      },
    });

    cancelEdit();
    await refresh();
  } catch (error) {
    editErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to update user";
  } finally {
    isUpdating.value = false;
  }
}
</script>

<template>
  <section>
    <h1>Users</h1>
    <p>Manage application users.</p>

    <hr />

    <form @submit.prevent="handleCreate">
      <h2>Add User</h2>

      <div>
        <label>Name</label>
        <br />
        <input v-model="name" type="text" />
      </div>

      <br />

      <div>
        <label>Email</label>
        <br />
        <input v-model="email" type="email" />
      </div>

      <br />

      <div>
        <label>Password</label>
        <br />
        <input v-model="password" type="password" />
      </div>

      <br />

      <div>
        <label>Role</label>
        <br />
        <select v-model="role">
          <option value="DEVELOPER">DEVELOPER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SCHEDULE_MAKER">SCHEDULE_MAKER</option>
          <option value="HEAD_OPERATIONAL">HEAD_OPERATIONAL</option>
          <option value="STAFF">STAFF</option>
        </select>
      </div>

      <br />

      <p v-if="errorMessage" style="color: red">
        {{ errorMessage }}
      </p>

      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? "Saving..." : "Save User" }}
      </button>
    </form>

    <hr />

    <div v-if="editingId">
      <h2>Edit User</h2>

      <form @submit.prevent="handleUpdate">
        <div>
          <label>Name</label>
          <br />
          <input v-model="editName" type="text" />
        </div>

        <br />

        <div>
          <label>Role</label>
          <br />
          <select v-model="editRole">
            <option value="DEVELOPER">DEVELOPER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SCHEDULE_MAKER">SCHEDULE_MAKER</option>
            <option value="HEAD_OPERATIONAL">HEAD_OPERATIONAL</option>
            <option value="STAFF">STAFF</option>
          </select>
        </div>

        <br />

        <div>
          <label>Status</label>
          <br />
          <select v-model="editStatus">
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        <br />

        <p v-if="editErrorMessage" style="color: red">
          {{ editErrorMessage }}
        </p>

        <button type="submit" :disabled="isUpdating">
          {{ isUpdating ? "Updating..." : "Update User" }}
        </button>

        <button type="button" @click="cancelEdit">
          Cancel
        </button>
      </form>

      <hr />
    </div>

    <div v-if="resetPasswordUserId">
      <h2>Reset Password</h2>

      <p>User: {{ resetPasswordUserName }}</p>

      <form @submit.prevent="handleResetPassword">
        <div>
          <label>New Password</label>
          <br />
          <input v-model="newPassword" type="password" />
        </div>

        <br />

        <p v-if="resetPasswordErrorMessage" style="color: red">
          {{ resetPasswordErrorMessage }}
        </p>

        <p v-if="resetPasswordSuccessMessage" style="color: green">
          {{ resetPasswordSuccessMessage }}
        </p>

        <button type="submit" :disabled="isResettingPassword">
          {{ isResettingPassword ? "Resetting..." : "Reset Password" }}
        </button>

        <button type="button" @click="cancelResetPassword">
          Cancel
        </button>
      </form>
    </div>

    <h2>User List</h2>

    <p v-if="pending">Loading users...</p>
    <p v-else-if="error">Failed to load users.</p>

    <table v-else border="1" cellpadding="8" cellspacing="0">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Created At</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="user in data?.data" :key="user.id">
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.role }}</td>
          <td>{{ user.status }}</td>
          <td>{{ new Date(user.createdAt).toLocaleString() }}</td>
          <td>
            <button type="button" @click="startEdit(user)">
              Edit
            </button>

            |

            <button type="button" @click="startResetPassword(user)">
              Reset Password
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="data?.data?.length === 0">No users yet.</p>
  </section>
</template>
