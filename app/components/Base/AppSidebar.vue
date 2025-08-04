<template>
  <aside
    :class="[
      'fixed flex flex-col top-0 left-0 bg-white dark:bg-[#141C2C] border-r border-gray-200 dark:border-gray-800 h-screen transition-all duration-300 z-50 overflow-hidden print:hidden',
      'w-full md:w-60',
      isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
      // Desktop: always show
      'md:translate-x-0',
    ]"
  >
    <div class="flex items-center justify-between py-4 h-16 px-0">
      <div class="flex items-center">
        <img
          src="/logo.png"
          alt="Amaam"
          class="h-48 w-48 object-contain"
        >
      </div>

      <div class="flex-shrink-0">
        <UButton
          variant="ghost"
          icon="i-lucide-x"
          size="sm"
          class="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close sidebar"
          @click="closeSidebar"
        />
      </div>
    </div>
    <div class="flex-1 overflow-y-auto px-5 sidebar-scroll">
      <div
        v-if="(currentRole === 'developer' || currentRole === 'admin')"
        class="mb-4"
      >
        <USelectMenu
          v-model="selectedProperty"
          :items="items"
          :icon="'i-lucide-folder'"
          size="sm"
          class="w-full  py-1"
          searchable
          placeholder="Select property"
          @update:model-value="handleSelectionChange"
        >
          <template #empty>
            <div class="p-2 text-center text-sm text-gray-500 dark:text-white/70">
              <div v-if="status === 'pending'">
                Loading properties...
              </div>
              <div v-else>
                <UButton
                  variant="solid"
                  size="sm"
                  color="secondary"
                  icon="i-lucide-refresh-cw"
                  label="Refresh"
                  class="text-gray-900 dark:text-white border-gray-300 dark:border-white/30 hover:bg-gray-100 dark:hover:bg-white/10"
                  @click="refresh()"
                />
              </div>
            </div>
          </template>
        </USelectMenu>
      </div>

      <UNavigationMenu
        orientation="vertical"
        :items="menus"
        class="data-[orientation=vertical]:w-full mb-4"
      />
    </div>

    <!-- Fixed Footer -->
    <div class="flex-shrink-0">
      <div class="mt-6">
        <p class="text-xs uppercase text-gray-600 dark:text-white font-medium px-3 py-2">
          Support
        </p>
        <UNavigationMenu
          orientation="vertical"
          :items="supportMenuItems"
          class="data-[orientation=vertical]:w-full"
        />
      </div>
      <div class="border-t border-gray-200 dark:border-gray-800">
        <UDropdownMenu
          :items="userMenuItems"
          :content="{
            align: 'start',
          }"
          class="w-full py-1"
        >
          <button
            class="w-full flex items-center justify-between text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-md px-3 py-2 transition-colors duration-300"
          >
            <div class="flex items-center">
              <UAvatar
                :text="getInitials(user?.first_name ?? undefined, user?.last_name ?? undefined)"
                size="sm"
                class="mr-2"
              />
              <span class="text-sm font-medium">
                {{ user?.first_name }} {{ user?.last_name || '' }}
              </span>
            </div>
            <UIcon
              name="i-lucide-chevron-up"
              class="w-4 h-4 ml-2"
            />
          </button>
        </UDropdownMenu>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import type { Property } from '~/types/property'
import { UserRole } from '~~/shared/enums/roles'
import developerMenu from '~/menus/developer'
import adminMenu from '~/menus/admin'
import caretakerMenu from '~/menus/caretaker'
import tenantMenu from '~/menus/tenant'
import { usePropertyStore } from '~/stores/usePropertyStore'
import ownerMenu from '~/menus/owner'

type PropertyItem = {
  id: string | undefined
  label: string
  description: string
  property: Property
}

const { user } = useUserSession()
const { isDark, toggleColorMode, setColorMode, isSidebarOpen, closeSidebar } = useDashboard()
const toast = useToast()
const router = useRouter()
const route = useRoute()

const propertyStore = usePropertyStore()
const { logout } = useLogout()

const showPropertySelector = computed(() =>
  user.value?.role === UserRole.ADMIN || user.value?.role === UserRole.DEVELOPER,
)

const { data: propertiesData, status, refresh } = showPropertySelector.value
  ? useFetch<{
    properties: Property[]
  }>('/api/properties/list', {
      default: () => ({ properties: [] }),
      watch: [
        () => user.value?.ownedProperties,
        () => propertyStore.propertyChanged,
      ],
      immediate: showPropertySelector.value,
    })
  : {
      data: ref({ properties: [] }),
      status: ref('success'),
      refresh: () => Promise.resolve(),
    }

defineExpose({ refresh })

