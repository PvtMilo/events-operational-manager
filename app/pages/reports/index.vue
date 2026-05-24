<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: ["auth", "no-staff-report"],
});

const now = new Date();
const route = useRoute();
const router = useRouter();

const selectedYear = ref(getInitialYear(route.query.year));
const selectedMonth = ref(getInitialMonth(route.query.month));

const reportUrl = computed(() => {
  return `/api/reports/crew-monthly?year=${selectedYear.value}&month=${selectedMonth.value}`;
});

const { data, pending, error, refresh } = await useFetch(reportUrl);

const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const years = computed(() => {
  const currentYear = now.getFullYear();

  return [
    { label: String(currentYear - 1), value: String(currentYear - 1) },
    { label: String(currentYear), value: String(currentYear) },
    { label: String(currentYear + 1), value: String(currentYear + 1) },
  ];
});

const rows = computed(() => data.value?.data || []);

const periodLabel = computed(() => {
  const month = months.find((item) => item.value === selectedMonth.value);

  return `${month?.label || selectedMonth.value} ${selectedYear.value}`;
});

const metrics = computed(() => {
  const staffRows = rows.value;
  const assignedRows = staffRows.filter((item) => item.totalAssigned > 0);

  const totalAssignments = staffRows.reduce((total, item) => {
    return total + item.totalAssigned;
  }, 0);

  const totalEvaluated = staffRows.reduce((total, item) => {
    return total + item.totalEvaluated;
  }, 0);

  const totalSuccess = staffRows.reduce((total, item) => {
    return total + item.totalSuccess;
  }, 0);

  const totalFailed = staffRows.reduce((total, item) => {
    return total + item.totalFailed;
  }, 0);

  const totalPic = staffRows.reduce((total, item) => {
    return total + item.totalPic;
  }, 0);

  const assignedCounts = assignedRows.map((item) => item.totalAssigned);
  const maxAssigned = assignedCounts.length ? Math.max(...assignedCounts) : 0;
  const minAssigned = assignedCounts.length ? Math.min(...assignedCounts) : 0;
  const averageAssigned = assignedRows.length
    ? totalAssignments / assignedRows.length
    : 0;

  return {
    activeStaff: staffRows.length,
    assignedStaff: assignedRows.length,
    benchStaff: staffRows.length - assignedRows.length,
    totalAssignments,
    totalEvaluated,
    totalSuccess,
    totalFailed,
    totalPic,
    evaluationGap: Math.max(totalAssignments - totalEvaluated, 0),
    evaluationCoverage: totalAssignments
      ? Math.round((totalEvaluated / totalAssignments) * 100)
      : 0,
    successRate: totalEvaluated
      ? Math.round((totalSuccess / totalEvaluated) * 100)
      : 0,
    maxAssigned,
    minAssigned,
    averageAssigned,
    workloadSpread: maxAssigned - minAssigned,
  };
});

const topReliabilityRows = computed(() => {
  return [...rows.value]
    .filter((item) => item.totalEvaluated > 0)
    .sort((a, b) => {
      if (a.successRate !== b.successRate) return b.successRate - a.successRate;
      if (a.totalSuccess !== b.totalSuccess) return b.totalSuccess - a.totalSuccess;
      return b.totalAssigned - a.totalAssigned;
    })
    .slice(0, 3);
});

const heavyLoadRows = computed(() => {
  return [...rows.value]
    .filter((item) => item.totalAssigned > 0)
    .sort((a, b) => {
      if (a.totalAssigned !== b.totalAssigned) {
        return b.totalAssigned - a.totalAssigned;
      }

      return b.totalPic - a.totalPic;
    })
    .slice(0, 3);
});

const needsReviewRows = computed(() => {
  return [...rows.value]
    .filter((item) => {
      return (
        item.totalAssigned > 0 &&
        (item.totalFailed > 0 ||
          item.totalEvaluated < item.totalAssigned ||
          item.successRate < 80)
      );
    })
    .sort((a, b) => {
      const aGap = a.totalAssigned - a.totalEvaluated;
      const bGap = b.totalAssigned - b.totalEvaluated;

      if (a.totalFailed !== b.totalFailed) return b.totalFailed - a.totalFailed;
      if (aGap !== bGap) return bGap - aGap;

      return a.successRate - b.successRate;
    })
    .slice(0, 5);
});

