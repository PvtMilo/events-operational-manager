<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const page = ref(1);
const filterRole = ref("ALL");
const filterAssignmentStatus = ref("ALL_ACTIVE");
const filterEventStatus = ref("ALL");
const filterYear = ref("ALL");
const filterMonth = ref("ALL");
const filterDateRange = ref(null);
const isFilterModalOpen = ref(false);
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

const hasDateRangeFilter = computed(
  () => !!filterDateRange.value?.start || !!filterDateRange.value?.end,
);

const scheduleUrl = computed(() => {
  const params = new URLSearchParams();

  if (appliedSearch.value) params.set("search", appliedSearch.value);

  if (filterRole.value !== "ALL") {
    params.set("role", filterRole.value);
  }

  if (filterAssignmentStatus.value !== "ALL_ACTIVE") {
    params.set("assignmentStatus", filterAssignmentStatus.value);
  }

  if (filterEventStatus.value !== "ALL") {
    params.set("eventStatus", filterEventStatus.value);
  }

  const dateParams = getDateRangeParams();

  if (dateParams.dateFrom || dateParams.dateTo) {
    if (dateParams.dateFrom) params.set("dateFrom", dateParams.dateFrom);
    if (dateParams.dateTo) params.set("dateTo", dateParams.dateTo);
  } else {
    if (filterYear.value !== "ALL") {
      params.set("year", filterYear.value);
    }

    if (filterMonth.value !== "ALL") {
      params.set("month", filterMonth.value);
    }
  }

  params.set("page", page.value);
  params.set("limit", 20);

  return `/api/crew-schedule?${params.toString()}`;
});

const {
  data: scheduleData,
  pending,
  error,
  refresh,
} = await useFetch(scheduleUrl);

const rows = computed(() => scheduleData.value?.data || []);

const pagination = computed(() => {
  return (
    scheduleData.value?.pagination || {
      page: 1,
      limit: 20,
      totalItems: 0,
      totalPages: 1,
    }
  );
});

const roleOptions = [
  { label: "All Roles", value: "ALL" },
  { label: "PIC", value: "PIC" },
  { label: "CREW", value: "CREW" },
];

const assignmentStatusOptions = [
  { label: "All Active", value: "ALL_ACTIVE" },
  { label: "ASSIGNED", value: "ASSIGNED" },
  { label: "CONFIRMED", value: "CONFIRMED" },
];

const eventStatusOptions = [
  { label: "All Event Status", value: "ALL" },
  { label: "DRAFTED", value: "DRAFTED" },
  { label: "SCHEDULED", value: "SCHEDULED" },
  { label: "ONGOING", value: "ONGOING" },
  { label: "PENDING_EVALUATION", value: "PENDING_EVALUATION" },
  { label: "COMPLETED", value: "COMPLETED" },
];

const monthOptions = [
  { label: "All Months", value: "ALL" },
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();

  return [
    { label: "All Years", value: "ALL" },
    { label: String(currentYear - 1), value: String(currentYear - 1) },
    { label: String(currentYear), value: String(currentYear) },
    { label: String(currentYear + 1), value: String(currentYear + 1) },
  ];
});

const activeFilterCount = computed(() => {
  let count = 0;

  if (filterRole.value !== "ALL") count += 1;
  if (filterAssignmentStatus.value !== "ALL_ACTIVE") count += 1;
  if (filterEventStatus.value !== "ALL") count += 1;

  if (hasDateRangeFilter.value) {
    count += 1;
  } else {
    if (filterYear.value !== "ALL") count += 1;
    if (filterMonth.value !== "ALL") count += 1;
  }

  return count;
});

const filterDateLabel = computed(() => {
  const start = formatDateFilterValue(filterDateRange.value?.start);
  const end = formatDateFilterValue(filterDateRange.value?.end);

  if (start && end && start !== end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;
  return "Date";
});

function formatDate(dateValue) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleDateString();
}

function formatDateFilterValue(dateValue) {
  if (!dateValue) return "";

  const [year, month, day] = dateValue.toString().split("-");

  if (!year || !month || !day) return dateValue.toString();

  return `${day}/${month}/${year}`;
}

function getDateRangeParams() {
  const dateFrom = filterDateRange.value?.start?.toString() || "";
  const dateTo =
    filterDateRange.value?.end?.toString() ||
    filterDateRange.value?.start?.toString() ||
    "";

  return { dateFrom, dateTo };
}

