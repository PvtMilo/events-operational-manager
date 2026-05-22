<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const { user } = useUserSession();

const eventName = ref("");
const clientName = ref("");
const clientPhone = ref("");
const serviceTypeId = ref(null);
const equipmentSetup = ref("");
const salesId = ref("NONE");
const eventDate = ref("");
const startTime = ref("");
const endTime = ref("");
const loadingDate = ref("");
const loadingTime = ref("");
const location = ref("");
const status = ref("DRAFTED");
const vehicleName = ref("");
const driverName = ref("");
const vendorSewa = ref("");
const notes = ref("");

const isSubmitting = ref(false);
const errorMessage = ref("");
const isCreateEventModalOpen = ref(false);
const isFilterModalOpen = ref(false);

const page = ref(1);

const search = ref("");
const filterStatus = ref("ALL");
const filterServiceTypeId = ref("ALL");
const filterYear = ref("ALL");
const filterMonth = ref("ALL");
const filterDateRange = ref(null);

const hasDateRangeFilter = computed(
  () => !!filterDateRange.value?.start || !!filterDateRange.value?.end,
);

const eventUrl = computed(() => {
  const params = new URLSearchParams();

  if (search.value) params.set("search", search.value);
  if (filterStatus.value !== "ALL") params.set("status", filterStatus.value);
  if (filterServiceTypeId.value !== "ALL")
    params.set("serviceTypeId", filterServiceTypeId.value);

  const dateParams = getDateRangeParams();

  if (dateParams.dateFrom || dateParams.dateTo) {
    if (dateParams.dateFrom) params.set("dateFrom", dateParams.dateFrom);
    if (dateParams.dateTo) params.set("dateTo", dateParams.dateTo);
  } else {
    if (filterYear.value !== "ALL") params.set("year", filterYear.value);
    if (filterMonth.value !== "ALL") params.set("month", filterMonth.value);
  }

  params.set("page", page.value);

  return `/api/events?${params.toString()}`;
});

const statusOptions = [
  { label: "All Status", value: "ALL" },
  { label: "DRAFTED", value: "DRAFTED" },
  { label: "SCHEDULED", value: "SCHEDULED" },
  { label: "READY", value: "READY" },
  { label: "ONGOING", value: "ONGOING" },
  { label: "PENDING_EVALUATION", value: "PENDING_EVALUATION" },
  { label: "COMPLETED", value: "COMPLETED" },
  { label: "CANCELLED", value: "CANCELLED" },
];

const eventStatusOptions = [
  { label: "DRAFTED", value: "DRAFTED" },
  { label: "SCHEDULED", value: "SCHEDULED" },
  { label: "READY", value: "READY" },
  { label: "ONGOING", value: "ONGOING" },
  { label: "PENDING_EVALUATION", value: "PENDING_EVALUATION" },
  { label: "COMPLETED", value: "COMPLETED" },
  { label: "CANCELLED", value: "CANCELLED" },
];

const serviceTypeOptions = computed(() => [
  { label: "All Service Types", value: "ALL" },
  ...(serviceTypesData.value?.data || []).map((item) => ({
    label: item.name,
    value: item.id,
  })),
]);

const createServiceTypeOptions = computed(() =>
  (serviceTypesData.value?.data || []).map((item) => ({
    label: item.name,
    value: item.id,
  })),
);

const salesOptions = computed(() => [
  { label: "No sales / optional", value: "NONE" },
  ...(salesData.value?.data || []).map((item) => ({
    label: item.name,
    value: item.id,
  })),
]);

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
  if (filterStatus.value !== "ALL") count += 1;
  if (filterServiceTypeId.value !== "ALL") count += 1;
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

function getStatusColor(status) {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "error";
  if (status === "PENDING_EVALUATION") return "warning";
  if (status === "ONGOING") return "primary";
  if (status === "READY") return "info";
  return "neutral";
}

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

