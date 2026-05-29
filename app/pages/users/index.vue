<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: ["auth", "no-staff-users"],
});

const { user } = useUserSession();
const config = useRuntimeConfig();
const isDemoMode = computed(() => {
  return config.public.demoMode === true || config.public.demoMode === "true";
});
const demoModeMessage = "This action is disabled in demo mode.";

const name = ref("");
const email = ref("");
const password = ref("");
const role = ref("STAFF");

const isSubmitting = ref(false);
const errorMessage = ref("");
const isCreateUserModalOpen = ref(false);
const isEditUserModalOpen = ref(false);
const isResetPasswordModalOpen = ref(false);
const isFilterModalOpen = ref(false);

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

const filterRole = ref("ALL");
const filterStatus = ref("ALL");
const page = ref(1);
const {
  searchInput,
  appliedSearch,
  applySearchNow,
  resetSearch,
} = useDebouncedSearch({
  onApply: () => {
    page.value = 1;
  },
});

const roleOptions = [
  { label: "DEVELOPER", value: "DEVELOPER" },
  { label: "ADMIN", value: "ADMIN" },
  { label: "SCHEDULE_MAKER", value: "SCHEDULE_MAKER" },
  { label: "HEAD_OPERATIONAL", value: "HEAD_OPERATIONAL" },
  { label: "STAFF", value: "STAFF" },
];

const roleFilterOptions = [
  { label: "All Roles", value: "ALL" },
  ...roleOptions,
];

const statusOptions = [
  { label: "ACTIVE", value: "ACTIVE" },
  { label: "INACTIVE", value: "INACTIVE" },
];

const statusFilterOptions = [
  { label: "All Status", value: "ALL" },
  ...statusOptions,
];

const activeFilterCount = computed(() => {
  let count = 0;
  if (filterRole.value !== "ALL") count += 1;
  if (filterStatus.value !== "ALL") count += 1;
  return count;
});

const usersUrl = computed(() => {
  const params = new URLSearchParams();

  if (appliedSearch.value) params.set("search", appliedSearch.value);
  if (filterRole.value !== "ALL") params.set("role", filterRole.value);
  if (filterStatus.value !== "ALL") params.set("status", filterStatus.value);
  params.set("page", page.value);

  const queryString = params.toString();

  return queryString ? `/api/users?${queryString}` : "/api/users";
});

const { data, pending, error, refresh } = await useFetch(usersUrl);

async function handleApplyFilter() {
  applySearchNow();
  page.value = 1;
  await refresh();
  isFilterModalOpen.value = false;
}

async function handleResetFilter() {
  resetSearch();
  filterRole.value = "ALL";
  filterStatus.value = "ALL";
  page.value = 1;

  await refresh();
  isFilterModalOpen.value = false;
}

async function goToPreviousPage() {
  if (page.value <= 1) return;

  page.value -= 1;
  await refresh();
}

async function goToNextPage() {
  if (page.value >= data.value?.pagination?.totalPages) return;

  page.value += 1;
  await refresh();
}

function openCreateUserModal() {
  errorMessage.value = "";
  isCreateUserModalOpen.value = true;
}

function startEdit(user) {
  editingId.value = user.id;
  editName.value = user.name;
  editRole.value = user.role;
  editStatus.value = user.status;
  editErrorMessage.value = "";
  isEditUserModalOpen.value = true;
}

function cancelEdit() {
  editingId.value = "";
  editName.value = "";
  editRole.value = "STAFF";
  editStatus.value = "ACTIVE";
  editErrorMessage.value = "";
  isEditUserModalOpen.value = false;
}

function startResetPassword(user) {
  if (isDemoMode.value) {
    alert(demoModeMessage);
    return;
  }

  resetPasswordUserId.value = user.id;
  resetPasswordUserName.value = user.name;
  newPassword.value = "";
  resetPasswordErrorMessage.value = "";
  resetPasswordSuccessMessage.value = "";
  isResetPasswordModalOpen.value = true;
}

function cancelResetPassword() {
  resetPasswordUserId.value = "";
  resetPasswordUserName.value = "";
  newPassword.value = "";
  resetPasswordErrorMessage.value = "";
  resetPasswordSuccessMessage.value = "";
  isResetPasswordModalOpen.value = false;
}

