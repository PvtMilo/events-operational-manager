<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const route = useRoute();
const eventId = route.params.id;
const { user } = useUserSession();

const staffId = ref("");
const roleInEvent = ref("CREW");
const assignmentNotes = ref("");
const isSubmitting = ref(false);
const errorMessage = ref("");

const clientSatisfactionOk = ref(false);
const clientFeedback = ref("");
const eventEvaluationNotes = ref("");

const staffEvaluationForms = ref({});
const evaluationErrorMessage = ref("");
const isSavingEventEvaluation = ref(false);
const savingStaffEvaluationId = ref("");

const selectedStatus = ref("");
const isUpdatingStatus = ref(false);
const statusErrorMessage = ref("");

const editEventName = ref("");
const editClientName = ref("");
const editClientPhone = ref("");
const editServiceTypeId = ref("");
const editEquipmentSetup = ref("");
const editSalesId = ref("");
const editEventDate = ref("");
const editStartTime = ref("");
const editEndTime = ref("");
const editLoadingDate = ref("");
const editLoadingTime = ref("");
const editLocation = ref("");
const editVehicleName = ref("");
const editDriverName = ref("");
const editVendorSewa = ref("");
const editNotes = ref("");

const isUpdatingEvent = ref(false);
const editEventErrorMessage = ref("");

const postRibbonStart = ref("");
const postRibbonEnd = ref("");
const postEventErrorMessage = ref("");
const isSavingPostEventData = ref(false);

const postRibbonUsed = computed(() => {
  const start = Number(postRibbonStart.value);
  const end = Number(postRibbonEnd.value);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "";
  }

  return start - end;
});

const assignmentForms = ref({});
const savingAssignmentId = ref("");
const assignmentErrorMessage = ref("");

const {
  data: eventData,
  pending,
  error,
  refresh,
} = await useFetch(`/api/events/${eventId}`);

const { data: serviceTypesData } = await useFetch("/api/service-types");
const { data: salesData } = await useFetch("/api/sales");

const { data: availabilityData, refresh: refreshAvailability } = await useFetch(
  `/api/events/${eventId}/staff-availability`,
);

const activeAssignments = computed(() => {
  return (
    eventData.value?.data?.assignments?.filter((assignment) => {
      return ["ASSIGNED", "CONFIRMED"].includes(assignment.assignmentStatus);
    }) || []
  );
});

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

async function handleHardDeleteAssignment(assignmentId) {
  const confirmed = confirm(
    "HARD DELETE this assignment? This action cannot be undone.",
  );

  if (!confirmed) return;

  try {
    await $fetch(`/api/developer/event-assignments/${assignmentId}`, {
      method: "DELETE",
    });

    await refresh();
    await refreshAvailability();
  } catch (error) {
    alert(
      error?.data?.statusMessage ||
        error?.statusMessage ||
        "Failed to hard delete assignment",
    );
  }
}

async function handleSaveEventEvaluation() {
  evaluationErrorMessage.value = "";
  isSavingEventEvaluation.value = true;

  try {
    await $fetch(`/api/events/${eventId}/evaluation`, {
      method: "POST",
      body: {
        clientSatisfactionOk: clientSatisfactionOk.value,
        clientFeedback: clientFeedback.value,
        notes: eventEvaluationNotes.value,
      },
    });

    await refresh();
  } catch (error) {
    evaluationErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to save event evaluation";
  } finally {
    isSavingEventEvaluation.value = false;
  }
}

async function handleSaveStaffEvaluation(staffId) {
  evaluationErrorMessage.value = "";
  savingStaffEvaluationId.value = staffId;

  const form = staffEvaluationForms.value[staffId];

  try {
    await $fetch(`/api/events/${eventId}/staff-evaluations`, {
      method: "POST",
      body: {
        staffId,
        sopOk: form.sopOk,
        warehouseOk: form.warehouseOk,
        groomingOk: form.groomingOk,
        dataCollectionOk: form.dataCollectionOk,
        notes: form.notes,
      },
    });

    await refresh();
  } catch (error) {
    evaluationErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to save staff evaluation";
  } finally {
    savingStaffEvaluationId.value = "";
  }
}

