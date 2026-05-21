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
    eventsNeedAssignment: 0,
    eventsWithoutAssignment: [],
    recentEvents: [],
  };
});

const summaryCards = computed(() => [
  {
    label: "Total Events",
    value: summary.value.totalEvents,
    description: "This month, excluding cancelled",
  },
  {
    label: "Upcoming Events",
    value: summary.value.upcomingEvents,
    description: "Active upcoming events",
  },
  {
    label: "Completed Events",
    value: summary.value.completedEvents,
    description: "Finished this month",
  },
  {
    label: "Pending Evaluation",
    value: summary.value.pendingEvaluationEvents,
    description: "Need evaluation",
  },
  {
    label: "Need Assignment",
    value: summary.value.eventsNeedAssignment,
    description: "No active crew assigned",
  },
]);

function formatDate(dateValue) {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleDateString();
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">
          Dashboard
        </h1>
        <p class="text-sm text-muted">
          Operational summary for this month.
        </p>
      </div>

      <!-- <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" @click="refresh">
        Refresh
      </UButton> -->
    </div>

    <UCard v-if="pending">
      Loading dashboard...
    </UCard>

    <UCard v-else-if="error">
      <p class="text-red-500">
        Failed to load dashboard summary.
      </p>
    </UCard>

    <div v-else class="space-y-6">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <UCard v-for="card in summaryCards" :key="card.label">
          <p class="text-sm text-muted">
            {{ card.label }}
          </p>

          <p class="mt-2 text-3xl font-semibold">
            {{ card.value }}
          </p>

          <p class="mt-1 text-xs text-muted">
            {{ card.description }}
          </p>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">
                Events Need Assignment
              </h2>
              <p class="text-sm text-muted">
                Events this month without active PIC/crew.
              </p>
            </div>

            <UBadge color="warning" variant="soft">
              {{ summary.eventsNeedAssignment }} events
            </UBadge>
          </div>
        </template>

        <p v-if="summary.eventsWithoutAssignment.length === 0" class="text-sm text-muted">
          No events need assignment.
        </p>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-default text-left">
                <th class="py-2 pr-4">Event</th>
                <th class="py-2 pr-4">Client</th>
                <th class="py-2 pr-4">Date</th>
                <th class="py-2 pr-4">Status</th>
                <th class="py-2 pr-4">Action</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="event in summary.eventsWithoutAssignment" :key="event.id" class="border-b border-default">
                <td class="py-2 pr-4">
                  {{ event.eventName }}
                </td>
                <td class="py-2 pr-4">
                  {{ event.clientName }}
                </td>
                <td class="py-2 pr-4">
                  {{ formatDate(event.eventDate) }}
                </td>
                <td class="py-2 pr-4">
                  <UBadge color="neutral" variant="soft">
                    {{ event.status }}
                  </UBadge>
                </td>
                <td class="py-2 pr-4">
                  <UButton size="xs" color="primary" variant="soft" :to="`/events/${event.id}`">
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
          <div>
            <h2 class="text-lg font-semibold">
              Recent Events
            </h2>
            <p class="text-sm text-muted">
              Latest events created this month.
            </p>
          </div>
        </template>

        <p v-if="summary.recentEvents.length === 0" class="text-sm text-muted">
          No recent events.
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
                <th class="py-2 pr-4">Status</th>
                <th class="py-2 pr-4">Staff</th>
                <th class="py-2 pr-4">Action</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="event in summary.recentEvents" :key="event.id" class="border-b border-default">
                <td class="py-2 pr-4">
                  {{ event.eventName }}
                </td>
                <td class="py-2 pr-4">
                  {{ event.clientName }}
                </td>
                <td class="py-2 pr-4">
                  {{ event.serviceType?.name || "-" }}
                </td>
                <td class="py-2 pr-4">
                  {{ event.sales?.name || "-" }}
                </td>
                <td class="py-2 pr-4">
                  {{ formatDate(event.eventDate) }}
                </td>
                <td class="py-2 pr-4">
                  <UBadge color="neutral" variant="soft">
                    {{ event.status }}
                  </UBadge>
                </td>
                <td class="py-2 pr-4">
                  {{
                    event.assignments?.length
                      ? event.assignments
                        .map((assignment) => assignment.staff?.name)
                        .filter(Boolean)
                        .join(", ")
                      : "-"
                  }}
                </td>
                <td class="py-2 pr-4">
                  <UButton size="xs" color="primary" variant="soft" :to="`/events/${event.id}`">
                    Detail
                  </UButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>
  </div>
</template>