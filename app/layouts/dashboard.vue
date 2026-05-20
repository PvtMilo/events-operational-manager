<script setup>
const { user, clear } = useUserSession();

async function handleLogout() {
  await $fetch("/api/auth/logout", {
    method: "POST",
  });

  await clear();
  await navigateTo("/login");
}
</script>

<template>
  <div>
    <aside>
      <h2>EventOps Manager</h2>

      <nav>
        <ul>
          <li>
            <NuxtLink to="/dashboard">Dashboard</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/events">Events</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/staff">Staff</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/sales">Sales</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/service-types">Service Types</NuxtLink>
          </li>
          <li v-if="user?.role !== 'STAFF'">
            <NuxtLink to="/reports">Reports</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/users">Users</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/change-password">Change Password</NuxtLink>
          </li>
        </ul>
      </nav>
    </aside>

    <main>
      <header>
        <p>Login as: {{ user?.name }} - {{ user?.role }}</p>
        <button @click="handleLogout">Logout</button>
      </header>

      <hr />

      <slot />
    </main>
  </div>
</template>
