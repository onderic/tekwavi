<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const _props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['register'])

const schema = z
  .object({
    phone: z.string()
      .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
      .refine(val => val.trim().length > 0, 'Phone number is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords don\'t match',
    path: ['confirmPassword'],
  })

const form = ref({
  phone: '',
  password: '',
  confirmPassword: '',
  first_name: '',
  last_name: '',
  email: '',
})

const handleSubmit = async (event: FormSubmitEvent<any>) => {
  const { confirmPassword, ...registerData } = event.data

  if (!registerData.email || registerData.email.trim() === '') {
    delete registerData.email
  }

  emit('register', registerData)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
    <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
      <h1 class="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
        Create an Account
      </h1>

      <UForm
        :state="form"
        :schema="schema"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <UFormField
          label="Phone Number"
          name="phone"
          required
        >
          <UInput
            v-model="form.phone"
            :disabled="loading"
            autocomplete="tel"
            placeholder="e.g. 0712345678"
          />
        </UFormField>

        <UFormField
          label="Email (Optional)"
          name="email"
        >
          <UInput
            v-model="form.email"
            type="email"
            :disabled="loading"
            autocomplete="email"
            placeholder="john@example.com"
          />
        </UFormField>

        <UFormField
          label="Password"
          name="password"
          required
        >
          <UInput
            v-model="form.password"
            type="password"
            :disabled="loading"
            autocomplete="new-password"
          />
        </UFormField>

        <UFormField
          label="Confirm Password"
          name="confirmPassword"
          required
        >
          <UInput
            v-model="form.confirmPassword"
            type="password"
            :disabled="loading"
            autocomplete="new-password"
          />
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          icon="i-lucide:user-plus"
          block
          :loading="loading"
          :disabled="loading"
        >
          {{ loading ? 'Creating Account...' : 'Create Account' }}
        </UButton>

        <div class="mt-4 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?
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
