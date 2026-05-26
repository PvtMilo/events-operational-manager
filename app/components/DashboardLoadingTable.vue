<script setup>
defineProps({
  rows: {
    type: Array,
    required: true,
  },
  formatDate: {
    type: Function,
    required: true,
  },
  formatEventTime: {
    type: Function,
    required: true,
  },
  getDueColor: {
    type: Function,
    required: true,
  },
  getLoadingStatusColor: {
    type: Function,
    required: true,
  },
  getLoadingStatusLabel: {
    type: Function,
    required: true,
  },
});
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-default">
    <table class="min-w-full text-left text-sm">
      <thead>
        <tr class="border-b border-default bg-muted/30 text-xs uppercase text-muted">
          <th class="whitespace-nowrap px-3 py-3">
            Due
          </th>
          <th class="whitespace-nowrap px-3 py-3">
            Loading Date
          </th>
          <th class="whitespace-nowrap px-3 py-3">
            Loading Time
          </th>
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
            Event Date
          </th>
          <th class="whitespace-nowrap px-3 py-3">
            Event Time
          </th>
          <th class="whitespace-nowrap px-3 py-3">
            Staff
          </th>
          <th class="whitespace-nowrap px-3 py-3">
            Location
          </th>
          <th class="whitespace-nowrap px-3 py-3">
            Loading Status
          </th>
          <th class="whitespace-nowrap px-3 py-3">
            Action
          </th>
        </tr>
      </thead>

      <tbody class="divide-y divide-default">
        <tr
          v-for="row in rows"
          :key="row.id"
          class="align-top"
        >
          <td class="whitespace-nowrap px-3 py-3">
            <div class="flex flex-col gap-1">
              <UBadge
                :color="getDueColor(row.dueLabel)"
                variant="soft"
              >
                {{ row.dueLabel }}
              </UBadge>

              <span class="text-xs text-muted">
                {{ row.eventLeadLabel }}
              </span>
            </div>
          </td>

          <td class="whitespace-nowrap px-3 py-3">
            {{ formatDate(row.loadingDate) }}
          </td>

          <td class="whitespace-nowrap px-3 py-3">
            {{ row.loadingTime || "-" }}
          </td>

          <td class=" px-3 py-3">
            <p class="font-medium">
              {{ row.eventName }}
            </p>

            <p class="text-xs text-muted">
              {{ row.equipmentSetup || "-" }}
            </p>
          </td>

          <td class="px-3 py-3">
            <p>{{ row.clientName }}</p>

            <p class="text-xs text-muted">
              {{ row.clientPhone || "-" }}
            </p>
          </td>

          <td class="min-w-40 px-3 py-3">
            {{ row.serviceTypeName }}
          </td>

          <td class="whitespace-nowrap px-3 py-3">
            {{ formatDate(row.eventDate) }}
          </td>

          <td class="whitespace-nowrap px-3 py-3">
            {{ formatEventTime(row) }}
          </td>

          <td class="min-w-56 px-3 py-3">
            {{ row.staff }}
          </td>

          <td class="min-w-38 px-3 py-3">
            {{ row.location }}
          </td>

          <td class="whitespace-nowrap px-3 py-3">
            <UBadge
              :color="getLoadingStatusColor(row.loadingStatus)"
              variant="soft"
            >
              {{ getLoadingStatusLabel(row.loadingStatus) }}
            </UBadge>
          </td>

          <td class="whitespace-nowrap px-3 py-3">
            <UButton
              size="xs"
              color="primary"
              variant="soft"
              :to="`/events/${row.id}`"
            >
              Detail
            </UButton>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
