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

function getDateKey(dateValue) {
  if (!dateValue) return "";

  return new Date(dateValue).toISOString().slice(0, 10);
}

function getLoadingDateTime(row) {
  if (!row.loadingDate || !row.loadingTime) return null;

  const dateKey = getDateKey(row.loadingDate);

  return new Date(`${dateKey}T${row.loadingTime}:00`);
}

function formatOverdue(minutesLate) {
  if (minutesLate < 60) {
    return `Terlambat ${minutesLate} menit`;
  }

  const hoursLate = Math.floor(minutesLate / 60);
  const remainingMinutes = minutesLate % 60;

  if (remainingMinutes === 0) {
    return `Terlambat ${hoursLate} jam`;
  }

  return `Terlambat ${hoursLate} jam ${remainingMinutes} menit`;
}

function getLoadingReminder(row) {
  if (row.loadingStatus === "LOADED") {
    return {
      label: "Selesai loading",
      color: "success",
    };
  }

  const loadingDateTime = getLoadingDateTime(row);

  if (!loadingDateTime) {
    return {
      label: "Lengkapi jam loading",
      color: "error",
    };
  }

  const now = new Date();
  const diffMs = loadingDateTime.getTime() - now.getTime();
  const diffMinutes = Math.ceil(diffMs / 60000);

  if (diffMinutes > 1440) {
    const days = Math.ceil(diffMinutes / 1440);

    return {
      label: `${days} hari lagi`,
      color: "neutral",
    };
  }

  if (diffMinutes > 120) {
    const hours = Math.ceil(diffMinutes / 60);

    return {
      label: `${hours} jam lagi`,
      color: "neutral",
    };
  }

  if (diffMinutes > 60) {
    return {
      label: "2 jam lagi",
      color: "primary",
    };
  }

  if (diffMinutes > 30) {
    return {
      label: "1 jam lagi",
      color: "warning",
    };
  }

  if (diffMinutes >= -30) {
    return {
      label: "Loading sekarang",
      color: "error",
    };
  }

  const minutesLate = Math.abs(diffMinutes);

  return {
    label: formatOverdue(minutesLate),
    color: "error",
  };
}
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
            <div class="flex flex-col items-start gap-1">
              <span>
                {{ row.loadingTime || "-" }}
              </span>

              <UBadge
                size="xs"
                :color="getLoadingReminder(row).color"
                variant="soft"
              >
                {{ getLoadingReminder(row).label }}
              </UBadge>
            </div>
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
