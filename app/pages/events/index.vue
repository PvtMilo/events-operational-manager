<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const { user } = useUserSession();

const eventName = ref("");
const clientName = ref("");
const clientPhone = ref("");
const serviceTypeId = ref("");
const equipmentSetup = ref("");
const salesId = ref("");
const eventDate = ref("");
const startTime = ref("");
const endTime = ref("");
const loadingDate = ref("");
const loadingTime = ref("");
const location = ref("");
const status = ref("DRAFTED");
const vehicleName = ref("");
const driverName = ref("");
const vendorSewa = ref("");
const notes = ref("");

const isSubmitting = ref(false);
const errorMessage = ref("");

const page = ref(1);

const search = ref("");
const filterStatus = ref("");
const filterServiceTypeId = ref("");
const filterYear = ref("");
const filterMonth = ref("");

const eventUrl = computed(() => {
  const params = new URLSearchParams();

  if (search.value) params.set("search", search.value);
  if (filterStatus.value) params.set("status", filterStatus.value);
  if (filterServiceTypeId.value) {
    params.set("serviceTypeId", filterServiceTypeId.value);
  }
  if (filterYear.value) params.set("year", filterYear.value);
  if (filterMonth.value) params.set("month", filterMonth.value);

  params.set("page", page.value);

  const queryString = params.toString();

  return queryString ? `/api/events?${queryString}` : "/api/events";
});

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

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];

async function handleApplyFilter() {
  page.value = 1;
  await refresh();
}

async function handleResetFilter() {
  search.value = "";
  filterStatus.value = "";
  filterServiceTypeId.value = "";
  filterYear.value = "";
  filterMonth.value = "";
  page.value = 1;

  await refresh();
}

function handleExportEvents() {
  const params = new URLSearchParams();

  if (search.value) params.set("search", search.value);
  if (filterStatus.value) params.set("status", filterStatus.value);
  if (filterServiceTypeId.value) {
    params.set("serviceTypeId", filterServiceTypeId.value);
  }
  if (filterYear.value) params.set("year", filterYear.value);
  if (filterMonth.value) params.set("month", filterMonth.value);

  const queryString = params.toString();

  const url = queryString
    ? `/api/events/export?${queryString}`
    : "/api/events/export";

  window.open(url, "_blank");
}

async function goToPreviousPage() {
  if (page.value <= 1) return;

  page.value -= 1;
  await refresh();
}

async function goToNextPage() {
  if (page.value >= eventsData.value?.pagination?.totalPages) return;

  page.value += 1;
  await refresh();
}

const {
  data: eventsData,
  pending,
  error,
  refresh,
} = await useFetch(eventUrl);
const { data: serviceTypesData } = await useFetch("/api/service-types");
const { data: salesData } = await useFetch("/api/sales");

async function handleCreate() {
  errorMessage.value = "";

  if (!eventName.value.trim()) {
    errorMessage.value = "Event name is required";
    return;
  }

  if (!clientName.value.trim()) {
    errorMessage.value = "Client name is required";
    return;
  }

  if (!serviceTypeId.value) {
    errorMessage.value = "Service type is required";
    return;
  }

  if (!equipmentSetup.value.trim()) {
    errorMessage.value = "Equipment setup is required";
    return;
  }

  if (!eventDate.value || !startTime.value || !endTime.value) {
    errorMessage.value = "Event date, start time, and end time are required";
    return;
  }

  isSubmitting.value = true;

  try {
    await $fetch("/api/events", {
      method: "POST",
      body: {
        eventName: eventName.value,
        clientName: clientName.value,
        clientPhone: clientPhone.value,
        serviceTypeId: serviceTypeId.value,
        equipmentSetup: equipmentSetup.value,
        salesId: salesId.value || null,
        eventDate: eventDate.value,
        startTime: startTime.value,
        endTime: endTime.value,
        loadingDate: loadingDate.value || null,
        loadingTime: loadingTime.value || null,
        location: location.value,
        status: status.value,
        vehicleName: vehicleName.value,
        driverName: driverName.value,
        vendorSewa: vendorSewa.value,
        notes: notes.value,
      },
    });

    eventName.value = "";
    clientName.value = "";
    clientPhone.value = "";
    serviceTypeId.value = "";
    equipmentSetup.value = "";
    salesId.value = "";
    eventDate.value = "";
    startTime.value = "";
    endTime.value = "";
    loadingDate.value = "";
    loadingTime.value = "";
    location.value = "";
    status.value = "DRAFTED";
    vehicleName.value = "";
    driverName.value = "";
    vendorSewa.value = "";
    notes.value = "";

    await refresh();
  } catch (error) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to create event";
  } finally {
    isSubmitting.value = false;
  }
}

