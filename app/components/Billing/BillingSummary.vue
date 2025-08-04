<template>
  <UCard>
    <div class="flex items-center space-x-2 mb-6">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
        Billing Summary
      </h2>
      <span
        :class="[
          'ml-auto text-sm px-2 py-1 rounded-full',
          currentMonthStatus?.isPaid
            ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
            : 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
        ]"
      >
        {{ currentMonthStatus?.isPaid ? 'Paid' : 'Pending' }}
      </span>
    </div>

    <div
      v-if="loading"
      class="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      <UCard class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
        <div class="flex flex-col items-center">
          <USkeleton class="h-6 w-6 mb-2" />
          <USkeleton class="h-4 w-32 mb-1" />
          <USkeleton class="h-8 w-16" />
        </div>
      </UCard>
      <UCard class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
        <div class="flex flex-col items-center">
          <USkeleton class="h-6 w-6 mb-2" />
          <USkeleton class="h-4 w-32 mb-1" />
          <USkeleton class="h-8 w-24" />
        </div>
      </UCard>
      <UCard class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
        <div class="flex flex-col items-center">
          <USkeleton class="h-6 w-6 mb-2" />
          <USkeleton class="h-4 w-32 mb-1" />
          <USkeleton class="h-8 w-20" />
        </div>
      </UCard>
    </div>

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      <UCard
        class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 dark:border-blue-800/30"
      >
        <div class="flex flex-col items-center">
          <UIcon
            name="i-lucide-building"
            class="mb-2 h-6 w-6 text-blue-500 dark:text-blue-400"
          />
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total Active Properties
          </p>
          <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ stats?.totalActiveProperties || 0 }}
          </p>
        </div>
      </UCard>

      <UCard
        class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 dark:border-green-800/30"
      >
        <div class="flex flex-col items-center">
          <UIcon
            name="i-lucide-credit-card"
            class="mb-2 h-6 w-6 text-green-500 dark:text-green-400"
          />
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total Monthly Charge
          </p>
          <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(stats?.totalMonthlyCharge || 0) }}
          </p>
        </div>
      </UCard>

      <UCard
        class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 dark:border-purple-800/30"
      >
        <div class="flex flex-col items-center">
          <UIcon
            name="i-lucide-tag"
            class="mb-2 h-6 w-6 text-purple-500 dark:text-purple-400"
          />
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Flat Rate Per Property
          </p>
          <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(stats?.monthlyRatePerProperty || 0) }}
          </p>
        </div>
      </UCard>
    </div>

    <UCard
      class="mt-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-700/30 dark:border-gray-700/30"
    >
      <div
        v-if="loading"
        class="flex items-center"
      >
        <USkeleton class="h-6 w-6 mr-3" />
        <div class="flex-1">
          <USkeleton class="h-4 w-24 mb-1" />
          <USkeleton class="h-6 w-32" />
        </div>
      </div>
      <div
        v-else
        class="flex items-center"
      >
        <UIcon
          name="i-lucide-calendar"
          class="h-6 w-6 text-gray-500 dark:text-gray-400 mr-3"
        />
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Next Billing Date
          </p>
          <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ formatBillingDate }}
          </p>
        </div>
        <div class="ml-auto flex items-center gap-2">
          <UBadge
            :color="daysUntilDue < 7 ? 'secondary' : 'neutral'"
            variant="subtle"
          >
            {{ daysUntilDue }} days
          </UBadge>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-alert-circle"
            size="xs"
            :tooltip="`${formatCurrency(nextBilling?.amount || 0)} will be charged on this date`"
          />
        </div>
      </div>
    </UCard>
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
  currentMonthStatus?: {
    isPaid: boolean
    status: string
    amount: number
  }
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// Format currency based on the currency from stats
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: props.stats?.currency || 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format billing date
const formatBillingDate = computed(() => {
  if (!props.nextBilling?.date) return 'Not available'

  const date = new Date(props.nextBilling.date)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
})

// Days until due
const daysUntilDue = computed(() => {
  return props.nextBilling?.daysUntilDue || 0
})
</script>