const propertyItems = computed(() => {
  if (!propertiesData.value?.properties) return []

  return propertiesData.value.properties.map(property => ({
    id: property._id,
    label: property.propertyName,
    description: property.address ? `${property.address.city}, ${property.address.country}` : '',
    property: property,
  }))
})

const items: ComputedRef<DropdownMenuItem[][]> = computed(() => [
  propertyItems.value,
  [
    {
      label: 'View All Properties',
      icon: 'i-lucide-eye',
      onSelect: () => {
        router.push('/properties/listing')
        closeOnMobile()
      },
      disabled: false,
      class: 'pointer-events-auto',
      _nonSelectable: true,
      _isActionButton: true,
    },
    {
      label: 'New Property',
      icon: 'i-lucide-plus',
      onSelect: () => {
        router.push('/properties/listing')
        closeOnMobile()
      },
      disabled: false,
      class: 'pointer-events-auto',
      _nonSelectable: true,
      _isActionButton: true,
    },
  ],
])

const selectedProperty = ref<PropertyItem | undefined>(undefined)
const isUpdatingFromStore = ref(false)
const previousSelectedProperty = ref<PropertyItem | undefined>(undefined)

watch(selectedProperty, (newValue) => {
  if (newValue && newValue.property) {
    previousSelectedProperty.value = newValue
  }
})

const handleSelectionChange = (selectedItem: any) => {
  if (selectedItem && selectedItem._isActionButton) {
    if (selectedItem.onSelect) {
      selectedItem.onSelect()
    }
    nextTick(() => {
      selectedProperty.value = previousSelectedProperty.value
    })
    return
  }

  if (selectedItem && selectedItem.property) {
    selectedProperty.value = selectedItem
    if (!isUpdatingFromStore.value) {
      propertyStore.setCurrentProperty(selectedItem.property)
      toast.add({
        title: `Switched to ${selectedItem.label}`,
        icon: 'i-lucide-building',
        color: 'primary',
      })
      closeOnMobile()

      if (route.path === '/properties/listing') {
        router.push('/properties')
      }
    }
  }
}

watch(() => propertyStore.currentProperty, (newCurrentProperty) => {
  if (newCurrentProperty && propertyItems.value.length > 0) {
    const matchingItem = propertyItems.value.find(
      item => item.id === newCurrentProperty._id,
    )

    if (matchingItem && (!selectedProperty.value || selectedProperty.value.id !== matchingItem.id)) {
      isUpdatingFromStore.value = true
      selectedProperty.value = matchingItem
      previousSelectedProperty.value = matchingItem
      nextTick(() => {
        isUpdatingFromStore.value = false
      })
    }
  }
}, { immediate: true })

watch(() => propertyItems.value, (newItems) => {
  if (propertyStore.currentProperty && propertyStore.currentProperty._id && newItems.length > 0) {
    const matchingItem = newItems.find(
      item => item.id === propertyStore.currentProperty._id,
    )

    if (matchingItem && (!selectedProperty.value || selectedProperty.value.id !== matchingItem.id)) {
      isUpdatingFromStore.value = true
      selectedProperty.value = matchingItem
      previousSelectedProperty.value = matchingItem
      nextTick(() => {
        isUpdatingFromStore.value = false
      })
    }
  }
}, { immediate: true })

watchEffect(() => {
  if (propertyItems.value.length && !selectedProperty.value) {
    if (propertyStore.currentProperty?._id) {
      const storedProperty = propertyItems.value.find(
        item => item.id === propertyStore.currentProperty?._id,
      )
      if (storedProperty) {
        selectedProperty.value = storedProperty as PropertyItem
        previousSelectedProperty.value = storedProperty as PropertyItem
        return
      }
    }
    const firstProperty = propertyItems.value[0]
    if (firstProperty) {
      selectedProperty.value = firstProperty as PropertyItem
      previousSelectedProperty.value = firstProperty as PropertyItem
      if (propertyStore.setCurrentProperty) {
        propertyStore.setCurrentProperty(firstProperty.property)
      }
    }
  }
})

provide('selectedProperty', selectedProperty)

const closeOnMobile = () => {
  if (import.meta.client && window.innerWidth < 768) {
    closeSidebar()
  }
}

router.beforeEach((to, from, next) => {
  closeOnMobile()
  next()
})

const colorModePreference = computed(() => useColorMode().preference)
const currentRole = computed(() => user.value?.role || UserRole.TENANT)

const getRoleSpecificMenus = computed((): NavigationMenuItem[] => {
  switch (currentRole.value) {
    case UserRole.ADMIN:
      return adminMenu
    case UserRole.DEVELOPER:
      return developerMenu
    case UserRole.UNIT_OWNER:
      return ownerMenu
    case UserRole.CARETAKER:
      return caretakerMenu
    case UserRole.TENANT:
      return tenantMenu
    default:
      return []
  }
})

