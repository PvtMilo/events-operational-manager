<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: ["auth", "no-staff-report"],
});

const route = useRoute();

const staffId = route.params.id;
const reportRange = getInitialReportRange(
  route.query.dateFrom,
  route.query.dateTo,
  route.query.year,
  route.query.month,
);

const reportUrl = computed(() => {
  return `/api/reports/staff/${staffId}?${getReportQueryString()}`;
});

const { data, pending, error, refresh } = await useFetch(reportUrl);

const report = computed(() => {
  return data.value?.data || null;
});

const events = computed(() => {
  return report.value?.events || [];
});

const summary = computed(() => {
  return (
    report.value?.summary || {
      totalAssigned: 0,
      totalPic: 0,
      totalEvaluated: 0,
      totalSuccess: 0,
      totalFailed: 0,
      successRate: 0,
    }
  );
});

const periodLabel = computed(() => {
  const start = formatDateFilterValue(reportRange.dateFrom);
  const end = formatDateFilterValue(reportRange.dateTo);

  if (start && end && start !== end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;
  return "Date";
});

const evaluationGap = computed(() => {
  return Math.max(summary.value.totalAssigned - summary.value.totalEvaluated, 0);
});

const evaluationCoverage = computed(() => {
  if (!summary.value.totalAssigned) return 0;

  return Math.round(
    (summary.value.totalEvaluated / summary.value.totalAssigned) * 100,
  );
});

const signal = computed(() => {
  if (!summary.value.totalAssigned) {
    return {
      label: "No Assignment",
      color: "neutral",
      detail: "No active assignment in this period.",
    };
  }

  if (evaluationGap.value > 0) {
    return {
      label: "Evaluation Gap",
      color: "warning",
      detail: `${evaluationGap.value} event still needs evaluation.`,
    };
  }

  if (summary.value.successRate >= 90) {
    return {
      label: "Strong Performer",
      color: "success",
      detail: "High success rate with completed evaluations.",
    };
  }

  if (summary.value.successRate >= 75) {
    return {
      label: "Stable",
      color: "primary",
      detail: "Good baseline, review failed events if any.",
    };
  }

  return {
    label: "Needs Review",
    color: "error",
    detail: "Review failures before assigning critical events.",
  };
});

function formatDate(dateValue) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleDateString();
}

function formatTimeRange(item) {
  if (!item.startTime && !item.endTime) return "-";

  return `${item.startTime || "-"} - ${item.endTime || "-"}`;
}

function formatBoolean(value) {
  if (value === true) return "OK";
  if (value === false) return "NOT OK";
  return "NOT EVALUATED";
}

function getBooleanColor(value) {
  if (value === true) return "success";
  if (value === false) return "error";
  return "neutral";
}

function getSuccessLabel(value) {
  if (value === true) return "SUCCESS";
  if (value === false) return "NOT SUCCESS";
  return "NOT EVALUATED";
}

function getSuccessColor(value) {
  if (value === true) return "success";
  if (value === false) return "error";
  return "neutral";
}

function getRateColor(rate, evaluated = 1) {
  if (!evaluated) return "neutral";
  if (rate >= 90) return "success";
  if (rate >= 75) return "warning";
  return "error";
}

function getRoleColor(role) {
  if (role === "PIC") return "primary";
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

function getQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function parseDateParam(value) {
  const stringValue = getQueryValue(value)?.toString() || "";
  const match = stringValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return "";

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "";
  }

  return stringValue;
}

function formatDateInput(dateValue) {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return {
    dateFrom: formatDateInput(start),
    dateTo: formatDateInput(end),
  };
}

