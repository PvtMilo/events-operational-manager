<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const name = ref("");
const description = ref("");
const requiresRibbonTracking = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref("");

const search = ref("");

const serviceTypesUrl = computed(() => {
  const params = new URLSearchParams();

  if (search.value) params.set("search", search.value);

  const queryString = params.toString();

  return queryString ? `/api/service-types?${queryString}` : "/api/service-types";
});

const editingId = ref("");
const editName = ref("");
const editDescription = ref("");
const editRequiresRibbonTracking = ref(false);
const isUpdating = ref(false);
const editErrorMessage = ref("");

const { data, pending, error, refresh } = await useFetch(serviceTypesUrl);

async function handleApplyFilter() {
  await refresh();
}

async function handleResetFilter() {
  search.value = "";
  await refresh();
}

async function handleCreate() {
  errorMessage.value = "";

  if (!name.value.trim()) {
    errorMessage.value = "Name is required";
    return;
  }

  isSubmitting.value = true;

  try {
    await $fetch("/api/service-types", {
      method: "POST",
      body: {
        name: name.value,
        description: description.value,
        requiresRibbonTracking: requiresRibbonTracking.value,
      },
    });

    name.value = "";
    description.value = "";
    requiresRibbonTracking.value = false;

    await refresh();
  } catch (error) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to create service type";
  } finally {
    isSubmitting.value = false;
  }
}

function startEdit(item) {
  editingId.value = item.id;
  editName.value = item.name;
  editDescription.value = item.description || "";
  editRequiresRibbonTracking.value = item.requiresRibbonTracking || false;
  editErrorMessage.value = "";
}

function cancelEdit() {
  editingId.value = "";
  editName.value = "";
  editDescription.value = "";
  editRequiresRibbonTracking.value = false;
  editErrorMessage.value = "";
}

async function handleUpdate() {
  editErrorMessage.value = "";

  if (!editName.value.trim()) {
    editErrorMessage.value = "Name is required";
    return;
  }

  isUpdating.value = true;

  try {
    await $fetch(`/api/service-types/${editingId.value}`, {
      method: "PATCH",
      body: {
        name: editName.value,
        description: editDescription.value,
        requiresRibbonTracking: editRequiresRibbonTracking.value,
      },
    });

    cancelEdit();
    await refresh();
  } catch (error) {
    editErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to update service type";
  } finally {
    isUpdating.value = false;
  }
}

async function handleDelete(id) {
  const confirmed = confirm("Delete this service type?");

  if (!confirmed) return;

  try {
    await $fetch(`/api/service-types/${id}`, {
      method: "DELETE",
    });

    await refresh();
  } catch (error) {
    alert(
      error?.data?.statusMessage ||
        error?.statusMessage ||
        "Failed to delete service type"
    );
  }
}
</script>

<template>
  <section>
    <h1>Service Types</h1>
    <p>Manage event service types.</p>

    <hr />

    <form @submit.prevent="handleCreate">
      <h2>Add Service Type</h2>

      <div>
        <label>Name</label>
        <br />
        <input
          v-model="name"
          type="text"
          placeholder="Example: AI Photobooth"
        />
      </div>

      <br />

      <div>
        <label>Description</label>
        <br />
        <textarea
          v-model="description"
          placeholder="Short description"
        ></textarea>
      </div>

      <br />

      <div>
        <label>
          <input v-model="requiresRibbonTracking" type="checkbox" />
          Requires Ribbon Tracking
        </label>
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

    <div v-if="editingId">
      <h2>Edit Service Type</h2>

      <form @submit.prevent="handleUpdate">
        <div>
          <label>Name</label>
          <br />
          <input v-model="editName" type="text" />
        </div>

        <br />

        <div>
          <label>Description</label>
          <br />
          <textarea v-model="editDescription"></textarea>
        </div>

        <br />

        <div>
          <label>
            <input v-model="editRequiresRibbonTracking" type="checkbox" />
            Requires Ribbon Tracking
          </label>
        </div>

        <br />

        <p v-if="editErrorMessage" style="color: red">
          {{ editErrorMessage }}
        </p>

        <button type="submit" :disabled="isUpdating">
          {{ isUpdating ? "Updating..." : "Update" }}
        </button>

        <button type="button" @click="cancelEdit">
          Cancel
        </button>
      </form>
    </div>

    <hr />

    <h2>Filter Service Types</h2>

    <form @submit.prevent="handleApplyFilter">
      <div>
        <label>Search</label>
        <br />
        <input
          v-model="search"
          type="text"
          placeholder="Search name or description"
        />
      </div>

      <br />

      <button type="submit">Apply Filter</button>
      <button type="button" @click="handleResetFilter">Reset</button>
    </form>

    <hr />

    <h2>Service Type List</h2>

    <p v-if="pending">Loading...</p>
    <p v-else-if="error">Failed to load service types.</p>

    <table v-else border="1" cellpadding="8" cellspacing="0">
      <thead>
        <tr>
          <th>Name</th>
          <th>Ribbon Tracking</th>
          <th>Description</th>
          <th>Created At</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item in data?.data" :key="item.id">
          <td>{{ item.name }}</td>
          <td>{{ item.requiresRibbonTracking ? "Yes" : "No" }}</td>
          <td>{{ item.description || "-" }}</td>
          <td>{{ new Date(item.createdAt).toLocaleString() }}</td>
          <td>
            <button type="button" @click="startEdit(item)">Edit</button>
            |
            <button type="button" @click="handleDelete(item.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="data?.data?.length === 0">No service types yet.</p>
  </section>
</template>