<script setup lang="ts">
import { z } from 'zod'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['login'])

const schema = z.object({
  phone: z.string()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
    .refine(val => val.trim().length > 0, 'Phone number is required'),
  password: z.string().min(1, 'Password is required'),
})

const form = ref({
  phone: '',
  password: '',
})

const handleSubmit = async () => {
  emit('login', form.value)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
    <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
      <h1 class="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
        Sign In
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
        >
          <UInput
            v-model="form.phone"
            :disabled="loading"
            autocomplete="tel"
            placeholder="e.g. 0712345678"
          />
        </UFormField>

        <UFormField
          label="Password"
          name="password"
        >
          <UInput
            v-model="form.password"
            type="password"
            :disabled="loading"
            autocomplete="current-password"
          />
        </UFormField>
        <div class="flex justify-end">
          <NuxtLink
            to="/auth/request-reset-password"
            class="text-sm text-primary-600 hover:underline dark:text-primary-400 font-medium"
          >
            Forgot your password?
          </NuxtLink>
        </div>

        <UButton
          type="submit"
          color="primary"
          icon="i-lucide:unlock"
          block
          :loading="props.loading"
          :disabled="loading"
        >
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </UButton>

        <div class="mt-4 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?
            <NuxtLink
              to="/auth/register"
              class="text-primary-600 hover:underline dark:text-primary-400 font-medium"
            >
              Register here
            </NuxtLink>
          </p>
        </div>
      </UForm>
    </div>
  </div>
</template>
