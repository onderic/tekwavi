<template>
  <div>
    <BasePage
      title="Notification Settings"
      icon="i-lucide-bell"
    >
      <div class="max-w-4xl mx-auto space-y-6">
        <div
          v-for="(section, index) in sections"
          :key="index"
          class="space-y-4"
        >
          <!-- Section Header -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ section.title }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ section.description }}
            </p>
          </div>

          <!-- Section Fields -->
          <UCard>
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              <div
                v-for="(field, fieldIndex) in section.fields"
                :key="field.name"
                class="flex items-center justify-between py-4"
                :class="{ 'pt-0': fieldIndex === 0, 'pb-0': fieldIndex === section.fields.length - 1 }"
              >
                <div class="flex-1 min-w-0 pr-4">
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ field.label }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {{ field.description }}
                  </p>
                </div>
                <div class="flex-shrink-0">
                  <USwitch
                    v-model="state[field.name]"
                    @update:model-value="onChange"
                  />
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Save Button -->
        <div class="flex justify-end pt-6">
          <UButton
            color="primary"
            :loading="saving"
            @click="saveSettings"
          >
            Save Changes
          </UButton>
        </div>
      </div>
    </BasePage>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Notification Settings',
  layout: 'default',
})

const toast = useToast()
const saving = ref(false)

const state = reactive<{ [key: string]: boolean }>({
  email: true,
  desktop: false,
  product_updates: true,
  weekly_digest: false,
  important_updates: true,
})

const sections = [{
  title: 'Notification Channels',
  description: 'Choose how you want to receive notifications',
  fields: [{
    name: 'email',
    label: 'Email Notifications',
    description: 'Receive notifications via email to your registered email address.',
  }, {
    name: 'desktop',
    label: 'Browser Notifications',
    description: 'Show notifications in your browser when you\'re online.',
  }],
}, {
  title: 'Content Preferences',
  description: 'Control what types of notifications you receive',
  fields: [{
    name: 'weekly_digest',
    label: 'Weekly Summary',
    description: 'Get a weekly summary of your account activity and updates.',
  }, {
    name: 'product_updates',
    label: 'Feature Updates',
    description: 'Be notified about new features, improvements, and product announcements.',
  }, {
    name: 'important_updates',
    label: 'Security & Maintenance',
    description: 'Receive critical notifications about security updates and system maintenance.',
  }],
}]

async function onChange() {
  // Optional: Auto-save on change
  console.log('Notification preferences updated:', state)
}

async function saveSettings() {
  saving.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Replace with actual API call
    // await $fetch('/api/users/notification-preferences', {
    //   method: 'PUT',
    //   body: state
    // })

    toast.add({
      title: 'Settings Saved',
      description: 'Your notification preferences have been updated successfully.',
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
  }
  catch (error: any) {
    toast.add({
      title: 'Save Failed',
      description: error?.data?.message || 'Failed to save notification settings. Please try again.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  }
  finally {
    saving.value = false
  }
}

// Load settings on mount
onMounted(async () => {
  try {
    // to come
  }
  catch (error) {
    console.error('Failed to load notification preferences:', error)
  }
})
</script>

<style scoped>
</style>
