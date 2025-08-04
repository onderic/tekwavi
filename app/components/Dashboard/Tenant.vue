<template>
  <div>
    <SkeletonTenant v-if="props.loading" />

    <div
      v-else
      class="space-y-6"
    >
      <div
        v-for="property in propertiesWithUnits"
        :key="property.propertyId"
        class="space-y-4"
      >
        <div class="flex items-center gap-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          <UIcon
            name="i-lucide-building"
            class="text-primary"
            size="lg"
          />
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ property.name }}
          </h2>
          <UBadge
            v-if="property.units.length > 1"
            variant="soft"
            color="primary"
          >
            {{ property.units.length }} units
          </UBadge>
        </div>
        <div :class="property.units.length === 1 ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'">
          <UCard
            v-for="unit in property.units"
            :key="unit.unitId"
          >
            <template #header>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-lucide-door-open"
                    size="sm"
                    class="text-gray-500"
                  />
                  <h3 class="font-semibold text-gray-900 dark:text-white">
                    Unit {{ unit.unitNumber }}
                  </h3>
                  <UBadge
                    v-if="unit.isPrimary"
                    color="primary"
                    variant="soft"
                    size="xs"
                  >
                    Primary
                  </UBadge>
                </div>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatFloorNumber(unit.floorNumber).number }}{{ formatFloorNumber(unit.floorNumber).suffix || '' }} Floor
                </span>
              </div>
            </template>

            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payment Calendar {{ selectedYears[unit.unitId] || props.selectedYear }}
                </h4>
                <USelect
                  :model-value="selectedYears[unit.unitId] || props.selectedYear"
                  :items="availableYears"
                  size="xs"
                  class="w-20"
                  @update:model-value="updateUnitYear(unit.unitId, $event)"
                />
              </div>

              <div class="space-y-3">
                <div class="flex flex-wrap items-center gap-2 text-xs">
                  <div class="flex items-center gap-1">
                    <div class="w-2 h-2 rounded-full bg-green-500 dark:bg-green-600" />
                    <span>Paid</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <div class="w-2 h-2 rounded-full bg-red-500 dark:bg-red-600" />
                    <span>Overdue</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <div class="w-2 h-2 rounded-full bg-yellow-500 dark:bg-yellow-600" />
                    <span>Due</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <div class="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>Future</span>
                  </div>
                </div>

                <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <div
                    v-for="month in 12"
                    :key="month"
                    class="border rounded-lg p-2 transition-colors"
                    :class="[
                      getMonthPaymentClass(unit.unitId, month),
                      isMonthBeforeLeaseStart(unit.unitId, month) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary',
                    ]"
                    @click="handleMonthClick(unit.unitId, month, $event)"
                  >
                    <div class="flex items-center justify-between mb-1">
                      <span
                        class="text-xs font-medium"
                        :class="isMonthBeforeLeaseStart(unit.unitId, month) ? 'text-gray-400 dark:text-gray-500' : ''"
                      >
                        {{ getMonthName(month).substring(0, 3) }}
                      </span>
                      <UBadge
                        v-if="getMonthStatus(unit.unitId, month) !== 'future' && !isMonthBeforeLeaseStart(unit.unitId, month)"
                        :color="getMonthStatusColor(unit.unitId, month)"
                        size="xs"
                      >
                        {{ getMonthStatusText(unit.unitId, month).substring(0, 1) }}
                      </UBadge>
                      <UBadge
                        v-if="isMonthBeforeLeaseStart(unit.unitId, month)"
                        color="neutral"
                        size="xs"
                      >
                        N/A
                      </UBadge>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-gray-500 dark:text-gray-400">{{ selectedYears[unit.unitId] || props.selectedYear }}</span>
                      <span
                        class="text-xs font-medium"
                        :class="[
                          getMonthStatus(unit.unitId, month) === 'paid' ? 'text-green-600 dark:text-green-400' : '',
                          isMonthBeforeLeaseStart(unit.unitId, month) ? 'text-gray-400 dark:text-gray-500' : '',
                        ]"
                      >
                        {{ getMonthPayment(unit.unitId, month) ? formatCurrency(getMonthPayment(unit.unitId, month)?.amount) : '-' }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex justify-between items-center pt-2 text-xs">
                  <span class="text-gray-500">
                    {{ getPaidMonthsCount(unit.unitId) }}/{{ getValidMonthsCount(unit.unitId) }} paid
                  </span>
                  <span
                    v-if="getOverdueCount(unit.unitId) > 0"
                    class="text-red-600 dark:text-red-400 font-medium"
                  >
                    {{ getOverdueCount(unit.unitId) }} overdue
                  </span>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <UModal
        v-model:open="showPaymentDetailsModal"
        :title="selectedPayment?.paymentFor?.monthName + ' ' + selectedPayment?.paymentFor?.year + ' Payment Details'"
      >
        <template #body>
          <div
            v-if="selectedPayment"
            class="space-y-4"
          >
            <div class="flex justify-between py-2 border-b">
              <span class="text-gray-600 dark:text-gray-400">Invoice Number</span>
              <span class="font-medium font-mono">{{ selectedPayment.invoiceNumber }}</span>
            </div>

            <div class="flex justify-between py-2 border-b">
              <span class="text-gray-600 dark:text-gray-400">Amount Paid</span>
              <span class="font-medium">{{ formatCurrency(selectedPayment.amount) }}</span>
            </div>

            <div class="flex justify-between py-2 border-b">
              <span class="text-gray-600 dark:text-gray-400">Payment Method</span>
              <span class="capitalize">{{ formatPaymentMethod(selectedPayment.paymentMethod) }}</span>
            </div>

            <div class="flex justify-between py-2 border-b">
              <span class="text-gray-600 dark:text-gray-400">Payment Date</span>
              <span>{{ formatDate(selectedPayment.paymentDate) }}</span>
            </div>

            <div
              v-if="selectedPayment.paymentReferenceId"
              class="flex justify-between py-2 border-b"
            >
              <span class="text-gray-600 dark:text-gray-400">Reference ID</span>
              <span>{{ selectedPayment.paymentReferenceId }}</span>
            </div>

            <div
              v-if="selectedPayment.isLate"
              class="flex justify-between py-2"
            >
              <span class="text-gray-600 dark:text-gray-400">Status</span>
              <span class="text-yellow-600 dark:text-yellow-500">Payment was made after due date</span>
            </div>
          </div>
        </template>
      </UModal>

      <PropertyAddPayment
        v-if="selectedUnit && selectedTenant"
        v-model:open="showRecordPaymentModal"
        :unit="selectedUnit"
        :tenant="selectedTenant"
        :payment-month="selectedPaymentMonth"
        :payment-year="selectedPaymentYear"
        :expected-amount="getExpectedAmount()"
        @payment-added="refresh"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useFormatters } from '~/composables/formatters'

