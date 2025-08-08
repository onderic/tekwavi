<script setup lang="ts">
definePageMeta({
  layout: 'empty',
  title: 'Request Password Reset',
})

const toast = useToast()
const isLoading = ref(false)

const handleRequestReset = async (form: { phone: string }) => {
  if (isLoading.value) return

  isLoading.value = true

  try {
    await $fetch('/api/auth/request-reset-password', {
      method: 'POST',
      body: form,
    })

    toast.add({
      color: 'success',
      title: 'Temporary Password Sent',
      description: `A temporary password has been sent to ${form.phone}`,
    })
    sessionStorage.setItem('temp-password-phone', form.phone)

    navigateTo('/auth/confirm-temp-password', { replace: true })
  }
  catch (error) {
    if (error && typeof error === 'object' && 'statusMessage' in error) {
      toast.add({
        color: 'error',
        title: 'Request failed',
        description: error.statusMessage as string,
      })
    }
    else {
      console.error(error)
      toast.add({
        color: 'error',
        title: 'Request failed',
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
  <AuthRequestResetPassword
    :loading="isLoading"
    @request-reset="handleRequestReset"
  />
</template>
