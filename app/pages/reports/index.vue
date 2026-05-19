<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const now = new Date();

const selectedYear = ref(now.getFullYear());
const selectedMonth = ref(now.getMonth() + 1);

const reportUrl = computed(() => {
  return `/api/reports/crew-monthly?year=${selectedYear.value}&month=${selectedMonth.value}`;
});

const { data, pending, error, refresh } = await useFetch(reportUrl);

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const years = computed(() => {
  const currentYear = now.getFullYear();

  return [currentYear - 1, currentYear, currentYear + 1];
});

async function handleFilter() {
  await refresh();
}
</script>

<template>
  <section>
    <h1>Reports</h1>
    <p>Monthly crew performance report.</p>

    <hr />

    <form @submit.prevent="handleFilter">
      <div>
        <label>Month</label>
        <br />
        <select v-model="selectedMonth">
          <option
            v-for="month in months"
            :key="month.value"
            :value="month.value"
          >
            {{ month.label }}
          </option>
        </select>
      </div>

      <br />

      <div>
        <label>Year</label>
        <br />
        <select v-model="selectedYear">
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>

      <br />

      <button type="submit">Apply Filter</button>
    </form>

    <hr />

    <p v-if="pending">Loading report...</p>
    <p v-else-if="error">Failed to load report.</p>

    <table v-else border="1" cellpadding="8" cellspacing="0">
      <thead>
        <tr>
          <th>Staff</th>
          <th>Default Role</th>
          <th>Total Assigned</th>
          <th>Total Evaluated</th>
          <th>Success</th>
          <th>Failed</th>
          <th>PIC Count</th>
          <th>Success Rate</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item in data?.data" :key="item.staffId">
          <td>{{ item.name }}</td>
          <td>{{ item.defaultRole }}</td>
          <td>{{ item.totalAssigned }}</td>
          <td>{{ item.totalEvaluated }}</td>
          <td>{{ item.totalSuccess }}</td>
          <td>{{ item.totalFailed }}</td>
          <td>{{ item.totalPic }}</td>
          <td>{{ item.successRate }}%</td>
        </tr>
      </tbody>
    </table>

    <p v-if="data?.data?.length === 0">No report data.</p>
  </section>
</template>