interface MonthData {
  month: number
  monthName: string
  year: number
  status: 'paid' | 'overdue' | 'due' | 'future' | 'no-invoice' | 'before-lease' | 'after-lease' | 'cancelled'
  hasInvoice: boolean
  invoice: any | null
  amount: number
  isPaid: boolean
  isBeforeLease: boolean
  isAfterLease: boolean
}

interface UnitData {
  unitId: string
  unitNumber: string
  floorId: string
  floorNumber: number
  associatedAt?: Date
  isPrimary?: boolean
  tenantId?: string
  tenantName?: string
  _id?: string
  rentAmount?: number
  leaseStartDate?: Date
  leaseEndDate?: Date
  monthsData?: MonthData[]
  paidCount?: number
  overdueCount?: number
  dueCount?: number
  noInvoiceCount?: number
}

interface UserProperty {
  propertyId: string
  name: string
  role: 'caretaker' | 'developer' | 'tenant' | 'normal'
  associatedAt?: Date
  units?: UnitData[]
}

const props = defineProps<{
  tenantData: any
  loading: boolean
  selectedYear: number
}>()

const emit = defineEmits<{
  'refresh': []
  'update:selectedYear': [year: number]
}>()

const { formatFloorNumber } = useFormatFloor()
const {
  formatCurrency,
  getMonthName,
  formatDate,
  formatPaymentMethod,
} = useFormatters()

