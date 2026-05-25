<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const { user } = useUserSession();

const name = ref("");
const description = ref("");
const requiresRibbonTracking = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref("");
const isCreateServiceTypeModalOpen = ref(false);
const isEditServiceTypeModalOpen = ref(false);

const {
  searchInput,
  appliedSearch,
  applySearchNow,
  resetSearch,
} = useDebouncedSearch();

const serviceTypesUrl = computed(() => {
  const params = new URLSearchParams();

  if (appliedSearch.value) params.set("search", appliedSearch.value);

  const queryString = params.toString();

  return queryString
    ? `/api/service-types?${queryString}`
    : "/api/service-types";
});

const editingId = ref("");
const editName = ref("");
const editDescription = ref("");
const editRequiresRibbonTracking = ref(false);
const isUpdating = ref(false);
const editErrorMessage = ref("");

const { data, pending, error, refresh } = await useFetch(serviceTypesUrl);

async function handleApplyFilter() {
  applySearchNow();
  await refresh();
}

async function handleResetFilter() {
  resetSearch();
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
    await $fetch("/api/service-types", {
      method: "POST",
      body: {
        name: name.value,
        description: description.value,
        requiresRibbonTracking: requiresRibbonTracking.value,
      },
    });

    name.value = "";
    description.value = "";
    requiresRibbonTracking.value = false;

    await refresh();
    isCreateServiceTypeModalOpen.value = false;
  } catch (error) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to create service type";
  } finally {
    isSubmitting.value = false;
  }
}

function startEdit(item) {
  editingId.value = item.id;
  editName.value = item.name;
  editDescription.value = item.description || "";
  editRequiresRibbonTracking.value = item.requiresRibbonTracking || false;
  editErrorMessage.value = "";
  isEditServiceTypeModalOpen.value = true;
}

function cancelEdit() {
  editingId.value = "";
  editName.value = "";
  editDescription.value = "";
  editRequiresRibbonTracking.value = false;
  editErrorMessage.value = "";
  isEditServiceTypeModalOpen.value = false;
}

async function handleUpdate() {
  editErrorMessage.value = "";

  if (!editName.value.trim()) {
    editErrorMessage.value = "Name is required";
    return;
  }

  isUpdating.value = true;

  try {
    await $fetch(`/api/service-types/${editingId.value}`, {
      method: "PATCH",
      body: {
        name: editName.value,
        description: editDescription.value,
        requiresRibbonTracking: editRequiresRibbonTracking.value,
      },
    });

    cancelEdit();
    await refresh();
  } catch (error) {
    editErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to update service type";
  } finally {
    isUpdating.value = false;
  }
}

async function handleDelete(id) {
  const confirmed = confirm("Delete this service type?");

  if (!confirmed) return;

  try {
    await $fetch(`/api/service-types/${id}`, {
      method: "DELETE",
    });

    await refresh();
  } catch (error) {
    alert(
      error?.data?.statusMessage ||
        error?.statusMessage ||
        "Failed to delete service type",
    );
  }
}

async function handleHardDeleteServiceType(id) {
  const confirmed = confirm(
    "HARD DELETE this service type? This action cannot be undone.",
  );

  if (!confirmed) return;

  try {
    await $fetch(`/api/developer/service-types/${id}`, {
      method: "DELETE",
    });

    await refresh();
  } catch (error) {
    alert(
      error?.data?.statusMessage ||
        error?.statusMessage ||
        "Failed to hard delete service type",
    );
  }
}

function formatDateTime(dateValue) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleString();
}

function getRibbonTrackingColor(requiresTracking) {
  return requiresTracking ? "warning" : "neutral";
}

function getServiceTypeActionItems(item) {
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
      onSelect: () => handleHardDeleteServiceType(item.id),
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
        <h1 class="text-2xl font-semibold">Service Types</h1>
        <p class="text-sm text-muted">
          Manage event service types, descriptions, and ribbon tracking rules.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          icon="i-lucide-plus"
          color="primary"
          @click="isCreateServiceTypeModalOpen = true"
        >
          Add Service Type
        </UButton>
      </div>
    </div>

    <UModal
      v-model:open="isCreateServiceTypeModalOpen"
      title="Add Service Type"
      description="Create a new event service type."
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <form
          id="create-service-type-form"
          class="space-y-4"
          @submit.prevent="handleCreate"
        >
          <UFormField label="Name" required>
            <UInput
              v-model="name"
              placeholder="Example: AI Photobooth"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Description">
            <UTextarea
              v-model="description"
              placeholder="Short description"
              class="w-full"
            />
          </UFormField>

          <UCheckbox
            v-model="requiresRibbonTracking"
            label="Requires Ribbon Tracking"
          />

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
            @click="isCreateServiceTypeModalOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            form="create-service-type-form"
            type="submit"
            color="primary"
            :loading="isSubmitting"
          >
            Save Service Type
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="isEditServiceTypeModalOpen"
      title="Edit Service Type"
      description="Update service type details."
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <form
          id="edit-service-type-form"
          class="space-y-4"
          @submit.prevent="handleUpdate"
        >
          <UFormField label="Name" required>
            <UInput v-model="editName" class="w-full" />
          </UFormField>

          <UFormField label="Description">
            <UTextarea
              v-model="editDescription"
              placeholder="Short description"
              class="w-full"
            />
          </UFormField>

          <UCheckbox
            v-model="editRequiresRibbonTracking"
            label="Requires Ribbon Tracking"
          />

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
            form="edit-service-type-form"
            type="submit"
            color="primary"
            :loading="isUpdating"
          >
            Update Service Type
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
            placeholder="Search service types"
            class="w-full"
            size="md"
            @keyup.enter="handleApplyFilter"
          />
        </div>
      </div>
    </UCard>

    <UCard>
      <p v-if="pending" class="text-sm text-muted">Loading service types...</p>
      <p v-else-if="error" class="text-sm text-red-500">
        Failed to load service types.
      </p>
      <p v-else-if="data?.data?.length === 0" class="text-sm text-muted">
        No service types found.
      </p>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-default text-left">
              <th class="py-2 pr-4">Service Type</th>
              <th class="py-2 pr-4">Ribbon Tracking</th>
              <th class="py-2 pr-4">Description</th>
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
              <td class="py-3 pr-4">
                <UBadge
                  :color="getRibbonTrackingColor(item.requiresRibbonTracking)"
                  variant="soft"
                >
                  {{ item.requiresRibbonTracking ? "Required" : "Optional" }}
                </UBadge>
              </td>
              <td class="py-3 pr-4 max-w-xl">
                {{ item.description || "-" }}
              </td>
              <td class="py-3 pr-4 min-w-40">
                {{ formatDateTime(item.createdAt) }}
              </td>
              <td class="py-3 pr-4">
                <UDropdownMenu
                  :items="getServiceTypeActionItems(item)"
                  :content="{ align: 'end' }"
                >
                  <UButton
                    icon="i-lucide-ellipsis-vertical"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    aria-label="Service type actions"
                  />
                </UDropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
