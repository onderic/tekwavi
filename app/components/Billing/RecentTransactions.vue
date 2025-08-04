<template>
  <UCard>
    <div class="flex items-center space-x-2 mb-4">
      <UIcon
        name="i-lucide-history"
        class="h-6 w-6 text-indigo-500 dark:text-indigo-400"
      />
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
        Recent Transactions
      </h2>
    </div>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
      View your recent payment activities and refunds.
    </p>

    <div class="space-y-3">
      <div
        v-for="transaction in recentTransactions"
        :key="transaction.id"
        class="flex justify-between items-center py-3 px-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors"
      >
        <div class="flex items-start space-x-3">
          <UIcon
            :name="transaction.type === 'payment' ? 'i-lucide-credit-card' : 'i-lucide-rotate-ccw'"
            :class="[
              'h-5 w-5 mt-0.5',
              transaction.type === 'payment' ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400',
            ]"
          />
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
              {{ transaction.description }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {{ formatDate(transaction.date) }}
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <span
            :class="[
              'text-sm font-semibold',
              transaction.type === 'payment' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400',
            ]"
          >
            {{ transaction.amount }}
          </span>
          <UBadge
            :color="transaction.type === 'payment' ? 'error' : 'success'"
            variant="subtle"
            size="xs"
          >
            {{ transaction.type === 'payment' ? 'Payment' : 'Refund' }}
          </UBadge>
        </div>
      </div>
    </div>

    <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <UButton
        variant="soft"
        color="neutral"
        size="sm"
        icon="i-lucide-arrow-right"
        label="View All Transactions"
        class="w-full"
        @click="viewAllTransactions"
      />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Define types
type TransactionType = 'payment' | 'refund'

interface Transaction {
  id: number
  description: string
  date: string
  amount: string
  type: TransactionType
}

// Recent transactions data
const recentTransactions = ref<Transaction[]>([
  {
    id: 1,
    description: 'Monthly subscription fee',
    date: '2025-07-01',
    amount: '-100.00 USD',
    type: 'payment',
  },
  {
    id: 2,
    description: 'Refund for overcharge',
    date: '2025-06-10',
    amount: '+10.00 USD',
    type: 'refund',
  },
  {
    id: 3,
    description: 'Property addition charge',
    date: '2025-06-05',
    amount: '-20.00 USD',
    type: 'payment',
  },
  {
    id: 4,
    description: 'Annual plan upgrade',
    date: '2025-05-28',
    amount: '-480.00 USD',
    type: 'payment',
  },
  {
    id: 5,
    description: 'Service credit applied',
    date: '2025-05-15',
    amount: '+50.00 USD',
    type: 'refund',
  },
])

/**
 * Format date to a more readable format
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Handle view all transactions
 */
const viewAllTransactions = (): void => {
  useToast().add({
    title: 'Navigating to Transactions',
    description: 'Opening full transaction history...',
    icon: 'i-lucide-history',
  })
  // In a real app, you would navigate to a transactions page
  // navigateTo('/billing/transactions')
}
</script>
