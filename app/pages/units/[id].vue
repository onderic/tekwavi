<template>
  <BasePage
    icon="i-lucide-door-open"
    :status="status === 'pending'"
  >
    <template #titleSuffix>
      <span
        v-if="unit"
        class="text-base font-semibold text-gray-800 dark:text-gray-200 ml-2"
      >
        Unit {{ unit.unitNumber }}
      </span>
    </template>
    <template #headerActions>
      <div class="flex gap-2">
        <UButton
          v-if="(user?.role === 'admin' || user?.role === 'developer') && ownership"
          color="neutral"
          variant="outline"
          icon="i-lucide-user-check"
          label=""
          :disabled="status === 'pending'"
          @click="handleShowOwnership"
        />
        <UButton
          v-if="unit?.isOccupied && tenant"
          color="primary"
          variant="outline"
          icon="i-lucide-edit"
          label="Edit Unit"
          :disabled="status === 'pending'"
          @click="handleEditUnit"
        />
      </div>
    </template>

    <UCard class="print:hidden">
      <SkeletonUnitDetails v-if="status === 'pending' || !unit" />
      <template v-else>
        <div class="flex flex-row items-center justify-between gap-4 mb-6">
          <div>
            <p class="font-medium mt-1 text-gray-800 text-lg dark:text-white">
              <span>
                {{ formatFloorNumber(unit?.floorNumber).number }}
                <sup v-if="formatFloorNumber(unit?.floorNumber).suffix">
                  {{ formatFloorNumber(unit?.floorNumber).suffix }}
                </sup>
                {{ formatFloorNumber(unit?.floorNumber).number !== 'Ground' ? ' Floor' : ' Floor' }}
              </span>
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <UButton
              v-if="unit?.isOccupied"
              color="error"
              variant="outline"
              icon="i-lucide-log-out"
              @click="handleEndTenancy"
            >
              End Tenancy
            </UButton>
            <UButton
              v-if="!unit?.isOccupied"
              color="primary"
              variant="solid"
              icon="i-lucide-user-plus"
              @click="handleAddTenant"
            >
              Add Tenant
            </UButton>
          </div>
        </div>
        <div
          v-if="unit?.isOccupied && tenant"
          class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
          <UnitsDetailCard
            ref="detailCardRef"
            :unit="unit"
            :property-id="propertyId"
            @edit="handleEditUnit"
            @save="refresh()"
          />

          <ClientOnly>
            <UnitsPaymentCalendar
              :unit="unit"
              :tenant="tenant"
              :payments="payments"
              :selected-year="selectedPaymentYear"
              :available-years="availableYears"
              :property-id="propertyId"
              :unit-services="unitServices"
              :expected-total-amount="getExpectedtotalAmount()"
              @update:selected-year="selectedPaymentYear = $event"
              @save="refresh()"
            />
          </ClientOnly>

          <UnitsTenantCard
            ref="tenantCardRef"
            :unit="unit"
            :tenant="tenant"
            :property-id="propertyId"
            :ownership="ownership"
            @edit="handleEditTenant"
            @add-tenant="handleAddTenant"
            @end-tenancy="handleEndTenancy"
            @save="refresh()"
          />
        </div>

        <div
          v-else
          class="mb-8"
        >
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <UIcon
                    name="i-lucide-door-open"
                    class="text-2xl text-primary"
                  />
                  <div>
                    <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">
                      Unit {{ unit?.unitNumber }}
                    </h2>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {{ formatFloorNumber(unit?.floorNumber).number }}{{ formatFloorNumber(unit?.floorNumber).suffix }} Floor
                    </p>
                  </div>
                </div>
                <UBadge
                  color="warning"
                  variant="soft"
                  size="lg"
                >
                  Vacant
                </UBadge>
              </div>
            </template>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    Unit Information
                  </h3>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span class="text-gray-600 dark:text-gray-400">Unit Type</span>
                      <p class="font-medium capitalize">
                        {{ unit?.type?.includes('bedunit')
                          ? unit.type.replace(/_/g, '').replace(/(\d)([a-zA-Z])/g, '$1 $2').replace('bedunit', 'bed unit')
                          : unit?.type?.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([a-z])(unit)/g, '$1 $2') || 'Not specified' }}
                      </p>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span class="text-gray-600 dark:text-gray-400">Category</span>
                      <span class="font-medium text-gray-900 dark:text-gray-100">
                        {{ unit?.category || 'Not specified' }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span class="text-gray-600 dark:text-gray-400">Furnishing</span>
                      <span class="font-medium text-gray-900 dark:text-gray-100 capitalize">
                        {{ formatFurnishing(unit?.furnishing)|| 'Not specified' }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span class="text-gray-600 dark:text-gray-400">Monthly Rent</span>
                      <span class="font-medium text-green-600 dark:text-green-400 text-lg">
                        {{ formatCurrency(unit?.rentAmount || 0) }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span class="text-gray-600 dark:text-gray-400">Status</span>
                      <UBadge
                        :color="unit?.status === 'available' ? 'success' : 'warning'"
                        variant="soft"
                      >
                        {{ unit?.status || 'Available' }}
                      </UBadge>
                    </div>
                  </div>
                </div>

                <!-- Ownership Information (if available) -->
                <div v-if="ownership">
                  <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    Ownership Information
                  </h3>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span class="text-gray-600 dark:text-gray-400">Owner</span>
                      <span class="font-medium text-gray-900 dark:text-gray-100">
                        {{ ownership.ownerName || 'Not specified' }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span class="text-gray-600 dark:text-gray-400">Contact</span>
                      <span class="font-medium text-gray-900 dark:text-gray-100">
                        {{ ownership.ownerPhone || 'Not specified' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tenant Assignment Section -->
              <div class="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-8">
                <div class="relative mb-6">
                  <div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <UIcon
                      name="i-lucide-user-plus"
                      class="text-white text-3xl"
                    />
                  </div>
                  <div class="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                    <UIcon
                      name="i-lucide-plus"
                      class="text-white text-sm"
                    />
                  </div>
                </div>

                <div class="text-center mb-6">
                  <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Ready for Tenant
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    This unit is available and ready for a new tenant assignment.
                    Start collecting rent by adding a tenant today.
                  </p>
                </div>

                <UButton
                  color="primary"
                  variant="solid"
                  size="xl"
                  icon="i-lucide-user-plus"
                  class="px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  @click="handleAddTenant"
                >
                  Assign Tenant
                </UButton>

                <p class="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                  Choose from monthly rental, fixed-term lease, or owner-occupied
                </p>
              </div>
            </div>
          </UCard>
        </div>
        <UnitsPaymentHistory
          :payments="payments"
          @refresh="refresh()"
        />

        <UnitsOccupationHistory :occupation-history="unitInfo?.occupationHistory?.occupants || []" />

        <!-- Ownership Modal -->
        <ClientOnly>
          <UnitsOwnershipModal
            v-model:is-open="showOwnershipModal"
            :ownership="ownership"
          />
        </ClientOnly>

        <ClientOnly>
          <PropertyAddTenant
            v-model:open="showAddTenantModal"
            :unit="unit"
            :property-id="propertyId"
            :ownership="ownership"
            @save="refresh()"
          />
        </ClientOnly>
      </template>
    </UCard>
  </BasePage>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'default',
})

const { formatFloorNumber } = useFormatFloor()
const { formatCurrency, formatFurnishing } = useFormatters()
const { user } = useUserSession()

const currentYear = new Date().getFullYear()
const selectedPaymentYear = ref(currentYear)
const showOwnershipModal = ref(false)
const showAddTenantModal = ref(false)

const detailCardRef = ref()
const tenantCardRef = ref()

const route = useRoute()
const unitId = computed(() => String(route.params.id || ''))
const propertyId = computed(() => String(route.query.propertyId || ''))

const availableYears = computed(() => {
  const years = []
  for (let i = -1; i <= 1; i++) {
    years.push(currentYear + i)
  }
  return years
})

const unit = computed(() => unitInfo.value?.unit)
const tenant = computed(() => unitInfo.value?.tenant)
const ownership = computed(() => unitInfo.value?.ownership)
const unitServices = computed(() => unitInfo.value?.services || [])

const payments = computed(() => {
  if (unitInfo.value?.payments?.invoices) {
    return unitInfo.value.payments.invoices
  }
  return []
})

const { data: unitInfo, status, refresh } = useAsyncData(
  `unit-${unitId.value}-${selectedPaymentYear.value}`,
  async () => {
    const unitData = await $fetch(`/api/properties/${unitId.value}/unit`, {})

    const occupationData = await $fetch(`/api/tenants/${unitId.value}/occupation`, {})
    const paymentData = await $fetch(`/api/invoices/unit`, {
      query: {
        unitId: unitId.value,
        year: selectedPaymentYear.value,
      },
    })
    const servicesResponse = await $fetch(`/api/services`, {
      query: {
        propertyId: propertyId.value,
        isActive: 'true',
        mandatory: 'true',
      },
    })

    const mappedServices = (servicesResponse.services || []).map((service: any) => ({
      serviceId: service._id,
      serviceName: service.serviceName,
      amount: service.costPerUnit || 0,
    }))

    return {
      ...unitData,
      occupationHistory: occupationData,
      payments: paymentData,
      services: mappedServices,
    }
  },
  {
    watch: [propertyId, unitId, selectedPaymentYear],
  },
)

function getExpectedtotalAmount() {
  if (tenant.value) {
    // For owner-occupied units, return only the service fee amount
    if (tenant.value.rentalType === 'owner_occupied') {
      const unitServiceFee = unitInfo.value?.serviceFee
      return unitServiceFee?.isConfigured ? unitServiceFee.monthlyFee : 0
    }
    return tenant.value.rentAmount || 0
  }
  return 0
}

function handleEditUnit() {
  if (detailCardRef.value) {
    detailCardRef.value.showEdit(unit.value)
  }
}

function handleAddTenant() {
  if (tenantCardRef.value) {
    tenantCardRef.value.showAddTenant()
  }
  else {
    // When no tenant card is rendered (vacant unit), show the add tenant modal directly
    showAddTenantModal.value = true
  }
}

function handleEditTenant() {
  if (tenantCardRef.value) {
    tenantCardRef.value.showEditTenant()
  }
}

function handleShowOwnership() {
  showOwnershipModal.value = true
}

function handleEndTenancy() {
  if (tenantCardRef.value) {
    tenantCardRef.value.showEndTenancy()
  }
}
</script>
