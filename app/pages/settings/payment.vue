<template>
  <BasePage
    :title="'M-PESA Payment Settings'"
    icon="i-lucide-credit-card"
    :status="status === 'pending'"
  >
    <template #headerActions>
      <!-- <UButton
        color="primary"
        variant="soft"
        label="Reload"
        icon="i-lucide-refresh-cw"
        size="sm"
        :loading="status === 'pending'"
        :disabled="status === 'pending'"
        @click="refresh()"
      /> -->
    </template>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="md:col-span-1">
        <UCard class="bg-gradient-to-br from-primary-50 to-white dark:from-primary-950 dark:to-gray-900">
          <div class="space-y-4">
            <div class="flex items-center space-x-2 text-primary-600 dark:text-primary-400">
              <UIcon
                name="i-lucide-credit-card"
                class="text-2xl"
              />
              <h3 class="text-lg font-medium">
                M-PESA Integration
              </h3>
            </div>

            <p class="text-sm text-gray-600 dark:text-gray-300">
              Connect your M-PESA business account to enable mobile payments for your tenants.
            </p>

            <div class="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
              <h4 class="text-sm font-medium mb-2">
                Where to find your credentials
              </h4>
              <ol class="list-decimal list-inside text-xs space-y-2 text-gray-600 dark:text-gray-400">
                <li>Log in to the M-PESA Developer Portal</li>
                <li>Navigate to "My Apps" in your dashboard</li>
                <li>Select your app to view the API keys</li>
                <li>Copy the credentials into this form</li>
              </ol>
            </div>

            <UAlert
              title="Secure Storage"
              icon="i-lucide-shield"
              color="primary"
              variant="soft"
              class="mt-4"
            >
              <p class="text-xs">
                Your API credentials are encrypted and securely stored.
              </p>
            </UAlert>
          </div>
        </UCard>
      </div>

      <!-- Main form -->
      <div class="md:col-span-2">
        <UCard>
          <UForm
            :schema="schema"
            :state="formData"
            class="space-y-6"
            @submit="savePaymentSettings"
          >
            <div class="space-y-5">
              <UAlert
                v-if="!hasCredentials"
                title="Configuration Required"
                description="To enable M-PESA payments, please enter your API credentials below."
                color="info"
                class="mb-6"
                icon="i-lucide-info"
              />

              <UFormField
                label="M-PESA Short Code"
                name="mpesaShortcode"
                help="Your business short code"
              >
                <UInput
                  v-model="formData.mpesaShortcode"
                  placeholder="123456"
                  type="text"
                  icon="i-lucide-hash"
                />
              </UFormField>

              <UFormField
                label="Consumer Key"
                name="mpesaConsumerKey"
                help="Your M-PESA API consumer key"
              >
                <UInput
                  v-model="formData.mpesaConsumerKey"
                  placeholder="Enter your consumer key"
                  type="text"
                  toggle
                  icon="i-lucide-key"
                />
              </UFormField>

              <UFormField
                label="Consumer Secret"
                name="mpesaConsumerSecret"
                help="Your M-PESA API consumer secret"
              >
                <UInput
                  v-model="formData.mpesaConsumerSecret"
                  placeholder="Enter your consumer secret"
                  type="text"
                  toggle
                  icon="i-lucide-fingerprint"
                />
              </UFormField>

              <UFormField
                label="Pass Key"
                name="mpesaPasskey"
                help="Your M-PESA API pass key"
              >
                <UInput
                  v-model="formData.mpesaPasskey"
                  placeholder="Enter your pass key"
                  type="text"
                  toggle
                  icon="i-lucide-key-round"
                />
              </UFormField>
            </div>

            <div class="flex items-center justify-between pt-4 mt-2 border-t dark:border-gray-700">
              <div
                v-if="lastUpdated"
                class="text-xs text-gray-500 dark:text-gray-400"
              >
                Last updated: {{ formatDate(lastUpdated) }}
              </div>
              <div class="flex gap-3 ml-auto">
                <UButton
                  type="button"
                  color="neutral"
                  variant="ghost"
                  label="Cancel"
                  :disabled="isSubmitting || !hasAnyValue"
                  @click="resetForm"
                />
                <UButton
                  type="submit"
                  color="primary"
                  icon="i-lucide-save"
                  :loading="isSubmitting"
                  :disabled="isSubmitting"
                >
                  {{ isSubmitting ? 'Saving...' : 'Save Settings' }}
                </UButton>
              </div>
            </div>
          </UForm>
        </UCard>

        <UCard
          v-if="hasCredentials"
          class="mt-6 border-l-4 border-l-green-500 dark:border-l-green-500"
        >
          <div class="flex items-start gap-3">
            <div class="bg-green-100 dark:bg-green-900 p-2 rounded-full">
              <UIcon
                name="i-lucide-check-circle"
                class="text-green-600 dark:text-green-400 text-xl"
              />
            </div>
            <div>
              <h3 class="font-medium text-sm">
                M-PESA Integration Active
              </h3>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Your M-PESA integration is configured and ready to receive payments.
                <!-- <UButton
                  color="primary"
                  variant="link"
                  class="text-xs px-0"
                  label="Test connection"
                /> -->
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </BasePage>
</template>

