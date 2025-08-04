<template>
  <div>
    <BasePage
      title="Security Settings"
      icon="i-lucide-shield"
    >
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <UCard>
            <template #header>
              <div class="flex items-center space-x-3">
                <UIcon
                  name="i-lucide-lock"
                  class="h-5 w-5 text-gray-600"
                />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Change Password
                </h3>
              </div>
            </template>

            <div class="space-y-6">
              <UAlert
                icon="i-lucide-info"
                color="primary"
                variant="soft"
                title="Password Requirements"
                description="Your password must be at least 8 characters long and contain a mix of letters, numbers, and special characters."
              />
              <UForm
                :schema="passwordSchema"
                :state="passwordState"
                @submit="updatePassword"
              >
                <div class="space-y-4">
                  <UFormField
                    label="Current Password"
                    name="currentPassword"
                    required
                  >
                    <UInput
                      v-model="passwordState.currentPassword"
                      placeholder="Enter your current password"
                      :type="showCurrentPassword ? 'text' : 'password'"
                      :ui="{ trailing: 'pe-1' }"
                    >
                      <template #trailing>
                        <UButton
                          color="neutral"
                          variant="link"
                          size="sm"
                          :icon="showCurrentPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                          :aria-label="showCurrentPassword ? 'Hide password' : 'Show password'"
                          :aria-pressed="showCurrentPassword"
                          @click="showCurrentPassword = !showCurrentPassword"
                        />
                      </template>
                    </UInput>
                  </UFormField>

                  <UFormField
                    label="New Password"
                    name="newPassword"
                    required
                  >
                    <UInput
                      v-model="passwordState.newPassword"
                      placeholder="Enter your new password"
                      :type="showNewPassword ? 'text' : 'password'"
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
                      <span class="text-sm text-gray-600">Password Strength</span>
                      <span
                        class="text-xs font-medium"
                        :class="passwordStrengthColor"
                      >
                        {{ passwordStrengthText }}
                      </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div
                        class="h-2 rounded-full transition-all duration-300"
                        :class="passwordStrengthColor"
                        :style="{ width: `${passwordStrengthWidth}%` }"
                      />
                    </div>
                  </div>

                  <div class="flex justify-end space-x-3 pt-4">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      @click="resetForm"
                    >
                      Cancel
                    </UButton>
                    <UButton
                      type="submit"
                      color="primary"
                      :loading="loading"
                      :disabled="!isFormValid"
                    >
                      Update Password
                    </UButton>
                  </div>
                </div>
              </UForm>
            </div>
          </UCard>
        </div>

        <!-- Sidebar Cards - Stack on mobile, sidebar on large screens -->
        <div class="space-y-6">
          <!-- Security Tips -->
          <UCard>
            <template #header>
              <div class="flex items-center space-x-3">
                <UIcon
                  name="i-lucide-shield-check"
                  class="h-5 w-5 text-green-600 dark:text-green-400"
                />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Security Best Practices
                </h3>
              </div>
            </template>

            <div class="space-y-5">
              <div class="flex items-start space-x-3">
                <UIcon
                  name="i-lucide-key"
                  class="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Create a strong password
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Use a combination of uppercase, lowercase letters, numbers, and special characters. Avoid common words, personal information, or predictable patterns.
                  </p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <UIcon
                  name="i-lucide-shield-x"
                  class="h-5 w-5 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Never reuse passwords
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Each account should have a unique password. If one account gets compromised, your other accounts remain secure. Consider using a password manager to help manage multiple passwords.
                  </p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <UIcon
                  name="i-lucide-eye-off"
                  class="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Keep passwords private
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Never share your password via email, text, or phone. Legitimate services will never ask for your password. Be cautious of phishing attempts and suspicious links.
                  </p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <UIcon
                  name="i-lucide-refresh-cw"
                  class="h-5 w-5 text-purple-500 dark:text-purple-400 mt-0.5 flex-shrink-0"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Update regularly
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Change your password periodically, especially if you suspect it may have been compromised. Update immediately if you receive any security alerts.
                  </p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <UIcon
                  name="i-lucide-smartphone"
                  class="h-5 w-5 text-indigo-500 dark:text-indigo-400 mt-0.5 flex-shrink-0"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Enable two-factor authentication
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Add an extra layer of security by enabling 2FA when available. This requires a second form of verification, making your account much more secure.
                  </p>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Account Security Status -->
          <UCard>
            <template #header>
              <div class="flex items-center space-x-3">
                <UIcon
                  name="i-lucide-shield"
                  class="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Account Security
                </h3>
              </div>
            </template>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <UIcon
                    name="i-lucide-clock"
                    class="h-4 w-4 text-gray-400 dark:text-gray-500"
                  />
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Last password change
                    </p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      {{ lastPasswordChange }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <UIcon
                    name="i-lucide-log-in"
                    class="h-4 w-4 text-gray-400 dark:text-gray-500"
                  />
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Last login
                    </p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      Today at 2:30 PM
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <UIcon
                    name="i-lucide-globe"
                    class="h-4 w-4 text-gray-400 dark:text-gray-500"
                  />
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Login location
                    </p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      Current session
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </BasePage>
  </div>
</template>

<script lang="ts" setup>
import { z } from 'zod'

definePageMeta({
  title: 'Security Settings',
  layout: 'default',
})

const toast = useToast()

const loading = ref(false)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords don\'t match',
  path: ['confirmPassword'],
})

const passwordState = reactive({
  currentPassword: '',
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
  return passwordState.currentPassword
    && passwordState.newPassword
    && passwordState.confirmPassword
    && passwordState.newPassword === passwordState.confirmPassword
    && passwordState.newPassword.length >= 8
})

const lastPasswordChange = computed(() => {
  return 'Never changed'
})

const updatePassword = async () => {
  loading.value = true

  try {
    await $fetch('/api/users/profile/change-password', {
      method: 'POST',
      body: {
        currentPassword: passwordState.currentPassword,
        newPassword: passwordState.newPassword,
      },
    })

    toast.add({
      title: 'Password Updated',
      description: 'Your password has been successfully changed.',
      color: 'success',
      icon: 'i-lucide-check-circle',
    })

    resetForm()
  }
  catch (error: any) {
    toast.add({
      title: 'Password Update Failed',
      description: error?.data?.message || 'Failed to update password. Please try again.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  }
  finally {
    loading.value = false
  }
}

const resetForm = () => {
  passwordState.currentPassword = ''
  passwordState.newPassword = ''
  passwordState.confirmPassword = ''
  showCurrentPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
}
</script>