function getEventStaff(event) {
  if (!event.assignments?.length) return "-";
  return event.assignments
    .map((a) => `${a.staff?.name || "-"} (${a.roleInEvent})`)
    .join(", ");
}

function getEventActionItems(event) {
  const items = [
    {
      label: "Detail",
      icon: "i-lucide-eye",
      to: `/events/${event.id}`,
    },
    {
      label: "Cancel",
      icon: "i-lucide-ban",
      color: "warning",
      onSelect: () => handleDelete(event.id),
    },
  ];

  if (user.value?.role === "DEVELOPER") {
    items.push({
      label: "Hard Delete",
      icon: "i-lucide-trash-2",
      color: "error",
      onSelect: () => handleHardDeleteEvent(event.id),
    });
  }

  return items;
}

async function handleApplyFilter() {
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
  search.value = "";
  filterStatus.value = "ALL";
  filterServiceTypeId.value = "ALL";
  filterYear.value = "ALL";
  filterMonth.value = "ALL";
  filterDateRange.value = null;
  page.value = 1;

  await refresh();
  isFilterModalOpen.value = false;
}

function handleExportEvents() {
  const params = new URLSearchParams();

  if (search.value) params.set("search", search.value);
  if (filterStatus.value !== "ALL") params.set("status", filterStatus.value);
  if (filterServiceTypeId.value !== "ALL")
    params.set("serviceTypeId", filterServiceTypeId.value);

  const dateParams = getDateRangeParams();

  if (dateParams.dateFrom || dateParams.dateTo) {
    if (dateParams.dateFrom) params.set("dateFrom", dateParams.dateFrom);
    if (dateParams.dateTo) params.set("dateTo", dateParams.dateTo);
  } else {
    if (filterYear.value !== "ALL") params.set("year", filterYear.value);
    if (filterMonth.value !== "ALL") params.set("month", filterMonth.value);
  }

  const queryString = params.toString();
  const url = queryString
    ? `/api/events/export?${queryString}`
    : "/api/events/export";

  window.open(url, "_blank");
}

async function goToPreviousPage() {
  if (page.value <= 1) return;

  page.value -= 1;
  await refresh();
}

async function goToNextPage() {
  if (page.value >= eventsData.value?.pagination?.totalPages) return;

  page.value += 1;
  await refresh();
}

const { data: eventsData, pending, error, refresh } = await useFetch(eventUrl);
const { data: serviceTypesData } = await useFetch("/api/service-types");
const { data: salesData } = await useFetch("/api/sales");

async function handleCreate() {
  errorMessage.value = "";

  if (!eventName.value.trim()) {
    errorMessage.value = "Event name is required";
    return;
  }

  if (!clientName.value.trim()) {
    errorMessage.value = "Client name is required";
    return;
  }

  if (!serviceTypeId.value) {
    errorMessage.value = "Service type is required";
    return;
  }

  if (!equipmentSetup.value.trim()) {
    errorMessage.value = "Equipment setup is required";
    return;
  }

  if (!eventDate.value || !startTime.value || !endTime.value) {
    errorMessage.value = "Event date, start time, and end time are required";
    return;
  }

  isSubmitting.value = true;

  try {
    await $fetch("/api/events", {
      method: "POST",
      body: {
        eventName: eventName.value,
        clientName: clientName.value,
        clientPhone: clientPhone.value,
        serviceTypeId: serviceTypeId.value,
        equipmentSetup: equipmentSetup.value,
        salesId: salesId.value === "NONE" ? null : salesId.value,
        eventDate: eventDate.value,
        startTime: startTime.value,
        endTime: endTime.value,
        loadingDate: loadingDate.value || null,
        loadingTime: loadingTime.value || null,
        location: location.value,
        status: status.value,
        vehicleName: vehicleName.value,
        driverName: driverName.value,
        vendorSewa: vendorSewa.value,
        notes: notes.value,
      },
    });

    eventName.value = "";
    clientName.value = "";
    clientPhone.value = "";
    serviceTypeId.value = null;
    equipmentSetup.value = "";
    salesId.value = "NONE";
    eventDate.value = "";
    startTime.value = "";
    endTime.value = "";
    loadingDate.value = "";
    loadingTime.value = "";
    location.value = "";
    status.value = "DRAFTED";
    vehicleName.value = "";
    driverName.value = "";
    vendorSewa.value = "";
    notes.value = "";

    await refresh();
    isCreateEventModalOpen.value = false;
  } catch (error) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to create event";
  } finally {
    isSubmitting.value = false;
  }
}