function getInitialReportRange(dateFromValue, dateToValue, yearValue, monthValue) {
  const dateFrom = parseDateParam(dateFromValue);
  const dateTo = parseDateParam(dateToValue || dateFromValue);

  if (dateFrom || dateTo) {
    return {
      dateFrom: dateFrom || dateTo,
      dateTo: dateTo || dateFrom,
    };
  }

  const legacyYear = Number(getQueryValue(yearValue));
  const legacyMonth = Number(getQueryValue(monthValue));

  if (
    legacyYear &&
    !Number.isNaN(legacyYear) &&
    legacyMonth &&
    !Number.isNaN(legacyMonth) &&
    legacyMonth >= 1 &&
    legacyMonth <= 12
  ) {
    return getMonthRange(legacyYear, legacyMonth);
  }

  const now = new Date();

  return getMonthRange(now.getFullYear(), now.getMonth() + 1);
}

function getReportQueryString() {
  const params = new URLSearchParams();

  if (reportRange.dateFrom) params.set("dateFrom", reportRange.dateFrom);
  if (reportRange.dateTo) params.set("dateTo", reportRange.dateTo);

  return params.toString();
}

function getReportsTo() {
  const queryString = getReportQueryString();

  return queryString ? `/reports?${queryString}` : "/reports";
}