async function handleUpdateStatus() {
  statusErrorMessage.value = "";
  isUpdatingStatus.value = true;

  try {
    await $fetch(`/api/events/${eventId}/status`, {
      method: "PATCH",
      body: {
        status: selectedStatus.value,
      },
    });

    await refresh();
  } catch (error) {
    statusErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to update event status";
  } finally {
    isUpdatingStatus.value = false;
  }
}

async function handleUpdateEvent() {
  editEventErrorMessage.value = "";

  if (!editEventName.value.trim()) {
    editEventErrorMessage.value = "Event name is required";
    return;
  }

  if (!editClientName.value.trim()) {
    editEventErrorMessage.value = "Client name is required";
    return;
  }

  if (!editServiceTypeId.value) {
    editEventErrorMessage.value = "Service type is required";
    return;
  }

  if (!editEquipmentSetup.value.trim()) {
    editEventErrorMessage.value = "Equipment setup is required";
    return;
  }

  if (!editEventDate.value || !editStartTime.value || !editEndTime.value) {
    editEventErrorMessage.value =
      "Event date, start time, and end time are required";
    return;
  }

  isUpdatingEvent.value = true;

  try {
    await $fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      body: {
        eventName: editEventName.value,
        clientName: editClientName.value,
        clientPhone: editClientPhone.value,
        serviceTypeId: editServiceTypeId.value,
        equipmentSetup: editEquipmentSetup.value,
        salesId: editSalesId.value || null,
        eventDate: editEventDate.value,
        startTime: editStartTime.value,
        endTime: editEndTime.value,
        loadingDate: editLoadingDate.value || null,
        loadingTime: editLoadingTime.value || null,
        location: editLocation.value,
        vehicleName: editVehicleName.value,
        driverName: editDriverName.value,
        vendorSewa: editVendorSewa.value,
        notes: editNotes.value,
      },
    });

    await refresh();
    await refreshAvailability();
  } catch (error) {
    editEventErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to update event";
  } finally {
    isUpdatingEvent.value = false;
  }
}

async function handleSavePostEventData() {
  postEventErrorMessage.value = "";

  if (postRibbonStart.value === "") {
    postEventErrorMessage.value = "Ribbon awal is required";
    return;
  }

  if (postRibbonEnd.value === "") {
    postEventErrorMessage.value = "Ribbon akhir is required";
    return;
  }

  if (Number(postRibbonUsed.value) < 0) {
    postEventErrorMessage.value =
      "Total penggunaan tidak boleh minus. Cek ribbon awal dan akhir.";
    return;
  }

  isSavingPostEventData.value = true;

  try {
    await $fetch(`/api/events/${eventId}/post-event-data`, {
      method: "PATCH",
      body: {
        ribbonStart: postRibbonStart.value,
        ribbonEnd: postRibbonEnd.value,
      },
    });

    await refresh();
  } catch (error) {
    postEventErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to save post event data";
  } finally {
    isSavingPostEventData.value = false;
  }
}

async function handleUpdateAssignment(assignmentId) {
  assignmentErrorMessage.value = "";
  savingAssignmentId.value = assignmentId;

  const form = assignmentForms.value[assignmentId];

  try {
    await $fetch(`/api/event-assignments/${assignmentId}`, {
      method: "PATCH",
      body: {
        roleInEvent: form.roleInEvent,
        assignmentStatus: form.assignmentStatus,
        notes: form.notes,
      },
    });

    await refresh();
    await refreshAvailability();
  } catch (error) {
    assignmentErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to update assignment";
  } finally {
    savingAssignmentId.value = "";
  }
}