const benchRows = computed(() => {
  return rows.value.filter((item) => item.totalAssigned === 0).slice(0, 5);
});

const scheduleSignals = computed(() => {
  const topPic = [...rows.value]
    .filter((item) => item.totalPic > 0)
    .sort((a, b) => {
      if (a.totalPic !== b.totalPic) return b.totalPic - a.totalPic;
      return b.successRate - a.successRate;
    })[0];

  return [
    {
      label: "Evaluation Gap",
      value: metrics.value.evaluationGap,
      detail: `${metrics.value.evaluationCoverage}% coverage`,
      color: getCoverageColor(metrics.value.evaluationCoverage),
    },
    {
      label: "Bench Capacity",
      value: metrics.value.benchStaff,
      detail: "active staff without assignment",
      color: metrics.value.benchStaff > 0 ? "info" : "neutral",
    },
    {
      label: "Load Spread",
      value: metrics.value.workloadSpread,
      detail: "max minus min assignments",
      color: getSpreadColor(metrics.value.workloadSpread),
    },
    {
      label: "PIC Anchor",
      value: topPic?.name || "-",
      detail: topPic ? `${topPic.totalPic} PIC, ${topPic.successRate}% success` : "no PIC data",
      color: topPic ? "primary" : "neutral",
    },
  ];
});

function getInitialYear(value) {
  const number = Number(Array.isArray(value) ? value[0] : value);

  if (!number || Number.isNaN(number)) return String(now.getFullYear());

  return String(number);
}

function getInitialMonth(value) {
  const number = Number(Array.isArray(value) ? value[0] : value);

  if (!number || Number.isNaN(number) || number < 1 || number > 12) {
    return String(now.getMonth() + 1);
  }

  return String(number);
}

async function handleFilter() {
  await router.replace({
    query: {
      ...route.query,
      year: selectedYear.value,
      month: selectedMonth.value,
    },
  });

  await refresh();
}

function handleExportStaffEvaluation() {
  const url = `/api/reports/completed-events/export?year=${selectedYear.value}&month=${selectedMonth.value}`;

  window.open(url, "_blank");
}

function handleExportEventSummary() {
  const url = `/api/reports/completed-events/event-summary-export?year=${selectedYear.value}&month=${selectedMonth.value}`;

  window.open(url, "_blank");
}

function getSuccessColor(rate, evaluated = 1) {
  if (!evaluated) return "neutral";
  if (rate >= 90) return "success";
  if (rate >= 75) return "warning";
  return "error";
}

function getCoverageColor(rate) {
  if (rate >= 90) return "success";
  if (rate >= 70) return "warning";
  return "error";
}

function getSpreadColor(spread) {
  if (spread <= 1) return "success";
  if (spread <= 3) return "warning";
  return "error";
}

function getLoadColor(item) {
  if (item.totalAssigned === 0) return "neutral";
  if (metrics.value.averageAssigned && item.totalAssigned >= metrics.value.averageAssigned * 1.5) {
    return "warning";
  }
  return "primary";
}

function getReviewLabel(item) {
  if (item.totalAssigned === 0) return "Bench";
  if (item.totalEvaluated === 0) return "Needs evaluation";
  if (item.totalEvaluated < item.totalAssigned) return "Evaluation gap";
  if (item.totalFailed > 0) return "Has failed event";
  if (item.successRate >= 90 && item.totalPic > 0) return "Strong PIC option";
  if (item.successRate >= 80) return "Stable";
  return "Review before assigning";
}

