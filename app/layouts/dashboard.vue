<script setup>
const { user, clear } = useUserSession();
const colorMode = useColorMode();
const { t, locale, setLocale } = useI18n();

const open = ref(false);
const collapsed = ref(false);
const selectedLocale = computed({
  get: () => {
    return locale.value;
  },
  set: (value) => {
    setLocale(value);
  },
});

const languageOptions = computed(() => {
  return [
    {
      label: t("common.language.english"),
      value: "en",
    },
    {
      label: t("common.language.indonesian"),
      value: "id",
    },
  ];
});

const collapsedLanguageLabel = computed(() => {
  return locale.value.toUpperCase();
});

async function handleLogout() {
  await $fetch("/api/auth/logout", {
    method: "POST",
  });

  await clear();
  await navigateTo("/login");
}

const links = computed(() => {
  const isStaff = user.value?.role === "STAFF";

  const mainLinks = [
    {
      label: t("navigation.dashboard"),
      icon: "i-lucide-house",
      to: "/dashboard",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: t("navigation.events"),
      icon: "i-lucide-calendar-days",
      to: "/events",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: t("navigation.staff"),
      icon: "i-lucide-users",
      to: "/staff",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: t("navigation.sales"),
      icon: "i-lucide-user-round",
      to: "/sales",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: t("navigation.serviceTypes"),
      icon: "i-lucide-box",
      to: "/service-types",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: t("navigation.crewSchedule"),
      icon: "i-lucide-calendar-check-2",
      to: "/crew-schedule",
      onSelect: () => {
        open.value = false;
      },
    },
  ];

  if (!isStaff) {
    mainLinks.push(
      {
        label: t("navigation.staffAvailability"),
        icon: "i-lucide-calendar-off",
        to: "/staff-availability",
        onSelect: () => {
          open.value = false;
        },
      },
      {
        label: t("navigation.reports"),
        icon: "i-lucide-chart-column",
        to: "/reports",
        onSelect: () => {
          open.value = false;
        },
      },
    );
  }

  const settingsChildren = [
    {
      label: t("navigation.appearance"),
      icon: "i-lucide-palette",
      type: "trigger",
      children: [
        {
          label: t("navigation.light"),
          icon: "i-lucide-sun",
          onSelect: () => {
            colorMode.preference = "light";
            open.value = false;
          },
        },
        {
          label: t("navigation.dark"),
          icon: "i-lucide-moon",
          onSelect: () => {
            colorMode.preference = "dark";
            open.value = false;
          },
        },
      ],
    },
    {
      label: t("navigation.changePassword"),
      icon: "i-lucide-key-round",
      to: "/change-password",
      onSelect: () => {
        open.value = false;
      },
    },
  ];

  if (!isStaff) {
    settingsChildren.unshift({
      label: t("navigation.users"),
      icon: "i-lucide-user-cog",
      to: "/users",
      onSelect: () => {
        open.value = false;
      },
    });
  }

  const settingsLinks = [
    {
      label: t("navigation.settings"),
      icon: "i-lucide-settings",
      type: "trigger",
      children: settingsChildren,
    },
  ];

  return [mainLinks, settingsLinks];
});
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      v-model:collapsed="collapsed"
      mode="slideover"
      collapsible
      resizable
      :collapsed-size="4"
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed, collapse }">
        <div class="flex items-center justify-between gap-2 px-2 py-3">
          <p v-if="!collapsed" class="font-semibold">
            {{ t("common.brand") }}
          </p>

          <p v-else class="font-semibold">
            {{ t("common.shortBrand") }}
          </p>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          popover
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <div class="p-2">
          <div class="mb-2">
            <USelect
              v-if="!collapsed"
              v-model="selectedLocale"
              :items="languageOptions"
              :aria-label="t('common.language.select')"
              icon="i-lucide-languages"
              size="sm"
              class="w-full"
            />

            <UButton
              v-else
              block
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-languages"
              :aria-label="t('common.language.switch')"
              @click="setLocale(locale === 'en' ? 'id' : 'en')"
            >
              {{ collapsedLanguageLabel }}
            </UButton>
          </div>

          <div v-if="!collapsed" class="mb-2">
            <p class="text-sm font-medium">
              {{ user?.name || "-" }}
            </p>

            <p class="text-xs text-muted">
              {{ user?.role || "-" }}
            </p>
          </div>
          <UButton
            block
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-log-out"
            @click="handleLogout"
          >
            <span v-if="!collapsed">{{ t("common.logout") }}</span>
          </UButton>
        </div>
      </template>
    </UDashboardSidebar>

    <main class="min-h-screen flex-1 overflow-auto">
      <header
        class="sticky top-0 z-10 flex items-center gap-2 border-b border-default bg-default/95 p-3 backdrop-blur lg:hidden"
      >
        <UDashboardSidebarToggle />
        <p class="font-semibold">
          {{ t("common.brand") }}
        </p>
      </header>

      <slot />
    </main>
  </UDashboardGroup>
</template>
