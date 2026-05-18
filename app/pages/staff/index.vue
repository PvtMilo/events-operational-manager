<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const name = ref("");
const phone = ref("");
const defaultRole = ref("JUNIOR_CREW");
const canBeAssignedToEvent = ref(true);
const status = ref("ACTIVE");
const notes = ref("");

const isSubmitting = ref(false);
const errorMessage = ref("");

const { data, pending, error, refresh } = await useFetch("/api/staff");

async function handleCreate() {
  errorMessage.value = "";

  if (!name.value.trim()) {
    errorMessage.value = "Name is required";
    return;
  }

  isSubmitting.value = true;

  try {
    await $fetch("/api/staff", {
      method: "POST",
      body: {
        name: name.value,
        phone: phone.value,
        defaultRole: defaultRole.value,
        canBeAssignedToEvent: canBeAssignedToEvent.value,
        status: status.value,
        notes: notes.value,
      },
    });

    name.value = "";
    phone.value = "";
    defaultRole.value = "JUNIOR_CREW";
    canBeAssignedToEvent.value = true;
    status.value = "ACTIVE";
    notes.value = "";

    await refresh();
  } catch (error) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "Failed to create staff";
  } finally {
    isSubmitting.value = false;
  }
}

async function handleDelete(id) {
  const confirmed = confirm("Delete this staff?");

  if (!confirmed) return;

  try {
    await $fetch(`/api/staff/${id}`, {
      method: "DELETE",
    });

    await refresh();
  } catch (error) {
    alert(
      error?.data?.statusMessage ||
        error?.statusMessage ||
        "Failed to delete staff"
    );
  }
}
</script>

<template>
  <section>
    <h1>Staff</h1>
    <p>Manage operational staff data.</p>

    <hr />

    <form @submit.prevent="handleCreate">
      <h2>Add Staff</h2>

      <div>
        <label>Name</label>
        <br />
        <input v-model="name" type="text" placeholder="Example: Andi" />
      </div>

      <br />

      <div>
        <label>Phone</label>
        <br />
        <input v-model="phone" type="text" placeholder="Example: 08123456789" />
      </div>

      <br />

      <div>
        <label>Default Role</label>
        <br />
        <select v-model="defaultRole">
          <option value="PIC">PIC</option>
          <option value="SENIOR_CREW">SENIOR_CREW</option>
          <option value="JUNIOR_CREW">JUNIOR_CREW</option>
          <option value="INHOUSE">INHOUSE</option>
        </select>
      </div>

      <br />

      <div>
        <label>
          <input v-model="canBeAssignedToEvent" type="checkbox" />
          Can be assigned to event
        </label>
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

    <h2>Staff List</h2>

    <p v-if="pending">Loading...</p>
    <p v-else-if="error">Failed to load staff.</p>

    <table v-else border="1" cellpadding="8" cellspacing="0">
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>Default Role</th>
          <th>Can Assign</th>
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
          <td>{{ item.defaultRole }}</td>
          <td>{{ item.canBeAssignedToEvent ? "Yes" : "No" }}</td>
          <td>{{ item.status }}</td>
          <td>{{ item.notes || "-" }}</td>
          <td>{{ new Date(item.createdAt).toLocaleString() }}</td>
          <td>
            <button @click="handleDelete(item.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="data?.data?.length === 0">No staff yet.</p>
  </section>
</template>