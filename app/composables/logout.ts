import { usePropertyStore } from '~/stores/usePropertyStore'

export const useLogout = () => {
  const { clear } = useUserSession()
  const propertyStore = usePropertyStore()
  const toast = useToast()

  const logout = async () => {
    await clear()
    propertyStore.currentProperty = null
    if (import.meta.client) {
      localStorage.removeItem('currentProperty')
    }

    toast.add({
      title: 'Logged out successfully',
      description: 'You have been logged out.',
    })

    await navigateTo('/auth/login', {
      replace: true,
      external: false,
    })

    $fetch('/api/auth/logout', {
      method: 'POST',
    }).catch(console.error)
  }

  return {
    logout,
  }
}
