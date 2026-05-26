<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const {
  data: dashboardData,
  pending,
  error,
  refresh,
} = await useFetch("/api/dashboard");

const dashboard = computed(() => {
  return (
    dashboardData.value?.data || {
      summary: {
        loadingToday: 0,
        upcomingLoading: 0,
        needAttention: 0,
        todayEvents: 0,
        pendingEvaluation: 0,
        needAssignment: 0,
      },
      loadingReminders: {
        loadingToday: [],
        upcomingLoading: [],
        missingLoadingInfo: [],
      },
      needAssignment: [],
    }
  );
});

const summary = computed(() => dashboard.value.summary);
const loadingToday = computed(() => {
  return dashboard.value.loadingReminders.loadingToday || [];
});
const upcomingLoading = computed(() => {
  return dashboard.value.loadingReminders.upcomingLoading || [];
});
const missingLoadingInfo = computed(() => {
  return dashboard.value.loadingReminders.missingLoadingInfo || [];
});
const needAssignment = computed(() => dashboard.value.needAssignment || []);

function formatDate(dateValue) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleDateString();
}

function formatEventTime(row) {
  if (!row.startTime && !row.endTime) return "-";

  return `${row.startTime || "-"} - ${row.endTime || "-"}`;
}

function getDueColor(label) {
  if (label === "OVERDUE") return "error";
  if (label === "TODAY") return "error";
  if (label === "TOMORROW") return "warning";
  if (label === "H+2") return "primary";
  if (label === "NO LOADING DATE") return "error";

  return "neutral";
}

function getLoadingStatusColor(status) {
  if (status === "LOADED") return "success";
  if (status === "LOADING") return "primary";
  if (status === "PREPARING") return "warning";
  if (status === "NOT_PREPARED") return "neutral";

  return "neutral";
}

