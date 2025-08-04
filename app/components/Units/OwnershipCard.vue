<template>
  <UCard
    v-if="ownership"
    class="mb-8"
  >
    <template #header>
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-bold">
          Ownership Information
        </h2>
        <UBadge
          v-if="ownership.isActive"
          color="success"
          variant="subtle"
        >
          Active Owner
        </UBadge>
      </div>
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <div>
        <p class="text-sm text-gray-500 mb-1">
          Owner Name
        </p>
        <p class="font-medium">
          {{ ownership.ownerName || 'Not specified' }}
        </p>
      </div>

      <div>
        <p class="text-sm text-gray-500 mb-1">
          Owner Phone
        </p>
        <p class="font-medium">
          {{ ownership.ownerPhone ? formatPhoneNumber(ownership.ownerPhone) : 'Not specified' }}
        </p>
      </div>

      <div>
        <p class="text-sm text-gray-500 mb-1">
          Owner Email
        </p>
        <p class="font-medium">
          {{ ownership.ownerEmail || 'Not specified' }}
        </p>
      </div>

      <div>
        <p class="text-sm text-gray-500 mb-1">
          Purchase Date
        </p>
        <p class="font-medium">
          {{ ownership.purchaseDate ? formatDate(ownership.purchaseDate) : 'Not specified' }}
        </p>
      </div>

      <div>
        <p class="text-sm text-gray-500 mb-1">
          Purchase Amount
        </p>
        <p class="font-medium">
          {{ ownership.purchasetotalAmount ? formatCurrency(ownership.purchasetotalAmount) : 'Not specified' }}
        </p>
      </div>

      <div>
        <p class="text-sm text-gray-500 mb-1">
          Ownership Type
        </p>
        <p class="font-medium capitalize">
          {{ ownership.ownershipType || 'individual' }}
        </p>
      </div>

      <div>
        <p class="text-sm text-gray-500 mb-1">
          Ownership Percentage
        </p>
        <p class="font-medium">
          {{ ownership.ownershipPercentage || 100 }}%
        </p>
      </div>

      <div>
        <p class="text-sm text-gray-500 mb-1">
          Title Deed Number
        </p>
        <p class="font-medium">
          {{ ownership.titleDeedNumber || 'Not specified' }}
        </p>
      </div>

      <div
        v-if="ownership.transferDate"
      >
        <p class="text-sm text-gray-500 mb-1">
          Transfer Date
        </p>
        <p class="font-medium">
          {{ formatDate(ownership.transferDate) }}
        </p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { useFormatters } from '~/composables/formatters'

interface Props {
  ownership: any
}

defineProps<Props>()

const { formatDate, formatCurrency, formatPhoneNumber } = useFormatters()
</script>
