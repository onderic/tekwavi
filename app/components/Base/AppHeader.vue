<template>
  <header class="sticky top-0 z-50 flex flex-col w-full bg-[#FFFFFF] border-gray-200 dark:border-gray-800 dark:bg-gray-900 border-b print:hidden">
    <div class="flex items-center justify-between grow lg:px-6 px-2.5">
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-menu"
          class="md:hidden w-6 h-6"
          aria-label="Toggle sidebar"
          @click="toggleSidebar"
        />

        <template v-if="loading">
          <USkeleton class="shrink-0 w-7 h-7 hidden lg:block rounded-full" />
        </template>
        <template v-else>
          <UIcon
            :name="icon || 'i-lucide-panel-left-close'"
            class="shrink-0 w-5 h-5 hidden md:block"
          />
        </template>

        <div class="flex items-center">
          <template v-if="loading">
            <USkeleton class="h-7 w-40 rounded-md hidden lg:block" />
          </template>
          <template v-else>
            <h1 class="text-lg text-gray-800 dark:text-white font-medium">
              <slot name="title">
                {{ title }}
              </slot>
            </h1>
            <slot name="titleSuffix" />
          </template>
        </div>
      </div>

      <div class="flex items-center justify-end lg:py-4 py-2.5">
        <template v-if="showDashboardControls">
          <UButton
            variant="ghost"
            icon="i-lucide-bell"
            class="relative"
            aria-label="Notifications"
            @click="toggleNotificationsSlideOver"
          >
            <span class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
          </UButton>

          <UDropdownMenu :items="colorModeItems">
            <UButton
              variant="ghost"
              :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
              aria-label="Color mode options"
              class="relative"
            />
          </UDropdownMenu>

          <div class="flex items-center ml-4">
            <UDropdownMenu :items="userMenuItems">
              <button
                class="flex items-center focus:outline-none"
                aria-label="User menu"
              >
                <UAvatar
                  :text="getInitials(user?.first_name ?? undefined, user?.last_name ?? undefined)"
                  size="md"
                />
                <span class="ml-2 hidden md:inline">{{ user?.first_name }} {{ user?.last_name || '' }}</span>
                <UIcon
                  name="i-lucide-chevron-down"
                  class="w-4 h-4 ml-1"
                />
              </button>
            </UDropdownMenu>
          </div>
        </template>

        <div class="min-h-[2.0rem] flex items-center gap-2">
          <!-- <template v-if="loading">
            <div class="flex items-center gap-2">
              <USkeleton class="h-7 w-32 rounded-md" />
            </div>
          </template> -->
          <template v-if="actions && actions.length > 0 && !hasActionsSlot">
            <component
              :is="action"
              v-for="(action, index) in actions"
              :key="index"
            />
          </template>

          <slot
            v-else
            name="actions"
          >
            <span
              v-if="!showDashboardControls && (!actions || actions.length === 0)"
              class="inline-block opacity-0"
            >&nbsp;</span>
          </slot>
        </div>

        <BaseNotificationsSlideover />
      </div>
    </div>

    <div
      v-if="showDashboardControls && (user?.role === 'developer' || user?.role === 'admin')"
      class="w-full border-t border-gray-200 dark:border-gray-800 print:hidden"
    >
      <div class="flex items-start justify-start py-2 px-4">
        <div class="flex items-start gap-3">
          <BaseDateRangePicker />
          <BasePeriodSelect />
        </div>
      </div>
    </div>

    <UProgress
      v-if="loading"
      size="xs"
      class="w-full"
      color="primary"
    />
  </header>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

const {
  toggleNotificationsSlideOver,
  isDark,
  setColorMode,
  toggleSidebar,
} = useDashboard()

const { user } = useUserSession()
const { logout } = useLogout()

const props = withDefaults(defineProps<{
  title?: string
  icon?: string
  actions?: any[]
  forceDashboard?: boolean
  hideUserMenu?: boolean
  loading?: boolean
}>(), {
  title: '',
  icon: '',
  hideUserMenu: false,
  loading: false,
})

const slots = useSlots()
const hasActionsSlot = computed(() => !!slots.actions)
const showDashboardControls = computed(() => {
  const route = useRoute()
  return props.forceDashboard || route.path === '/'
})

const toast = useToast()
const colorMode = useColorMode()
function showColorModeToast(mode: 'light' | 'dark' | 'system') {
  const modeName = mode.charAt(0).toUpperCase() + mode.slice(1)
  toast.add({
    title: `${modeName} mode activated`,
    icon: mode === 'light'
      ? 'i-lucide-sun'
      : mode === 'dark' ? 'i-lucide-moon' : 'i-lucide-monitor',
    color: isDark.value ? 'info' : 'primary',
  })
}

const colorModeItems = computed(() => [
  [
    {
      label: 'Light Mode',
      icon: 'i-lucide-sun',
      type: 'checkbox' as const,
      checked: colorMode.preference === 'light',
      onUpdateChecked() {
        setColorMode('light')
        showColorModeToast('light')
      },
      onSelect(e: Event) {
        e.preventDefault()
      },
    },
    {
      label: 'Dark Mode',
      icon: 'i-lucide-moon',
      type: 'checkbox' as const,
      checked: colorMode.preference === 'dark',
      onUpdateChecked() {
        setColorMode('dark')
        showColorModeToast('dark')
      },
      onSelect(e: Event) {
        e.preventDefault()
      },
    },
    {
      label: 'System',
      icon: 'i-lucide-monitor',
      type: 'checkbox' as const,
      checked: colorMode.preference === 'system',
      onUpdateChecked() {
        setColorMode('system')
        showColorModeToast('system')
      },
      onSelect(e: Event) {
        e.preventDefault()
      },
    },
  ],
])

const userMenuItems = [
  [
    {
      label: 'Profile',
      icon: 'i-lucide-user',
      to: '/profile',
    },
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      to: '/settings',
    },
  ],
  [
    {
      label: 'Logout',
      icon: 'i-lucide-log-out',
      color: 'error',
      async onSelect(e: Event) {
        e.preventDefault()
        await logout()
      },
    },
  ],
]

const { dateRange, selectedPeriod } = useDateRange()

// Watch for changes to emit or handle date range and period changes
watch([dateRange, selectedPeriod], ([newRange, newPeriod]) => {
  // You can emit these values or handle them as needed
  console.log('Date range changed:', newRange)
  console.log('Period changed:', newPeriod)
}, { deep: true })

function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName ? firstName.charAt(0).toUpperCase() : ''
  const last = lastName ? lastName.charAt(0).toUpperCase() : ''
  return first + (last || '')
}
</script>