function formatTimeRange(row) {
  if (!row.startTime && !row.endTime) return "-";

  return `${row.startTime || "-"} - ${row.endTime || "-"}`;
}

function formatLoading(row) {
  if (!row.loadingDate && !row.loadingTime) return "-";

  const date = row.loadingDate ? formatDate(row.loadingDate) : "-";
  const time = row.loadingTime || "-";

  return `${date} ${time}`;
}

function getRoleColor(role) {
  if (role === "PIC") return "primary";
  if (role === "CREW") return "neutral";

  return "neutral";
}

function getAssignmentStatusColor(status) {
  if (status === "CONFIRMED") return "success";
  if (status === "ASSIGNED") return "primary";

  return "neutral";
}

function getEventStatusColor(status) {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "error";
  if (status === "PENDING_EVALUATION") return "warning";
  if (status === "ONGOING") return "primary";

  return "neutral";
}

async function handleApplyFilter() {
  applySearchNow();
  page.value = 1;
  if (hasDateRangeFilter.value) {
    filterYear.value = "ALL";
    filterMonth.value = "ALL";
  }
  await refresh();
  isFilterModalOpen.value = false;
}

async function handleApplyDateFilter(close) {
  await handleApplyFilter();
  close?.();
}

async function handleClearDateFilter(close) {
  filterDateRange.value = null;
  page.value = 1;
  await refresh();
  close?.();
}

