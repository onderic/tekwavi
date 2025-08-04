<script setup lang="ts">
definePageMeta({
  layout: 'empty',
})

const { fetch } = useUserSession()
const toast = useToast()
const isLoading = ref(false)

const handleRegister = async (form: {
  email: string
  password: string
}) => {
  try {
    if (isLoading.value) return

    isLoading.value = true
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: form,
    })
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
