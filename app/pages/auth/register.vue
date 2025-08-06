<script setup lang="ts">
definePageMeta({
  layout: 'empty',
  title: 'Register',
})

const { fetch } = useUserSession()
const toast = useToast()
const isLoading = ref(false)

const handleRegister = async (form: {
  phone: string
  password: string
  first_name: string
  last_name: string
  email: string
}) => {
  if (isLoading.value) return

  isLoading.value = true

  try {
    await $fetch('/api/auth/register', {
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
        title: 'Registration failed',
        description: error.statusMessage as string,
      })
    }
    else {
      console.error(error)
      toast.add({
        color: 'error',
        title: 'Registration failed',
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
  <AuthRegisterForm
    :loading="isLoading"
    @register="handleRegister"
  />
</template>
