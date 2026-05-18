<script setup>
const { loggedIn } = useUserSession();

if (loggedIn.value) {
  await navigateTo("/dashboard");
} else {
  await navigateTo("/login");
}
</script>

<template>
  <div></div>
</template>