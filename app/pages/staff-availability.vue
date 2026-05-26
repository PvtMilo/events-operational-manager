<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const now = new Date();

function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

const page = ref(1);
const search = ref("");
const filterType = ref("ALL");
const filterStatus = ref("ACTIVE");
const filterStartDate = ref(formatDateInput(getMonthStart(now)));
const filterEndDate = ref(formatDateInput(getMonthEnd(now)));

const isModalOpen = ref(false);
const isEditMode = ref(false);
const isFilterModalOpen = ref(false);
const editingId = ref("");

const formStaffId = ref("");
const formType = ref("LIBUR");
const formStatus = ref("ACTIVE");
const formStartDate = ref("");
const formEndDate = ref("");
const formIsFullDay = ref(true);
const formStartTime = ref("");
const formEndTime = ref("");
const formReason = ref("");
const formNotes = ref("");

const formErrorMessage = ref("");
const isSaving = ref(false);

const availabilityUrl = computed(() => {
  const params = new URLSearchParams();

  if (search.value) params.set("search", search.value);
  if (filterType.value !== "ALL") params.set("type", filterType.value);
  if (filterStatus.value !== "ALL") params.set("status", filterStatus.value);
  if (filterStartDate.value) params.set("startDate", filterStartDate.value);
  if (filterEndDate.value) params.set("endDate", filterEndDate.value);

  params.set("page", page.value);
  params.set("limit", 20);

  return `/api/staff-availability?${params.toString()}`;
});

const {
  data: availabilityData,
  pending,
  error,
  refresh,
} = await useFetch(availabilityUrl);

const { data: staffData } = await useFetch("/api/staff?limit=1000");

const records = computed(() => availabilityData.value?.data || []);

const summary = computed(() => {
  return (
    availabilityData.value?.summary || {
      totalStaff: 0,
      availableToday: 0,
      unavailableToday: 0,
      upcoming7Days: 0,
      thisMonthBlocks: 0,
    }
  );
});

const todayUnavailable = computed(() => {
  return availabilityData.value?.todayUnavailable || [];
});

const todayAvailable = computed(() => {
  return availabilityData.value?.todayAvailable || [];
});

const days = computed(() => {
  return availabilityData.value?.days || [];
});

const matrix = computed(() => {
  return availabilityData.value?.matrix || [];
});

const pagination = computed(() => {
  return (
    availabilityData.value?.pagination || {
      page: 1,
      limit: 20,
      totalItems: 0,
      totalPages: 1,
    }
  );
});

const staffOptions = computed(() => {
  return (staffData.value?.data || []).map((staff) => ({
    label: `${staff.name} (${staff.defaultRole})`,
    value: staff.id,
  }));
});

const typeOptions = [
  { label: "All Types", value: "ALL" },
  { label: "Libur", value: "LIBUR" },
  { label: "Izin", value: "IZIN" },
  { label: "Sakit", value: "SAKIT" },
  { label: "Cuti", value: "CUTI" },
  { label: "Blocked", value: "BLOCKED" },
];

const formTypeOptions = [
  { label: "Libur", value: "LIBUR" },
  { label: "Izin", value: "IZIN" },
  { label: "Sakit", value: "SAKIT" },
  { label: "Cuti", value: "CUTI" },
  { label: "Blocked", value: "BLOCKED" },
];

const statusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "All Status", value: "ALL" },
];

const formStatusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Cancelled", value: "CANCELLED" },
];

const defaultFilterStartDate = computed(() => {
  return formatDateInput(getMonthStart(new Date()));
});

const defaultFilterEndDate = computed(() => {
  return formatDateInput(getMonthEnd(new Date()));
});

const activeFilterCount = computed(() => {
  let count = 0;

  if (filterType.value !== "ALL") count += 1;
  if (filterStatus.value !== "ACTIVE") count += 1;
  if (
    filterStartDate.value !== defaultFilterStartDate.value ||
    filterEndDate.value !== defaultFilterEndDate.value
  ) {
    count += 1;
  }

  return count;
});

function getTypeLabel(type) {
  const item = formTypeOptions.find((option) => option.value === type);
  return item?.label || type;
}

function getTypeColor(type) {
  if (type === "CUTI") return "warning";
  if (type === "SAKIT") return "secondary";
  if (type === "IZIN") return "warning";
  if (type === "LIBUR") return "warning";
  if (type === "BLOCKED") return "error";

  return "neutral";
}

function getStatusColor(status) {
  if (status === "ACTIVE") return "success";
  if (status === "CANCELLED") return "error";

  return "neutral";
}

function formatDate(dateValue) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleDateString();
}

function formatDateRange(row) {
  const start = formatDate(row.startDate);
  const end = formatDate(row.endDate);

  if (start === end) return start;

  return `${start} - ${end}`;
}