async function handleResetFilter() {
  resetSearch();
  filterRole.value = "ALL";
  filterAssignmentStatus.value = "ALL_ACTIVE";
  filterEventStatus.value = "ALL";
  filterYear.value = "ALL";
  filterMonth.value = "ALL";
  filterDateRange.value = null;
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
  <div class="p-6 space-y-6">
    <div
      class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <h1 class="text-2xl font-semibold">
          Crew Schedule
        </h1>

        <p class="text-sm text-muted">
          View crew assignments across events, including role, event details, and workload.
        </p>
      </div>

      <!-- <div class="flex flex-wrap gap-2">
        <UButton
          type="button"
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          @click="refresh"
        >
          Refresh
        </UButton>
      </div> -->
    </div>

    <UCard>
      <div
        class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div class="w-full lg:max-w-sm">
          <UInput
            v-model="searchInput"
            icon="i-lucide-search"
            placeholder="Search crew schedule"
            class="w-full"
            size="md"
            @keyup.enter="handleApplyFilter"
          />
        </div>

        <div class="flex flex-wrap items-center gap-2 w-full md:justify-end">
          <UPopover :content="{ align: 'end' }">
            <UButton
              type="button"
              size="md"
              color="neutral"
              variant="outline"
              icon="i-lucide-calendar"
              class="w-full justify-center md:w-auto"
            >
              {{ filterDateLabel }}
            </UButton>

            <template #content="{ close }">
              <div class="space-y-3 p-3">
                <UCalendar
                  v-model="filterDateRange"
                  range
                  month-controls
                  year-controls
                />

                <div class="flex justify-end gap-2">
                  <UButton
                    type="button"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    @click="handleClearDateFilter(close)"
                  >
                    Clear
                  </UButton>

                  <UButton
                    type="button"
                    color="primary"
                    size="sm"
                    @click="handleApplyDateFilter(close)"
                  >
                    Apply
                  </UButton>
                </div>
              </div>
            </template>
          </UPopover>

          <USelect
            v-model="filterEventStatus"
            :items="eventStatusOptions"
            size="md"
            class="w-full md:w-48"
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
      title="Filter Crew Schedule"
      description="Apply advanced filters to the crew schedule."
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <form
          id="crew-schedule-filter-form"
          class="space-y-4"
          @submit.prevent="handleApplyFilter"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Date" class="md:col-span-2">
              <div class="rounded-md border border-default p-3">
                <UCalendar
                  v-model="filterDateRange"
                  range
                  month-controls
                  year-controls
                />
              </div>
            </UFormField>

            <UFormField label="Role">
              <USelect
                v-model="filterRole"
                :items="roleOptions"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Assignment Status">
              <USelect
                v-model="filterAssignmentStatus"
                :items="assignmentStatusOptions"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Event Status">
              <USelect
                v-model="filterEventStatus"
                :items="eventStatusOptions"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Month">
              <USelect
                v-model="filterMonth"
                :items="monthOptions"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Year">
              <USelect
                v-model="filterYear"
                :items="yearOptions"
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

          <UButton
            form="crew-schedule-filter-form"
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
        <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-lg font-semibold">
              Crew Assignment List
            </h2>

            <p class="text-sm text-muted">
              One row represents one crew assignment to one event.
            </p>
          </div>
        </div>
      </template>

      <div v-if="pending" class="py-8 text-center text-sm text-muted">
        Loading crew schedule...
      </div>

      <div v-else-if="error" class="py-8 text-center text-sm text-red-500">
        Failed to load crew schedule.
      </div>

      <div v-else class="touch-scroll-x overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-default text-xs uppercase text-muted">
            <tr>
              <th class="whitespace-nowrap px-3 py-3">
                Date
              </th>
              <th class="whitespace-nowrap px-3 py-3">
                Time
              </th>
              <th class="whitespace-nowrap px-3 py-3">
                Staff
              </th>
              <th class="whitespace-nowrap px-3 py-3">
                Role
              </th>
              <th class="whitespace-nowrap px-3 py-3">
                Assignment
              </th>
              <th class="whitespace-nowrap px-3 py-3">
                Event
              </th>
              <th class="whitespace-nowrap px-3 py-3">
                Client
              </th>
              <th class="whitespace-nowrap px-3 py-3">
                Service
              </th>
              <th class="whitespace-nowrap px-3 py-3">
                Location
              </th>
              <th class="whitespace-nowrap px-3 py-3">
                Event Status
              </th>
              <th class="whitespace-nowrap px-3 py-3">
                Workload
              </th>
              <th class="whitespace-nowrap px-3 py-3">
                Action
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-default">
            <tr v-if="rows.length === 0">
              <td colspan="12" class="px-3 py-8 text-center text-muted">
                No crew schedule found.
              </td>
            </tr>

            <tr
              v-for="row in rows"
              :key="row.id"
              class="align-top"
            >
              <td class="whitespace-nowrap px-3 py-3">
                {{ formatDate(row.eventDate) }}
              </td>

              <td class="whitespace-nowrap px-3 py-3">
                {{ formatTimeRange(row) }}
              </td>

              <td class="min-w-40 px-3 py-3">
                <p class="font-medium">
                  {{ row.staffName }}
                </p>

                <p class="text-xs text-muted">
                  Default: {{ row.staffDefaultRole }}
                </p>
              </td>

              <td class="whitespace-nowrap px-3 py-3">
                <UBadge
                  :color="getRoleColor(row.roleInEvent)"
                  variant="soft"
                >
                  {{ row.roleInEvent }}
                </UBadge>
              </td>

              <td class="whitespace-nowrap px-3 py-3">
                <UBadge
                  :color="getAssignmentStatusColor(row.assignmentStatus)"
                  variant="soft"
                >
                  {{ row.assignmentStatus }}
                </UBadge>
              </td>

              <td class="min-w-56 px-3 py-3">
                <p class="font-medium">
                  {{ row.eventName }}
                </p>

                <p class="text-xs text-muted">
                  Loading: {{ formatLoading(row) }}
                </p>
              </td>

              <td class="min-w-40 px-3 py-3">
                {{ row.clientName }}
              </td>

              <td class="min-w-40 px-3 py-3">
                {{ row.serviceTypeName }}
              </td>

              <td class="min-w-56 px-3 py-3">
                {{ row.location }}
              </td>

              <td class="whitespace-nowrap px-3 py-3">
                <UBadge
                  :color="getEventStatusColor(row.eventStatus)"
                  variant="soft"
                >
                  {{ row.eventStatus }}
                </UBadge>
              </td>

              <td class="whitespace-nowrap px-3 py-3">
                <div class="space-y-1">
                  <UBadge color="neutral" variant="soft">
                    {{ row.periodEventCount }} events
                  </UBadge>

                  <UBadge color="neutral" variant="soft">
                    {{ row.periodPicCount }} PIC
                  </UBadge>
                </div>
              </td>

              <td class="whitespace-nowrap px-3 py-3">
                <UButton
                  size="sm"
                  color="neutral"
                  variant="outline"
                  :to="`/events/${row.eventId}`"
                >
                  Open
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template #footer>
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p class="text-sm text-muted">
            Page {{ pagination.page }} of {{ pagination.totalPages }}
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
  </div>
</template>
