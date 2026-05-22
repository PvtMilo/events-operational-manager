<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const route = useRoute();
const eventId = route.params.id;
const { user } = useUserSession();

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

const currentEvent = computed(() => eventData.value?.data || null);

const selectedStatus = ref("");
const isUpdatingStatus = ref(false);
const statusErrorMessage = ref("");

const editEventName = ref("");
const editClientName = ref("");
const editClientPhone = ref("");
const editServiceTypeId = ref(null);
const editEquipmentSetup = ref("");
const editSalesId = ref("NONE");
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
const isEditEventModalOpen = ref(false);

const postRibbonStart = ref("");
const postRibbonEnd = ref("");
const postEventErrorMessage = ref("");
const isSavingPostEventData = ref(false);

const postRibbonUsed = computed(() => {
  if (postRibbonStart.value === "" || postRibbonEnd.value === "") {
    return "";
  }

  const start = Number(postRibbonStart.value);
  const end = Number(postRibbonEnd.value);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "";
  }

  return start - end;
});

const availableStaffSearch = ref("");
const assignmentForms = ref({});
const savingAssignmentId = ref("");
const assignmentErrorMessage = ref("");
const addingStaffId = ref("");

const clientSatisfactionOk = ref(false);
const clientFeedback = ref("");
const eventEvaluationNotes = ref("");
const evaluationErrorMessage = ref("");
const isSavingEventEvaluation = ref(false);

const staffEvaluationForms = ref({});
const savingStaffEvaluationId = ref("");

const activeAssignmentStatuses = ["ASSIGNED", "CONFIRMED"];

const eventStatusOptions = [
  { label: "DRAFTED", value: "DRAFTED" },
  { label: "SCHEDULED", value: "SCHEDULED" },
  { label: "READY", value: "READY" },
  { label: "ONGOING", value: "ONGOING" },
  { label: "PENDING_EVALUATION", value: "PENDING_EVALUATION" },
  { label: "COMPLETED", value: "COMPLETED" },
  { label: "CANCELLED", value: "CANCELLED" },
];

const roleOptions = [
  { label: "PIC", value: "PIC" },
  { label: "CREW", value: "CREW" },
];

const assignmentStatusOptions = [
  { label: "ASSIGNED", value: "ASSIGNED" },
  { label: "CONFIRMED", value: "CONFIRMED" },
  { label: "REPLACED", value: "REPLACED" },
  { label: "CANCELLED", value: "CANCELLED" },
];

const serviceTypeOptions = computed(() => {
  return (serviceTypesData.value?.data || []).map((item) => ({
    label: item.name,
    value: item.id,
  }));
});

const salesOptions = computed(() => {
  return [
    { label: "No sales / optional", value: "NONE" },
    ...(salesData.value?.data || []).map((item) => ({
      label: item.name,
      value: item.id,
    })),
  ];
});

const selectedAssignments = computed(() => {
  return currentEvent.value?.assignments || [];
});

const activeSelectedAssignments = computed(() => {
  return selectedAssignments.value.filter((assignment) => {
    return activeAssignmentStatuses.includes(assignment.assignmentStatus);
  });
});

const inactiveSelectedAssignments = computed(() => {
  return selectedAssignments.value.filter((assignment) => {
    return !activeAssignmentStatuses.includes(assignment.assignmentStatus);
  });
});

const activeAssignments = activeSelectedAssignments;

const assignableStaff = computed(() => {
  const assignedStaffIds = selectedAssignments.value.map((assignment) => {
    return assignment.staffId;
  });

  return (
    availabilityData.value?.data?.filter((staff) => {
      return !assignedStaffIds.includes(staff.id);
    }) || []
  );
});

const filteredAvailableStaff = computed(() => {
  const keyword = availableStaffSearch.value.trim().toLowerCase();

  if (!keyword) return assignableStaff.value;

  return assignableStaff.value.filter((staff) => {
    return (
      staff.name?.toLowerCase().includes(keyword) ||
      staff.defaultRole?.toLowerCase().includes(keyword) ||
      staff.availabilityStatus?.toLowerCase().includes(keyword)
    );
  });
});

