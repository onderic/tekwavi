<script setup lang="ts">
definePageMeta({
  layout: 'empty',
  title: 'Confirm Temporary Password',
})

const route = useRoute()
const toast = useToast()
const isLoading = ref(false)

// Get phone number from query params
const phone = computed(() => route.query.phone as string || '')

const handleConfirmTempPassword = async (form: { phone: string, tempPassword: string }) => {
  if (isLoading.value) return

  isLoading.value = true

  try {
    await $fetch('/api/auth/confirm-temp-password', {
      method: 'POST',
      body: form,
    })

    toast.add({
      color: 'success',
      title: 'Temporary Password Verified',
      description: 'Now create your new password.',
    })

    // Navigate to actual reset password page
    navigateTo('/auth/reset-password', { replace: true })
  }
  catch (error) {
    if (error && typeof error === 'object' && 'statusMessage' in error) {
      toast.add({
        color: 'error',
        title: 'Verification failed',
        description: error.statusMessage as string,
      })
    }
    else {
      console.error(error)
      toast.add({
        color: 'error',
        title: 'Verification failed',
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
  <ClientOnly>
    <AuthConfirmTempPassword
      :loading="isLoading"
      :phone="phone"
      @confirm-temp-password="handleConfirmTempPassword"
    />
  </ClientOnly>
</template>