function formatDateFilterValue(dateValue) {
  if (!dateValue) return "";

  const [year, month, day] = dateValue.toString().split("-");

  if (!year || !month || !day) return dateValue.toString();

  return `${day}/${month}/${year}`;
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div
      class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          class="mb-2"
          :to="getReportsTo()"
        >
          Back to Reports
        </UButton>

        <h1 class="text-2xl font-semibold">Staff Report Detail</h1>
        <p class="text-sm text-muted">
          Performance detail, evaluation checks, and event history.
        </p>
      </div>

      <UButton
        type="button"
        color="neutral"
        variant="outline"
        icon="i-lucide-refresh-cw"
        @click="refresh"
      >
        Refresh
      </UButton>
    </div>

    <p v-if="pending" class="text-sm text-muted">Loading report detail...</p>
    <p v-else-if="error" class="text-sm text-red-500">
      Failed to load report detail.
    </p>

    <template v-else-if="report">
      <UCard>
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-xl font-semibold">{{ report.staff.name }}</h2>
              <UBadge color="neutral" variant="soft">
                {{ report.staff.defaultRole }}
              </UBadge>
            </div>

            <p class="mt-1 text-sm text-muted">
              {{ periodLabel }}
            </p>
          </div>

          <div class="max-w-xl">
            <div class="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
              <UBadge :color="signal.color" variant="soft">
                {{ signal.label }}
              </UBadge>
              <p class="text-sm text-muted">{{ signal.detail }}</p>
            </div>
          </div>
        </div>
      </UCard>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <UCard>
          <p class="text-sm text-muted">Assigned</p>
          <p class="mt-1 text-2xl font-semibold">
            {{ summary.totalAssigned }}
          </p>
        </UCard>

        <UCard>
          <p class="text-sm text-muted">PIC</p>
          <p class="mt-1 text-2xl font-semibold">
            {{ summary.totalPic }}
          </p>
        </UCard>

        <UCard>
          <p class="text-sm text-muted">Evaluated</p>
          <p class="mt-1 text-2xl font-semibold">
            {{ summary.totalEvaluated }}
          </p>
        </UCard>

        <UCard>
          <p class="text-sm text-muted">Success</p>
          <p class="mt-1 text-2xl font-semibold">
            {{ summary.totalSuccess }}
          </p>
        </UCard>

        <UCard>
          <p class="text-sm text-muted">Failed</p>
          <p class="mt-1 text-2xl font-semibold">
            {{ summary.totalFailed }}
          </p>
        </UCard>

        <UCard>
          <p class="text-sm text-muted">Success Rate</p>
          <div class="mt-2 flex items-center gap-2">
            <p class="text-2xl font-semibold">{{ summary.successRate }}%</p>
            <UBadge
              :color="getRateColor(summary.successRate, summary.totalEvaluated)"
              variant="soft"
            >
              {{ evaluationCoverage }}% eval
            </UBadge>
          </div>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 class="text-lg font-semibold">Event Performance</h2>
              <p class="text-sm text-muted">
                Assignment history and evaluation checklist for this period.
              </p>
            </div>

            <UBadge color="neutral" variant="soft">
              {{ events.length }} events
            </UBadge>
          </div>
        </template>

        <p v-if="events.length === 0" class="text-sm text-muted">
          No active assignment for this staff in this period.
        </p>

        <div v-else class="touch-scroll-x overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-default text-left">
                <th class="py-2 pr-4">Event</th>
                <th class="py-2 pr-4">Client</th>
                <th class="py-2 pr-4">Service</th>
                <th class="py-2 pr-4">Date</th>
                <th class="py-2 pr-4">Time</th>
                <th class="py-2 pr-4">Role</th>
                <th class="py-2 pr-4">Assignment</th>
                <th class="py-2 pr-4">Event Status</th>
                <th class="py-2 pr-4">Client</th>
                <th class="py-2 pr-4">SOP</th>
                <th class="py-2 pr-4">Warehouse</th>
                <th class="py-2 pr-4">Grooming</th>
                <th class="py-2 pr-4">Data</th>
                <th class="py-2 pr-4">Result</th>
                <th class="py-2 pr-4"></th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="item in events"
                :key="item.assignmentId"
                class="border-b border-default align-top"
              >
                <td class="py-3 pr-4 font-medium min-w-56">
                  {{ item.eventName }}
                </td>
                <td class="py-3 pr-4 min-w-40">
                  {{ item.clientName }}
                </td>
                <td class="py-3 pr-4 min-w-40">
                  {{ item.serviceTypeName || "-" }}
                </td>
                <td class="py-3 pr-4 whitespace-nowrap">
                  {{ formatDate(item.eventDate) }}
                </td>
                <td class="py-3 pr-4 whitespace-nowrap">
                  {{ formatTimeRange(item) }}
                </td>
                <td class="py-3 pr-4">
                  <UBadge :color="getRoleColor(item.roleInEvent)" variant="soft">
                    {{ item.roleInEvent }}
                  </UBadge>
                </td>
                <td class="py-3 pr-4">
                  <UBadge
                    :color="getAssignmentStatusColor(item.assignmentStatus)"
                    variant="soft"
                  >
                    {{ item.assignmentStatus }}
                  </UBadge>
                </td>
                <td class="py-3 pr-4">
                  <UBadge
                    :color="getEventStatusColor(item.eventStatus)"
                    variant="soft"
                  >
                    {{ item.eventStatus }}
                  </UBadge>
                </td>
                <td class="py-3 pr-4">
                  <UBadge
                    :color="getBooleanColor(item.clientSatisfactionOk)"
                    variant="soft"
                  >
                    {{ formatBoolean(item.clientSatisfactionOk) }}
                  </UBadge>
                </td>
                <td class="py-3 pr-4">
                  <UBadge :color="getBooleanColor(item.sopOk)" variant="soft">
                    {{ formatBoolean(item.sopOk) }}
                  </UBadge>
                </td>
                <td class="py-3 pr-4">
                  <UBadge :color="getBooleanColor(item.warehouseOk)" variant="soft">
                    {{ formatBoolean(item.warehouseOk) }}
                  </UBadge>
                </td>
                <td class="py-3 pr-4">
                  <UBadge :color="getBooleanColor(item.groomingOk)" variant="soft">
                    {{ formatBoolean(item.groomingOk) }}
                  </UBadge>
                </td>
                <td class="py-3 pr-4">
                  <UBadge
                    :color="getBooleanColor(item.dataCollectionOk)"
                    variant="soft"
                  >
                    {{ formatBoolean(item.dataCollectionOk) }}
                  </UBadge>
                </td>
                <td class="py-3 pr-4">
                  <UBadge :color="getSuccessColor(item.isSuccess)" variant="soft">
                    {{ getSuccessLabel(item.isSuccess) }}
                  </UBadge>
                </td>
                <td class="py-3 pr-4">
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-eye"
                    :to="`/events/${item.eventId}`"
                  >
                    Event
                  </UButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </template>
  </div>
</template>
