<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const { data, pending, error, refresh } = await useFetch("/api/dashboard/summary");

const summary = computed(() => {
  return data.value?.data || {
    totalEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    pendingEvaluationEvents: 0,
    activeStaff: 0,
    activeSales: 0,
    eventsNeedAssignment: 0,
    eventsWithoutAssignment: [],
    recentEvents: [],
  };
});
</script>

<template>
  <section>
    <h1>Dashboard</h1>
    <p>Operational summary from database.</p>

    <button type="button" @click="refresh">Refresh</button>

    <hr />

    <p v-if="pending">Loading dashboard...</p>
    <p v-else-if="error">Failed to load dashboard summary.</p>

    <div v-else>
      <h2>Summary</h2>

      <table border="1" cellpadding="8" cellspacing="0">
        <tbody>
          <tr>
            <td>Total Events</td>
            <td>{{ summary.totalEvents }}</td>
          </tr>
          <tr>
            <td>Upcoming Events</td>
            <td>{{ summary.upcomingEvents }}</td>
          </tr>
          <tr>
            <td>Completed Events</td>
            <td>{{ summary.completedEvents }}</td>
          </tr>
          <tr>
            <td>Pending Evaluation</td>
            <td>{{ summary.pendingEvaluationEvents }}</td>
          </tr>
          <tr>
            <td>Active Staff</td>
            <td>{{ summary.activeStaff }}</td>
          </tr>
          <tr>
            <td>Active Sales</td>
            <td>{{ summary.activeSales }}</td>
          </tr>
          <tr>
            <td>Events Need Assignment</td>
            <td>{{ summary.eventsNeedAssignment }}</td>
          </tr>
        </tbody>
      </table>

      <hr />

      <h2>Events Need Assignment</h2>

      <p v-if="summary.eventsWithoutAssignment.length === 0">
        No events need assignment.
      </p>

      <table
        v-else
        border="1"
        cellpadding="8"
        cellspacing="0"
      >
        <thead>
          <tr>
            <th>Event</th>
            <th>Client</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="event in summary.eventsWithoutAssignment"
            :key="event.id"
          >
            <td>{{ event.eventName }}</td>
            <td>{{ event.clientName }}</td>
            <td>{{ new Date(event.eventDate).toLocaleDateString() }}</td>
            <td>{{ event.status }}</td>
            <td>
              <NuxtLink :to="`/events/${event.id}`">Assign Staff</NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>

      <hr />

      <h2>Recent Events</h2>

      <p v-if="summary.recentEvents.length === 0">
        No recent events.
      </p>

      <table
        v-else
        border="1"
        cellpadding="8"
        cellspacing="0"
      >
        <thead>
          <tr>
            <th>Event</th>
            <th>Client</th>
            <th>Service</th>
            <th>Sales</th>
            <th>Date</th>
            <th>Status</th>
            <th>Assigned Staff</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="event in summary.recentEvents"
            :key="event.id"
          >
            <td>{{ event.eventName }}</td>
            <td>{{ event.clientName }}</td>
            <td>{{ event.serviceType?.name || "-" }}</td>
            <td>{{ event.sales?.name || "-" }}</td>
            <td>{{ new Date(event.eventDate).toLocaleDateString() }}</td>
            <td>{{ event.status }}</td>
            <td>{{ event.assignments?.length || 0 }}</td>
            <td>
              <NuxtLink :to="`/events/${event.id}`">Detail</NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>