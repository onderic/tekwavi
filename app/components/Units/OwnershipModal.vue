<template>
  <UModal
    :open="isOpen"
    :transition="true"
    title="Ownership Information"
    :close="{ onClick: () => emit('update:isOpen', false), color: 'neutral', variant: 'outline', class: 'rounded-full' }"
  >
    <template #body>
      <div class="p-3">
        <div class="space-y-6">
          <!-- Primary Information -->
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <UIcon
                name="i-lucide-user"
                class="w-4 h-4"
              />
              Owner Details
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Full Name
                </p>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ ownership?.ownerName || 'Not specified' }}
                </p>
              </div>

              <div class="space-y-1">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Phone Number
                </p>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ ownership?.ownerPhone ? formatPhoneNumber(ownership.ownerPhone) : 'Not specified' }}
                </p>
              </div>

              <div class="space-y-1 md:col-span-2">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Email Address
                </p>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ ownership?.ownerEmail || 'Not specified' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Purchase Information -->
          <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <UIcon
                name="i-lucide-credit-card"
                class="w-4 h-4"
              />
              Purchase Information
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Purchase Date
                </p>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ ownership?.purchaseDate ? formatDate(ownership.purchaseDate) : 'Not specified' }}
                </p>
              </div>

              <div class="space-y-1">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Purchase Amount
                </p>
                <p class="font-medium text-green-600 dark:text-green-400">
                  {{ ownership?.purchaseAmount ? formatCurrency(ownership.purchaseAmount) : 'Not specified' }}
                </p>
              </div>

              <div
                v-if="ownership?.transferDate"
                class="space-y-1 md:col-span-2"
              >
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Transfer Date
                </p>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ formatDate(ownership.transferDate) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Ownership Details -->
          <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <UIcon
                name="i-lucide-shield-check"
                class="w-4 h-4"
              />
              Ownership Details
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Ownership Type
                </p>
                <p class="font-medium text-gray-900 dark:text-white capitalize">
                  {{ ownership?.ownershipType || 'Individual' }}
                </p>
              </div>

              <div class="space-y-1">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Ownership Percentage
                </p>
                <p class="font-medium text-purple-600 dark:text-purple-400">
                  {{ ownership?.ownershipPercentage || 100 }}%
                </p>
              </div>

              <div class="space-y-1 md:col-span-2">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Title Deed Number
                </p>
                <p class="font-medium text-gray-900 dark:text-white font-mono">
                  {{ ownership?.titleDeedNumber || 'Not specified' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useFormatters } from '~/composables/formatters'

defineProps({
  ownership: {
    type: Object as PropType<any>,
    default: () => ({}),
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:isOpen'])

const { formatDate, formatCurrency, formatPhoneNumber } = useFormatters()
</script>
