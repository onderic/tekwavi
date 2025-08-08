<script setup lang="ts">
definePageMeta({
  layout: 'empty',
  title: 'Reset Password',
})

const toast = useToast()
const isLoading = ref(false)

const { fetch } = useUserSession()

const handleResetPassword = async (form: { newPassword: string }) => {
  if (isLoading.value) return

  isLoading.value = true

  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: form,
    })

    toast.add({
      color: 'success',
      title: 'Password Reset Successful',
      description: 'Your password has been reset successfully. You are now logged in.',
    })

    await fetch()
    navigateTo('/', { replace: true })
  }
  catch (error) {
    if (error && typeof error === 'object' && 'statusMessage' in error) {
      toast.add({
        color: 'error',
        title: 'Reset failed',
        description: error.statusMessage as string,
      })
    }
    else {
      console.error(error)
      toast.add({
        color: 'error',
        title: 'Reset failed',
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
  <AuthResetPassword
    :loading="isLoading"
    @reset-password="handleResetPassword"
  />
</template>
