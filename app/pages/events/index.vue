<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const eventName = ref("");
const clientName = ref("");
const clientPhone = ref("");
const serviceTypeId = ref("");
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
const notes = ref("");

const isSubmitting = ref(false);
const errorMessage = ref("");

const {
  data: eventsData,
  pending,
  error,
  refresh,
} = await useFetch("/api/events");
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
        notes: notes.value,
      },
    });

    eventName.value = "";
    clientName.value = "";
    clientPhone.value = "";
    serviceTypeId.value = "";
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

    <h2>Event List</h2>

    <p v-if="pending">Loading...</p>
    <p v-else-if="error">Failed to load events.</p>

    <table v-else border="1" cellpadding="8" cellspacing="0">
      <thead>
        <tr>
          <th>Event</th>
          <th>Client</th>
          <th>Service</th>
          <th>Sales</th>
          <th>Date</th>
          <th>Time</th>
          <th>Loading</th>
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
          <td>{{ item.status }}</td>
          <td>{{ item.location || "-" }}</td>
          <td>
            <NuxtLink :to="`/events/${item.id}`">Detail</NuxtLink>
            |
            <button @click="handleDelete(item.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="eventsData?.data?.length === 0">No events yet.</p>
  </section>
</template>
