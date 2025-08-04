<script setup lang="ts">
import { UserRole } from '~~/shared/enums/roles'

definePageMeta({
  layout: 'empty',
  title: 'Login',
})

const { fetch } = useUserSession()
const propertyStore = usePropertyStore()
const propertiesStore = usePropertiesStore()
const toast = useToast()
const isLoading = ref(false)

const handleLogin = async (form: { email: string, password: string }) => {
  if (isLoading.value) return

  isLoading.value = true

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: form,
    })

    // Fetch user session
    await fetch()
    const { user } = useUserSession()

    // If user is developer or admin, fetch and store properties
    if (user.value?.role === UserRole.DEVELOPER || user.value?.role === UserRole.ADMIN) {
      try {
        const { properties } = await $fetch<{ properties: any[] }>('/api/properties/list')

        if (properties && properties.length > 0) {
          // Store properties in separate store
          propertiesStore.setProperties(properties)

          // Only set current property if none exists in store
          if (!propertyStore.currentProperty) {
            await propertyStore.setCurrentProperty(properties[0])
          }
        }
      }
      catch (error) {
        console.error('Failed to fetch properties:', error)
      }
    }

    navigateTo('/', { replace: true })
  }
  catch (error) {
    if (error && typeof error === 'object' && 'statusMessage' in error) {
      toast.add({
        color: 'error',
        title: 'Login failed',
        description: error.statusMessage as string,
      })
    }
    else {
      console.error(error)
      toast.add({
        color: 'error',
        title: 'Login failed',
        description: 'An unexpected error occurred. Please try again.',
      })
    }
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthLoginForm
    :loading="isLoading"
    @login="handleLogin"
  />
</template>
