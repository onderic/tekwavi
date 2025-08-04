<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <UCard class="max-w-7xl w-full">
      <template #header>
        <div class="mb-6 text-center">
          <h2 class="text-2xl font-bold">
            Complete Your Profile
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Please provide the missing information to complete your account setup
          </p>
        </div>
      </template>
      <UForm
        :schema="validationSchema"
        :state="formState"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField
              label="First Name"
              name="first_name"
            >
              <UInput
                v-model="formState.first_name"
                placeholder="John"
              />
            </UFormField>

            <UFormField
              label="Last Name"
              name="last_name"
            >
              <UInput
                v-model="formState.last_name"
                placeholder="Doe"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField
              label="City"
              name="address.city"
            >
              <UInput
                v-model="formState.address.city"
                placeholder="San Francisco"
              />
            </UFormField>

            <UFormField
              label="State/Province"
              name="address.state"
            >
              <UInput
                v-model="formState.address.state"
                placeholder="California"
              />
            </UFormField>
          </div>

          <UFormField
            label="Street Address"
            name="address.street"
          >
            <UTextarea
              v-model="formState.address.street"
              class="w-full"
              placeholder="123 Main St"
            />
          </UFormField>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <UButton
            type="submit"
            color="primary"
            label="Complete Registration"
            :loading="loading"
          />
        </div>
      </UForm>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({
  layout: 'empty',
})

const loading = ref(false)
const toast = useToast()
const { user } = useUserSession()

const validationSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State/Province is required'),
  }),
})

type Schema = z.infer<typeof validationSchema>

const formState = reactive<Schema>({
  first_name: user.value?.first_name || '',
  last_name: user.value?.last_name || '',
  phone: user.value?.phone || '',
  address: {
    street: user.value?.address?.street || '',
    city: user.value?.address?.city || '',
    state: user.value?.address?.state || '',
  },
})

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  loading.value = true

  try {
    const response = await $fetch('/api/users/complete-registration', {
      method: 'POST',
      body: {
        first_name: event.data.first_name,
        last_name: event.data.last_name,
        phone: event.data.phone,
        address: {
          street: event.data.address.street,
          city: event.data.address.city,
          state: event.data.address.state,
        },
        isVerified: true,
      },
    })

    toast.add({
      title: 'Registration Completed',
      description: 'Your profile has been successfully updated.',
      color: 'success',
      icon: 'i-heroicons-check-circle',
    })

    if (response.user && user.value) {
      Object.assign(user.value, response.user)
    }

    setTimeout(() => {
      navigateTo('/')
    }, 1000)
  }
  catch (error: any) {
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Failed to update profile. Please try again.',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle',
    })
    console.error('Error updating profile:', error)
  }
  finally {
    loading.value = false
  }
}
</script>