async function handleResetPassword() {
  resetPasswordErrorMessage.value = "";
  resetPasswordSuccessMessage.value = "";

  if (isDemoMode.value) {
    resetPasswordErrorMessage.value = demoModeMessage;
    return;
  }

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
    isCreateUserModalOpen.value = false;
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

async function handleHardDeleteUser(id) {
  if (isDemoMode.value) {
    alert(demoModeMessage);
    return;
  }

  const confirmed = confirm(
    "HARD DELETE this user? This action cannot be undone.",
  );

  if (!confirmed) return;

  try {
    await $fetch(`/api/developer/users/${id}`, {
      method: "DELETE",
    });

    await refresh();
  } catch (error) {
    alert(
      error?.data?.statusMessage ||
        error?.statusMessage ||
        "Failed to hard delete user",
    );
  }
}

function getStatusColor(status) {
  if (status === "ACTIVE") return "success";
  if (status === "INACTIVE") return "neutral";

  return "neutral";
}

function formatDateTime(dateValue) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleString();
}

function getUserActionItems(item) {
  const items = [
    {
      label: "Edit",
      icon: "i-lucide-pencil",
      onSelect: () => startEdit(item),
    },
    {
      label: isDemoMode.value
        ? "Reset Password (Disabled in Demo)"
        : "Reset Password",
      icon: "i-lucide-key-round",
      disabled: isDemoMode.value,
      onSelect: () => startResetPassword(item),
    },
  ];

  if (user.value?.role === "DEVELOPER" && user.value?.id !== item.id) {
    items.push({
      label: isDemoMode.value ? "Hard Delete (Disabled in Demo)" : "Hard Delete",
      icon: "i-lucide-trash-2",
      color: "error",
      disabled: isDemoMode.value,
      onSelect: () => handleHardDeleteUser(item.id),
    });
  }

  return items;
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div
      class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <h1 class="text-2xl font-semibold">Users</h1>
        <p class="text-sm text-muted">
          Manage application users, roles, account status, and password resets.
        </p>
      </div>

      <UButton icon="i-lucide-plus" color="primary" @click="openCreateUserModal">
        Add User
      </UButton>
    </div>

    <UModal
      v-model:open="isCreateUserModalOpen"
      title="Add User"
      description="Create a new application account."
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <form
          id="create-user-form"
          class="space-y-4"
          @submit.prevent="handleCreate"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Name" required>
              <UInput v-model="name" placeholder="Example: Andi" class="w-full" />
            </UFormField>

            <UFormField label="Email" required>
              <UInput
                v-model="email"
                type="email"
                placeholder="andi@example.com"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Password" required>
              <UInput v-model="password" type="password" class="w-full" />
            </UFormField>

            <UFormField label="Role">
              <USelect v-model="role" :items="roleOptions" class="w-full" />
            </UFormField>
          </div>

          <p v-if="errorMessage" class="text-sm text-red-500">
            {{ errorMessage }}
          </p>
        </form>
      </template>

      <template #footer>
        <div class="flex gap-2 w-full justify-end">
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            @click="isCreateUserModalOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            form="create-user-form"
            type="submit"
            color="primary"
            :loading="isSubmitting"
          >
            Save User
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="isEditUserModalOpen"
      title="Edit User"
      description="Update user profile, role, and account status."
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <form
          id="edit-user-form"
          class="space-y-4"
          @submit.prevent="handleUpdate"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Name" required>
              <UInput v-model="editName" class="w-full" />
            </UFormField>

            <UFormField label="Role">
              <USelect v-model="editRole" :items="roleOptions" class="w-full" />
            </UFormField>

            <UFormField label="Status">
              <USelect
                v-model="editStatus"
                :items="statusOptions"
                class="w-full"
              />
            </UFormField>
          </div>

          <p v-if="editErrorMessage" class="text-sm text-red-500">
            {{ editErrorMessage }}
          </p>
        </form>
      </template>

      <template #footer>
        <div class="flex gap-2 w-full justify-end">
          <UButton type="button" color="neutral" variant="ghost" @click="cancelEdit">
            Cancel
          </UButton>
          <UButton
            form="edit-user-form"
            type="submit"
            color="primary"
            :loading="isUpdating"
          >
            Update User
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="isResetPasswordModalOpen"
      title="Reset Password"
      :description="`Set a new password for ${resetPasswordUserName || 'this user'}.`"
      :ui="{ content: 'max-w-lg' }"
    >
      <template #body>
        <form
          id="reset-password-form"
          class="space-y-4"
          @submit.prevent="handleResetPassword"
        >
          <UFormField label="New Password" required>
            <UInput v-model="newPassword" type="password" class="w-full" />
          </UFormField>

          <p v-if="isDemoMode" class="text-sm text-amber-600">
            Reset password is disabled in demo mode.
          </p>

          <p v-if="resetPasswordErrorMessage" class="text-sm text-red-500">
            {{ resetPasswordErrorMessage }}
          </p>

          <p v-if="resetPasswordSuccessMessage" class="text-sm text-green-600">
            {{ resetPasswordSuccessMessage }}
          </p>
        </form>
      </template>

      <template #footer>
        <div class="flex gap-2 w-full justify-end">
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            @click="cancelResetPassword"
          >
            Cancel
          </UButton>
          <UButton
            form="reset-password-form"
            type="submit"
            color="primary"
            :loading="isResettingPassword"
            :disabled="isDemoMode"
          >
            {{ isDemoMode ? "Disabled in Demo" : "Reset Password" }}
          </UButton>
        </div>
      </template>
    </UModal>

    <UCard>
      <div
        class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div class="w-full lg:max-w-sm">
          <UInput
            v-model="searchInput"
            icon="i-lucide-search"
            placeholder="Search users"
            class="w-full"
            size="md"
            @keyup.enter="handleApplyFilter"
          />
        </div>

        <div class="flex flex-wrap items-center gap-2 w-full md:justify-end">
          <USelect
            v-model="filterStatus"
            :items="statusFilterOptions"
            size="md"
            class="w-full md:w-40"
            @update:model-value="handleApplyFilter"
          />

          <UButton
            type="button"
            size="md"
            color="neutral"
            variant="outline"
            icon="i-lucide-sliders-horizontal"
            @click="isFilterModalOpen = true"
          >
            Filter
            <UBadge
              v-if="activeFilterCount > 0"
              color="primary"
              variant="solid"
              size="md"
              class="ml-1"
            >
              {{ activeFilterCount }}
            </UBadge>
          </UButton>
        </div>
      </div>
    </UCard>

    <UModal
      v-model:open="isFilterModalOpen"
      title="Filter Users"
      description="Apply role and status filters to the user list."
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <form
          id="user-filter-form"
          class="space-y-4"
          @submit.prevent="handleApplyFilter"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Role">
              <USelect
                v-model="filterRole"
                :items="roleFilterOptions"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Status">
              <USelect
                v-model="filterStatus"
                :items="statusFilterOptions"
                class="w-full"
              />
            </UFormField>
          </div>
        </form>
      </template>

      <template #footer>
        <div class="flex gap-2 w-full justify-end">
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            @click="handleResetFilter"
          >
            Reset
          </UButton>

          <UButton form="user-filter-form" type="submit" color="primary">
            Apply Filter
          </UButton>
        </div>
      </template>
    </UModal>

    <UCard>
      <p v-if="pending" class="text-sm text-muted">Loading users...</p>
      <p v-else-if="error" class="text-sm text-red-500">
        Failed to load users.
      </p>
      <p v-else-if="data?.data?.length === 0" class="text-sm text-muted">
        No users found.
      </p>

      <div v-else class="touch-scroll-x overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-default text-left">
              <th class="py-2 pr-4">User</th>
              <th class="py-2 pr-4">Email</th>
              <th class="py-2 pr-4">Role</th>
              <th class="py-2 pr-4">Status</th>
              <th class="py-2 pr-4">Created At</th>
              <th class="py-2 pr-4"></th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="user in data?.data"
              :key="user.id"
              class="border-b border-default align-top"
            >
              <td class="py-3 pr-4 font-medium">{{ user.name }}</td>
              <td class="py-3 pr-4">{{ user.email }}</td>
              <td class="py-3 pr-4">
                <UBadge color="neutral" variant="soft">
                  {{ user.role }}
                </UBadge>
              </td>
              <td class="py-3 pr-4">
                <UBadge :color="getStatusColor(user.status)" variant="soft">
                  {{ user.status }}
                </UBadge>
              </td>
              <td class="py-3 pr-4 min-w-40">
                {{ formatDateTime(user.createdAt) }}
              </td>
              <td class="py-3 pr-4">
                <UDropdownMenu
                  :items="getUserActionItems(user)"
                  :content="{ align: 'end' }"
                >
                  <UButton
                    icon="i-lucide-ellipsis-vertical"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    aria-label="User actions"
                  />
                </UDropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template #footer>
        <div
          v-if="data?.pagination"
          class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
        >
          <p class="text-sm text-muted">
            Page {{ data.pagination.page }} of
            {{ data.pagination.totalPages }} - Total
            {{ data.pagination.totalItems }} users
          </p>

          <div class="flex gap-2">
            <UButton
              type="button"
              color="neutral"
              variant="outline"
              :disabled="data.pagination.page <= 1"
              @click="goToPreviousPage"
            >
              Previous
            </UButton>
            <UButton
              type="button"
              color="neutral"
              variant="outline"
              :disabled="data.pagination.page >= data.pagination.totalPages"
              @click="goToNextPage"
            >
              Next
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </div>
</template>