const requiresRibbonTracking = computed(() => {
  return currentEvent.value?.serviceType?.requiresRibbonTracking === true;
});

function syncEditEventForm(event) {
  editEventName.value = event.eventName || "";
  editClientName.value = event.clientName || "";
  editClientPhone.value = event.clientPhone || "";
  editServiceTypeId.value = event.serviceTypeId || null;
  editEquipmentSetup.value = event.equipmentSetup || "";
  editSalesId.value = event.salesId || "NONE";
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
}

watch(
  currentEvent,
  (event) => {
    if (!event) return;

    selectedStatus.value = event.status || "";
    syncEditEventForm(event);

    postRibbonStart.value = event.ribbonStart ?? "";
    postRibbonEnd.value = event.ribbonEnd ?? "";

    const evaluation = event.eventEvaluation;

    if (evaluation) {
      clientSatisfactionOk.value = evaluation.clientSatisfactionOk;
      clientFeedback.value = evaluation.clientFeedback || "";
      eventEvaluationNotes.value = evaluation.notes || "";
    }
  },
  { immediate: true },
);

watch(
  selectedAssignments,
  (assignments) => {
    const nextForms = {};

    for (const assignment of assignments || []) {
      nextForms[assignment.id] = {
        roleInEvent: assignment.roleInEvent || "CREW",
        assignmentStatus: assignment.assignmentStatus || "ASSIGNED",
        notes: assignment.notes || "",
      };
    }

    assignmentForms.value = nextForms;
  },
  { immediate: true },
);

watch(
  () => [activeAssignments.value, currentEvent.value?.staffEvaluations],
  () => {
    const existingEvaluations = currentEvent.value?.staffEvaluations || [];
    const nextForms = {};

    for (const assignment of activeAssignments.value) {
      const existing = existingEvaluations.find((item) => {
        return item.staffId === assignment.staffId;
      });

      nextForms[assignment.staffId] = {
        sopOk: existing?.sopOk || false,
        warehouseOk: existing?.warehouseOk || false,
        groomingOk: existing?.groomingOk || false,
        dataCollectionOk: existing?.dataCollectionOk || false,
        notes: existing?.notes || "",
      };
    }

    staffEvaluationForms.value = nextForms;
  },
  { immediate: true },
);

function formatDateInput(dateValue) {
  if (!dateValue) return "";

  return new Date(dateValue).toISOString().slice(0, 10);
}

function formatDate(dateValue) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleDateString();
}

function formatDateTime(dateValue) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleString();
}

function getStatusColor(status) {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "error";
  if (status === "PENDING_EVALUATION") return "warning";
  if (status === "ONGOING") return "primary";
  if (status === "READY") return "info";

  return "neutral";
}

function getAvailabilityColor(status) {
  if (status === "AVAILABLE") return "success";
  if (status === "SAME_DAY_AVAILABLE") return "warning";
  if (status === "TIME_CONFLICT") return "error";

  return "neutral";
}

function getAssignmentStatusColor(status) {
  if (status === "CONFIRMED") return "success";
  if (status === "ASSIGNED") return "primary";
  if (status === "REPLACED") return "warning";
  if (status === "CANCELLED") return "error";

  return "neutral";
}

function formatBoolean(value) {
  if (value === true) return "OK";
  if (value === false) return "NOT OK";

  return "NOT EVALUATED";
}

function getDefaultRoleForEvent(staff) {
  return staff.defaultRole === "PIC" ? "PIC" : "CREW";
}

function getStaffEvaluation(staffId) {
  return currentEvent.value?.staffEvaluations?.find((item) => {
    return item.staffId === staffId;
  });
}

function handleOpenEditEventModal() {
  if (currentEvent.value) {
    syncEditEventForm(currentEvent.value);
  }

  editEventErrorMessage.value = "";
  isEditEventModalOpen.value = true;
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
        salesId: editSalesId.value === "NONE" ? null : editSalesId.value,
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
    isEditEventModalOpen.value = false;
  } catch (error) {
    editEventErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to update event";
  } finally {
    isUpdatingEvent.value = false;
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
    await refreshAvailability();
  } catch (error) {
    statusErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to update event status";
  } finally {
    isUpdatingStatus.value = false;
  }
}