const toast = useToast()

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const selectedYears = ref<Record<string, number>>({})

// Watch for selected year changes and update all units
watch(() => props.selectedYear, (newYear) => {
  for (const property of propertiesWithUnits.value) {
    for (const unit of property.units || []) {
      selectedYears.value[unit.unitId] = newYear
    }
  }
})

// Update the USelect to emit year changes
const updateUnitYear = (unitId: string, year: number) => {
  selectedYears.value[unitId] = year
  emit('update:selectedYear', year)
}

const showPaymentDetailsModal = ref(false)
const showRecordPaymentModal = ref(false)
const selectedPayment = ref<any>(null)
const selectedUnit = ref<any>(null)
const selectedTenant = ref<any>(null)
const selectedPaymentMonth = ref<number>(currentMonth)
const selectedPaymentYear = ref<number>(currentYear)

const availableYears = computed(() => {
  const years = []
  for (let i = -1; i <= 1; i++) {
    years.push(currentYear + i)
  }
  return years
})

// Remove the API call and use props instead
const propertiesWithUnits = computed(() => {
  const properties = props.tenantData?.data || []
  return properties.filter((property: UserProperty) => property.units && property.units.length > 0)
})

// Function to refresh data - emit to parent
const refresh = () => {
  emit('refresh')
}

watchEffect(() => {
  for (const property of propertiesWithUnits.value) {
    for (const unit of property.units || []) {
      if (!selectedYears.value[unit.unitId]) {
        selectedYears.value[unit.unitId] = props.selectedYear
      }
    }
  }
})

function getMonthData(unitId: string, month: number): MonthData | null {
  const unit = propertiesWithUnits.value
    .flatMap((p: any) => p.units || [])
    .find((u: any) => u.unitId === unitId)

  const selectedYear = selectedYears.value[unitId] || props.selectedYear
  return unit?.monthsData?.find((m: MonthData) =>
    m.month === month && m.year === selectedYear,
  ) || null
}

function getMonthPayment(unitId: string, month: number) {
  const monthData = getMonthData(unitId, month)
  return monthData?.invoice
}

function getMonthStatus(unitId: string, month: number) {
  const monthData = getMonthData(unitId, month)
  return monthData?.status || 'future'
}

function isMonthBeforeLeaseStart(unitId: string, month: number) {
  const monthData = getMonthData(unitId, month)
  return monthData?.isBeforeLease || false
}

function getMonthPaymentClass(unitId: string, month: number) {
  const status = getMonthStatus(unitId, month)

  switch (status) {
    case 'paid':
      return 'bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700'
    case 'overdue':
      return 'bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-700'
    case 'due':
      return 'bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700'
    case 'future':
      return 'bg-gray-100 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
    case 'before-lease':
      return 'bg-gray-100 border-gray-200 dark:bg-gray-700/30 dark:border-gray-700'
    case 'cancelled':
      return 'bg-gray-200 border-gray-300 dark:bg-gray-700/50 dark:border-gray-600 line-through'
    default:
      return 'bg-gray-100 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
  }
}

function getMonthStatusColor(unitId: string, month: number): 'success' | 'error' | 'warning' | 'neutral' | undefined {
  const status = getMonthStatus(unitId, month)
  switch (status) {
    case 'paid':
      return 'success'
    case 'overdue':
      return 'error'
    case 'due':
      return 'warning'
    case 'future':
      return 'neutral'
    case 'cancelled':
      return 'neutral'
    default:
      return 'neutral'
  }
}

function getValidMonthsCount(unitId: string) {
  const unit = propertiesWithUnits.value
    .flatMap((p: any) => p.units || [])
    .find((u: any) => u.unitId === unitId)

  if (!unit?.monthsData) return 0

  // Count months that are not before lease
  return unit.monthsData.filter((m: MonthData) => !m.isBeforeLease).length
}

