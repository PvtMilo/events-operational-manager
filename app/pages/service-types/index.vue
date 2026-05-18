<script setup>
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const name = ref("");
const description = ref("");
const isSubmitting = ref(false);
const errorMessage = ref("");

const {
  data,
  pending,
  error,
  refresh,
} = await useFetch("/api/service-types");

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
      },
    });

    name.value = "";
    description.value = "";

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

      <p v-if="errorMessage" style="color: red">
        {{ errorMessage }}
      </p>

      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? "Saving..." : "Save" }}
      </button>
    </form>

    <hr />

    <h2>Service Type List</h2>

    <p v-if="pending">Loading...</p>
    <p v-else-if="error">Failed to load service types.</p>

    <table v-else border="1" cellpadding="8" cellspacing="0">
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Created At</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item in data?.data" :key="item.id">
          <td>{{ item.name }}</td>
          <td>{{ item.description || "-" }}</td>
          <td>{{ new Date(item.createdAt).toLocaleString() }}</td>
          <td>
            <button @click="handleDelete(item.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="data?.data?.length === 0">No service types yet.</p>
  </section>
</template>