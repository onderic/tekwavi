<script setup lang="ts">
definePageMeta({
  layout: 'empty',
  title: 'Login',
})

const { fetch } = useUserSession()
const { refreshPropertySelection } = useCurrentProperty()
const toast = useToast()
const isLoading = ref(false)

const handleLogin = async (form: { phone: string, password: string }) => {
  if (isLoading.value) return

  isLoading.value = true

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: form,
    })

    await fetch()

    // Refresh property selection with new user data
    // This will either restore the previous selection (if still valid)
    // or select the first available property
    await nextTick(() => {
      refreshPropertySelection()
    })

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
