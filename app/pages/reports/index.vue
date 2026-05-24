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

const leaderboards = computed(() => [
  {
    title: "Top 5 PIC",
    role: "PIC",
    rows: getLeaderboardRows("PIC"),
  },
  {
    title: "Top 5 Senior Crew",
    role: "SENIOR_CREW",
    rows: getLeaderboardRows("SENIOR_CREW"),
  },
  {
    title: "Top 5 Junior Crew",
    role: "JUNIOR_CREW",
    rows: getLeaderboardRows("JUNIOR_CREW"),
  },
]);

const metrics = computed(() => {
  const assignedRows = rows.value.filter((item) => item.totalAssigned > 0);
  const totalAssignments = assignedRows.reduce((total, item) => {
    return total + item.totalAssigned;
  }, 0);

  return {
    averageAssigned: assignedRows.length
      ? totalAssignments / assignedRows.length
      : 0,
    benchStaff: rows.value.length - assignedRows.length,
  };
});

const benchRows = computed(() => {
  return rows.value.filter((item) => item.totalAssigned === 0).slice(0, 5);
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

function getRankColor(rank) {
  if (rank === 1) return "warning";
  if (rank === 2) return "neutral";
  if (rank === 3) return "primary";
  return "neutral";
}

function getLeaderboardRows(role) {
  return rows.value
    .filter((item) => {
      return item.defaultRole === role && item.totalAssigned > 0;
    })
    .map((item) => ({
      ...item,
      score: getLeaderboardScore(item),
    }))
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.successRate !== b.successRate) return b.successRate - a.successRate;
      if (a.totalSuccess !== b.totalSuccess) return b.totalSuccess - a.totalSuccess;
      return b.totalAssigned - a.totalAssigned;
    })
    .slice(0, 5);
}

function getLeaderboardScore(item) {
  const evaluationGap = Math.max(item.totalAssigned - item.totalEvaluated, 0);
  const picBonus = item.defaultRole === "PIC" ? item.totalPic * 4 : item.totalPic * 2;

  return (
    item.successRate +
    item.totalSuccess * 6 +
    item.totalAssigned * 3 +
    picBonus -
    item.totalFailed * 10 -
    evaluationGap * 4
  );
}

function formatScore(score) {
  return Math.max(Math.round(score), 0);
}

function getLeaderboardSubtitle(role) {
  if (role === "PIC") return "Ranked by success, PIC load, and completed evaluations.";

  return "Ranked by success, assignment load, and evaluation quality.";
}

function getLoadColor(item) {
  if (item.totalAssigned === 0) return "neutral";
  if (
    metrics.value.averageAssigned &&
    item.totalAssigned >= metrics.value.averageAssigned * 1.5
  ) {
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
      </form>
    </UCard>
    <UCard>
      <template #header>
        <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-lg font-semibold">Monthly Staff Leaderboard</h2>
            <p class="text-sm text-muted">
              Top performers by role for schedule maker reference.
            </p>
          </div>

          <UBadge color="neutral" variant="soft">
            {{ periodLabel }}
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

      <div v-else class="grid gap-4 xl:grid-cols-3">
        <section
          v-for="board in leaderboards"
          :key="board.role"
          class="rounded-md border border-default"
        >
          <div class="border-b border-default p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h3 class="font-semibold">{{ board.title }}</h3>
                <p class="mt-1 text-xs text-muted">
                  {{ getLeaderboardSubtitle(board.role) }}
                </p>
              </div>

              <UBadge color="neutral" variant="soft">
                {{ board.rows.length }} / 5
              </UBadge>
            </div>
          </div>

          <div class="divide-y divide-default">
            <p
              v-if="board.rows.length === 0"
              class="p-4 text-sm text-muted"
            >
              No assigned {{ board.title.replace("Top 5 ", "") }} data.
            </p>

            <div
              v-for="(item, index) in board.rows"
              :key="item.staffId"
              class="p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex min-w-0 items-start gap-3">
                  <UBadge
                    :color="getRankColor(index + 1)"
                    variant="soft"
                    class="mt-0.5"
                  >
                    #{{ index + 1 }}
                  </UBadge>

                  <div class="min-w-0">
                    <p class="truncate font-medium">{{ item.name }}</p>
                    <p class="mt-1 text-xs text-muted">
                      {{ item.totalAssigned }} assigned,
                      {{ item.totalEvaluated }} evaluated,
                      {{ item.totalPic }} PIC
                    </p>
                  </div>
                </div>

                <UBadge
                  :color="getSuccessColor(item.successRate, item.totalEvaluated)"
                  variant="soft"
                >
                  {{ item.successRate }}%
                </UBadge>
              </div>

              <div class="mt-4 grid grid-cols-4 gap-2 text-sm">
                <div>
                  <p class="text-xs text-muted">Score</p>
                  <p class="font-semibold">{{ formatScore(item.score) }}</p>
                </div>

                <div>
                  <p class="text-xs text-muted">Success</p>
                  <p class="font-semibold">{{ item.totalSuccess }}</p>
                </div>

                <div>
                  <p class="text-xs text-muted">Failed</p>
                  <p class="font-semibold">{{ item.totalFailed }}</p>
                </div>

                <div class="flex items-end justify-end">
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-eye"
                    :to="`/reports/staff/${item.staffId}?year=${selectedYear}&month=${selectedMonth}`"
                  >
                    Detail
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </UCard>

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
    </UCard>
  </div>
</template>