const userMenuItems = computed<DropdownMenuItem[]>(() => [
  [
    {
      label: 'Your Profile',
      icon: 'i-lucide-user',
      to: '/profile',
    },
    {
      label: 'Account Settings',
      icon: 'i-lucide-settings',
      to: '/settings',
    },
    {
      label: 'Appearance',
      icon: 'i-lucide-palette',
      children: [
        {
          label: 'Light Mode',
          icon: 'i-lucide-sun',
          type: 'checkbox' as const,
          checked: colorModePreference.value === 'light',
          onUpdateChecked() {
            handleColorModeChange('light')
          },
          onSelect(e: Event) {
            e.preventDefault()
          },
        },
        {
          label: 'Dark Mode',
          icon: 'i-lucide-moon',
          type: 'checkbox' as const,
          checked: colorModePreference.value === 'dark',
          onUpdateChecked() {
            handleColorModeChange('dark')
          },
          onSelect(e: Event) {
            e.preventDefault()
          },
        },
        {
          label: 'System',
          icon: 'i-lucide-monitor',
          type: 'checkbox' as const,
          checked: colorModePreference.value === 'system',
          onUpdateChecked() {
            handleColorModeChange('system')
          },
          onSelect(e: Event) {
            e.preventDefault()
          },
        },
      ],
    },
  ],
  [
    {
      label: isDark.value ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      icon: isDark.value ? 'i-lucide-sun' : 'i-lucide-moon',
      onSelect(e: Event) {
        e.preventDefault()
        toggleColorMode()
        toast.add({
          title: `Switched to ${!isDark.value ? 'Dark' : 'Light'} mode`,
          icon: !isDark.value ? 'i-lucide-moon' : 'i-lucide-sun',
          color: 'primary',
        })
      },
    },
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
])

const baseMenus: NavigationMenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-home',
    to: '/dashboard',
  },
  {
    label: 'Notifications',
    icon: 'i-lucide-bell',
    to: '/notifications',
  },
  {
    label: 'Profile',
    icon: 'i-lucide-user',
    to: '/profile',
  },
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    defaultOpen: true,
    children: [
      ...(currentRole.value === UserRole.ADMIN || currentRole.value === UserRole.DEVELOPER
        ? [{
            label: 'Payments',
            to: '/settings/payment',
            onSelect: () => {},
          }]
        : []),
      {
        label: 'Security',
        to: '/settings/security',
        onSelect: () => {},
      },
      {
        label: 'Notifications',
        to: '/settings/notifications',
        onSelect: () => {},
      },
    ],
  },
]

const menus = computed(() => {
  const allItems = [
    baseMenus[0],
    ...getRoleSpecificMenus.value,
    ...baseMenus.slice(1),
  ].filter(Boolean)

  return allItems.map((item: any) => {
    const path = typeof item?.to === 'string'
      ? item.to
      : (item.to && typeof item.to === 'object' && 'path' in item.to
          ? item.to.path
          : undefined)

    return {
      ...item,
      active: Boolean(path && route.path && (
        route.path === path || route.path.startsWith(`${path}/`)
      )),
    }
  })
})

const supportMenuItems = ref([
  {
    label: 'Help Center',
    icon: 'i-lucide-help-circle',
    to: '/help',
  },
  {
    label: 'Feedback',
    icon: 'i-lucide-message-circle',
    to: '/feedback',
    badge: 'New',
  },
  {
    label: 'Documentation',
    icon: 'i-lucide-file-text',
    to: '/docs',
  },
])

function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName ? firstName.charAt(0).toUpperCase() : ''
  const last = lastName ? lastName.charAt(0).toUpperCase() : ''
  return first + (last || '')
}

function showColorModeToast(mode: 'light' | 'dark' | 'system') {
  const modeName = mode.charAt(0).toUpperCase() + mode.slice(1)

  toast.add({
    title: `${modeName} mode activated`,
    icon: mode === 'light'
      ? 'i-lucide-sun'
      : mode === 'dark'
        ? 'i-lucide-moon'
        : 'i-lucide-monitor',
    color: isDark.value ? 'info' : 'primary',
  })
}

const handleColorModeChange = (mode: 'light' | 'dark' | 'system') => {
  setColorMode(mode)
  showColorModeToast(mode)
}
</script>

<style scoped>
/* Custom scrollbar styles */
.sidebar-scroll::-webkit-scrollbar {
  width: 4px;
}

.sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.sidebar-scroll:hover::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

/* Firefox */
.sidebar-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.sidebar-scroll:hover {
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}
</style>