watchEffect(() => {
  const evaluation = eventData.value?.data?.eventEvaluation;

  if (evaluation) {
    clientSatisfactionOk.value = evaluation.clientSatisfactionOk;
    clientFeedback.value = evaluation.clientFeedback || "";
    eventEvaluationNotes.value = evaluation.notes || "";
  }

  const assignedTeam = eventData.value?.data?.assignments || [];
  const existingEvaluations = eventData.value?.data?.staffEvaluations || [];

  for (const assignment of assignedTeam) {
    const existing = existingEvaluations.find((item) => {
      return item.staffId === assignment.staffId;
    });

    if (!staffEvaluationForms.value[assignment.staffId]) {
      staffEvaluationForms.value[assignment.staffId] = {
        sopOk: existing?.sopOk || false,
        warehouseOk: existing?.warehouseOk || false,
        groomingOk: existing?.groomingOk || false,
        dataCollectionOk: existing?.dataCollectionOk || false,
        notes: existing?.notes || "",
      };
    }
  }
});

watchEffect(() => {
  if (eventData.value?.data?.status) {
    selectedStatus.value = eventData.value.data.status;
  }
});

function formatDateInput(dateValue) {
  if (!dateValue) return "";

  return new Date(dateValue).toISOString().slice(0, 10);
}

watchEffect(() => {
  const event = eventData.value?.data;

  if (!event) return;

  editEventName.value = event.eventName || "";
  editClientName.value = event.clientName || "";
  editClientPhone.value = event.clientPhone || "";
  editServiceTypeId.value = event.serviceTypeId || "";
  editEquipmentSetup.value = event.equipmentSetup || "";
  editSalesId.value = event.salesId || "";
  editEventDate.value = formatDateInput(event.eventDate);
  editStartTime.value = event.startTime || "";
  editEndTime.value = event.endTime || "";
  editLoadingDate.value = formatDateInput(event.loadingDate);
  editLoadingTime.value = event.loadingTime || "";
  editLocation.value = event.location || "";
  editVehicleName.value = event.vehicleName || "";
  editDriverName.value = event.driverName || "";
  editVendorSewa.value = event.vendorSewa || "";
  editNotes.value = event.notes || "";

  postRibbonStart.value = event.ribbonStart ?? "";
  postRibbonEnd.value = event.ribbonEnd ?? "";
});

