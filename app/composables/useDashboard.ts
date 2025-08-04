import { createSharedComposable } from '@vueuse/core'

const useUIState = () => {
  // Notifications state
  const isNotificationsSlideoverOpen = ref(false)

  const toggleNotificationsSlideOver = () => {
    isNotificationsSlideoverOpen.value = !isNotificationsSlideoverOpen.value
  }

  // Sidebar state - initialize based on screen size
  const isSidebarOpen = ref(false)

  const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  const closeSidebar = () => {
    isSidebarOpen.value = false
  }

  const openSidebar = () => {
    isSidebarOpen.value = true
  }

  // Color mode state
  const colorMode = useColorMode()
  const isDark = computed(() => colorMode.value === 'dark')

  const toggleColorMode = () => {
    colorMode.preference = isDark.value ? 'light' : 'dark'
  }

  const setColorMode = (mode: 'light' | 'dark' | 'system') => {
    colorMode.preference = mode
  }

  return {
    // Notifications
    isNotificationsSlideoverOpen,
    toggleNotificationsSlideOver,

    // Sidebar
    isSidebarOpen,
    toggleSidebar,
    closeSidebar,
    openSidebar,

    // Color mode
    isDark,
    toggleColorMode,
    setColorMode,
  }
}

export const useDashboard = createSharedComposable(useUIState)
