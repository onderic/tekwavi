<script setup lang="ts">
import { z } from 'zod'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['requestReset'])

const schema = z.object({
  phone: z.string()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
    .refine(val => val.trim().length > 0, 'Phone number is required'),
})

const form = ref({
  phone: '',
})

const handleSubmit = async () => {
  emit('requestReset', form.value)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
    <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
      <div class="text-center mb-6">
        <UIcon
          name="i-lucide-key-round"
          class="w-12 h-12 mx-auto text-primary-500 mb-4"
        />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Reset Password
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Enter your phone number to receive a password reset code
        </p>
      </div>

      <UForm
        :state="form"
        :schema="schema"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <UFormField
          label="Phone Number"
          name="phone"
        >
          <UInput
            v-model="form.phone"
            :disabled="loading"
            autocomplete="tel"
            placeholder="e.g. 0712345678"
          />
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          icon="i-lucide-send"
          block
          :loading="props.loading"
          :disabled="loading"
        >
          {{ loading ? 'Sending Reset Code...' : 'Send Reset Code' }}
        </UButton>

        <div class="mt-4 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Remember your password?
            <NuxtLink
              to="/auth/login"
              class="text-primary-600 hover:underline dark:text-primary-400 font-medium"
            >
              Sign in here
            </NuxtLink>
          </p>
        </div>
      </UForm>
    </div>
  </div>
</template>
