<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const { user } = useUserSession();

const name = ref("");
const phone = ref("");
const notes = ref("");
const status = ref("ACTIVE");

const isSubmitting = ref(false);
const errorMessage = ref("");
const isCreateSalesModalOpen = ref(false);
const isEditSalesModalOpen = ref(false);
const isFilterModalOpen = ref(false);

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

const salesUrl = computed(() => {
  const params = new URLSearchParams();

  if (appliedSearch.value) params.set("search", appliedSearch.value);
  if (filterStatus.value !== "ALL") params.set("status", filterStatus.value);
  params.set("page", page.value);

  const queryString = params.toString();

  return queryString ? `/api/sales?${queryString}` : "/api/sales";
});

const editingId = ref("");
const editName = ref("");
const editPhone = ref("");
const editNotes = ref("");
const editStatus = ref("ACTIVE");
const isUpdating = ref(false);
const editErrorMessage = ref("");

const { data, pending, error, refresh } = await useFetch(salesUrl);

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
  if (filterStatus.value !== "ALL") count += 1;
  return count;
});

async function handleApplyFilter() {
  applySearchNow();
  page.value = 1;
  await refresh();
  isFilterModalOpen.value = false;
}

async function handleResetFilter() {
  resetSearch();
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

async function handleCreate() {
  errorMessage.value = "";

  if (!name.value.trim()) {
    errorMessage.value = "Name is required";
    return;
  }

  isSubmitting.value = true;

  try {
    await $fetch("/api/sales", {
      method: "POST",
      body: {
        name: name.value,
        phone: phone.value,
        notes: notes.value,
        status: status.value,
      },
    });

    name.value = "";
    phone.value = "";
    notes.value = "";
    status.value = "ACTIVE";

    await refresh();
    isCreateSalesModalOpen.value = false;
  } catch (error) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to create sales";
  } finally {
    isSubmitting.value = false;
  }
}

function startEdit(item) {
  editingId.value = item.id;
  editName.value = item.name;
  editPhone.value = item.phone || "";
  editNotes.value = item.notes || "";
  editStatus.value = item.status || "ACTIVE";
  editErrorMessage.value = "";
  isEditSalesModalOpen.value = true;
}

function cancelEdit() {
  editingId.value = "";
  editName.value = "";
  editPhone.value = "";
  editNotes.value = "";
  editStatus.value = "ACTIVE";
  editErrorMessage.value = "";
  isEditSalesModalOpen.value = false;
}

async function handleUpdate() {
  editErrorMessage.value = "";

  if (!editName.value.trim()) {
    editErrorMessage.value = "Name is required";
    return;
  }

  isUpdating.value = true;

  try {
    await $fetch(`/api/sales/${editingId.value}`, {
      method: "PATCH",
      body: {
        name: editName.value,
        phone: editPhone.value,
        notes: editNotes.value,
        status: editStatus.value,
      },
    });

    cancelEdit();
    await refresh();
  } catch (error) {
    editErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to update sales";
  } finally {
    isUpdating.value = false;
  }
}

async function handleDelete(id) {
  const confirmed = confirm("Delete this sales?");

  if (!confirmed) return;

  try {
    await $fetch(`/api/sales/${id}`, {
      method: "DELETE",
    });

    await refresh();
  } catch (error) {
    alert(
      error?.data?.statusMessage ||
        error?.statusMessage ||
        "Failed to delete sales",
    );
  }
}

async function handleHardDeleteSales(id) {
  const confirmed = confirm(
    "HARD DELETE this sales? This action cannot be undone.",
  );

  if (!confirmed) return;

  try {
    await $fetch(`/api/developer/sales/${id}`, {
      method: "DELETE",
    });

    await refresh();
  } catch (error) {
    alert(
      error?.data?.statusMessage ||
        error?.statusMessage ||
        "Failed to hard delete sales",
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

function getSalesActionItems(item) {
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
      onSelect: () => handleHardDeleteSales(item.id),
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
        <h1 class="text-2xl font-semibold">Sales</h1>
        <p class="text-sm text-muted">
          Manage sales contacts, phone numbers, notes, and status.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          icon="i-lucide-plus"
          color="primary"
          @click="isCreateSalesModalOpen = true"
        >
          Add Sales
        </UButton>
      </div>
    </div>

    <UModal
      v-model:open="isCreateSalesModalOpen"
      title="Add Sales"
      description="Create a new sales record."
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <form
          id="create-sales-form"
          class="space-y-4"
          @submit.prevent="handleCreate"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Name" required>
              <UInput
                v-model="name"
                placeholder="Example: Samuel"
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

            <UFormField label="Status">
              <USelect v-model="status" :items="statusOptions" class="w-full" />
            </UFormField>
          </div>

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
            @click="isCreateSalesModalOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            form="create-sales-form"
            type="submit"
            color="primary"
            :loading="isSubmitting"
          >
            Save Sales
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="isEditSalesModalOpen"
      title="Edit Sales"
      description="Update sales contact and status."
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <form
          id="edit-sales-form"
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

            <UFormField label="Status">
              <USelect
                v-model="editStatus"
                :items="statusOptions"
                class="w-full"
              />
            </UFormField>
          </div>

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
            form="edit-sales-form"
            type="submit"
            color="primary"
            :loading="isUpdating"
          >
            Update Sales
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
            placeholder="Search sales"
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
      title="Filter Sales"
      description="Apply advanced filters to the sales list."
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <form
          id="sales-filter-form"
          class="space-y-4"
          @submit.prevent="handleApplyFilter"
        >
          <div class="grid gap-4 md:grid-cols-2">
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

          <UButton form="sales-filter-form" type="submit" color="primary">
            Apply Filter
          </UButton>
        </div>
      </template>
    </UModal>

    <UCard>
      <p v-if="pending" class="text-sm text-muted">Loading sales...</p>
      <p v-else-if="error" class="text-sm text-red-500">
        Failed to load sales.
      </p>
      <p v-else-if="data?.data?.length === 0" class="text-sm text-muted">
        No sales found.
      </p>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-default text-left">
              <th class="py-2 pr-4">Sales</th>
              <th class="py-2 pr-4">Phone</th>
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
                  :items="getSalesActionItems(item)"
                  :content="{ align: 'end' }"
                >
                  <UButton
                    icon="i-lucide-ellipsis-vertical"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    aria-label="Sales actions"
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
            {{ data.pagination.totalItems }} sales
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