async function handleDelete(id) {
  const confirmed = confirm("Delete this event?");

  if (!confirmed) return;

  try {
    await $fetch(`/api/events/${id}`, {
      method: "DELETE",
    });

    await refresh();
  } catch (error) {
    alert(
      error?.data?.statusMessage ||
        error?.statusMessage ||
        "Failed to delete event",
    );
  }
}

async function handleHardDeleteEvent(id) {
  const confirmed = confirm(
    "HARD DELETE this event? This action cannot be undone.",
  );

  if (!confirmed) return;

  try {
    await $fetch(`/api/developer/events/${id}`, {
      method: "DELETE",
    });

    await refresh();
  } catch (error) {
    alert(
      error?.data?.statusMessage ||
        error?.statusMessage ||
        "Failed to hard delete event",
    );
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div
      class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <h1 class="text-2xl font-semibold">Events</h1>
        <p class="text-sm text-muted">
          Manage event records, schedule, assignment, and operational status.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          icon="i-lucide-download"
          color="neutral"
          variant="outline"
          @click="handleExportEvents"
        >
          Export CSV
        </UButton>

        <UButton
          icon="i-lucide-plus"
          color="primary"
          @click="isCreateEventModalOpen = true"
        >
          Add Event
        </UButton>
      </div>
    </div>

    <UModal
      v-model:open="isCreateEventModalOpen"
      title="Add Event"
      description="Create a new event record."
      :ui="{ content: 'max-w-3xl' }"
    >
      <template #body>
        <form
          id="create-event-form"
          class="space-y-4"
          @submit.prevent="handleCreate"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Event Name" required>
              <UInput
                v-model="eventName"
                placeholder="Example: Friskies CFD"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Client Name" required>
              <UInput
                v-model="clientName"
                placeholder="Example: Friskies"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Client Phone">
              <UInput
                v-model="clientPhone"
                placeholder="Optional"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Service Type" required>
              <USelect
                v-model="serviceTypeId"
                :items="createServiceTypeOptions"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Sales">
              <USelect v-model="salesId" :items="salesOptions" class="w-full" />
            </UFormField>

            <UFormField label="Status">
              <USelect
                v-model="status"
                :items="eventStatusOptions"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Event Date" required>
              <UInput v-model="eventDate" type="date" class="w-full" />
            </UFormField>

            <UFormField label="Start Time" required>
              <UInput v-model="startTime" type="time" class="w-full" />
            </UFormField>

            <UFormField label="End Time" required>
              <UInput v-model="endTime" type="time" class="w-full" />
            </UFormField>

            <UFormField label="Loading Date">
              <UInput v-model="loadingDate" type="date" class="w-full" />
            </UFormField>

            <UFormField label="Loading Time">
              <UInput v-model="loadingTime" type="time" class="w-full" />
            </UFormField>

            <UFormField label="Location" class="w-full">
              <UInput
                v-model="location"
                placeholder="Event location"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Vehicle Name">
              <UInput
                v-model="vehicleName"
                placeholder="Optional"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Driver Name">
              <UInput
                v-model="driverName"
                placeholder="Optional"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Vendor Sewa" class="md:col-span-2">
              <UInput
                v-model="vendorSewa"
                placeholder="Optional vendor rental info"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Equipment Setup" required>
            <UTextarea
              v-model="equipmentSetup"
              placeholder="Example: 1 photobooth, 1 printer, 2 lighting"
              class="w-full"
            />
          </UFormField>

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
            @click="isCreateEventModalOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            form="create-event-form"
            type="submit"
            color="primary"
            :loading="isSubmitting"
          >
            Save Event
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
            placeholder="Search"
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
            v-model="filterStatus"
            :items="statusOptions"
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
      title="Filter Events"
      description="Apply advanced filters to the event list."
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <form
          id="event-filter-form"
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

            <UFormField label="Status">
              <USelect
                v-model="filterStatus"
                :items="statusOptions"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Service Type">
              <USelect
                v-model="filterServiceTypeId"
                :items="serviceTypeOptions"
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

          <UButton form="event-filter-form" type="submit" color="primary">
            Apply Filter
          </UButton>
        </div>
      </template>
    </UModal>

    <UCard>
      <p v-if="pending" class="text-sm text-muted">Loading events...</p>
      <p v-else-if="error" class="text-sm text-red-500">
        Failed to load events.
      </p>
      <p v-else-if="eventsData?.data?.length === 0" class="text-sm text-muted">
        No events found.
      </p>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-default text-left">
              <th class="py-2 pr-4">Event</th>
              <th class="py-2 pr-4">Client</th>
              <th class="py-2 pr-4">Service</th>
              <th class="py-2 pr-4">Sales</th>
              <th class="py-2 pr-4">Date</th>
              <th class="py-2 pr-4">Time</th>
              <th class="py-2 pr-4">Loading Date</th>
              <th class="py-2 pr-4">Loading Time</th>
              <th class="py-2 pr-4">Vehicle</th>
              <th class="py-2 pr-4">Staff</th>
              <th class="py-2 pr-4">Location</th>
              <th class="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in eventsData?.data"
              :key="item.id"
              class="border-b border-default align-top"
            >
              <td class="py-3 pr-4 font-medium">{{ item.eventName }}</td>
              <td class="py-3 pr-4">
                <div>{{ item.clientName }}</div>
                <div class="text-xs text-muted">
                  {{ item.clientPhone || "-" }}
                </div>
              </td>
              <td class="py-3 pr-4">{{ item.serviceType?.name || "-" }}</td>
              <td class="py-3 pr-4">{{ item.sales?.name || "-" }}</td>
              <td class="py-3 pr-4">{{ formatDate(item.eventDate) }}</td>
              <td class="py-3 pr-4">
                {{ item.startTime }} - {{ item.endTime }}
              </td>
              <td class="py-3 pr-4">
                {{ formatDate(item.loadingDate) }}
              </td>
              <td class="py-3 pr-4">
                {{ item.loadingTime || "-" }}
              </td>
              <td class="py-3 pr-4">
                {{ item.vehicleName || "-" }}
              </td>
              <td class="py-3 pr-4 min-w-48">{{ getEventStaff(item) }}</td>
              <td class="py-3 pr-4">{{ item.location || "-" }}</td>
              <td class="py-3 pr-4">
                <UBadge :color="getStatusColor(item.status)" variant="soft">
                  {{ item.status }}
                </UBadge>
              </td>

              <td class="py-3 pr-4">
                <UDropdownMenu
                  :items="getEventActionItems(item)"
                  :content="{ align: 'end' }"
                >
                  <UButton
                    icon="i-lucide-ellipsis-vertical"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    aria-label="Event actions"
                  />
                </UDropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template #footer>
        <div
          v-if="eventsData?.pagination"
          class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
        >
          <p class="text-sm text-muted">
            Page {{ eventsData.pagination.page }} of
            {{ eventsData.pagination.totalPages }} — Total
            {{ eventsData.pagination.totalItems }} events
          </p>
          <div class="flex gap-2">
            <UButton
              type="button"
              color="neutral"
              variant="outline"
              :disabled="eventsData.pagination.page <= 1"
              @click="goToPreviousPage"
            >
              Previous
            </UButton>
            <UButton
              type="button"
              color="neutral"
              variant="outline"
              :disabled="
                eventsData.pagination.page >= eventsData.pagination.totalPages
              "
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