function resetForm() {
  isEditMode.value = false;
  editingId.value = "";

  formStaffId.value = "";
  formType.value = "LIBUR";
  formStatus.value = "ACTIVE";
  formStartDate.value = formatDateInput(new Date());
  formEndDate.value = formatDateInput(new Date());
  formIsFullDay.value = true;
  formStartTime.value = "";
  formEndTime.value = "";
  formReason.value = "";
  formNotes.value = "";
  formErrorMessage.value = "";
}

function handleOpenCreateModal() {
  resetForm();
  isModalOpen.value = true;
}

function handleOpenEditModal(row) {
  isEditMode.value = true;
  editingId.value = row.id;

  formStaffId.value = row.staffId;
  formType.value = row.type;
  formStatus.value = row.status;
  formStartDate.value = formatDateInput(new Date(row.startDate));
  formEndDate.value = formatDateInput(new Date(row.endDate));
  formIsFullDay.value = row.isFullDay;
  formStartTime.value = row.startTime || "";
  formEndTime.value = row.endTime || "";
  formReason.value = row.reason || "";
  formNotes.value = row.notes || "";
  formErrorMessage.value = "";

  isModalOpen.value = true;
}

async function handleSaveAvailabilityBlock() {
  formErrorMessage.value = "";

  if (!formStaffId.value) {
    formErrorMessage.value = "Staff is required";
    return;
  }

  if (!formStartDate.value || !formEndDate.value) {
    formErrorMessage.value = "Start date and end date are required";
    return;
  }

  if (!formIsFullDay.value && (!formStartTime.value || !formEndTime.value)) {
    formErrorMessage.value =
      "Start time and end time are required for partial day";
    return;
  }

  isSaving.value = true;

  try {
    const body = {
      staffId: formStaffId.value,
      type: formType.value,
      status: formStatus.value,
      startDate: formStartDate.value,
      endDate: formEndDate.value,
      isFullDay: formIsFullDay.value,
      startTime: formIsFullDay.value ? null : formStartTime.value,
      endTime: formIsFullDay.value ? null : formEndTime.value,
      reason: formReason.value,
      notes: formNotes.value,
    };

    if (isEditMode.value) {
      await $fetch(`/api/staff-availability/${editingId.value}`, {
        method: "PATCH",
        body,
      });
    } else {
      await $fetch("/api/staff-availability", {
        method: "POST",
        body,
      });
    }

    await refresh();
    isModalOpen.value = false;
    resetForm();
  } catch (error) {
    formErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to save availability block";
  } finally {
    isSaving.value = false;
  }
}

async function handleCancelBlock(id) {
  const confirmed = confirm("Cancel this availability block?");

  if (!confirmed) return;

  try {
    await $fetch(`/api/staff-availability/${id}`, {
      method: "DELETE",
    });

    await refresh();
  } catch (error) {
    alert(
      error?.data?.statusMessage ||
        error?.statusMessage ||
        "Failed to cancel availability block",
    );
  }
}

function getAvailabilityActionItems(row) {
  const items = [
    {
      label: "Edit",
      icon: "i-lucide-pencil",
      onSelect: () => handleOpenEditModal(row),
    },
  ];

  if (row.status === "ACTIVE") {
    items.push({
      label: "Cancel",
      icon: "i-lucide-ban",
      color: "warning",
      onSelect: () => handleCancelBlock(row.id),
    });
  }

  return items;
}

async function handleApplyFilter() {
  page.value = 1;
  await refresh();
  isFilterModalOpen.value = false;
}

