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
} = await useFetch(`/api/events/${eventId}`);

const { data: serviceTypesData } = await useFetch("/api/service-types");
const { data: salesData } = await useFetch("/api/sales");
const { data: availabilityData } = await useFetch(
  `/api/events/${eventId}/staff-availability`,
);

const currentEvent = computed(() => eventData.value?.data || null);

async function refreshEventDetailInPlace() {
  eventData.value = await $fetch(`/api/events/${eventId}`);
}

async function refreshAvailabilityInPlace() {
  availabilityData.value = await $fetch(
    `/api/events/${eventId}/staff-availability`,
  );
}

const selectedStatus = ref("");
const isUpdatingStatus = ref(false);
const statusErrorMessage = ref("");
const selectedLoadingStatus = ref("NOT_PREPARED");
const isUpdatingLoadingStatus = ref(false);
const loadingStatusErrorMessage = ref("");

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
const draftTeam = ref([]);
const originalTeamSignature = ref("");
const isSavingTeam = ref(false);

const clientSatisfactionOk = ref(false);
const clientFeedback = ref("");
const eventEvaluationNotes = ref("");
const evaluationErrorMessage = ref("");
const isSubmittingEvaluationBundle = ref(false);
const isEditingEvaluationSubmission = ref(false);

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

const loadingStatusOptions = [
  { label: "Not Prepared", value: "NOT_PREPARED" },
  { label: "Preparing", value: "PREPARING" },
  { label: "Loading in Progress", value: "LOADING" },
  { label: "Loading Complete", value: "LOADED" },
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

const teamAssignmentStatusOptions = [
  { label: "ASSIGNED", value: "ASSIGNED" },
  { label: "CONFIRMED", value: "CONFIRMED" },
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

const selectedDraftStaffIds = computed(() => {
  return draftTeam.value.map((member) => member.staffId);
});

const assignableStaff = computed(() => {
  const selectedIds = selectedDraftStaffIds.value;

  return (
    availabilityData.value?.data
      ?.filter((staff) => {
        return !selectedIds.includes(staff.id);
      })
      .sort((a, b) => {
        const rank = {
          AVAILABLE: 1,
          SAME_DAY_AVAILABLE: 2,
          TIME_CONFLICT: 3,
        };

        const rankA = rank[a.availabilityStatus] || 9;
        const rankB = rank[b.availabilityStatus] || 9;

        if (rankA !== rankB) return rankA - rankB;

        const monthlyA = a.monthlyEventCount || 0;
        const monthlyB = b.monthlyEventCount || 0;

        if (monthlyA !== monthlyB) return monthlyA - monthlyB;

        return a.name.localeCompare(b.name);
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

const hasTeamChanges = computed(() => {
  return getTeamSignature(draftTeam.value) !== originalTeamSignature.value;
});

const requiresRibbonTracking = computed(() => {
  return currentEvent.value?.serviceType?.requiresRibbonTracking === true;
});

const isPostEventDataSubmitted = computed(() => {
  const event = currentEvent.value;

  if (!event) return false;

  return (
    event.ribbonStart !== null &&
    event.ribbonStart !== undefined &&
    event.ribbonEnd !== null &&
    event.ribbonEnd !== undefined
  );
});

const isEventEvaluationSubmitted = computed(() => {
  return Boolean(currentEvent.value?.eventEvaluation);
});

const areStaffEvaluationsSubmitted = computed(() => {
  const evaluatedStaffIds = new Set(
    currentEvent.value?.staffEvaluations?.map((evaluation) => {
      return evaluation.staffId;
    }) || [],
  );

  return activeAssignments.value.every((assignment) => {
    return evaluatedStaffIds.has(assignment.staffId);
  });
});

const isEvaluationSubmissionSubmitted = computed(() => {
  return (
    isPostEventDataSubmitted.value &&
    isEventEvaluationSubmitted.value &&
    areStaffEvaluationsSubmitted.value
  );
});

const isEvaluationReadOnly = computed(() => {
  return (
    isEvaluationSubmissionSubmitted.value &&
    !isEditingEvaluationSubmission.value
  );
});

const evaluationSubmitButtonLabel = computed(() => {
  return isEvaluationReadOnly.value ? "Edit" : "Submit";
});

const evaluationSubmitButtonIcon = computed(() => {
  return isEvaluationReadOnly.value ? "i-lucide-pencil" : "i-lucide-send";
});

const evaluationSubmitButtonColor = computed(() => {
  return isEvaluationReadOnly.value ? "neutral" : "success";
});

const evaluationSubmitButtonVariant = computed(() => {
  return isEvaluationReadOnly.value ? "outline" : "solid";
});

const isEventEvaluationSuccess = computed(() => {
  if (!isEvaluationSubmissionSubmitted.value) return false;

  return activeAssignments.value.every((assignment) => {
    return getStaffEvaluation(assignment.staffId)?.isSuccess === true;
  });
});

const eventEvaluationResultLabel = computed(() => {
  return isEventEvaluationSuccess.value ? "EVENT SUCCESS" : "EVENT NOT SUCCESS";
});

const eventEvaluationResultColor = computed(() => {
  return isEventEvaluationSuccess.value ? "success" : "error";
});

const isEvaluationBundleBusy = computed(() => {
  return (
    isSubmittingEvaluationBundle.value || Boolean(savingStaffEvaluationId.value)
  );
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
    selectedLoadingStatus.value = event.loadingStatus || "NOT_PREPARED";
    syncEditEventForm(event);
    syncTeamDraftFromEvent(event);

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

function formatCapitalCase(value) {
  if (!value) return "-";

  return value
    .toString()
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusColor(status) {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "error";
  if (status === "PENDING_EVALUATION") return "warning";
  if (status === "ONGOING") return "primary";
  if (status === "READY") return "info";

  return "neutral";
}

function getLoadingStatusColor(status) {
  if (status === "LOADED") return "success";
  if (status === "LOADING") return "primary";
  if (status === "PREPARING") return "warning";
  if (status === "NOT_PREPARED") return "neutral";

  return "neutral";
}

function getLoadingStatusLabel(status) {
  if (status === "NOT_PREPARED") return "Not Prepared";
  if (status === "PREPARING") return "Preparing";
  if (status === "LOADING") return "Loading in Progress";
  if (status === "LOADED") return "Loading Complete";

  return status || "Not Prepared";
}

function getAvailabilityColor(status) {
  if (status === "AVAILABLE") return "success";
  if (status === "SAME_DAY_AVAILABLE") return "warning";
  if (status === "TIME_CONFLICT") return "error";
  if (status === "UNAVAILABLE") return "error";

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

function getTeamSignature(team) {
  return JSON.stringify(
    team
      .map((member) => ({
        staffId: member.staffId,
        roleInEvent: member.roleInEvent,
        assignmentStatus: member.assignmentStatus,
        notes: member.notes || "",
      }))
      .sort((a, b) => a.staffId.localeCompare(b.staffId)),
  );
}

function syncTeamDraftFromEvent(event) {
  const activeAssignments =
    event?.assignments?.filter((assignment) => {
      return activeAssignmentStatuses.includes(assignment.assignmentStatus);
    }) || [];

  draftTeam.value = activeAssignments.map((assignment) => ({
    assignmentId: assignment.id,
    staffId: assignment.staffId,
    staff: assignment.staff,
    roleInEvent: assignment.roleInEvent || "CREW",
    assignmentStatus: assignment.assignmentStatus || "ASSIGNED",
    notes: assignment.notes || "",
  }));

  originalTeamSignature.value = getTeamSignature(draftTeam.value);
  assignmentErrorMessage.value = "";
}

function handleRemoveDraftStaff(staffId) {
  draftTeam.value = draftTeam.value.filter((member) => {
    return member.staffId !== staffId;
  });
}

function handleResetTeamDraft() {
  if (!currentEvent.value) return;

  syncTeamDraftFromEvent(currentEvent.value);
}

function getStaffEvaluation(staffId) {
  return currentEvent.value?.staffEvaluations?.find((item) => {
    return item.staffId === staffId;
  });
}

function getStaffEvaluationLabel(staffId) {
  const evaluation = getStaffEvaluation(staffId);

  if (!evaluation) return "NOT EVALUATED";

  return evaluation.isSuccess ? "SUCCESS" : "NOT SUCCESS";
}

function getStaffEvaluationColor(staffId) {
  const evaluation = getStaffEvaluation(staffId);

  if (!evaluation) return "neutral";

  return evaluation.isSuccess ? "success" : "error";
}

function getStaffEvaluationVariant(staffId) {
  return getStaffEvaluation(staffId) ? "soft" : "outline";
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

    await refreshEventDetailInPlace();
    await refreshAvailabilityInPlace();
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

    await refreshEventDetailInPlace();
    await refreshAvailabilityInPlace();
  } catch (error) {
    statusErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to update event status";
  } finally {
    isUpdatingStatus.value = false;
  }
}

async function handleUpdateLoadingStatus() {
  loadingStatusErrorMessage.value = "";
  isUpdatingLoadingStatus.value = true;

  try {
    await $fetch(`/api/events/${eventId}/loading-status`, {
      method: "PATCH",
      body: {
        loadingStatus: selectedLoadingStatus.value,
      },
    });

    await refreshEventDetailInPlace();
    await refreshAvailabilityInPlace();
  } catch (error) {
    loadingStatusErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to update loading status";
  } finally {
    isUpdatingLoadingStatus.value = false;
  }
}

function handleAddAvailableStaff(staff) {
  assignmentErrorMessage.value = "";

  if (staff.availabilityStatus === "TIME_CONFLICT") {
    assignmentErrorMessage.value =
      "Staff has time conflict and cannot be assigned";
    return;
  }

  if (staff.availabilityStatus === "UNAVAILABLE") {
    assignmentErrorMessage.value = "Staff is unavailable on this event date";
    return;
  }

  const alreadySelected = draftTeam.value.some((member) => {
    return member.staffId === staff.id;
  });

  if (alreadySelected) return;

  draftTeam.value.push({
    assignmentId: null,
    staffId: staff.id,
    staff,
    roleInEvent: getDefaultRoleForEvent(staff),
    assignmentStatus: "ASSIGNED",
    notes: "",
  });
}

async function handleSaveTeam() {
  assignmentErrorMessage.value = "";
  isSavingTeam.value = true;

  try {
    await $fetch(`/api/events/${eventId}/team`, {
      method: "PATCH",
      body: {
        team: draftTeam.value.map((member) => ({
          staffId: member.staffId,
          roleInEvent: member.roleInEvent,
          assignmentStatus: member.assignmentStatus,
          notes: member.notes || "",
        })),
      },
    });

    await refreshEventDetailInPlace();
    await refreshAvailabilityInPlace();
  } catch (error) {
    assignmentErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to save team";
  } finally {
    isSavingTeam.value = false;
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

    await refreshEventDetailInPlace();
    await refreshAvailabilityInPlace();
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

    await refreshEventDetailInPlace();
    await refreshAvailabilityInPlace();
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

    await refreshEventDetailInPlace();
    await refreshAvailabilityInPlace();
  } catch (error) {
    alert(
      error?.data?.statusMessage ||
        error?.statusMessage ||
        "Failed to hard delete assignment",
    );
  }
}

function getSaveErrorMessage(error, fallback) {
  return (
    error?.data?.statusMessage ||
    error?.statusMessage ||
    error?.message ||
    fallback
  );
}

function validatePostEventData() {
  if (postRibbonStart.value === "") {
    postEventErrorMessage.value = "Starting ribbon count is required";
    return false;
  }

  if (postRibbonEnd.value === "") {
    postEventErrorMessage.value = "Ending ribbon count is required";
    return false;
  }

  if (Number(postRibbonUsed.value) < 0) {
    postEventErrorMessage.value =
      "Total ribbon used cannot be negative. Check starting and ending ribbon counts.";
    return false;
  }

  return true;
}

async function savePostEventDataRequest() {
  await $fetch(`/api/events/${eventId}/post-event-data`, {
    method: "PATCH",
    body: {
      ribbonStart: postRibbonStart.value,
      ribbonEnd: postRibbonEnd.value,
    },
  });
}

async function saveEventEvaluationRequest() {
  await $fetch(`/api/events/${eventId}/evaluation`, {
    method: "POST",
    body: {
      clientSatisfactionOk: clientSatisfactionOk.value,
      clientFeedback: clientFeedback.value,
      notes: eventEvaluationNotes.value,
    },
  });
}

async function saveStaffEvaluationRequest(staffId) {
  const form = staffEvaluationForms.value[staffId];

  if (!form) {
    throw new Error("Staff evaluation form is not ready");
  }

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
}

async function handleSubmitEvaluationBundle() {
  if (isEvaluationReadOnly.value) {
    isEditingEvaluationSubmission.value = true;
    return;
  }

  postEventErrorMessage.value = "";
  evaluationErrorMessage.value = "";

  if (!validatePostEventData()) {
    return;
  }

  isSubmittingEvaluationBundle.value = true;

  try {
    await savePostEventDataRequest();
    await saveEventEvaluationRequest();

    for (const assignment of activeAssignments.value) {
      savingStaffEvaluationId.value = assignment.staffId;
      await saveStaffEvaluationRequest(assignment.staffId);
    }

    savingStaffEvaluationId.value = "";
    await refreshEventDetailInPlace();
    isEditingEvaluationSubmission.value = false;
  } catch (error) {
    evaluationErrorMessage.value = getSaveErrorMessage(
      error,
      "Failed to submit evaluation",
    );
  } finally {
    isSubmittingEvaluationBundle.value = false;
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

    <UCard v-if="pending && !currentEvent"> Loading event detail... </UCard>

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
            <div class="flex flex-wrap gap-2">
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
          </div>
        </template>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p class="text-xs text-muted">Client</p>
            <p class="font-medium">
              {{ formatCapitalCase(currentEvent.clientName) }}
            </p>
            <p class="text-xs text-muted">
              {{ currentEvent.clientPhone || "-" }}
            </p>
          </div>

          <div>
            <p class="text-xs text-muted">Service Type</p>
            <p class="font-medium">
              {{ formatCapitalCase(currentEvent.serviceType?.name) }}
            </p>
          </div>

          <div>
            <p class="text-xs text-muted">Sales</p>
            <p class="font-medium">
              {{ formatCapitalCase(currentEvent.sales?.name) }}
            </p>
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
            <p class="font-medium">
              {{ formatCapitalCase(currentEvent.location) }}
            </p>
          </div>

          <div>
            <p class="text-xs text-muted">Vehicle / Driver</p>
            <p class="font-medium">
              {{ formatCapitalCase(currentEvent.vehicleName) }}
            </p>
            <p class="text-xs text-muted">
              {{ formatCapitalCase(currentEvent.driverName) }}
            </p>
          </div>

          <div>
            <p class="text-xs text-muted">Rental Vendor</p>
            <p class="font-medium">
              {{ formatCapitalCase(currentEvent.vendorSewa) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted">Equipment Setup</p>
            <p class="font-medium">
              {{ formatCapitalCase(currentEvent.equipmentSetup) }}
            </p>
          </div>

          <div>
            <p class="text-xs text-muted">Notes</p>
            <p class="text-sm">
              {{ formatCapitalCase(currentEvent.notes) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted">Current Status</p>
            <UBadge :color="getStatusColor(currentEvent.status)" variant="soft">
              {{ formatCapitalCase(currentEvent.status) }}
            </UBadge>
          </div>

          <div>
            <p class="text-xs text-muted">Loading Status</p>
            <UBadge
              :color="
                getLoadingStatusColor(
                  currentEvent.loadingStatus || 'NOT_PREPARED',
                )
              "
              variant="soft"
            >
              {{
                getLoadingStatusLabel(
                  currentEvent.loadingStatus || "NOT_PREPARED",
                )
              }}
            </UBadge>
          </div>
        </div>
      </UCard>
      <UCard>
        <template #header>
          <div>
            <h2 class="text-lg font-semibold">Operational Status</h2>
            <p class="text-sm text-muted">
              Manage event lifecycle and warehouse loading progress separately.
            </p>
          </div>
        </template>

        <div class="grid gap-6 xl:grid-cols-2">
          <form
            class="space-y-4 rounded-lg border border-default p-4"
            @submit.prevent="handleUpdateStatus"
          >
            <div>
              <h3 class="font-medium">Event Status</h3>
              <p class="text-sm text-muted">
                Controls the main event lifecycle.
              </p>
            </div>

            <div class="grid gap-4 md:grid-cols-[1fr_1.5fr_auto] md:items-end">
              <UFormField label="Current">
                <UBadge
                  :color="getStatusColor(currentEvent.status)"
                  variant="soft"
                >
                  {{ currentEvent.status }}
                </UBadge>
              </UFormField>

              <UFormField label="Change Event Status">
                <USelect
                  v-model="selectedStatus"
                  :items="eventStatusOptions"
                  class="w-full"
                />
              </UFormField>

              <UButton
                type="submit"
                :loading="isUpdatingStatus"
                icon="i-lucide-refresh-cw"
              >
                Update
              </UButton>
            </div>

            <p v-if="statusErrorMessage" class="text-sm text-red-500">
              {{ statusErrorMessage }}
            </p>
          </form>

          <form
            class="space-y-4 rounded-lg border border-default p-4"
            @submit.prevent="handleUpdateLoadingStatus"
          >
            <div>
              <h3 class="font-medium">Loading Status</h3>
              <p class="text-sm text-muted">
                Tracks equipment preparation and loading progress.
              </p>
            </div>

            <div class="grid gap-4 md:grid-cols-[1fr_1.5fr_auto] md:items-end">
              <UFormField label="Current">
                <UBadge
                  :color="
                    getLoadingStatusColor(
                      currentEvent.loadingStatus || 'NOT_PREPARED',
                    )
                  "
                  variant="soft"
                >
                  {{
                    getLoadingStatusLabel(
                      currentEvent.loadingStatus || "NOT_PREPARED",
                    )
                  }}
                </UBadge>
              </UFormField>

              <UFormField label="Change Loading Status">
                <USelect
                  v-model="selectedLoadingStatus"
                  :items="loadingStatusOptions"
                  class="w-full"
                />
              </UFormField>

              <UButton
                type="submit"
                :loading="isUpdatingLoadingStatus"
                icon="i-lucide-truck"
              >
                Update
              </UButton>
            </div>

            <p v-if="loadingStatusErrorMessage" class="text-sm text-red-500">
              {{ loadingStatusErrorMessage }}
            </p>
          </form>
        </div>
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

              <UFormField label="Rental Vendor">
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
            class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
          >
            <div>
              <h2 class="text-lg font-semibold">Team Assignment</h2>
              <p class="text-sm text-muted">
                Build the team draft first, then save when the selection is
                final.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <UBadge color="primary" variant="soft">
                {{ draftTeam.length }} selected
              </UBadge>

              <UBadge color="neutral" variant="soft">
                {{ filteredAvailableStaff.length }} available
              </UBadge>

              <UBadge v-if="hasTeamChanges" color="warning" variant="soft">
                Unsaved changes
              </UBadge>

              <UButton
                size="sm"
                color="neutral"
                variant="outline"
                icon="i-lucide-rotate-ccw"
                :disabled="!hasTeamChanges || isSavingTeam"
                @click="handleResetTeamDraft"
              >
                Reset Changes
              </UButton>

              <UButton
                size="sm"
                color="primary"
                icon="i-lucide-save"
                :loading="isSavingTeam"
                :disabled="!hasTeamChanges"
                @click="handleSaveTeam"
              >
                Save Team
              </UButton>
            </div>
          </div>
        </template>

        <p v-if="assignmentErrorMessage" class="mb-4 text-sm text-red-500">
          {{ assignmentErrorMessage }}
        </p>

        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div class="rounded-lg border border-default bg-muted/20">
            <div class="border-b border-default p-4">
              <h3 class="font-medium">Selected Team</h3>
              <p class="text-sm text-muted">
                Draft team for this event. Use Move to Available if you selected
                the wrong staff.
              </p>
            </div>

            <div class="max-h-[32rem] space-y-3 overflow-y-auto p-4">
              <p v-if="draftTeam.length === 0" class="text-sm text-muted">
                No staff selected yet. Add staff from the available list.
              </p>

              <div
                v-for="member in draftTeam"
                :key="member.assignmentId || member.staffId"
                class="rounded-lg border border-default bg-default p-4"
              >
                <div
                  class="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
                >
                  <div>
                    <p class="font-medium">
                      {{ member.staff?.name || "-" }}
                    </p>

                    <p class="text-sm text-muted">
                      Default role: {{ member.staff?.defaultRole || "-" }}
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <UBadge
                      :color="getAssignmentStatusColor(member.assignmentStatus)"
                      variant="soft"
                    >
                      {{ member.assignmentStatus }}
                    </UBadge>
                  </div>
                </div>

                <div class="grid gap-3 md:grid-cols-2">
                  <UFormField label="Role">
                    <USelect
                      v-model="member.roleInEvent"
                      :items="roleOptions"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Status">
                    <USelect
                      v-model="member.assignmentStatus"
                      :items="teamAssignmentStatusOptions"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Notes" class="md:col-span-2">
                    <UTextarea
                      v-model="member.notes"
                      placeholder="Assignment notes"
                      :rows="2"
                      class="w-full"
                    />
                  </UFormField>
                </div>

                <div class="mt-4 flex flex-wrap gap-2">
                  <UButton
                    size="sm"
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-arrow-right"
                    @click="handleRemoveDraftStaff(member.staffId)"
                  >
                    Move to Available
                  </UButton>

                  <UButton
                    v-if="user?.role === 'DEVELOPER' && member.assignmentId"
                    size="sm"
                    color="error"
                    variant="soft"
                    @click="handleHardDeleteAssignment(member.assignmentId)"
                  >
                    Hard Delete
                  </UButton>
                </div>
              </div>
            </div>
          </div>

          <div class="hidden items-center justify-center xl:flex">
            <div class="flex flex-col gap-2 text-muted">
              <UIcon name="i-lucide-arrow-left-right" class="size-6" />
            </div>
          </div>

          <div class="rounded-lg border border-default bg-muted/20">
            <div class="border-b border-default p-4">
              <h3 class="font-medium">Available Staff</h3>
              <p class="text-sm text-muted">
                Search and add staff based on availability and monthly workload.
              </p>

              <div class="mt-3">
                <UInput
                  v-model="availableStaffSearch"
                  icon="i-lucide-search"
                  placeholder="Search staff"
                  class="w-full"
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

                    <p
                      v-if="staff.availabilityStatus === 'UNAVAILABLE'"
                      class="pt-1 text-xs text-red-500"
                    >
                      Unavailable:
                      {{ staff.unavailableBlock?.label || staff.unavailableType }}
                      <span v-if="staff.unavailableReason">
                        — {{ staff.unavailableReason }}
                      </span>
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <UButton
                      size="sm"
                      color="primary"
                      variant="soft"
                      icon="i-lucide-arrow-left"
                      :disabled="
                        staff.availabilityStatus === 'TIME_CONFLICT' ||
                        staff.availabilityStatus === 'UNAVAILABLE'
                      "
                      @click="handleAddAvailableStaff(staff)"
                    >
                      Add
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>
      <UCard>
        <template #header>
          <div
            class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
          >
            <div>
              <h2 class="text-lg font-semibold">Post Event Reports</h2>
              <p class="text-sm text-muted">
                Review completed events and document post-event results, notes,
                and feedback.
              </p>
            </div>
            <div class="mt-6 flex flex-wrap items-center justify-end gap-2">
              <UBadge
                v-if="isEvaluationSubmissionSubmitted"
                :color="eventEvaluationResultColor"
                variant="soft"
              >
                {{ eventEvaluationResultLabel }}
              </UBadge>

              <UButton
                type="button"
                :color="evaluationSubmitButtonColor"
                :variant="evaluationSubmitButtonVariant"
                :icon="evaluationSubmitButtonIcon"
                :loading="isEvaluationBundleBusy"
                @click="handleSubmitEvaluationBundle"
              >
                {{ evaluationSubmitButtonLabel }}
              </UButton>
            </div>
          </div>
        </template>
        <div class="grid gap-4 lg:grid-cols-2">
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
                <div class="flex flex-wrap gap-2">
                  <UBadge
                    :color="requiresRibbonTracking ? 'warning' : 'neutral'"
                    variant="soft"
                  >
                    Ribbon tracking:
                    {{ requiresRibbonTracking ? "Required" : "Optional" }}
                  </UBadge>
                </div>
              </div>
            </template>

            <form
              class="space-y-4"
              @submit.prevent="handleSubmitEvaluationBundle"
            >
              <div class="grid gap-4 md:grid-cols-3">
                <UFormField label="Starting Ribbon Count">
                  <UInput
                    v-model="postRibbonStart"
                    type="number"
                    :disabled="isEvaluationReadOnly"
                  />
                </UFormField>

                <UFormField label="Ending Ribbon Count">
                  <UInput
                    v-model="postRibbonEnd"
                    type="number"
                    :disabled="isEvaluationReadOnly"
                  />
                </UFormField>

                <UFormField label="Total Ribbon Used">
                  <UInput
                    :model-value="postRibbonUsed"
                    type="number"
                    disabled
                  />
                </UFormField>
              </div>

              <p v-if="postEventErrorMessage" class="text-sm text-red-500">
                {{ postEventErrorMessage }}
              </p>
            </form>
          </UCard>

          <UCard>
            <template #header>
              <div
                class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h2 class="text-lg font-semibold">Event Evaluation</h2>
                  <p class="text-sm text-muted">
                    Client satisfaction and event-level feedback.
                  </p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <UBadge
                    :color="
                      currentEvent.eventEvaluation?.clientSatisfactionOk
                        ? 'success'
                        : 'warning'
                    "
                    variant="soft"
                  >
                    <span class="font-medium">
                      {{
                        formatBoolean(
                          currentEvent.eventEvaluation?.clientSatisfactionOk,
                        )
                      }}
                    </span>
                  </UBadge>
                </div>
              </div>
            </template>

            <form
              class="space-y-4"
              @submit.prevent="handleSubmitEvaluationBundle"
            >
              <UCheckbox
                v-model="clientSatisfactionOk"
                label="Client Satisfaction OK"
                :disabled="isEvaluationReadOnly"
              />

              <UFormField label="Client Feedback">
                <UTextarea
                  v-model="clientFeedback"
                  class="w-full"
                  placeholder="Client feedback"
                  :rows="3"
                  :disabled="isEvaluationReadOnly"
                />
              </UFormField>

              <UFormField label="Internal Notes">
                <UTextarea
                  v-model="eventEvaluationNotes"
                  class="w-full"
                  placeholder="Internal notes"
                  :rows="3"
                  :disabled="isEvaluationReadOnly"
                />
              </UFormField>

              <p v-if="evaluationErrorMessage" class="text-sm text-red-500">
                {{ evaluationErrorMessage }}
              </p>
            </form>
          </UCard>
        </div>

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
                <div class="flex flex-wrap gap-2">
                  <UBadge
                    :color="getStaffEvaluationColor(assignment.staffId)"
                    :variant="getStaffEvaluationVariant(assignment.staffId)"
                  >
                    {{ getStaffEvaluationLabel(assignment.staffId) }}
                  </UBadge>
                </div>
              </div>

              <div
                v-if="staffEvaluationForms[assignment.staffId]"
                class="space-y-4"
              >
                <div class="grid gap-3 md:grid-cols-2">
                  <UCheckbox
                    v-model="staffEvaluationForms[assignment.staffId].sopOk"
                    label="SOP OK"
                    :disabled="isEvaluationReadOnly"
                  />

                  <UCheckbox
                    v-model="
                      staffEvaluationForms[assignment.staffId].warehouseOk
                    "
                    label="Warehouse OK"
                    :disabled="isEvaluationReadOnly"
                  />

                  <UCheckbox
                    v-model="
                      staffEvaluationForms[assignment.staffId].groomingOk
                    "
                    label="Grooming OK"
                    :disabled="isEvaluationReadOnly"
                  />

                  <UCheckbox
                    v-model="
                      staffEvaluationForms[assignment.staffId].dataCollectionOk
                    "
                    label="Data Collection OK"
                    :disabled="isEvaluationReadOnly"
                  />
                </div>

                <UFormField label="Notes">
                  <UTextarea
                    v-model="staffEvaluationForms[assignment.staffId].notes"
                    class="w-full"
                    placeholder="Staff evaluation notes"
                    :rows="2"
                    :disabled="isEvaluationReadOnly"
                  />
                </UFormField>
              </div>
            </div>
          </div>
        </UCard>
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
