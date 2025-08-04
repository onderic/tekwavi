<script setup lang="ts">
import { z } from 'zod'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  phone: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['confirmTempPassword'])

const schema = z.object({
  tempPassword: z.string().min(1, 'Temporary password is required'),
})

// Form only contains tempPassword
const form = ref({
  tempPassword: '',
})

const handleSubmit = async () => {
  emit('confirmTempPassword', {
    phone: props.phone,
    tempPassword: form.value.tempPassword,
  })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
    <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
      <div class="text-center mb-6">
        <UIcon
          name="i-lucide-shield-check"
          class="w-12 h-12 mx-auto text-primary-500 mb-4"
        />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Verify Temporary Password
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Enter the temporary password we sent to {{ phone }}
        </p>
      </div>

      <UForm
        :state="form"
        :schema="schema"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <UFormField
          label="Temporary Password"
          name="tempPassword"
        >
          <UInput
            v-model="form.tempPassword"
            :disabled="loading"
            placeholder="Enter temporary password"
            autocomplete="one-time-code"
          />
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          icon="i-lucide-check-circle"
          block
          :loading="props.loading"
          :disabled="loading"
        >
          {{ loading ? 'Verifying...' : 'Verify & Continue' }}
        </UButton>

        <div class="mt-4 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Didn't receive the password?
            <NuxtLink
              to="/auth/request-reset-password"
              class="text-primary-600 hover:underline dark:text-primary-400 font-medium"
            >
              Request new one
            </NuxtLink>
          </p>
        </div>
      </UForm>
    </div>
  </div>
</template>