async function handleResetFilter() {
  search.value = "";
  filterType.value = "ALL";
  filterStatus.value = "ACTIVE";
  filterStartDate.value = defaultFilterStartDate.value;
  filterEndDate.value = defaultFilterEndDate.value;
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
  if (page.value >= pagination.value.totalPages) return;

  page.value += 1;
  await refresh();
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div
      class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <h1 class="text-2xl font-semibold">Staff Availability</h1>

        <p class="text-sm text-muted">
          Manage staff leave, sick days, day off, and blocked availability
          dates.
        </p>
      </div>

      <UButton
        type="button"
        icon="i-lucide-plus"
        color="primary"
        @click="handleOpenCreateModal"
      >
        Add Availability Block
      </UButton>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <UCard>
        <p class="text-sm text-muted">Total Staff</p>

        <p class="mt-1 text-2xl font-semibold">
          {{ summary.totalStaff }}
        </p>
      </UCard>

      <UCard>
        <p class="text-sm text-muted">Available Today</p>

        <p class="mt-1 text-2xl font-semibold">
          {{ summary.availableToday }}
        </p>
      </UCard>

      <UCard>
        <p class="text-sm text-muted">Unavailable Today</p>

        <p class="mt-1 text-2xl font-semibold">
          {{ summary.unavailableToday }}
        </p>
      </UCard>

      <UCard>
        <p class="text-sm text-muted">Upcoming 7 Days</p>

        <p class="mt-1 text-2xl font-semibold">
          {{ summary.upcoming7Days }}
        </p>
      </UCard>

      <UCard>
        <p class="text-sm text-muted">This Month Blocks</p>

        <p class="mt-1 text-2xl font-semibold">
          {{ summary.thisMonthBlocks }}
        </p>
      </UCard>
    </div>

    <div class="grid gap-4 xl:grid-cols-2">
      <UCard>
        <template #header>
          <div>
            <h2 class="text-lg font-semibold">Unavailable Today</h2>

            <p class="text-sm text-muted">
              Staff who cannot be assigned today.
            </p>
          </div>
        </template>

        <div class="space-y-3">
          <p v-if="todayUnavailable.length === 0" class="text-sm text-muted">
            No unavailable staff today.
          </p>

          <div
            v-for="item in todayUnavailable"
            :key="item.id"
            class="rounded-lg border border-default p-3"
          >
            <div
              class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
            >
              <div>
                <p class="font-medium">
                  {{ item.staffName }}
                </p>

                <p class="text-sm text-muted">
                  {{ item.staffDefaultRole }} · {{ item.durationLabel }}
                </p>

                <p v-if="item.reason" class="mt-1 text-sm">
                  {{ item.reason }}
                </p>
              </div>

              <UBadge :color="getTypeColor(item.type)" variant="soft">
                {{ getTypeLabel(item.type) }}
              </UBadge>
            </div>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div>
            <h2 class="text-lg font-semibold">Available Today</h2>

            <p class="text-sm text-muted">
              Active staff with no availability block today.
            </p>
          </div>
        </template>

        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="staff in todayAvailable"
            :key="staff.id"
            color="neutral"
            variant="soft"
          >
            {{ staff.name }} · {{ staff.defaultRole }}
          </UBadge>

          <p v-if="todayAvailable.length === 0" class="text-sm text-muted">
            No available staff today.
          </p>
        </div>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <div>
          <h2 class="text-lg font-semibold">7 Days Availability Matrix</h2>

          <p class="text-sm text-muted">
            Quick view of staff availability for the next 7 days.
          </p>
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b border-default text-left">
              <th class="whitespace-nowrap py-2 pr-4">Staff</th>

              <th
                v-for="day in days"
                :key="day.date"
                class="whitespace-nowrap px-3 py-2 text-center"
              >
                {{ day.label }}
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-default">
            <tr v-for="row in matrix" :key="row.staffId">
              <td class="whitespace-nowrap py-3 pr-4">
                <p class="font-medium">
                  {{ row.staffName }}
                </p>

                <p class="text-xs text-muted">
                  {{ row.defaultRole }}
                </p>
              </td>

              <td
                v-for="day in row.days"
                :key="day.date"
                class="px-3 py-3 text-center"
              >
                <UBadge v-if="day.isAvailable" color="success" variant="soft">
                  Available
                </UBadge>

                <UBadge v-else :color="getTypeColor(day.type)" variant="soft">
                  {{ getTypeLabel(day.type) }}
                </UBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <UCard>
      <div
        class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div class="w-full lg:max-w-sm">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search staff, reason, or notes"
            class="w-full"
            size="md"
            @keyup.enter="handleApplyFilter"
          />
        </div>

        <div class="flex w-full flex-wrap items-center gap-2 md:justify-end">
          <USelect
            v-model="filterType"
            :items="typeOptions"
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
      title="Filter Availability Records"
      description="Apply advanced filters to staff availability records."
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <form
          id="availability-filter-form"
          class="space-y-4"
          @submit.prevent="handleApplyFilter"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Type">
              <USelect
                v-model="filterType"
                :items="typeOptions"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Start Date">
              <UInput v-model="filterStartDate" type="date" class="w-full" />
            </UFormField>

            <UFormField label="End Date">
              <UInput v-model="filterEndDate" type="date" class="w-full" />
            </UFormField>
          </div>
        </form>
      </template>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            @click="handleResetFilter"
          >
            Reset
          </UButton>

          <UButton
            form="availability-filter-form"
            type="submit"
            color="primary"
          >
            Apply Filter
          </UButton>
        </div>
      </template>
    </UModal>

    <UCard>
      <template #header>
        <div>
          <h2 class="text-lg font-semibold">Availability Records</h2>

          <p class="text-sm text-muted">
            Search, filter, edit, or cancel staff availability blocks.
          </p>
        </div>
      </template>

      <div>
        <p v-if="pending" class="text-sm text-muted">
          Loading availability records...
        </p>

        <p v-else-if="error" class="text-sm text-red-500">
          Failed to load availability records.
        </p>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead>
              <tr class="border-b border-default text-xs uppercase text-muted">
                <th class="whitespace-nowrap px-3 py-3">Staff</th>
                <th class="whitespace-nowrap px-3 py-3">Type</th>
                <th class="whitespace-nowrap px-3 py-3">Date</th>
                <th class="whitespace-nowrap px-3 py-3">Time / Duration</th>
                <th class="whitespace-nowrap px-3 py-3">Reason</th>
                <th class="whitespace-nowrap px-3 py-3">Action</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-default">
              <tr v-if="records.length === 0">
                <td colspan="7" class="px-3 py-8 text-center text-muted">
                  No availability record found.
                </td>
              </tr>

              <tr v-for="row in records" :key="row.id" class="align-top">
                <td class="min-w-44 px-3 py-3">
                  <p class="font-medium">
                    {{ row.staffName }}
                  </p>

                  <p class="text-xs text-muted">
                    {{ row.staffDefaultRole }}
                  </p>
                </td>

                <td class="whitespace-nowrap px-3 py-3">
                  <UBadge :color="getTypeColor(row.type)" variant="soft">
                    {{ getTypeLabel(row.type) }}
                  </UBadge>
                </td>

                <td class="whitespace-nowrap px-3 py-3">
                  {{ formatDateRange(row) }}
                </td>

                <td class="whitespace-nowrap px-3 py-3">
                  {{ row.durationLabel }}
                </td>

                <td class="px-3 py-3">
                  <p>{{ row.reason || "-" }}</p>
                  <p v-if="row.notes" class="text-xs text-muted">
                    {{ row.notes }}
                  </p>
                </td>

                <td class="whitespace-nowrap px-3 py-3">
                  <UDropdownMenu
                    :items="getAvailabilityActionItems(row)"
                    :content="{ align: 'end' }"
                  >
                    <UButton
                      icon="i-lucide-ellipsis-vertical"
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      aria-label="Availability record actions"
                    />
                  </UDropdownMenu>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <template #footer>
        <div
          class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
        >
          <p class="text-sm text-muted">
            Page {{ pagination.page }} of {{ pagination.totalPages }} — Total
            {{ pagination.totalItems }} records
          </p>

          <div class="flex gap-2">
            <UButton
              type="button"
              color="neutral"
              variant="outline"
              :disabled="pagination.page <= 1"
              @click="goToPreviousPage"
            >
              Previous
            </UButton>

            <UButton
              type="button"
              color="neutral"
              variant="outline"
              :disabled="pagination.page >= pagination.totalPages"
              @click="goToNextPage"
            >
              Next
            </UButton>
          </div>
        </div>
      </template>
    </UCard>

    <UModal
      v-model:open="isModalOpen"
      :title="isEditMode ? 'Edit Availability Block' : 'Add Availability Block'"
      description="Set staff unavailable date for scheduling."
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <form
          id="availability-form"
          class="space-y-4"
          @submit.prevent="handleSaveAvailabilityBlock"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Staff" required>
              <USelect
                v-model="formStaffId"
                :items="staffOptions"
                placeholder="Select staff"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Type" required>
              <USelect
                v-model="formType"
                :items="formTypeOptions"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Start Date" required>
              <UInput v-model="formStartDate" type="date" class="w-full" />
            </UFormField>

            <UFormField label="End Date" required>
              <UInput v-model="formEndDate" type="date" class="w-full" />
            </UFormField>

            <UFormField v-if="isEditMode" label="Status">
              <USelect
                v-model="formStatus"
                :items="formStatusOptions"
                class="w-full"
              />
            </UFormField>
          </div>

          <UCheckbox v-model="formIsFullDay" label="Full day unavailable" />

          <div v-if="!formIsFullDay" class="grid gap-4 md:grid-cols-2">
            <UFormField label="Start Time" required>
              <UInput v-model="formStartTime" type="time" class="w-full" />
            </UFormField>

            <UFormField label="End Time" required>
              <UInput v-model="formEndTime" type="time" class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Reason">
            <UInput
              v-model="formReason"
              placeholder="Example: family event, sick, monthly day off"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Notes">
            <UTextarea
              v-model="formNotes"
              placeholder="Optional internal notes"
              class="w-full"
            />
          </UFormField>

          <p v-if="formErrorMessage" class="text-sm text-red-500">
            {{ formErrorMessage }}
          </p>
        </form>
      </template>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            @click="isModalOpen = false"
          >
            Cancel
          </UButton>

          <UButton
            form="availability-form"
            type="submit"
            color="primary"
            :loading="isSaving"
          >
            {{ isEditMode ? "Update Block" : "Save Block" }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
