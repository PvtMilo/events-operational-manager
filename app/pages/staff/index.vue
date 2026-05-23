<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const { user } = useUserSession();

const name = ref("");
const phone = ref("");
const defaultRole = ref("JUNIOR_CREW");
const canBeAssignedToEvent = ref(true);
const status = ref("ACTIVE");
const notes = ref("");

const isSubmitting = ref(false);
const errorMessage = ref("");
const isCreateStaffModalOpen = ref(false);
const isEditStaffModalOpen = ref(false);
const isFilterModalOpen = ref(false);

const search = ref("");
const filterDefaultRole = ref("ALL");
const filterStatus = ref("ALL");
const filterCanBeAssigned = ref("ALL");
const page = ref(1);

const staffUrl = computed(() => {
  const params = new URLSearchParams();

  if (search.value) params.set("search", search.value);
  if (filterDefaultRole.value !== "ALL") {
    params.set("defaultRole", filterDefaultRole.value);
  }
  if (filterStatus.value !== "ALL") params.set("status", filterStatus.value);
  if (filterCanBeAssigned.value !== "ALL") {
    params.set("canBeAssigned", filterCanBeAssigned.value);
  }
  params.set("page", page.value);

  const queryString = params.toString();

  return queryString ? `/api/staff?${queryString}` : "/api/staff";
});

const editingId = ref("");
const editName = ref("");
const editPhone = ref("");
const editDefaultRole = ref("JUNIOR_CREW");
const editCanBeAssignedToEvent = ref(true);
const editStatus = ref("ACTIVE");
const editNotes = ref("");
const isUpdating = ref(false);
const editErrorMessage = ref("");

const { data, pending, error, refresh } = await useFetch(staffUrl);

const roleOptions = [
  { label: "PIC", value: "PIC" },
  { label: "SENIOR_CREW", value: "SENIOR_CREW" },
  { label: "JUNIOR_CREW", value: "JUNIOR_CREW" },
  { label: "INHOUSE", value: "INHOUSE" },
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

const canBeAssignedOptions = [
  { label: "All Assignments", value: "ALL" },
  { label: "Can be assigned", value: "true" },
  { label: "Cannot be assigned", value: "false" },
];

const activeFilterCount = computed(() => {
  let count = 0;
  if (filterDefaultRole.value !== "ALL") count += 1;
  if (filterStatus.value !== "ALL") count += 1;
  if (filterCanBeAssigned.value !== "ALL") count += 1;
  return count;
});

async function handleApplyFilter() {
  page.value = 1;
  await refresh();
  isFilterModalOpen.value = false;
}

async function handleResetFilter() {
  search.value = "";
  filterDefaultRole.value = "ALL";
  filterStatus.value = "ALL";
  filterCanBeAssigned.value = "ALL";
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

async function handleCreate() {
  errorMessage.value = "";

  if (!name.value.trim()) {
    errorMessage.value = "Name is required";
    return;
  }

  isSubmitting.value = true;

  try {
    await $fetch("/api/staff", {
      method: "POST",
      body: {
        name: name.value,
        phone: phone.value,
        defaultRole: defaultRole.value,
        canBeAssignedToEvent: canBeAssignedToEvent.value,
        status: status.value,
        notes: notes.value,
      },
    });

    name.value = "";
    phone.value = "";
    defaultRole.value = "JUNIOR_CREW";
    canBeAssignedToEvent.value = true;
    status.value = "ACTIVE";
    notes.value = "";

    await refresh();
    isCreateStaffModalOpen.value = false;
  } catch (error) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to create staff";
  } finally {
    isSubmitting.value = false;
  }
}

function startEdit(item) {
  editingId.value = item.id;
  editName.value = item.name;
  editPhone.value = item.phone || "";
  editDefaultRole.value = item.defaultRole || "JUNIOR_CREW";
  editCanBeAssignedToEvent.value = item.canBeAssignedToEvent;
  editStatus.value = item.status || "ACTIVE";
  editNotes.value = item.notes || "";
  editErrorMessage.value = "";
  isEditStaffModalOpen.value = true;
}

function cancelEdit() {
  editingId.value = "";
  editName.value = "";
  editPhone.value = "";
  editDefaultRole.value = "JUNIOR_CREW";
  editCanBeAssignedToEvent.value = true;
  editStatus.value = "ACTIVE";
  editNotes.value = "";
  editErrorMessage.value = "";
  isEditStaffModalOpen.value = false;
}

async function handleUpdate() {
  editErrorMessage.value = "";

  if (!editName.value.trim()) {
    editErrorMessage.value = "Name is required";
    return;
  }

  isUpdating.value = true;

  try {
    await $fetch(`/api/staff/${editingId.value}`, {
      method: "PATCH",
      body: {
        name: editName.value,
        phone: editPhone.value,
        defaultRole: editDefaultRole.value,
        canBeAssignedToEvent: editCanBeAssignedToEvent.value,
        status: editStatus.value,
        notes: editNotes.value,
      },
    });

    cancelEdit();
    await refresh();
  } catch (error) {
    editErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to update staff";
  } finally {
    isUpdating.value = false;
  }
}

async function handleDelete(id) {
  const confirmed = confirm("Delete this staff?");

  if (!confirmed) return;

  try {
    await $fetch(`/api/staff/${id}`, {
      method: "DELETE",
    });

    await refresh();
  } catch (error) {
    alert(
      error?.data?.statusMessage ||
        error?.statusMessage ||
        "Failed to delete staff",
    );
  }
}

async function handleHardDeleteStaff(id) {
  const confirmed = confirm(
    "HARD DELETE this staff? This action cannot be undone.",
  );

  if (!confirmed) return;

  try {
    await $fetch(`/api/developer/staff/${id}`, {
      method: "DELETE",
    });

    await refresh();
  } catch (error) {
    alert(
      error?.data?.statusMessage ||
        error?.statusMessage ||
        "Failed to hard delete staff",
    );
  }
}

function getStatusColor(status) {
  if (status === "ACTIVE") return "success";
  if (status === "INACTIVE") return "neutral";

  return "neutral";
}

function getAssignableColor(canAssign) {
  return canAssign ? "success" : "warning";
}

function formatDateTime(dateValue) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleString();
}

