<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const name = ref("");
const phone = ref("");
const notes = ref("");
const status = ref("ACTIVE");

const isSubmitting = ref(false);
const errorMessage = ref("");

const search = ref("");
const filterStatus = ref("");

const salesUrl = computed(() => {
  const params = new URLSearchParams();

  if (search.value) params.set("search", search.value);
  if (filterStatus.value) params.set("status", filterStatus.value);

  const queryString = params.toString();

  return queryString ? `/api/sales?${queryString}` : "/api/sales";
});

const editingId = ref("");
const editName = ref("");
const editPhone = ref("");
const editNotes = ref("");
const editStatus = ref("ACTIVE");
const isUpdating = ref(false);
const editErrorMessage = ref("");

const { data, pending, error, refresh } = await useFetch(salesUrl);

async function handleApplyFilter() {
  await refresh();
}

async function handleResetFilter() {
  search.value = "";
  filterStatus.value = "";

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
    await $fetch("/api/sales", {
      method: "POST",
      body: {
        name: name.value,
        phone: phone.value,
        notes: notes.value,
        status: status.value,
      },
    });

    name.value = "";
    phone.value = "";
    notes.value = "";
    status.value = "ACTIVE";

    await refresh();
  } catch (error) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to create sales";
  } finally {
    isSubmitting.value = false;
  }
}

function startEdit(item) {
  editingId.value = item.id;
  editName.value = item.name;
  editPhone.value = item.phone || "";
  editNotes.value = item.notes || "";
  editStatus.value = item.status || "ACTIVE";
  editErrorMessage.value = "";
}

function cancelEdit() {
  editingId.value = "";
  editName.value = "";
  editPhone.value = "";
  editNotes.value = "";
  editStatus.value = "ACTIVE";
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
    await $fetch(`/api/sales/${editingId.value}`, {
      method: "PATCH",
      body: {
        name: editName.value,
        phone: editPhone.value,
        notes: editNotes.value,
        status: editStatus.value,
      },
    });

    cancelEdit();
    await refresh();
  } catch (error) {
    editErrorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to update sales";
  } finally {
    isUpdating.value = false;
  }
}

async function handleDelete(id) {
  const confirmed = confirm("Delete this sales?");

  if (!confirmed) return;

  try {
    await $fetch(`/api/sales/${id}`, {
      method: "DELETE",
    });

    await refresh();
  } catch (error) {
    alert(
      error?.data?.statusMessage ||
        error?.statusMessage ||
        "Failed to delete sales"
    );
  }
}
</script>

<template>
  <section>
    <h1>Sales</h1>
    <p>Manage sales data.</p>

    <hr />

    <form @submit.prevent="handleCreate">
      <h2>Add Sales</h2>

      <div>
        <label>Name</label>
        <br />
        <input v-model="name" type="text" placeholder="Example: Samuel" />
      </div>

      <br />

      <div>
        <label>Phone</label>
        <br />
        <input v-model="phone" type="text" placeholder="Example: 08123456789" />
      </div>

      <br />

      <div>
        <label>Status</label>
        <br />
        <select v-model="status">
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
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

    <div v-if="editingId">
      <h2>Edit Sales</h2>

      <form @submit.prevent="handleUpdate">
        <div>
          <label>Name</label>
          <br />
          <input v-model="editName" type="text" />
        </div>

        <br />

        <div>
          <label>Phone</label>
          <br />
          <input v-model="editPhone" type="text" />
        </div>

        <br />

        <div>
          <label>Status</label>
          <br />
          <select v-model="editStatus">
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        <br />

        <div>
          <label>Notes</label>
          <br />
          <textarea v-model="editNotes"></textarea>
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

    <h2>Filter Sales</h2>

    <form @submit.prevent="handleApplyFilter">
      <div>
        <label>Search</label>
        <br />
        <input
          v-model="search"
          type="text"
          placeholder="Search name, phone, notes"
        />
      </div>

      <br />

      <div>
        <label>Status</label>
        <br />
        <select v-model="filterStatus">
          <option value="">All Status</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      <br />

      <button type="submit">Apply Filter</button>
      <button type="button" @click="handleResetFilter">Reset</button>
    </form>

    <hr />

    <h2>Sales List</h2>

    <p v-if="pending">Loading...</p>
    <p v-else-if="error">Failed to load sales.</p>

    <table v-else border="1" cellpadding="8" cellspacing="0">
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>Status</th>
          <th>Notes</th>
          <th>Created At</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item in data?.data" :key="item.id">
          <td>{{ item.name }}</td>
          <td>{{ item.phone || "-" }}</td>
          <td>{{ item.status }}</td>
          <td>{{ item.notes || "-" }}</td>
          <td>{{ new Date(item.createdAt).toLocaleString() }}</td>
          <td>
            <button type="button" @click="startEdit(item)">Edit</button>
            |
            <button type="button" @click="handleDelete(item.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="data?.data?.length === 0">No sales yet.</p>
  </section>
</template>