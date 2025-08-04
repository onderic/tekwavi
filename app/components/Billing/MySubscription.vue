<template>
  <UCard>
    <div class="flex items-center space-x-2 mb-4">
      <UIcon
        name="i-lucide-badge"
        class="h-6 w-6 text-yellow-500 dark:text-yellow-400"
      />
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
        My Subscription
      </h2>
    </div>

    <div
      v-if="loading"
      class="space-y-3"
    >
      <USkeleton class="h-6 w-48" />
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-3/4" />
      <USkeleton class="h-10 w-full mt-4" />
    </div>

    <div v-else>
      <div class="mb-4">
        <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Pay Per Property Plan
        </p>

        <p class="text-sm text-gray-600 dark:text-gray-400 mt-3">
          Your subscription includes:
        </p>
        <ul class="mt-1 space-y-1">
          <li
            v-for="(feature, index) in features"
            :key="index"
            class="flex items-start"
          >
            <UIcon
              name="i-lucide-check"
              class="h-5 w-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ feature }}</span>
          </li>
        </ul>
      </div>

      <div class="mb-6 flex items-center text-sm text-gray-600 dark:text-gray-400">
        <UIcon
          name="i-lucide-calendar"
          class="h-4 w-4 mr-1 flex-shrink-0"
        />
        <p>Next billing date: {{ formattedNextBillingDate }}</p>
      </div>

      <UButton
        class="w-full"
        color="primary"
        label="Manage Subscription"
        icon="i-lucide-settings"
        disabled
      />

      <div class="mt-4 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
        <UIcon
          name="i-lucide-info"
          class="h-3 w-3 mr-1"
        />
        <span>New properties are automatically added to your monthly billing</span>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  stats?: {
    totalActiveProperties: number
    monthlyRatePerProperty: number
    totalMonthlyCharge: number
    currency: string
  }
  nextBilling?: {
    date: string
    month: string
    amount: number
    daysUntilDue: number
  }
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// Generate features based on props data
const features = computed(() => {
  const rate = props.stats?.monthlyRatePerProperty || 5000
  const propertyCount = props.stats?.totalActiveProperties || 0

  return [
    `Fixed rate of ${formatCurrency(rate)} per property`,
    `Currently managing ${propertyCount} active ${propertyCount === 1 ? 'property' : 'properties'}`,
    'Automatic billing adjustments',
  ]
})

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: props.stats?.currency || 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formattedNextBillingDate = computed(() => {
  if (!props.nextBilling?.date) return 'Not available'

  const date = new Date(props.nextBilling.date)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
})
</script>
