<script setup lang="ts">
definePageMeta({
  layout: 'empty',
  title: 'Login',
})

const { fetch } = useUserSession()
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