function getReviewColor(item) {
  if (item.totalAssigned === 0) return "neutral";
  if (item.totalEvaluated === 0 || item.totalEvaluated < item.totalAssigned) {
    return "warning";
  }
  if (item.totalFailed > 0 || item.successRate < 80) return "error";
  if (item.successRate >= 90) return "success";
  return "primary";
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div
      class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <h1 class="text-2xl font-semibold">Reports</h1>
        <p class="text-sm text-muted">
          Monthly staff performance, workload balance, and evaluation readiness.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          icon="i-lucide-download"
          color="neutral"
          variant="outline"
          @click="handleExportEventSummary"
        >
          Event Summary CSV
        </UButton>

        <UButton
          icon="i-lucide-download"
          color="primary"
          @click="handleExportStaffEvaluation"
        >
          Staff Evaluation CSV
        </UButton>
      </div>
    </div>

    <UCard>
      <form
        class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
        @submit.prevent="handleFilter"
      >
        <div class="grid w-full gap-3 md:max-w-xl md:grid-cols-2">
          <UFormField label="Month">
            <USelect
              v-model="selectedMonth"
              :items="months"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Year">
            <USelect
              v-model="selectedYear"
              :items="years"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="flex flex-wrap gap-2 md:justify-end">
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            @click="refresh"
          >
            Refresh
          </UButton>

          <UButton
            type="submit"
            color="primary"
            icon="i-lucide-sliders-horizontal"
          >
            Apply Filter
          </UButton>
        </div>
      </form>
    </UCard>
<!-- Change To top 5 PIC | top 5 Senior Crew | top 5 Junior Crew  -->
    <UCard>
      <template #header>
        <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-lg font-semibold">Staff Performance Matrix</h2>
            <p class="text-sm text-muted">
              Workload and evaluation result by active staff.
            </p>
          </div>

          <UBadge color="neutral" variant="soft">
            {{ rows.length }} staff
          </UBadge>
        </div>
      </template>

      <p v-if="pending" class="text-sm text-muted">Loading report...</p>
      <p v-else-if="error" class="text-sm text-red-500">
        Failed to load report.
      </p>
      <p v-else-if="rows.length === 0" class="text-sm text-muted">
        No report data.
      </p>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-default text-left">
              <th class="py-2 pr-4">Staff</th>
              <th class="py-2 pr-4">Role</th>
              <th class="py-2 pr-4">Assigned</th>
              <th class="py-2 pr-4">Evaluated</th>
              <th class="py-2 pr-4">Success</th>
              <th class="py-2 pr-4">Failed</th>
              <th class="py-2 pr-4">PIC</th>
              <th class="py-2 pr-4">Success Rate</th>
              <th class="py-2 pr-4">Schedule Signal</th>
              <th class="py-2 pr-4"></th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in rows"
              :key="item.staffId"
              class="border-b border-default align-top"
            >
              <td class="py-3 pr-4 font-medium">{{ item.name }}</td>
              <td class="py-3 pr-4">
                <UBadge color="neutral" variant="soft">
                  {{ item.defaultRole }}
                </UBadge>
              </td>
              <td class="py-3 pr-4">
                <UBadge :color="getLoadColor(item)" variant="soft">
                  {{ item.totalAssigned }}
                </UBadge>
              </td>
              <td class="py-3 pr-4">
                {{ item.totalEvaluated }} / {{ item.totalAssigned }}
              </td>
              <td class="py-3 pr-4">{{ item.totalSuccess }}</td>
              <td class="py-3 pr-4">{{ item.totalFailed }}</td>
              <td class="py-3 pr-4">{{ item.totalPic }}</td>
              <td class="py-3 pr-4">
                <UBadge
                  :color="getSuccessColor(item.successRate, item.totalEvaluated)"
                  variant="soft"
                >
                  {{ item.successRate }}%
                </UBadge>
              </td>
              <td class="py-3 pr-4">
                <UBadge :color="getReviewColor(item)" variant="soft">
                  {{ getReviewLabel(item) }}
                </UBadge>
              </td>
              <td class="py-3 pr-4">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-eye"
                  :to="`/reports/staff/${item.staffId}?year=${selectedYear}&month=${selectedMonth}`"
                >
                  Detail
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template #footer>
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p class="text-sm text-muted">
            {{ metrics.benchStaff }} bench staff
            <span v-if="benchRows.length">
              : {{ benchRows.map((item) => item.name).join(", ") }}
            </span>
          </p>

          <p class="text-sm text-muted">
            Average assigned load:
            {{ metrics.averageAssigned.toFixed(1) }}
          </p>
        </div>
      </template>
    </UCard>
  </div>
</template>