async function handleDelete(id) {
  const confirmed = confirm("Delete this event?");

  if (!confirmed) return;

  try {
    await $fetch(`/api/events/${id}`, {
      method: "DELETE",
    });

    await refresh();
  } catch (error) {
    alert(
      error?.data?.statusMessage ||
        error?.statusMessage ||
        "Failed to delete event",
    );
  }
}

async function handleHardDeleteEvent(id) {
  const confirmed = confirm(
    "HARD DELETE this event? This action cannot be undone.",
  );

  if (!confirmed) return;

  try {
    await $fetch(`/api/developer/events/${id}`, {
      method: "DELETE",
    });

    await refresh();
  } catch (error) {
    alert(
      error?.data?.statusMessage ||
        error?.statusMessage ||
        "Failed to hard delete event",
    );
  }
}
</script>

<template>
  <section>
    <h1>Events</h1>
    <p>Manage event records.</p>

    <hr />

    <form @submit.prevent="handleCreate">
      <h2>Add Event</h2>

      <div>
        <label>Event Name</label>
        <br />
        <input
          v-model="eventName"
          type="text"
          placeholder="Example: Friskies CFD"
        />
      </div>

      <br />

      <div>
        <label>Client Name</label>
        <br />
        <input
          v-model="clientName"
          type="text"
          placeholder="Example: Friskies"
        />
      </div>

      <br />

      <div>
        <label>Client Phone</label>
        <br />
        <input v-model="clientPhone" type="text" placeholder="Optional" />
      </div>

      <br />

      <div>
        <label>Service Type</label>
        <br />
        <select v-model="serviceTypeId">
          <option value="">Select service type</option>
          <option
            v-for="item in serviceTypesData?.data"
            :key="item.id"
            :value="item.id"
          >
            {{ item.name }}
          </option>
        </select>
      </div>

      <br />

      <div>
        <label>Equipment Setup</label>
        <br />
        <textarea
          v-model="equipmentSetup"
          placeholder="Example: 1 photobooth, 1 printer, 2 lighting"
        ></textarea>
      </div>

      <br />

      <div>
        <label>Sales</label>
        <br />
        <select v-model="salesId">
          <option value="">No sales / optional</option>
          <option
            v-for="item in salesData?.data"
            :key="item.id"
            :value="item.id"
          >
            {{ item.name }}
          </option>
        </select>
      </div>

      <br />

      <div>
        <label>Event Date</label>
        <br />
        <input v-model="eventDate" type="date" />
      </div>

      <br />

      <div>
        <label>Start Time</label>
        <br />
        <input v-model="startTime" type="time" />
      </div>

      <br />

      <div>
        <label>End Time</label>
        <br />
        <input v-model="endTime" type="time" />
      </div>

      <br />

      <div>
        <label>Loading Date</label>
        <br />
        <input v-model="loadingDate" type="date" />
      </div>

      <br />

      <div>
        <label>Loading Time</label>
        <br />
        <input v-model="loadingTime" type="time" />
      </div>

      <br />

      <div>
        <label>Location</label>
        <br />
        <input v-model="location" type="text" placeholder="Event location" />
      </div>

      <br />

      <div>
        <label>Status</label>
        <br />
        <select v-model="status">
          <option value="DRAFTED">DRAFTED</option>
          <option value="SCHEDULED">SCHEDULED</option>
          <option value="READY">READY</option>
          <option value="ONGOING">ONGOING</option>
          <option value="PENDING_EVALUATION">PENDING_EVALUATION</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      <br />

      <div>
        <label>Vehicle Name</label>
        <br />
        <input v-model="vehicleName" type="text" placeholder="Optional" />
      </div>

      <br />

      <div>
        <label>Driver Name</label>
        <br />
        <input v-model="driverName" type="text" placeholder="Optional" />
      </div>

      <br />

      <div>
        <label>Vendor Sewa</label>
        <br />
        <input
          v-model="vendorSewa"
          type="text"
          placeholder="Optional vendor rental info"
        />
      </div>

      <br />

      <div>
        <label>Notes</label>
        <br />
        <textarea v-model="notes" placeholder="Optional notes"></textarea>
      </div>

      <br />

      <p v-if="errorMessage" style="color: red">
        {{ errorMessage }}
      </p>

      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? "Saving..." : "Save" }}
      </button>
    </form>

    <hr />

    <h2>Filter Events</h2>

    <form @submit.prevent="handleApplyFilter">
      <div>
        <label>Search</label>
        <br />
        <input
          v-model="search"
          type="text"
          placeholder="Search event, client, phone, location, equipment"
        />
      </div>

      <br />

      <div>
        <label>Status</label>
        <br />
        <select v-model="filterStatus">
          <option value="">All Status</option>
          <option value="DRAFTED">DRAFTED</option>
          <option value="SCHEDULED">SCHEDULED</option>
          <option value="READY">READY</option>
          <option value="ONGOING">ONGOING</option>
          <option value="PENDING_EVALUATION">PENDING_EVALUATION</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      <br />

      <div>
        <label>Service Type</label>
        <br />
        <select v-model="filterServiceTypeId">
          <option value="">All Service Types</option>
          <option
            v-for="item in serviceTypesData?.data"
            :key="item.id"
            :value="item.id"
          >
            {{ item.name }}
          </option>
        </select>
      </div>

      <br />

      <div>
        <label>Month</label>
        <br />
        <select v-model="filterMonth">
          <option value="">All Months</option>
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
        <select v-model="filterYear">
          <option value="">All Years</option>
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>

      <br />

      <button type="submit">Apply Filter</button>
      <button type="button" @click="handleResetFilter">Reset</button>
      <button type="button" @click="handleExportEvents">
        Export Event List CSV
      </button>
    </form>

    <hr />

    <h2>Event List</h2>

    <p v-if="pending">Loading...</p>
    <p v-else-if="error">Failed to load events.</p>

    <table v-else border="1" cellpadding="8" cellspacing="0">
      <thead>
        <tr>
          <th>Event</th>
          <th>Client</th>
          <th>Service</th>
          <th>Equipment Setup</th>
          <th>Sales</th>
          <th>Date</th>
          <th>Time</th>
          <th>Loading</th>
          <th>Vendor Sewa</th>
          <th>Status</th>
          <th>Location</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item in eventsData?.data" :key="item.id">
          <td>{{ item.eventName }}</td>
          <td>{{ item.clientName }}</td>
          <td>{{ item.serviceType?.name || "-" }}</td>
          <td>{{ item.equipmentSetup }}</td>
          <td>{{ item.sales?.name || "-" }}</td>
          <td>{{ new Date(item.eventDate).toLocaleDateString() }}</td>
          <td>{{ item.startTime }} - {{ item.endTime }}</td>
          <td>
            <span v-if="item.loadingDate">
              {{ new Date(item.loadingDate).toLocaleDateString() }}
              {{ item.loadingTime || "" }}
            </span>
            <span v-else>-</span>
          </td>
          <td>{{ item.vendorSewa || "-" }}</td>
          <td>{{ item.status }}</td>
          <td>{{ item.location || "-" }}</td>
          <td>
            <NuxtLink :to="`/events/${item.id}`">Detail</NuxtLink>
            |
            <button @click="handleDelete(item.id)">Delete</button>
            <template v-if="user?.role === 'DEVELOPER'">
              |
              <button type="button" @click="handleHardDeleteEvent(item.id)">
                Hard Delete
              </button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="eventsData?.data?.length === 0">No events yet.</p>

    <div v-if="eventsData?.pagination">
      <p>
        Page {{ eventsData.pagination.page }} of
        {{ eventsData.pagination.totalPages }}
        —
        Total {{ eventsData.pagination.totalItems }} events
      </p>

      <button
        type="button"
        :disabled="eventsData.pagination.page <= 1"
        @click="goToPreviousPage"
      >
        Previous
      </button>

      <button
        type="button"
        :disabled="eventsData.pagination.page >= eventsData.pagination.totalPages"
        @click="goToNextPage"
      >
        Next
      </button>
    </div>
  </section>
</template>