function getLoadingStatusLabel(status) {
  if (status === "NOT_PREPARED") return "Belum Disiapkan";
  if (status === "PREPARING") return "Sedang Disiapkan";
  if (status === "LOADING") return "Loading Berjalan";
  if (status === "LOADED") return "Sudah Loading";

  return status || "Belum Disiapkan";
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div
      class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <h1 class="text-2xl font-semibold">
          Dashboard
        </h1>

        <p class="text-sm text-muted">
          Operational reminder for loading, preparation, and event assignment.
        </p>
      </div>

      <UButton
        type="button"
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="outline"
        @click="refresh"
      >
        Refresh
      </UButton>
    </div>

    <UCard v-if="pending">
      Loading dashboard...
    </UCard>

    <UCard v-else-if="error">
      <p class="text-sm text-red-500">
        Failed to load dashboard.
      </p>
    </UCard>

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <UCard>
          <p class="text-sm text-muted">
            Loading Today
          </p>

          <p class="mt-1 text-2xl font-semibold">
            {{ summary.loadingToday }}
          </p>

          <p class="mt-1 text-xs text-muted">
            Based on loading date
          </p>
        </UCard>

        <UCard>
          <p class="text-sm text-muted">
            Upcoming Loading
          </p>

          <p class="mt-1 text-2xl font-semibold">
            {{ summary.upcomingLoading }}
          </p>

          <p class="mt-1 text-xs text-muted">
            Tomorrow and H+2 loading
          </p>
        </UCard>

        <UCard>
          <p class="text-sm text-muted">
            Need Attention
          </p>

          <p class="mt-1 text-2xl font-semibold">
            {{ summary.needAttention }}
          </p>

          <p class="mt-1 text-xs text-muted">
            Missing loading date/time
          </p>
        </UCard>

        <UCard>
          <p class="text-sm text-muted">
            Today Events
          </p>

          <p class="mt-1 text-2xl font-semibold">
            {{ summary.todayEvents }}
          </p>

          <p class="mt-1 text-xs text-muted">
            Events running today
          </p>
        </UCard>

        <UCard>
          <p class="text-sm text-muted">
            Pending Evaluation
          </p>

          <p class="mt-1 text-2xl font-semibold">
            {{ summary.pendingEvaluation }}
          </p>

          <p class="mt-1 text-xs text-muted">
            Need post-event evaluation
          </p>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <div
            class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h2 class="text-lg font-semibold">
                Events Need Assignment
              </h2>

              <p class="text-sm text-muted">
                Events this month without active PIC/crew.
              </p>
            </div>

            <UBadge color="warning" variant="soft">
              {{ summary.needAssignment }} events
            </UBadge>
          </div>
        </template>

        <p v-if="needAssignment.length === 0" class="text-sm text-muted">
          No event needs assignment.
        </p>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead>
              <tr class="border-b border-default text-xs uppercase text-muted">
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
                  Date
                </th>
                <th class="whitespace-nowrap px-3 py-3">
                  Time
                </th>
                <th class="whitespace-nowrap px-3 py-3">
                  Location
                </th>
                <th class="whitespace-nowrap px-3 py-3">
                  Action
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-default">
              <tr
                v-for="item in needAssignment"
                :key="item.id"
                class="align-top"
              >
                <td class="min-w-56 px-3 py-3 font-medium">
                  {{ item.eventName }}
                </td>

                <td class="min-w-40 px-3 py-3">
                  {{ item.clientName }}
                </td>

                <td class="min-w-40 px-3 py-3">
                  {{ item.serviceTypeName }}
                </td>

                <td class="whitespace-nowrap px-3 py-3">
                  {{ formatDate(item.eventDate) }}
                </td>

                <td class="whitespace-nowrap px-3 py-3">
                  {{ item.startTime || "-" }} - {{ item.endTime || "-" }}
                </td>

                <td class="min-w-56 px-3 py-3">
                  {{ item.location }}
                </td>

                <td class="whitespace-nowrap px-3 py-3">
                  <UButton
                    size="xs"
                    color="primary"
                    variant="soft"
                    :to="`/events/${item.id}`"
                  >
                    Assign Staff
                  </UButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div
            class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h2 class="text-lg font-semibold">
                Loading Reminders
              </h2>

              <p class="text-sm text-muted">
                Loading schedule based on loading date. Sales and event status
                are intentionally hidden.
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <UBadge color="error" variant="soft">
                Today {{ loadingToday.length }}
              </UBadge>

              <UBadge color="primary" variant="soft">
                Upcoming {{ upcomingLoading.length }}
              </UBadge>

              <UBadge color="warning" variant="soft">
                Attention {{ missingLoadingInfo.length }}
              </UBadge>
            </div>
          </div>
        </template>

        <div class="space-y-8">
          <section>
            <div class="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 class="font-medium">
                  Loading Today
                </h3>

                <p class="text-sm text-muted">
                  Events that should be prepared or loaded today.
                </p>
              </div>
            </div>

            <p v-if="loadingToday.length === 0" class="text-sm text-muted">
              No loading scheduled today.
            </p>

            <DashboardLoadingTable
              v-else
              :rows="loadingToday"
              :format-date="formatDate"
              :format-event-time="formatEventTime"
              :get-due-color="getDueColor"
              :get-loading-status-color="getLoadingStatusColor"
              :get-loading-status-label="getLoadingStatusLabel"
            />
          </section>

          <section>
            <div class="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 class="font-medium">
                  Upcoming Loading
                </h3>

                <p class="text-sm text-muted">
                  Loading schedule for tomorrow and the next 2 days.
                </p>
              </div>
            </div>

            <p v-if="upcomingLoading.length === 0" class="text-sm text-muted">
              No upcoming loading schedule.
            </p>

            <DashboardLoadingTable
              v-else
              :rows="upcomingLoading"
              :format-date="formatDate"
              :format-event-time="formatEventTime"
              :get-due-color="getDueColor"
              :get-loading-status-color="getLoadingStatusColor"
              :get-loading-status-label="getLoadingStatusLabel"
            />
          </section>

          <section>
            <div class="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 class="font-medium">
                  Missing Loading Info
                </h3>

                <p class="text-sm text-muted">
                  Upcoming events with missing loading date or loading time.
                </p>
              </div>
            </div>

            <p
              v-if="missingLoadingInfo.length === 0"
              class="text-sm text-muted"
            >
              No missing loading information.
            </p>

            <DashboardLoadingTable
              v-else
              :rows="missingLoadingInfo"
              :format-date="formatDate"
              :format-event-time="formatEventTime"
              :get-due-color="getDueColor"
              :get-loading-status-color="getLoadingStatusColor"
              :get-loading-status-label="getLoadingStatusLabel"
            />
          </section>
        </div>
      </UCard>
    </template>
  </div>
</template>