function handleMonthClick(unitId: string, month: number, event: Event) {
  event.stopPropagation()

  const monthData = getMonthData(unitId, month)
  const property = propertiesWithUnits.value.find((p: any) =>
    p.units?.some((u: UnitData) => u.unitId === unitId),
  )
  const unit = property?.units?.find((u: UnitData) => u.unitId === unitId)

  if (!monthData || !unit || !property) return

  // Only check if before lease
  if (monthData.isBeforeLease) {
    return
  }

  if (monthData.invoice && monthData.status === 'paid') {
    selectedPayment.value = monthData.invoice
    showPaymentDetailsModal.value = true
  }
  else if (monthData.status === 'future') {
    // For future months, check if there are any unpaid months before it
    const unpaidMonths = unit.monthsData?.filter((m: MonthData) =>
      !m.isBeforeLease
      && (m.status === 'overdue' || m.status === 'due')
      && (m.year < monthData.year || (m.year === monthData.year && m.month < monthData.month)),
    ).sort((a: MonthData, b: MonthData) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })

    if (unpaidMonths && unpaidMonths.length > 0) {
      const firstUnpaid = unpaidMonths[0]
      toast.add({
        title: 'Payment Not Allowed',
        description: `Please pay for ${firstUnpaid.monthName} ${firstUnpaid.year} first before paying for ${monthData.monthName} ${monthData.year}`,
        color: 'primary',
        icon: 'i-lucide-info',
      })
      return
    }
  }
  else if (monthData.status !== 'cancelled') {
    // For due/overdue months, check if there are any unpaid months before this one
    const unpaidMonths = unit.monthsData?.filter((m: MonthData) =>
      !m.isBeforeLease
      && m.status === 'overdue'
      && (m.year < monthData.year || (m.year === monthData.year && m.month < monthData.month)),
    ).sort((a: MonthData, b: MonthData) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })

    if (unpaidMonths && unpaidMonths.length > 0) {
      const firstUnpaid = unpaidMonths[0]
      toast.add({
        title: 'Payment Not Allowed',
        description: `Please pay for ${firstUnpaid.monthName} ${firstUnpaid.year} first before paying for ${monthData.monthName} ${monthData.year}`,
        color: 'primary',
        icon: 'i-lucide-info',
      })
      return
    }

    selectedUnit.value = {
      _id: unit.unitId,
      unitId: unit.unitId,
      unitNumber: unit.unitNumber,
      propertyId: property.propertyId,
      floorId: unit.floorId,
      floorNumber: unit.floorNumber,
    }
    selectedTenant.value = {
      _id: unit.tenantId || unit.unitId,
      tenantId: unit.tenantId,
      tenantName: unit.tenantName || '',
    }
    selectedPaymentMonth.value = month
    selectedPaymentYear.value = monthData.year
    showRecordPaymentModal.value = true
  }
}

function getPaidMonthsCount(unitId: string) {
  const unit = propertiesWithUnits.value
    .flatMap((p: any) => p.units || [])
    .find((u: any) => u.unitId === unitId)

  if (!unit?.monthsData) return 0

  // Count months that are paid
  return unit.monthsData.filter((m: MonthData) => m.status === 'paid').length
}

function getOverdueCount(unitId: string) {
  const unit = propertiesWithUnits.value
    .flatMap((p: any) => p.units || [])
    .find((u: any) => u.unitId === unitId)

  return unit?.overdueCount || 0
}

function getExpectedAmount() {
  const unit = propertiesWithUnits.value
    .flatMap((p: any) => p.units || [])
    .find((u: any) => u.unitId === selectedUnit.value?.unitId)

  return unit?.rentAmount || 0
}

function getMonthStatusText(unitId: string, month: number) {
  const status = getMonthStatus(unitId, month)
  switch (status) {
    case 'paid': return 'Paid'
    case 'overdue': return 'Overdue'
    case 'due': return 'Due'
    case 'before-lease': return 'N/A'
    case 'cancelled': return 'Cancelled'
    default: return ''
  }
}
</script>
