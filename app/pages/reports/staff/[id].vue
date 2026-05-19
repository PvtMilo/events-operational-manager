<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const route = useRoute();

const staffId = route.params.id;
const year = route.query.year || new Date().getFullYear();
const month = route.query.month || new Date().getMonth() + 1;

const reportUrl = computed(() => {
  return `/api/reports/staff/${staffId}?year=${year}&month=${month}`;
});

const { data, pending, error, refresh } = await useFetch(reportUrl);

const report = computed(() => {
  return data.value?.data || null;
});

function formatBoolean(value) {
  if (value === true) return "OK";
  if (value === false) return "NOT OK";
  return "NOT EVALUATED";
}
</script>

<template>
  <section>
    <p>
      <NuxtLink :to="`/reports?year=${year}&month=${month}`">
        ← Back to Reports
      </NuxtLink>
    </p>

    <h1>Staff Report Detail</h1>

    <button type="button" @click="refresh">Refresh</button>

    <p v-if="pending">Loading report detail...</p>
    <p v-else-if="error">Failed to load report detail.</p>

    <div v-else-if="report">
      <h2>{{ report.staff.name }}</h2>
      <p>Default Role: {{ report.staff.defaultRole }}</p>
      <p>Period: {{ month }}/{{ year }}</p>

      <hr />

      <h2>Summary</h2>

      <table border="1" cellpadding="8" cellspacing="0">
        <tbody>
          <tr>
            <td>Total Assigned</td>
            <td>{{ report.summary.totalAssigned }}</td>
          </tr>
          <tr>
            <td>Total PIC</td>
            <td>{{ report.summary.totalPic }}</td>
          </tr>
          <tr>
            <td>Total Evaluated</td>
            <td>{{ report.summary.totalEvaluated }}</td>
          </tr>
          <tr>
            <td>Total Success</td>
            <td>{{ report.summary.totalSuccess }}</td>
          </tr>
          <tr>
            <td>Total Failed</td>
            <td>{{ report.summary.totalFailed }}</td>
          </tr>
          <tr>
            <td>Success Rate</td>
            <td>{{ report.summary.successRate }}%</td>
          </tr>
        </tbody>
      </table>

      <hr />

      <h2>Event List</h2>

      <p v-if="report.events.length === 0">
        No active assignment for this staff in this period.
      </p>

      <table v-else border="1" cellpadding="8" cellspacing="0">
        <thead>
          <tr>
            <th>Event</th>
            <th>Client</th>
            <th>Service</th>
            <th>Date</th>
            <th>Time</th>
            <th>Role</th>
            <th>Assignment Status</th>
            <th>Event Status</th>
            <th>Client Satisfaction</th>
            <th>SOP</th>
            <th>Warehouse</th>
            <th>Grooming</th>
            <th>Data Collection</th>
            <th>Success</th>
            <th>Detail</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="item in report.events" :key="item.assignmentId">
            <td>{{ item.eventName }}</td>
            <td>{{ item.clientName }}</td>
            <td>{{ item.serviceTypeName || "-" }}</td>
            <td>{{ new Date(item.eventDate).toLocaleDateString() }}</td>
            <td>{{ item.startTime }} - {{ item.endTime }}</td>
            <td>{{ item.roleInEvent }}</td>
            <td>{{ item.assignmentStatus }}</td>
            <td>{{ item.eventStatus }}</td>
            <td>{{ formatBoolean(item.clientSatisfactionOk) }}</td>
            <td>{{ formatBoolean(item.sopOk) }}</td>
            <td>{{ formatBoolean(item.warehouseOk) }}</td>
            <td>{{ formatBoolean(item.groomingOk) }}</td>
            <td>{{ formatBoolean(item.dataCollectionOk) }}</td>
            <td>
              <strong>
                {{ item.isSuccess === true ? "SUCCESS" : "NOT SUCCESS / NOT EVALUATED" }}
              </strong>
            </td>
            <td>
              <NuxtLink :to="`/events/${item.eventId}`">
                Event Detail
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