function getStaffActionItems(item) {
  const items = [
    {
      label: "Edit",
      icon: "i-lucide-pencil",
      onSelect: () => startEdit(item),
    },
    {
      label: "Delete",
      icon: "i-lucide-ban",
      color: "warning",
      onSelect: () => handleDelete(item.id),
    },
  ];

  if (user.value?.role === "DEVELOPER") {
    items.push({
      label: "Hard Delete",
      icon: "i-lucide-trash-2",
      color: "error",
      onSelect: () => handleHardDeleteStaff(item.id),
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
        <h1 class="text-2xl font-semibold">Staff</h1>
        <p class="text-sm text-muted">
          Manage operational staff, roles, assignment eligibility, and status.
        </p>
      </div>

      <UButton
        icon="i-lucide-plus"
        color="primary"
        @click="isCreateStaffModalOpen = true"
      >
        Add Staff
      </UButton>
    </div>

    <UModal
      v-model:open="isCreateStaffModalOpen"
      title="Add Staff"
      description="Create a new operational staff record."
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <form
          id="create-staff-form"
          class="space-y-4"
          @submit.prevent="handleCreate"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Name" required>
              <UInput
                v-model="name"
                placeholder="Example: Andi"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Phone">
              <UInput
                v-model="phone"
                placeholder="Example: 08123456789"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Default Role">
              <USelect
                v-model="defaultRole"
                :items="roleOptions"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Status">
              <USelect
                v-model="status"
                :items="statusOptions"
                class="w-full"
              />
            </UFormField>
          </div>

          <UCheckbox
            v-model="canBeAssignedToEvent"
            label="Can be assigned to event"
          />

          <UFormField label="Notes">
            <UTextarea
              v-model="notes"
              placeholder="Optional notes"
              class="w-full"
            />
          </UFormField>

          <p v-if="errorMessage" class="text-sm text-red-500">
            {{ errorMessage }}
          </p>
        </form>
      </template>

      <template #footer>
        <div class="flex gap-2 w-full justify-end">
          <UButton
            color="neutral"
            variant="ghost"
            type="button"
            @click="isCreateStaffModalOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            form="create-staff-form"
            type="submit"
            color="primary"
            :loading="isSubmitting"
          >
            Save Staff
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="isEditStaffModalOpen"
      title="Edit Staff"
      description="Update staff profile and assignment settings."
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <form
          id="edit-staff-form"
          class="space-y-4"
          @submit.prevent="handleUpdate"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Name" required>
              <UInput v-model="editName" class="w-full" />
            </UFormField>

            <UFormField label="Phone">
              <UInput v-model="editPhone" class="w-full" />
            </UFormField>

            <UFormField label="Default Role">
              <USelect
                v-model="editDefaultRole"
                :items="roleOptions"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Status">
              <USelect
                v-model="editStatus"
                :items="statusOptions"
                class="w-full"
              />
            </UFormField>
          </div>

          <UCheckbox
            v-model="editCanBeAssignedToEvent"
            label="Can be assigned to event"
          />

          <UFormField label="Notes">
            <UTextarea
              v-model="editNotes"
              placeholder="Optional notes"
              class="w-full"
            />
          </UFormField>

          <p v-if="editErrorMessage" class="text-sm text-red-500">
            {{ editErrorMessage }}
          </p>
        </form>
      </template>

      <template #footer>
        <div class="flex gap-2 w-full justify-end">
          <UButton
            color="neutral"
            variant="ghost"
            type="button"
            @click="cancelEdit"
          >
            Cancel
          </UButton>
          <UButton
            form="edit-staff-form"
            type="submit"
            color="primary"
            :loading="isUpdating"
          >
            Update Staff
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
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search staff"
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
      title="Filter Staff"
      description="Apply advanced filters to the staff list."
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <form
          id="staff-filter-form"
          class="space-y-4"
          @submit.prevent="handleApplyFilter"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Default Role">
              <USelect
                v-model="filterDefaultRole"
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

            <UFormField label="Can Be Assigned">
              <USelect
                v-model="filterCanBeAssigned"
                :items="canBeAssignedOptions"
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

          <UButton form="staff-filter-form" type="submit" color="primary">
            Apply Filter
          </UButton>
        </div>
      </template>
    </UModal>

    <UCard>
      <p v-if="pending" class="text-sm text-muted">Loading staff...</p>
      <p v-else-if="error" class="text-sm text-red-500">
        Failed to load staff.
      </p>
      <p v-else-if="data?.data?.length === 0" class="text-sm text-muted">
        No staff found.
      </p>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-default text-left">
              <th class="py-2 pr-4">Staff</th>
              <th class="py-2 pr-4">Phone</th>
              <th class="py-2 pr-4">Default Role</th>
              <th class="py-2 pr-4">Can Assign</th>
              <th class="py-2 pr-4">Status</th>
              <th class="py-2 pr-4">Notes</th>
              <th class="py-2 pr-4">Created At</th>
              <th class="py-2 pr-4"></th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in data?.data"
              :key="item.id"
              class="border-b border-default align-top"
            >
              <td class="py-3 pr-4 font-medium">{{ item.name }}</td>
              <td class="py-3 pr-4">{{ item.phone || "-" }}</td>
              <td class="py-3 pr-4">
                <UBadge color="neutral" variant="soft">
                  {{ item.defaultRole }}
                </UBadge>
              </td>
              <td class="py-3 pr-4">
                <UBadge
                  :color="getAssignableColor(item.canBeAssignedToEvent)"
                  variant="soft"
                >
                  {{ item.canBeAssignedToEvent ? "Yes" : "No" }}
                </UBadge>
              </td>
              <td class="py-3 pr-4">
                <UBadge :color="getStatusColor(item.status)" variant="soft">
                  {{ item.status }}
                </UBadge>
              </td>
              <td class="py-3 pr-4 max-w-xs">
                {{ item.notes || "-" }}
              </td>
              <td class="py-3 pr-4 min-w-40">
                {{ formatDateTime(item.createdAt) }}
              </td>
              <td class="py-3 pr-4">
                <UDropdownMenu
                  :items="getStaffActionItems(item)"
                  :content="{ align: 'end' }"
                >
                  <UButton
                    icon="i-lucide-ellipsis-vertical"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    aria-label="Staff actions"
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
            Page {{ data.pagination.page }} of {{ data.pagination.totalPages }}
            - Total {{ data.pagination.totalItems }} staff
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
