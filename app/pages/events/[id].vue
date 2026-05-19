<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const route = useRoute();
const eventId = route.params.id;

const staffId = ref("");
const roleInEvent = ref("CREW");
const assignmentNotes = ref("");

const isSubmitting = ref(false);
const errorMessage = ref("");

const {
  data: eventData,
  pending,
  error,
  refresh,
} = await useFetch(`/api/events/${eventId}`);

const { data: availabilityData, refresh: refreshAvailability } = await useFetch(
  `/api/events/${eventId}/staff-availability`,
);

const assignableStaff = computed(() => {
  const assignedStaffIds =
    eventData.value?.data?.assignments?.map(
      (assignment) => assignment.staffId,
    ) || [];

  return (
    availabilityData.value?.data?.filter((staff) => {
      return !assignedStaffIds.includes(staff.id);
    }) || []
  );
});

async function handleAssignStaff() {
  errorMessage.value = "";

  if (!staffId.value) {
    errorMessage.value = "Staff is required";
    return;
  }

  isSubmitting.value = true;

  try {
    await $fetch(`/api/events/${eventId}/assignments`, {
      method: "POST",
      body: {
        staffId: staffId.value,
        roleInEvent: roleInEvent.value,
        notes: assignmentNotes.value,
      },
    });

    staffId.value = "";
    roleInEvent.value = "CREW";
    assignmentNotes.value = "";

    await refresh();
    await refreshAvailability();
  } catch (error) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to assign staff";
  } finally {
    isSubmitting.value = false;
  }
}

async function handleDeleteAssignment(assignmentId) {
  const confirmed = confirm("Remove this staff from event?");

  if (!confirmed) return;

  try {
    await $fetch(`/api/event-assignments/${assignmentId}`, {
      method: "DELETE",
    });

    await refresh();
    await refreshAvailability();
  } catch (error) {
    alert(
      error?.data?.statusMessage ||
        error?.statusMessage ||
        "Failed to remove assignment",
    );
  }
}
</script>

<template>
  <section>
    <p>
      <NuxtLink to="/events">← Back to Events</NuxtLink>
    </p>

    <p v-if="pending">Loading...</p>
    <p v-else-if="error">Failed to load event detail.</p>

    <div v-else>
      <h1>{{ eventData?.data?.eventName }}</h1>
      <p>Client: {{ eventData?.data?.clientName }}</p>
      <p>Service: {{ eventData?.data?.serviceType?.name || "-" }}</p>
      <p>Equipment Setup: {{ eventData?.data?.equipmentSetup }}</p>
      <p>Sales: {{ eventData?.data?.sales?.name || "-" }}</p>
      <p>
        Date:
        {{ new Date(eventData?.data?.eventDate).toLocaleDateString() }}
      </p>
      <p>
        Time: {{ eventData?.data?.startTime }} - {{ eventData?.data?.endTime }}
      </p>
      <p>Status: {{ eventData?.data?.status }}</p>
      <p>Location: {{ eventData?.data?.location || "-" }}</p>

      <hr />

      <h2>Assign Staff</h2>

      <form @submit.prevent="handleAssignStaff">
        <div>
          <label>Staff</label>
          <br />
          <select v-model="staffId">
            <option value="">Select staff</option>
            <option
              v-for="staff in assignableStaff"
              :key="staff.id"
              :value="staff.id"
              :disabled="staff.availabilityStatus === 'TIME_CONFLICT'"
            >
              {{ staff.name }} - {{ staff.defaultRole }} -
              {{ staff.availabilityStatus }} -
              {{ staff.monthlyEventCount }} event bulan ini
            </option>
          </select>
          <p>
            AVAILABLE = belum ada event bentrok. SAME_DAY_AVAILABLE = ada event
            lain di hari yang sama tapi tidak bentrok waktu. TIME_CONFLICT =
            tidak bisa dipilih.
          </p>
          <h3>Staff Recommendation</h3>

          <table border="1" cellpadding="8" cellspacing="0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Default Role</th>
                <th>Availability</th>
                <th>Monthly Event Count</th>
                <th>Monthly PIC Count</th>
                <th>Recommendation</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="staff in assignableStaff" :key="staff.id">
                <td>{{ staff.name }}</td>
                <td>{{ staff.defaultRole }}</td>
                <td>{{ staff.availabilityStatus }}</td>
                <td>{{ staff.monthlyEventCount }}</td>
                <td>{{ staff.monthlyPicCount }}</td>
                <td>
                  <span v-if="staff.availabilityStatus === 'TIME_CONFLICT'">
                    Not recommended
                  </span>
                  <span v-else-if="staff.monthlyEventCount === 0">
                    Highly recommended
                  </span>
                  <span v-else> Recommended </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <br />

        <div>
          <label>Role in Event</label>
          <br />
          <select v-model="roleInEvent">
            <option value="PIC">PIC</option>
            <option value="CREW">CREW</option>
          </select>
        </div>

        <br />

        <div>
          <label>Notes</label>
          <br />
          <textarea
            v-model="assignmentNotes"
            placeholder="Optional assignment notes"
          ></textarea>
        </div>

        <br />

        <p v-if="errorMessage" style="color: red">
          {{ errorMessage }}
        </p>

        <button type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? "Assigning..." : "Assign Staff" }}
        </button>
      </form>

      <hr />

      <h2>Assigned Team</h2>

      <p v-if="eventData?.data?.assignments?.length === 0">
        No staff assigned yet.
      </p>

      <table v-else border="1" cellpadding="8" cellspacing="0">
        <thead>
          <tr>
            <th>Name</th>
            <th>Default Role</th>
            <th>Role in Event</th>
            <th>Status</th>
            <th>Notes</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="assignment in eventData?.data?.assignments"
            :key="assignment.id"
          >
            <td>{{ assignment.staff?.name }}</td>
            <td>{{ assignment.staff?.defaultRole }}</td>
            <td>{{ assignment.roleInEvent }}</td>
            <td>{{ assignment.assignmentStatus }}</td>
            <td>{{ assignment.notes || "-" }}</td>
            <td>
              <button
                type="button"
                @click="handleDeleteAssignment(assignment.id)"
              >
                Remove
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
