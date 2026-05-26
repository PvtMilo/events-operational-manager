<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const { t } = useI18n();

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
  if (status === "NOT_PREPARED") return t("dashboard.loadingStatus.notPrepared");
  if (status === "PREPARING") return t("dashboard.loadingStatus.preparing");
  if (status === "LOADING") return t("dashboard.loadingStatus.loadingInProgress");
  if (status === "LOADED") return t("dashboard.loadingStatus.loadingComplete");

  return status || t("dashboard.loadingStatus.notPrepared");
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div
      class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <h1 class="text-2xl font-semibold">
          {{ t("dashboard.title") }}
        </h1>

        <p class="text-sm text-muted">
          {{ t("dashboard.description") }}
        </p>
      </div>

      <UButton
        type="button"
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="outline"
        @click="refresh"
      >
        {{ t("common.refresh") }}
      </UButton>
    </div>

    <UCard v-if="pending">
      {{ t("dashboard.loading") }}
    </UCard>

    <UCard v-else-if="error">
      <p class="text-sm text-red-500">
        {{ t("dashboard.failedToLoad") }}
      </p>
    </UCard>

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <UCard>
          <p class="text-sm text-muted">
            {{ t("dashboard.summary.loadingToday") }}
          </p>

          <p class="mt-1 text-2xl font-semibold">
            {{ summary.loadingToday }}
          </p>

          <p class="mt-1 text-xs text-muted">
            {{ t("dashboard.summary.loadingTodayHint") }}
          </p>
        </UCard>

        <UCard>
          <p class="text-sm text-muted">
            {{ t("dashboard.summary.upcomingLoading") }}
          </p>

          <p class="mt-1 text-2xl font-semibold">
            {{ summary.upcomingLoading }}
          </p>

          <p class="mt-1 text-xs text-muted">
            {{ t("dashboard.summary.upcomingLoadingHint") }}
          </p>
        </UCard>

        <UCard>
          <p class="text-sm text-muted">
            {{ t("dashboard.summary.needAttention") }}
          </p>

          <p class="mt-1 text-2xl font-semibold">
            {{ summary.needAttention }}
          </p>

          <p class="mt-1 text-xs text-muted">
            {{ t("dashboard.summary.needAttentionHint") }}
          </p>
        </UCard>

        <UCard>
          <p class="text-sm text-muted">
            {{ t("dashboard.summary.todayEvents") }}
          </p>

          <p class="mt-1 text-2xl font-semibold">
            {{ summary.todayEvents }}
          </p>

          <p class="mt-1 text-xs text-muted">
            {{ t("dashboard.summary.todayEventsHint") }}
          </p>
        </UCard>

        <UCard>
          <p class="text-sm text-muted">
            {{ t("dashboard.summary.pendingEvaluation") }}
          </p>

          <p class="mt-1 text-2xl font-semibold">
            {{ summary.pendingEvaluation }}
          </p>

          <p class="mt-1 text-xs text-muted">
            {{ t("dashboard.summary.pendingEvaluationHint") }}
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
                {{ t("dashboard.assignment.title") }}
              </h2>

              <p class="text-sm text-muted">
                {{ t("dashboard.assignment.description") }}
              </p>
            </div>

            <UBadge color="warning" variant="soft">
              {{ t("dashboard.assignment.eventsCount", { count: summary.needAssignment }) }}
            </UBadge>
          </div>
        </template>

        <p v-if="needAssignment.length === 0" class="text-sm text-muted">
          {{ t("dashboard.assignment.empty") }}
        </p>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead>
              <tr class="border-b border-default text-xs uppercase text-muted">
                <th class="whitespace-nowrap px-3 py-3">
                  {{ t("common.table.event") }}
                </th>
                <th class="whitespace-nowrap px-3 py-3">
                  {{ t("common.table.client") }}
                </th>
                <th class="whitespace-nowrap px-3 py-3">
                  {{ t("common.table.service") }}
                </th>
                <th class="whitespace-nowrap px-3 py-3">
                  {{ t("common.table.date") }}
                </th>
                <th class="whitespace-nowrap px-3 py-3">
                  {{ t("common.table.time") }}
                </th>
                <th class="whitespace-nowrap px-3 py-3">
                  {{ t("common.table.location") }}
                </th>
                <th class="whitespace-nowrap px-3 py-3">
                  {{ t("common.table.action") }}
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
                    {{ t("dashboard.assignment.assignStaff") }}
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
                {{ t("dashboard.loadingReminders.title") }}
              </h2>

              <p class="text-sm text-muted">
                {{ t("dashboard.loadingReminders.description") }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <UBadge color="error" variant="soft">
                {{ t("dashboard.loadingReminders.badges.today", { count: loadingToday.length }) }}
              </UBadge>

              <UBadge color="primary" variant="soft">
                {{ t("dashboard.loadingReminders.badges.upcoming", { count: upcomingLoading.length }) }}
              </UBadge>

              <UBadge color="warning" variant="soft">
                {{ t("dashboard.loadingReminders.badges.attention", { count: missingLoadingInfo.length }) }}
              </UBadge>
            </div>
          </div>
        </template>

        <div class="space-y-8">
          <section>
            <div class="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 class="font-medium">
                  {{ t("dashboard.loadingReminders.loadingTodayTitle") }}
                </h3>

                <p class="text-sm text-muted">
                  {{ t("dashboard.loadingReminders.loadingTodayDescription") }}
                </p>
              </div>
            </div>

            <p v-if="loadingToday.length === 0" class="text-sm text-muted">
              {{ t("dashboard.loadingReminders.loadingTodayEmpty") }}
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
                  {{ t("dashboard.loadingReminders.upcomingLoadingTitle") }}
                </h3>

                <p class="text-sm text-muted">
                  {{ t("dashboard.loadingReminders.upcomingLoadingDescription") }}
                </p>
              </div>
            </div>

            <p v-if="upcomingLoading.length === 0" class="text-sm text-muted">
              {{ t("dashboard.loadingReminders.upcomingLoadingEmpty") }}
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
                  {{ t("dashboard.loadingReminders.missingInfoTitle") }}
                </h3>

                <p class="text-sm text-muted">
                  {{ t("dashboard.loadingReminders.missingInfoDescription") }}
                </p>
              </div>
            </div>

            <p
              v-if="missingLoadingInfo.length === 0"
              class="text-sm text-muted"
            >
              {{ t("dashboard.loadingReminders.missingInfoEmpty") }}
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
