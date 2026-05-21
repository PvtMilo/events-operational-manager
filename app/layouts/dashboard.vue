<script setup>
const { user, clear } = useUserSession()

const open = ref(false)

async function handleLogout() {
    await $fetch('/api/auth/logout', {
        method: 'POST',
    })

    await clear()
    await navigateTo('/login')
}

const links = computed(() => {
    const isStaff = user.value?.role === 'STAFF'

    const mainLinks = [
        {
            label: 'Dashboard',
            icon: 'i-lucide-house',
            to: '/dashboard',
            onSelect: () => {
                open.value = false
            },
        },
        {
            label: 'Events',
            icon: 'i-lucide-calendar-days',
            to: '/events',
            onSelect: () => {
                open.value = false
            },
        },
        {
            label: 'Staff',
            icon: 'i-lucide-users',
            to: '/staff',
            onSelect: () => {
                open.value = false
            },
        },
        {
            label: 'Sales',
            icon: 'i-lucide-user-round',
            to: '/sales',
            onSelect: () => {
                open.value = false
            },
        },
        {
            label: 'Service Types',
            icon: 'i-lucide-box',
            to: '/service-types',
            onSelect: () => {
                open.value = false
            },
        },
    ]

    if (!isStaff) {
        mainLinks.push({
            label: 'Reports',
            icon: 'i-lucide-chart-column',
            to: '/reports',
            onSelect: () => {
                open.value = false
            },
        })
    }

    const settingsChildren = [
        {
            label: 'Change Password',
            icon: 'i-lucide-key-round',
            to: '/change-password',
            onSelect: () => {
                open.value = false
            },
        },
    ]

    if (!isStaff) {
        settingsChildren.unshift({
            label: 'Users',
            icon: 'i-lucide-user-cog',
            to: '/users',
            onSelect: () => {
                open.value = false
            },
        })
    }

    const settingsLinks = [
        {
            label: 'Settings',
            icon: 'i-lucide-settings',
            type: 'trigger',
            children: settingsChildren,
        },
    ]

    return [mainLinks, settingsLinks]
})
</script>

<template>
    <UDashboardGroup unit="rem">
        <UDashboardSidebar id="default" v-model:open="open" collapsible resizable class="bg-elevated/25"
            :ui="{ footer: 'lg:border-t lg:border-default' }">
            <template #header="{ collapsed }">
                <div class="px-2 py-3">
                    <p v-if="!collapsed" class="font-semibold">
                        EventOps Manager
                    </p>

                    <p v-else class="font-semibold">
                        EO
                    </p>
                </div>
            </template>

            <template #default="{ collapsed }">
                <UNavigationMenu :collapsed="collapsed" :items="links[0]" orientation="vertical" tooltip popover />

                <UNavigationMenu :collapsed="collapsed" :items="links[1]" orientation="vertical" tooltip popover
                    class="mt-auto" />
            </template>

            <template #footer="{ collapsed }">
                <div class="p-2">
                    <div v-if="!collapsed" class="mb-2">
                        <p class="text-sm font-medium">
                            {{ user?.name || '-' }}
                        </p>

                        <p class="text-xs text-muted">
                            {{ user?.role || '-' }}
                        </p>
                    </div>

                    <UColorModeButton />

                    <UButton block size="sm" color="neutral" variant="ghost" icon="i-lucide-log-out"
                        @click="handleLogout">
                        <span v-if="!collapsed">Logout</span>
                    </UButton>
                </div>
            </template>
        </UDashboardSidebar>

        <main class="min-h-screen flex-1 overflow-auto">
            <slot />
        </main>
    </UDashboardGroup>
</template>