watchEffect(() => {
  const assignments = eventData.value?.data?.assignments || [];

  for (const assignment of assignments) {
    if (!assignmentForms.value[assignment.id]) {
      assignmentForms.value[assignment.id] = {
        roleInEvent: assignment.roleInEvent,
        assignmentStatus: assignment.assignmentStatus,
        notes: assignment.notes || "",
      };
    }
  }
});
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
      <p>Vendor Sewa: {{ eventData?.data?.vendorSewa || "-" }}</p>

      <hr />

      <h2>Edit Event</h2>

      <form @submit.prevent="handleUpdateEvent">
        <div>
          <label>Event Name</label>
          <br />
          <input v-model="editEventName" type="text" />
        </div>

        <br />

        <div>
          <label>Client Name</label>
          <br />
          <input v-model="editClientName" type="text" />
        </div>

        <br />

        <div>
          <label>Client Phone</label>
          <br />
          <input v-model="editClientPhone" type="text" />
        </div>

        <br />

        <div>
          <label>Service Type</label>
          <br />
          <select v-model="editServiceTypeId">
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
          <textarea v-model="editEquipmentSetup"></textarea>
        </div>

        <br />

        <div>
          <label>Sales</label>
          <br />
          <select v-model="editSalesId">
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
          <input v-model="editEventDate" type="date" />
        </div>

        <br />

        <div>
          <label>Start Time</label>
          <br />
          <input v-model="editStartTime" type="time" />
        </div>

        <br />

        <div>
          <label>End Time</label>
          <br />
          <input v-model="editEndTime" type="time" />
        </div>

        <br />

        <div>
          <label>Loading Date</label>
          <br />
          <input v-model="editLoadingDate" type="date" />
        </div>

        <br />

        <div>
          <label>Loading Time</label>
          <br />
          <input v-model="editLoadingTime" type="time" />
        </div>

        <br />

        <div>
          <label>Location</label>
          <br />
          <input v-model="editLocation" type="text" />
        </div>

        <br />

        <div>
          <label>Vehicle Name</label>
          <br />
          <input v-model="editVehicleName" type="text" />
        </div>

        <br />

        <div>
          <label>Driver Name</label>
          <br />
          <input v-model="editDriverName" type="text" />
        </div>

        <br />

        <div>
          <label>Vendor Sewa</label>
          <br />
          <input v-model="editVendorSewa" type="text" placeholder="Optional vendor rental info" />
        </div>

        <br />

        <div>
          <label>Notes</label>
          <br />
          <textarea v-model="editNotes"></textarea>
        </div>

        <br />

        <p v-if="editEventErrorMessage" style="color: red">
          {{ editEventErrorMessage }}
        </p>

        <button type="submit" :disabled="isUpdatingEvent">
          {{ isUpdatingEvent ? "Updating..." : "Update Event" }}
        </button>
      </form>

      <hr />

      <h2>Update Event Status</h2>
      <form @submit.prevent="handleUpdateStatus">
        <div>
          <label>Current Status</label>
          <br />
          <strong>{{ eventData?.data?.status }}</strong>
        </div>

        <br />

        <div>
          <label>Change Status</label>
          <br />
          <select v-model="selectedStatus">
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

        <p v-if="statusErrorMessage" style="color: red">
          {{ statusErrorMessage }}
        </p>

        <button type="submit" :disabled="isUpdatingStatus">
          {{ isUpdatingStatus ? "Updating..." : "Update Status" }}
        </button>
      </form>
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

            <td>
              <select v-model="assignmentForms[assignment.id].roleInEvent">
                <option value="PIC">PIC</option>
                <option value="CREW">CREW</option>
              </select>
            </td>

            <td>
              <select v-model="assignmentForms[assignment.id].assignmentStatus">
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="REPLACED">REPLACED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </td>

            <td>
              <textarea
                v-model="assignmentForms[assignment.id].notes"
                placeholder="Assignment notes"
              ></textarea>
            </td>

            <td>
              <button
                type="button"
                :disabled="savingAssignmentId === assignment.id"
                @click="handleUpdateAssignment(assignment.id)"
              >
                {{
                  savingAssignmentId === assignment.id ? "Saving..." : "Update"
                }}
              </button>

              |

              <button
                type="button"
                @click="handleDeleteAssignment(assignment.id)"
              >
                Delete
              </button>

              <template v-if="user?.role === 'DEVELOPER'">
                |

                <button
                  type="button"
                  @click="handleHardDeleteAssignment(assignment.id)"
                >
                  Hard Delete
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="assignmentErrorMessage" style="color: red">
        {{ assignmentErrorMessage }}
      </p>
    </div>
    <hr />

    <h2>Post Event Data</h2>

    <form @submit.prevent="handleSavePostEventData">
      <div>
        <label>Ribbon Awal</label>
        <br />
        <input v-model="postRibbonStart" type="number" />
      </div>

      <br />

      <div>
        <label>Ribbon Akhir</label>
        <br />
        <input v-model="postRibbonEnd" type="number" />
      </div>

      <br />

      <div>
        <label>Total Penggunaan</label>
        <br />
        <input :value="postRibbonUsed" type="number" disabled />
      </div>

      <br />

      <p v-if="postEventErrorMessage" style="color: red">
        {{ postEventErrorMessage }}
      </p>

      <button type="submit" :disabled="isSavingPostEventData">
        {{ isSavingPostEventData ? "Saving..." : "Save Post Event Data" }}
      </button>
    </form>

    <hr />

    <h2>Event Evaluation</h2>
    <form @submit.prevent="handleSaveEventEvaluation">
      <div>
        <label>
          <input v-model="clientSatisfactionOk" type="checkbox" />
          Client Satisfaction OK
        </label>
      </div>

      <br />

      <div>
        <label>Client Feedback</label>
        <br />
        <textarea
          v-model="clientFeedback"
          placeholder="Client feedback"
        ></textarea>
      </div>

      <br />

      <div>
        <label>Evaluation Notes</label>
        <br />
        <textarea
          v-model="eventEvaluationNotes"
          placeholder="Internal notes"
        ></textarea>
      </div>

      <br />

      <button type="submit" :disabled="isSavingEventEvaluation">
        {{ isSavingEventEvaluation ? "Saving..." : "Save Event Evaluation" }}
      </button>
    </form>

    <p v-if="eventData?.data?.eventEvaluation">
      Current Client Satisfaction:
      {{
        eventData?.data?.eventEvaluation?.clientSatisfactionOk ? "OK" : "NOT OK"
      }}
    </p>

    <hr />

    <h2>Staff Evaluation</h2>

    <p v-if="!activeAssignments.length">
      No active staff assignment for evaluation.
    </p>

    <p v-if="evaluationErrorMessage" style="color: red">
      {{ evaluationErrorMessage }}
    </p>

    <div
      v-for="assignment in activeAssignments"
      :key="assignment.id"
      style="border: 1px solid #ccc; padding: 12px; margin-bottom: 12px"
    >
      <h3>{{ assignment.staff?.name }} - {{ assignment.roleInEvent }}</h3>

      <div>
        <label>
          <input
            v-model="staffEvaluationForms[assignment.staffId].sopOk"
            type="checkbox"
          />
          SOP OK
        </label>
      </div>

      <div>
        <label>
          <input
            v-model="staffEvaluationForms[assignment.staffId].warehouseOk"
            type="checkbox"
          />
          Warehouse OK
        </label>
      </div>

      <div>
        <label>
          <input
            v-model="staffEvaluationForms[assignment.staffId].groomingOk"
            type="checkbox"
          />
          Grooming OK
        </label>
      </div>

      <div>
        <label>
          <input
            v-model="staffEvaluationForms[assignment.staffId].dataCollectionOk"
            type="checkbox"
          />
          Data Collection OK
        </label>
      </div>

      <br />

      <div>
        <label>Notes</label>
        <br />
        <textarea
          v-model="staffEvaluationForms[assignment.staffId].notes"
          placeholder="Staff evaluation notes"
        ></textarea>
      </div>

      <br />

      <button
        type="button"
        :disabled="savingStaffEvaluationId === assignment.staffId"
        @click="handleSaveStaffEvaluation(assignment.staffId)"
      >
        {{
          savingStaffEvaluationId === assignment.staffId
            ? "Saving..."
            : "Save Staff Evaluation"
        }}
      </button>

      <p>
        Result:
        <strong>
          {{
            eventData?.data?.staffEvaluations?.find(
              (item) => item.staffId === assignment.staffId,
            )?.isSuccess
              ? "SUCCESS"
              : "NOT SUCCESS / NOT EVALUATED"
          }}
        </strong>
      </p>
    </div>

    <hr />

    <h2>Activity Log</h2>

    <p v-if="!eventData?.data?.activityLogs?.length">
      No activity log yet.
    </p>

    <table v-else border="1" cellpadding="8" cellspacing="0">
      <thead>
        <tr>
          <th>Time</th>
          <th>User</th>
          <th>Action</th>
          <th>Description</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="log in eventData?.data?.activityLogs" :key="log.id">
          <td>{{ new Date(log.createdAt).toLocaleString() }}</td>
          <td>{{ log.user?.name || "-" }}</td>
          <td>{{ log.action }}</td>
          <td>{{ log.description || "-" }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