<script lang="ts" setup>
import { z } from 'zod'
import { usePropertyStore } from '~/stores/usePropertyStore'

definePageMeta({
  title: 'M-PESA Settings',
  layout: 'default',
  actions: [],
})

const isSubmitting = ref(false)
const lastUpdated = ref<Date | null>(null)
const propertyStore = usePropertyStore()

const schema = z.object({
  mpesaShortcode: z.string().min(5, 'Valid shortcode is required'),
  mpesaConsumerKey: z.string().min(10, 'Consumer key is required'),
  mpesaConsumerSecret: z.string().min(10, 'Consumer secret is required'),
  mpesaPasskey: z.string().min(5, 'Pass key is required'),
})

const formData = ref({
  mpesaShortcode: '',
  mpesaConsumerKey: '',
  mpesaConsumerSecret: '',
  mpesaPasskey: '',
})

const propertyId = computed(() => propertyStore.currentProperty?._id)

const { data: paymentSettingsData, status, refresh } = useLazyAsyncData(
  'paymentSettings',
  async () => {
    if (!propertyId.value) {
      return null
    }

    try {
      const response = await $fetch(`/api/settings/payments`, {
        method: 'GET',
        params: { propertyId: propertyId.value },
      })

      return response
    }
    catch (error) {
      console.error('Error fetching payment settings:', error)
      return null
    }
  },
  {
    watch: [propertyId],
    default: () => ({ success: false, data: null }),
  },
)

watch(paymentSettingsData, (newData: any) => {
  if (newData?.success && newData?.data?.mpesa) {
    const mpesa = newData.data.mpesa

    formData.value = {
      mpesaShortcode: mpesa.SHORTCODE?.toString() || '',
      mpesaConsumerKey: mpesa.CONSUMER_KEY || '',
      mpesaConsumerSecret: mpesa.CONSUMER_SECRET || '',
      mpesaPasskey: mpesa.PASSKEY || '',
    }
    if (newData.data.updatedAt) {
      lastUpdated.value = new Date(newData.data.updatedAt)
    }
  }
})

const hasCredentials = computed(() => {
  return formData.value.mpesaShortcode
    && formData.value.mpesaConsumerKey
    && formData.value.mpesaConsumerSecret
    && formData.value.mpesaPasskey
})

const hasAnyValue = computed(() => {
  return formData.value.mpesaShortcode
    || formData.value.mpesaConsumerKey
    || formData.value.mpesaConsumerSecret
    || formData.value.mpesaPasskey
})

const formatDate = (date: Date) => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const resetForm = () => {
  formData.value = {
    mpesaShortcode: '',
    mpesaConsumerKey: '',
    mpesaConsumerSecret: '',
    mpesaPasskey: '',
  }

  const toast = useToast()
  toast.add({
    title: 'Form reset',
    description: 'All fields have been cleared',
    icon: 'i-lucide-refresh-ccw',
  })
}

const savePaymentSettings = async () => {
  isSubmitting.value = true

  try {
    if (!propertyId.value) {
      throw new Error('No property selected')
    }

    const mpesaConfig = {
      SHORTCODE: Number(formData.value.mpesaShortcode),
      CONSUMER_KEY: formData.value.mpesaConsumerKey,
      CONSUMER_SECRET: formData.value.mpesaConsumerSecret,
      PASSKEY: formData.value.mpesaPasskey,
    }

    await $fetch('/api/settings/payments', {
      method: 'POST',
      body: {
        propertyId: propertyId.value,
        mpesa: mpesaConfig,
      },
    })

    lastUpdated.value = new Date()

    const toast = useToast()
    toast.add({
      title: 'Settings saved',
      description: 'Your M-PESA payment settings have been successfully updated',
      icon: 'i-lucide-check-circle',
    })
    refresh()
  }
  catch (error) {
    console.error('Failed to save M-PESA settings', error)

    const toast = useToast()
    toast.add({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to save settings. Please try again.',
      icon: 'i-lucide-x-circle',
    })
  }
  finally {
    isSubmitting.value = false
  }
}
</script>
