<template>
  <div>
    <UCard
      v-if="unit?.isOccupied && tenant"
      class="lg:col-span-1"
    >
      <template #header>
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-lg font-bold">
              Current Tenant
            </h2>
            <p
              v-if="unit?.isOccupied"
              class="text-xs"
            >
              Tenant since {{ formatDate(tenant?.leaseStartDate) }}
            </p>
          </div>

          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-pencil"
            size="sm"
            @click="$emit('edit')"
          />
        </div>
      </template>

      <div
        v-if="tenant"
        class="flex flex-col items-center mb-4"
      >
        <UAvatar
          size="xl"
          :text="getTenantInitials(tenant?.firstName, tenant?.lastName)"
          class="mb-2"
          :class="tenant.rentalType === 'monthly' ? 'bg-secondary' : tenant.rentalType === 'owner_occupied' ? 'bg-success' : 'bg-primary'"
          :ui="{ fallback: 'font-medium leading-none text-white truncate' }"
        />
        <h3 class="text-lg font-medium ">
          {{ tenant?.firstName }} {{ tenant?.lastName }}
        </h3>
        <div class="flex items-center gap-1 text-sm text-gray-500 mb-1">
          <UIcon
            name="i-lucide-phone"
            size="xs"
          />
          {{ formatPhoneNumber(tenant.phoneNumber) }}
        </div>

        <div class="mt-2 flex flex-col items-center">
          <UBadge
            :color="tenant.rentalType === 'monthly' ? 'secondary' : tenant.rentalType === 'owner_occupied' ? 'success' : 'primary'"
            class="capitalize mb-1"
            variant="solid"
          >
            {{ tenant.rentalType === 'monthly' ? 'Monthly Rental' : tenant.rentalType === 'owner_occupied' ? 'Owner Occupied' : 'Fixed-term Lease' }}
          </UBadge>

          <span class="text-xs text-gray-500">
            <span v-if="tenant.nationalId">ID: {{ tenant.nationalId }}</span>
            <span v-if="tenant.email">
              <br>{{ tenant.email }}
            </span>
          </span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <p class="text-sm text-gray-500">
            Lease Started
          </p>
          <p class="font-medium">
            {{ formatDate(tenant?.leaseStartDate) }}
          </p>
        </div>

        <div>
          <p class="text-sm text-gray-500">
            Monthly Rent
          </p>
          <p class="font-medium">
            {{ formatCurrency(tenant?.rentAmount) }}
          </p>
        </div>

        <div>
          <p class="text-sm text-gray-500">
            Deposit Paid
          </p>
          <p class="font-medium">
            {{ formatCurrency(tenant?.depositAmount) }}
          </p>
        </div>

        <div
          v-if="rentBalance !== null"
        >
          <p class="text-sm text-gray-500">
            Rent Balance
          </p>
          <p
            class="font-medium"
            :class="rentBalance > 0 ? 'text-red-600' : ''"
          >
            {{ formatCurrency(rentBalance) }}
            <span
              v-if="rentBalance > 0"
              class="text-sm text-red-600"
            >(Overdue)</span>
          </p>
        </div>
      </div>
    </UCard>

    <UCard
      v-else
      class="lg:col-span-1 border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-700 dark:text-gray-300">
            Tenant Assignment
          </h2>
          <UBadge
            color="warning"
            variant="soft"
            size="sm"
          >
            Vacant
          </UBadge>
        </div>
      </template>

      <div class="flex flex-col items-center py-8">
        <!-- Icon with animated background -->
        <div class="relative mb-6">
          <div class="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center shadow-lg">
            <UIcon
              name="i-lucide-user-plus"
              class="text-blue-600 dark:text-blue-400 text-2xl"
            />
          </div>
          <div class="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 dark:bg-yellow-500 rounded-full flex items-center justify-center shadow-md">
            <UIcon
              name="i-lucide-plus"
              class="text-white text-xs"
            />
          </div>
        </div>

        <!-- Content -->
        <div class="text-center mb-6">
          <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            No Tenant Assigned
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
            This unit is currently vacant and available for new tenant assignment.
          </p>
        </div>

        <!-- Unit Status Info -->
        <div class="w-full max-w-sm mb-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Unit Status:</span>
              <span class="font-medium text-gray-900 dark:text-gray-100">Available</span>
            </div>
            <div class="flex items-center justify-between text-sm mt-2">
              <span class="text-gray-600 dark:text-gray-400">Monthly Rent:</span>
              <span class="font-medium text-green-600 dark:text-green-400">
                {{ formatCurrency(unit?.rentAmount || 0) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <UButton
          color="primary"
          variant="solid"
          size="lg"
          icon="i-lucide-user-plus"
          class="px-8 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          @click="$emit('addTenant')"
        >
          Assign Tenant
        </UButton>

        <!-- Helper Text -->
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center max-w-xs">
          Click above to assign a new tenant to this unit and start collecting rent.
        </p>
      </div>
    </UCard>
  </div>

  <PropertyAddTenant
    v-model:open="showAddTenantModal"
    :unit="unit"
    :property-id="propertyId"
    :ownership="ownership"
    @save="$emit('save')"
  />
  <PropertyAddTenant
    v-model:open="showEditTenantModal"
    :unit="unit"
    :property-id="propertyId"
    :tenant-data="tenant"
    :ownership="ownership"
    :is-editing="true"
    @save="$emit('save')"
  />
  <PropertyEndTenancy
    v-model:open="showEndTenancyModal"
    :tenant="tenant"
    :unit="unit"
    @tenancy-ended="$emit('save')"
  />
</template>

<script setup lang="ts">
import { useFormatters } from '~/composables/formatters'

interface Props {
  unit: any
  tenant: any
  propertyId: string
  ownership: any
}

const props = defineProps<Props>()

defineEmits<{
  edit: []
  addTenant: []
  endTenancy: []
  save: []
}>()

const { formatDate, formatCurrency, formatPhoneNumber, getTenantInitials } = useFormatters()

const showAddTenantModal = ref(false)
const showEditTenantModal = ref(false)
const showEndTenancyModal = ref(false)

const rentBalance = computed(() => {
  if (!props.tenant) return null
  return props.tenant.rentBalance || 0
})

// Functions to handle modal opening
function handleAddTenant() {
  showAddTenantModal.value = true
}

function handleEditTenant() {
  showEditTenantModal.value = true
}

function handleEndTenancy() {
  showEndTenancyModal.value = true
}

// Expose functions to parent
defineExpose({
  showAddTenant: handleAddTenant,
  showEditTenant: handleEditTenant,
  showEndTenancy: handleEndTenancy,
})
</script>
