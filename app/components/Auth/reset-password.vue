<script setup lang="ts">
import { z } from 'zod'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['resetPassword'])

const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords don\'t match',
  path: ['confirmPassword'],
})

const passwordState = reactive({
  newPassword: '',
  confirmPassword: '',
})

const passwordStrength = computed(() => {
  const password = passwordState.newPassword
  if (!password) return 0

  let strength = 0
  if (password.length >= 8) strength += 40
  if (/[a-z]/.test(password)) strength += 15
  if (/[A-Z]/.test(password)) strength += 15
  if (/\d/.test(password)) strength += 15
  if (/[@$!%*?&]/.test(password)) strength += 15

  return Math.min(strength, 100)
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 40) return 'Basic'
  if (strength <= 60) return 'Fair'
  if (strength <= 80) return 'Good'
  return 'Strong'
})

const passwordStrengthColor = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 40) return 'bg-yellow-500 text-yellow-600'
  if (strength <= 60) return 'bg-blue-400 text-blue-600'
  if (strength <= 80) return 'bg-blue-500 text-blue-600'
  return 'bg-green-500 text-green-600'
})

const passwordStrengthWidth = computed(() => passwordStrength.value)

const isFormValid = computed(() => {
  return passwordState.newPassword
    && passwordState.confirmPassword
    && passwordState.newPassword === passwordState.confirmPassword
    && passwordState.newPassword.length >= 8
})

const handleSubmit = async () => {
  emit('resetPassword', {
    newPassword: passwordState.newPassword,
  })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
    <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
      <div class="text-center mb-6">
        <UIcon
          name="i-lucide-lock-keyhole"
          class="w-12 h-12 mx-auto text-primary-500 mb-4"
        />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Create New Password
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Your identity has been verified. Please create a new password for your account.
        </p>
      </div>

      <UForm
        :schema="passwordSchema"
        :state="passwordState"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <UFormField
          label="New Password"
          name="newPassword"
          required
        >
          <UInput
            v-model="passwordState.newPassword"
            placeholder="Enter your new password"
            :type="showNewPassword ? 'text' : 'password'"
            :disabled="loading"
            :ui="{ trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="showNewPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="showNewPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showNewPassword"
                @click="showNewPassword = !showNewPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <UFormField
          label="Confirm New Password"
          name="confirmPassword"
          required
        >
          <UInput
            v-model="passwordState.confirmPassword"
            placeholder="Confirm your new password"
            :type="showConfirmPassword ? 'text' : 'password'"
            :disabled="loading"
            :ui="{ trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showConfirmPassword"
                @click="showConfirmPassword = !showConfirmPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <!-- Password Strength Indicator -->
        <div
          v-if="passwordState.newPassword"
          class="space-y-2"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Password Strength</span>
            <span
              class="text-xs font-medium"
              :class="passwordStrengthColor"
            >
              {{ passwordStrengthText }}
            </span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all duration-300"
              :class="passwordStrengthColor"
              :style="{ width: `${passwordStrengthWidth}%` }"
            />
          </div>
        </div>

        <UButton
          type="submit"
          color="primary"
          icon="i-lucide-check"
          block
          :loading="props.loading"
          :disabled="loading || !isFormValid"
        >
          {{ loading ? 'Setting Password...' : 'Set New Password' }}
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