async function handleAddAvailableStaff(staff) {
  assignmentErrorMessage.value = "";

  if (staff.availabilityStatus === "TIME_CONFLICT") {
    assignmentErrorMessage.value =
      "Staff has time conflict and cannot be assigned";
    return;
  }

  addingStaffId.value = staff.id;

  try {
    await $fetch(`/api/events/${eventId}/assignments`, {
      method: "POST",
      body: {
        staffId: staff.id,
        roleInEvent: getDefaultRoleForEvent(staff),
        notes: "",
      },
    });

    await refresh();
    await refreshAvailability();
  } catch (error) {
    assignmentErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to assign staff";
  } finally {
    addingStaffId.value = "";
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

async function handleDeleteAssignment(assignmentId) {
  const confirmed = confirm("Cancel this staff assignment?");

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
        "Failed to cancel assignment",
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
</script>

<template>
  <div class="p-6 space-y-6">
    <div
      class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
    >
      <div>
        <div class="mb-2">
          <UButton
            to="/events"
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            size="sm"
          >
            Back to Events
          </UButton>
        </div>

        <h1 class="text-2xl font-semibold">
          {{ currentEvent?.eventName || "Event Detail" }}
        </h1>

        <p class="text-sm text-muted">
          Manage event data, team assignment, post-event data, and evaluation.
        </p>
      </div>
    </div>

    <UCard v-if="pending"> Loading event detail... </UCard>

    <UCard v-else-if="error">
      <p class="text-sm text-red-500">Failed to load event detail.</p>
    </UCard>

    <div v-else-if="currentEvent" class="space-y-6">
      <UCard>
        <template #header>
          <div
            class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h2 class="text-lg font-semibold">Event Info</h2>
              <p class="text-sm text-muted">
                Main event information and operational details.
              </p>
            </div>
            <UButton
              type="button"
              icon="i-lucide-pencil"
              color="neutral"
              variant="outline"
              @click="handleOpenEditEventModal"
            >
              Edit
            </UButton>
          </div>
        </template>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p class="text-xs text-muted">Client</p>
            <p class="font-medium">{{ currentEvent.clientName }}</p>
            <p class="text-xs text-muted">
              {{ currentEvent.clientPhone || "-" }}
            </p>
          </div>

          <div>
            <p class="text-xs text-muted">Service Type</p>
            <p class="font-medium">
              {{ currentEvent.serviceType?.name || "-" }}
            </p>
          </div>

          <div>
            <p class="text-xs text-muted">Sales</p>
            <p class="font-medium">{{ currentEvent.sales?.name || "-" }}</p>
          </div>

          <div>
            <p class="text-xs text-muted">Event Date</p>
            <p class="font-medium">{{ formatDate(currentEvent.eventDate) }}</p>
          </div>
          <div>
            <p class="text-xs text-muted">Event Time</p>
            <p class="font-medium">
              {{ currentEvent.startTime }} - {{ currentEvent.endTime }}
            </p>
          </div>

          <div>
            <p class="text-xs text-muted">Loading Date</p>
            <p class="font-medium">
              {{ formatDate(currentEvent.loadingDate) }}
            </p>
          </div>

          <div>
            <p class="text-xs text-muted">Loading Time</p>
            <p class="font-medium">
              {{ currentEvent.loadingTime || "-" }}
            </p>
          </div>

          <div>
            <p class="text-xs text-muted">Location</p>
            <p class="font-medium">{{ currentEvent.location || "-" }}</p>
          </div>

          <div>
            <p class="text-xs text-muted">Vehicle / Driver</p>
            <p class="font-medium">{{ currentEvent.vehicleName || "-" }}</p>
            <p class="text-xs text-muted">
              {{ currentEvent.driverName || "-" }}
            </p>
          </div>

          <div>
            <p class="text-xs text-muted">Vendor Sewa</p>
            <p class="font-medium">{{ currentEvent.vendorSewa || "-" }}</p>
          </div>
          <div>
            <p class="text-xs text-muted">Equipment Setup</p>
            <p class="font-medium">
              {{ currentEvent.equipmentSetup || "-" }}
            </p>
          </div>

          <div>
            <p class="text-xs text-muted">Notes</p>
            <p class="text-sm">
              {{ currentEvent.notes || "-" }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted">Current Status</p>
            <UBadge :color="getStatusColor(currentEvent.status)" variant="soft">
              {{ currentEvent.status }}
            </UBadge>
          </div>
        </div>
      </UCard>
      <UCard>
        <template #header>
          <div>
            <h2 class="text-lg font-semibold">Status Flow</h2>
            <p class="text-sm text-muted">
              Update event status with backend validation.
            </p>
          </div>
        </template>

        <form
          class="flex flex-col gap-4 md:flex-row md:items-end"
          @submit.prevent="handleUpdateStatus"
        >
          <UFormField label="Current Status" class="md:w-64">
            <UBadge :color="getStatusColor(currentEvent.status)" variant="soft">
              {{ currentEvent.status }}
            </UBadge>
          </UFormField>

          <UFormField label="Change Status" class="md:w-72">
            <USelect v-model="selectedStatus" :items="eventStatusOptions" />
          </UFormField>

          <UButton
            type="submit"
            :loading="isUpdatingStatus"
            icon="i-lucide-refresh-cw"
          >
            Update Status
          </UButton>
        </form>

        <p v-if="statusErrorMessage" class="mt-3 text-sm text-red-500">
          {{ statusErrorMessage }}
        </p>
      </UCard>

      <UModal
        v-model:open="isEditEventModalOpen"
        title="Edit Event"
        description="Update event planning and operational data."
        :ui="{ content: 'max-w-3xl' }"
      >
        <template #body>
          <form
            id="edit-event-form"
            class="space-y-4"
            @submit.prevent="handleUpdateEvent"
          >
            <div class="grid gap-4 md:grid-cols-2">
              <UFormField label="Event Name" required>
                <UInput
                  v-model="editEventName"
                  placeholder="Example: Friskies CFD"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Client Name" required>
                <UInput
                  v-model="editClientName"
                  placeholder="Example: Friskies"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Client Phone">
                <UInput
                  v-model="editClientPhone"
                  placeholder="Optional"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Service Type" required>
                <USelect
                  v-model="editServiceTypeId"
                  :items="serviceTypeOptions"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Sales">
                <USelect
                  v-model="editSalesId"
                  :items="salesOptions"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Event Date" required>
                <UInput v-model="editEventDate" type="date" class="w-full" />
              </UFormField>

              <UFormField label="Start Time" required>
                <UInput v-model="editStartTime" type="time" class="w-full" />
              </UFormField>

              <UFormField label="End Time" required>
                <UInput v-model="editEndTime" type="time" class="w-full" />
              </UFormField>

              <UFormField label="Loading Date">
                <UInput v-model="editLoadingDate" type="date" class="w-full" />
              </UFormField>

              <UFormField label="Loading Time">
                <UInput v-model="editLoadingTime" type="time" class="w-full" />
              </UFormField>

              <UFormField label="Location" class="w-full">
                <UInput
                  v-model="editLocation"
                  placeholder="Event location"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Vehicle Name">
                <UInput
                  v-model="editVehicleName"
                  placeholder="Optional"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Driver Name">
                <UInput
                  v-model="editDriverName"
                  placeholder="Optional"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Vendor Sewa" class="md:col-span-2">
                <UInput
                  v-model="editVendorSewa"
                  placeholder="Optional vendor rental info"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField label="Equipment Setup" required>
              <UTextarea
                v-model="editEquipmentSetup"
                placeholder="Example: 1 photobooth, 1 printer, 2 lighting"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Notes">
              <UTextarea
                v-model="editNotes"
                placeholder="Optional notes"
                class="w-full"
              />
            </UFormField>

            <p v-if="editEventErrorMessage" class="text-sm text-red-500">
              {{ editEventErrorMessage }}
            </p>
          </form>
        </template>

        <template #footer>
          <div class="flex gap-2 w-full justify-end">
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              @click="isEditEventModalOpen = false"
            >
              Cancel
            </UButton>

            <UButton
              form="edit-event-form"
              type="submit"
              color="primary"
              :loading="isUpdatingEvent"
            >
              Update Event
            </UButton>
          </div>
        </template>
      </UModal>

      <UCard>
        <template #header>
          <div
            class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h2 class="text-lg font-semibold">Team Assignment</h2>
              <p class="text-sm text-muted">
                Select available staff and manage event role/status.
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <UBadge color="primary" variant="soft">
                {{ activeSelectedAssignments.length }} active staff
              </UBadge>

              <UBadge color="neutral" variant="soft">
                {{ filteredAvailableStaff.length }} available
              </UBadge>

              <UBadge
                v-if="inactiveSelectedAssignments.length"
                color="warning"
                variant="soft"
              >
                {{ inactiveSelectedAssignments.length }} inactive history
              </UBadge>
            </div>
          </div>
        </template>

        <p v-if="assignmentErrorMessage" class="mb-4 text-sm text-red-500">
          {{ assignmentErrorMessage }}
        </p>

        <div class="grid gap-4 xl:grid-cols-2">
          <div class="rounded-lg border border-default bg-muted/20">
            <div class="border-b border-default p-4">
              <h3 class="font-medium">Selected Team</h3>
              <p class="text-sm text-muted">
                Staff assigned to this event. Cancelled/replaced records stay as
                history.
              </p>
            </div>

            <div class="max-h-[32rem] space-y-3 overflow-y-auto p-4">
              <p
                v-if="selectedAssignments.length === 0"
                class="text-sm text-muted"
              >
                No staff assigned yet.
              </p>

              <div
                v-for="assignment in selectedAssignments"
                :key="assignment.id"
                class="rounded-lg border border-default bg-default p-4"
                :class="{
                  'opacity-60': !activeAssignmentStatuses.includes(
                    assignment.assignmentStatus,
                  ),
                }"
              >
                <div
                  class="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
                >
                  <div>
                    <p class="font-medium">
                      {{ assignment.staff?.name || "-" }}
                    </p>

                    <p class="text-sm text-muted">
                      Default role: {{ assignment.staff?.defaultRole || "-" }}
                    </p>
                  </div>

                  <UBadge
                    :color="
                      getAssignmentStatusColor(assignment.assignmentStatus)
                    "
                    variant="soft"
                  >
                    {{ assignment.assignmentStatus }}
                  </UBadge>
                </div>

                <div
                  v-if="assignmentForms[assignment.id]"
                  class="grid gap-3 md:grid-cols-2"
                >
                  <UFormField label="Role">
                    <USelect
                      v-model="assignmentForms[assignment.id].roleInEvent"
                      :items="roleOptions"
                    />
                  </UFormField>

                  <UFormField label="Status">
                    <USelect
                      v-model="assignmentForms[assignment.id].assignmentStatus"
                      :items="assignmentStatusOptions"
                    />
                  </UFormField>

                  <UFormField label="Notes" class="md:col-span-2">
                    <UTextarea
                      v-model="assignmentForms[assignment.id].notes"
                      placeholder="Assignment notes"
                      :rows="2"
                    />
                  </UFormField>
                </div>

                <div class="mt-4 flex flex-wrap gap-2">
                  <UButton
                    size="sm"
                    color="primary"
                    variant="soft"
                    :loading="savingAssignmentId === assignment.id"
                    @click="handleUpdateAssignment(assignment.id)"
                  >
                    Update
                  </UButton>

                  <UButton
                    size="sm"
                    color="warning"
                    variant="soft"
                    @click="handleDeleteAssignment(assignment.id)"
                  >
                    Cancel Assignment
                  </UButton>

                  <UButton
                    v-if="user?.role === 'DEVELOPER'"
                    size="sm"
                    color="error"
                    variant="soft"
                    @click="handleHardDeleteAssignment(assignment.id)"
                  >
                    Hard Delete
                  </UButton>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-default bg-muted/20">
            <div class="border-b border-default p-4">
              <h3 class="font-medium">Available Staff</h3>
              <p class="text-sm text-muted">
                Search and add staff based on availability and workload.
              </p>

              <div class="mt-3">
                <UInput
                  v-model="availableStaffSearch"
                  icon="i-lucide-search"
                  placeholder="Search staff"
                />
              </div>
            </div>

            <div class="max-h-[32rem] space-y-3 overflow-y-auto p-4">
              <p
                v-if="filteredAvailableStaff.length === 0"
                class="text-sm text-muted"
              >
                No available staff found.
              </p>

              <div
                v-for="staff in filteredAvailableStaff"
                :key="staff.id"
                class="rounded-lg border border-default bg-default p-4"
                :class="{
                  'opacity-60': staff.availabilityStatus === 'TIME_CONFLICT',
                }"
              >
                <div
                  class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
                >
                  <div class="space-y-1">
                    <p class="font-medium">
                      {{ staff.name }}
                    </p>

                    <p class="text-sm text-muted">
                      Default role: {{ staff.defaultRole }}
                    </p>

                    <div class="flex flex-wrap gap-2 pt-1">
                      <UBadge
                        :color="getAvailabilityColor(staff.availabilityStatus)"
                        variant="soft"
                      >
                        {{ staff.availabilityStatus }}
                      </UBadge>

                      <UBadge color="neutral" variant="soft">
                        {{ staff.monthlyEventCount || 0 }} events this month
                      </UBadge>

                      <UBadge color="neutral" variant="soft">
                        {{ staff.monthlyPicCount || 0 }} PIC
                      </UBadge>
                    </div>

                    <p
                      v-if="staff.conflictEvent"
                      class="pt-1 text-xs text-red-500"
                    >
                      Conflict: {{ staff.conflictEvent.eventName }} ({{
                        staff.conflictEvent.startTime
                      }}
                      - {{ staff.conflictEvent.endTime }})
                    </p>

                    <p
                      v-else-if="staff.sameDayEvent"
                      class="pt-1 text-xs text-amber-500"
                    >
                      Same day: {{ staff.sameDayEvent.eventName }} ({{
                        staff.sameDayEvent.startTime
                      }}
                      - {{ staff.sameDayEvent.endTime }})
                    </p>
                  </div>

                  <UButton
                    size="sm"
                    color="primary"
                    variant="soft"
                    icon="i-lucide-arrow-left"
                    :disabled="staff.availabilityStatus === 'TIME_CONFLICT'"
                    :loading="addingStaffId === staff.id"
                    @click="handleAddAvailableStaff(staff)"
                  >
                    Add
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div
            class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h2 class="text-lg font-semibold">Post Event Data</h2>
              <p class="text-sm text-muted">
                Input actual ribbon usage after the event.
              </p>
            </div>

            <UBadge
              :color="requiresRibbonTracking ? 'warning' : 'neutral'"
              variant="soft"
            >
              Ribbon tracking:
              {{ requiresRibbonTracking ? "Required" : "Optional" }}
            </UBadge>
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleSavePostEventData">
          <div class="grid gap-4 md:grid-cols-3">
            <UFormField label="Ribbon Awal">
              <UInput v-model="postRibbonStart" type="number" />
            </UFormField>

            <UFormField label="Ribbon Akhir">
              <UInput v-model="postRibbonEnd" type="number" />
            </UFormField>

            <UFormField label="Total Penggunaan">
              <UInput :model-value="postRibbonUsed" type="number" disabled />
            </UFormField>
          </div>

          <p v-if="postEventErrorMessage" class="text-sm text-red-500">
            {{ postEventErrorMessage }}
          </p>

          <div class="flex justify-end">
            <UButton type="submit" :loading="isSavingPostEventData">
              Save Post Event Data
            </UButton>
          </div>
        </form>
      </UCard>

      <UCard>
        <template #header>
          <div>
            <h2 class="text-lg font-semibold">Event Evaluation</h2>
            <p class="text-sm text-muted">
              Client satisfaction and event-level feedback.
            </p>
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleSaveEventEvaluation">
          <UCheckbox
            v-model="clientSatisfactionOk"
            label="Client Satisfaction OK"
          />

          <UFormField label="Client Feedback">
            <UTextarea
              v-model="clientFeedback"
              placeholder="Client feedback"
              :rows="3"
            />
          </UFormField>

          <UFormField label="Internal Notes">
            <UTextarea
              v-model="eventEvaluationNotes"
              placeholder="Internal notes"
              :rows="3"
            />
          </UFormField>

          <p v-if="evaluationErrorMessage" class="text-sm text-red-500">
            {{ evaluationErrorMessage }}
          </p>

          <div
            class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          >
            <p class="text-sm text-muted">
              Current Client Satisfaction:
              <span class="font-medium">
                {{
                  formatBoolean(
                    currentEvent.eventEvaluation?.clientSatisfactionOk,
                  )
                }}
              </span>
            </p>

            <UButton type="submit" :loading="isSavingEventEvaluation">
              Save Event Evaluation
            </UButton>
          </div>
        </form>
      </UCard>

      <UCard>
        <template #header>
          <div>
            <h2 class="text-lg font-semibold">Staff Evaluation</h2>
            <p class="text-sm text-muted">
              Evaluate only active assigned staff.
            </p>
          </div>
        </template>

        <p v-if="!activeAssignments.length" class="text-sm text-muted">
          No active staff assignment for evaluation.
        </p>

        <p v-if="evaluationErrorMessage" class="mb-4 text-sm text-red-500">
          {{ evaluationErrorMessage }}
        </p>

        <div class="grid gap-4 xl:grid-cols-2">
          <div
            v-for="assignment in activeAssignments"
            :key="assignment.id"
            class="rounded-lg border border-default p-4"
          >
            <div
              class="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
            >
              <div>
                <p class="font-medium">
                  {{ assignment.staff?.name }} - {{ assignment.roleInEvent }}
                </p>

                <p class="text-sm text-muted">
                  {{ assignment.staff?.defaultRole }}
                </p>
              </div>

              <UBadge
                :color="
                  getStaffEvaluation(assignment.staffId)?.isSuccess
                    ? 'success'
                    : 'neutral'
                "
                variant="soft"
              >
                {{
                  getStaffEvaluation(assignment.staffId)?.isSuccess
                    ? "SUCCESS"
                    : "NOT SUCCESS / NOT EVALUATED"
                }}
              </UBadge>
            </div>

            <div
              v-if="staffEvaluationForms[assignment.staffId]"
              class="space-y-4"
            >
              <div class="grid gap-3 md:grid-cols-2">
                <UCheckbox
                  v-model="staffEvaluationForms[assignment.staffId].sopOk"
                  label="SOP OK"
                />

                <UCheckbox
                  v-model="staffEvaluationForms[assignment.staffId].warehouseOk"
                  label="Warehouse OK"
                />

                <UCheckbox
                  v-model="staffEvaluationForms[assignment.staffId].groomingOk"
                  label="Grooming OK"
                />

                <UCheckbox
                  v-model="
                    staffEvaluationForms[assignment.staffId].dataCollectionOk
                  "
                  label="Data Collection OK"
                />
              </div>

              <UFormField label="Notes">
                <UTextarea
                  v-model="staffEvaluationForms[assignment.staffId].notes"
                  placeholder="Staff evaluation notes"
                  :rows="2"
                />
              </UFormField>

              <div class="flex justify-end">
                <UButton
                  size="sm"
                  :loading="savingStaffEvaluationId === assignment.staffId"
                  @click="handleSaveStaffEvaluation(assignment.staffId)"
                >
                  Save Staff Evaluation
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div>
            <h2 class="text-lg font-semibold">Activity Log</h2>
            <p class="text-sm text-muted">Audit trail for this event.</p>
          </div>
        </template>

        <p v-if="!currentEvent.activityLogs?.length" class="text-sm text-muted">
          No activity log yet.
        </p>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-default text-left">
                <th class="py-2 pr-4">Time</th>
                <th class="py-2 pr-4">User</th>
                <th class="py-2 pr-4">Action</th>
                <th class="py-2 pr-4">Description</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="log in currentEvent.activityLogs"
                :key="log.id"
                class="border-b border-default"
              >
                <td class="py-2 pr-4">
                  {{ formatDateTime(log.createdAt) }}
                </td>
                <td class="py-2 pr-4">
                  {{ log.user?.name || "-" }}
                </td>
                <td class="py-2 pr-4">
                  <UBadge color="neutral" variant="soft">
                    {{ log.action }}
                  </UBadge>
                </td>
                <td class="py-2 pr-4">
                  {{ log.description || "-" }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>
  </div>
</template>
