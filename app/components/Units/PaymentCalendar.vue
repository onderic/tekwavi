<template>
  <div class="print:hidden">
    <UCard class="lg:col-span-1">
      <template #header>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold">
              Rent Calendar
            </h2>
            <UButton
              v-if="tenant?.rentalType === 'fixed'"
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-info"
              @click="showLeaseInfoModal = true"
            />
          </div>
          <div class="flex items-center gap-2">
            <USelect
              :model-value="selectedYear"
              :items="availableYears"
              size="sm"
              class="w-24"
              :disabled="tenant?.rentalType === 'fixed'"
              @update:model-value="$emit('update:selectedYear', $event)"
            />
          </div>
        </div>
      </template>

      <!-- For fixed-term lease tenants, show only service fees calendar -->
      <div
        v-if="tenant?.rentalType === 'fixed'"
        class="space-y-4"
      >
        <!-- Service fees calendar legend -->
        <div class="flex flex-wrap items-center gap-2 mb-4 text-xs">
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-green-500 dark:bg-green-600" />
            <span>Paid</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-red-500 dark:bg-red-600" />
            <span>Overdue</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-yellow-500 dark:bg-yellow-600" />
            <span>Due</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span>Future</span>
          </div>
        </div>

        <!-- The grid of months for service fees -->
        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="month in 12"
            :key="month"
            class="border rounded-lg p-2 transition-colors"
            :class="[
              getServiceFeeMonthClass(month),
              isMonthWithinLeasePeriod(month)
                ? 'cursor-pointer hover:border-primary'
                : 'cursor-not-allowed',
            ]"
            @click="showServiceFeePaymentDetails(month)"
          >
            <div class="flex items-center justify-between mb-1">
              <span
                class="text-sm font-medium"
                :class="!isMonthWithinLeasePeriod(month) ? 'text-gray-400 dark:text-gray-500' : ''"
              >
                {{ getMonthName(month).substring(0, 3) }}
              </span>
              <UBadge
                v-if="isMonthWithinLeasePeriod(month) && getServiceFeeMonthStatus(month) !== 'future'"
                :color="getServiceFeeMonthStatusColor(month)"
                size="xs"
                class="ml-1"
              >
                {{ getServiceFeeMonthStatusText(month).substring(0, 1) }}
              </UBadge>
              <UBadge
                v-if="!isMonthWithinLeasePeriod(month)"
                color="neutral"
                size="xs"
                class="ml-1"
              >
                N/A
              </UBadge>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ selectedYear }}</span>
              <span class="text-xs font-medium text-orange-600 dark:text-orange-400">
                Services
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="unit?.isOccupied"
        class="overflow-hidden"
      >
        <!-- Payment calendar legend -->
        <div class="flex flex-wrap items-center gap-2 mb-4 text-xs">
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-green-500 dark:bg-green-600" />
            <span>Paid</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-red-500 dark:bg-red-600" />
            <span>Overdue</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-yellow-500 dark:bg-yellow-600" />
            <span>Due</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-600" />
            <span>Lease Period</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span>Future</span>
          </div>
        </div>

        <!-- The grid of months -->
        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="month in 12"
            :key="month"
            class="border rounded-lg p-2 transition-colors"
            :class="[
              getMonthPaymentClass(month),
              isMonthExcludedFromRent(month)
                ? 'opacity-50 cursor-not-allowed'
                : canPayForMonth(month)
                  ? 'hover:border-primary cursor-pointer'
                  : 'cursor-not-allowed',
            ]"
            @click="!isMonthExcludedFromRent(month) && showMonthPaymentDetails(month)"
          >
            <div class="flex items-center justify-between mb-1">
              <span
                class="text-sm font-medium"
                :class="isMonthExcludedFromRent(month) ? 'text-gray-400 dark:text-gray-500' : ''"
              >
                {{ getMonthName(month).substring(0, 3) }}
              </span>
              <UBadge
                v-if="getMonthStatus(month) !== 'future' && !isMonthExcludedFromRent(month)"
                :color="getMonthStatusColor(month)"
                size="xs"
                class="ml-1"
              >
                {{ getMonthStatusText(month).substring(0, 1) }}
              </UBadge>
              <UBadge
                v-if="isMonthBeforeLeaseStart(month)"
                color="neutral"
                size="xs"
                class="ml-1"
              >
                N/A
              </UBadge>
              <UBadge
                v-if="isMonthDuringFixedLease(month)"
                color="primary"
                size="xs"
                class="ml-1"
              >
                PAID
              </UBadge>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ selectedYear }}</span>
              <span
                class="text-xs font-medium"
                :class="getMonthStatus(month) === 'paid' ? 'text-green-600 dark:text-green-400' : ''"
              >
                {{ getMonthPayment(month) ? formatCurrency(getMonthPayment(month)?.totalAmount) : '-' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- For vacant units, show the existing empty state -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400"
      >
        <UIcon
          name="i-lucide-calendar"
          class="mb-2"
          size="xl"
        />
        <p>No payment calendar</p>
        <p class="text-sm">
          Add a tenant first
        </p>
      </div>
    </UCard>

    <UModal
      v-model:open="showPaymentDetailsModal"
      :title="selectedPayment?.paymentFor?.monthName + ' ' + selectedPayment?.paymentFor?.year + ' Payment Details'"
    >
      <template #body>
        <div
          v-if="selectedPayment"
          class="p-4"
        >
          <!-- Header with badge -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-receipt"
                class="w-5 h-5 text-blue-600"
              />
              <h3 class="text-lg font-semibold">
                Payment Receipt
              </h3>
            </div>
            <UBadge
              :color="selectedPayment.isPaid ? 'success' : selectedPayment.isLate ? 'warning' : 'neutral'"
              variant="subtle"
            >
              {{ selectedPayment.isPaid ? 'Paid' : selectedPayment.isLate ? 'Late Payment' : 'Pending' }}
            </UBadge>
          </div>

          <!-- Payment details -->
          <div class="space-y-4">
            <div class="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <span class="text-gray-600 dark:text-gray-400 font-medium">Receipt Number</span>
              <span class="font-semibold font-mono">{{ selectedPayment.receiptNumber || 'N/A' }}</span>
            </div>

            <div class="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <span class="text-gray-600 dark:text-gray-400 font-medium">Amount Paid</span>
              <span class="font-bold text-lg text-green-600 dark:text-green-400">{{ formatCurrency(selectedPayment.totalAmount) }}</span>
            </div>

            <div class="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <span class="text-gray-600 dark:text-gray-400 font-medium">Payment Method</span>
              <span class="capitalize font-medium">{{ formatPaymentMethod(selectedPayment.paymentMethod) }}</span>
            </div>

            <div class="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <span class="text-gray-600 dark:text-gray-400 font-medium">Payment Date</span>
              <span class="font-medium">{{ formatDate(selectedPayment.paymentDate) }}</span>
            </div>

            <div
              v-if="selectedPayment.paymentReferenceId"
              class="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700"
            >
              <span class="text-gray-600 dark:text-gray-400 font-medium">Reference ID</span>
              <span class="font-medium font-mono">{{ selectedPayment.paymentReferenceId }}</span>
            </div>

            <!-- Service charges breakdown if available -->
            <div
              v-if="selectedPayment.serviceCharges && selectedPayment.serviceCharges.length > 0"
              class="py-3 border-b border-gray-200 dark:border-gray-700"
            >
              <div class="flex justify-between mb-2">
                <span class="text-gray-600 dark:text-gray-400 font-medium">Service Charges</span>
                <span class="font-medium">{{ formatCurrency(selectedPayment.totalServiceCharges || 0) }}</span>
              </div>
              <div class="ml-4 space-y-1">
                <div
                  v-for="service in selectedPayment.serviceCharges"
                  :key="service.serviceId"
                  class="flex justify-between text-sm text-gray-500 dark:text-gray-400"
                >
                  <span>{{ service.serviceName }}</span>
                  <span>{{ formatCurrency(service.amount || 0) }}</span>
                </div>
              </div>
            </div>

            <div
              v-if="selectedPayment.isLate"
              class="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700"
            >
              <span class="text-gray-600 dark:text-gray-400 font-medium">Status</span>
              <span class="text-yellow-600 dark:text-yellow-500 font-medium flex items-center gap-1">
                <UIcon
                  name="i-lucide-alert-triangle"
                  class="w-4 h-4"
                />
                Payment was made after due date
              </span>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <UButton
              color="neutral"
              variant="ghost"
              @click="showPaymentDetailsModal = false"
            >
              Close
            </UButton>
            <UButton
              color="primary"
              variant="solid"
              icon="i-lucide-printer"
              @click="print(selectedPayment)"
            >
              Print Receipt
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Lease Information Modal -->
    <UModal
      v-model:open="showLeaseInfoModal"
      title="Fixed Lease Information"
    >
      <template #body>
        <div class="p-4 space-y-4">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
              <UIcon
                name="i-lucide-calendar-check"
                class="text-blue-600 dark:text-blue-400"
              />
              <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
                Lease Period
              </h3>
            </div>
            <p class="text-sm text-blue-700 dark:text-blue-300">
              {{ formatDate(tenant?.leaseStartDate) }} to {{ formatDate(tenant?.leaseEndDate) }}
            </p>
          </div>

          <!-- Fixed lease payment status -->
          <div
            v-if="hasFixedLeasePayment"
            class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg"
          >
            <div class="flex items-center gap-2 mb-2">
              <UIcon
                name="i-lucide-check-circle"
                class="text-green-600 dark:text-green-400"
              />
              <h3 class="text-sm font-medium text-green-800 dark:text-green-200">
                Lease Payment Status
              </h3>
            </div>
            <p class="text-sm text-green-700 dark:text-green-300 mb-1">
              Amount: {{ formatCurrency(fixedLeasePayment?.totalAmount || 0) }}
            </p>
            <p class="text-xs text-green-600 dark:text-green-400">
              Paid on {{ formatDate(fixedLeasePayment?.paymentDate) }}
            </p>
          </div>

          <div
            v-else
            class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg"
          >
            <div class="flex items-center gap-2 mb-2">
              <UIcon
                name="i-lucide-alert-circle"
                class="text-yellow-600 dark:text-yellow-400"
              />
              <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Lease Payment Pending
              </h3>
            </div>
            <p class="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              A payment record for the entire lease period is required for financial tracking.
            </p>
            <UButton
              color="primary"
              variant="solid"
              size="sm"
              icon="i-lucide-plus"
              @click="showFixedLeasePaymentModal"
            >
              Record Lease Payment
            </UButton>
          </div>

          <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
              <UIcon
                name="i-lucide-settings"
                class="text-orange-600 dark:text-orange-400"
              />
              <h3 class="text-sm font-medium text-orange-800 dark:text-orange-200">
                Monthly Service Fees
              </h3>
            </div>
            <p class="text-sm text-orange-700 dark:text-orange-300">
              Use the calendar below to record monthly service fees (water, garbage, etc.) for months within the lease period.
            </p>
          </div>

          <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <UButton
              color="neutral"
              variant="ghost"
              @click="showLeaseInfoModal = false"
            >
              Close
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <PropertyAddPayment
      v-if="unit && tenant"
      v-model:open="showRecordPaymentModal"
      :unit="unit"
      :tenant="tenant"
      :payment-month="selectedPaymentMonth"
      :payment-year="selectedYear"
      :expected-amount="props.expectedTotalAmount"
      :services="unitServices"
      @payment-added="$emit('save')"
    />
  </div>
</template>

<script setup lang="ts">
import { useFormatters } from '~/composables/formatters'
import { computed, ref } from 'vue'

interface Props {
  unit: any
  tenant: any
  payments: any[]
  selectedYear: number
  availableYears: number[]
  propertyId: string
  unitServices: any[]
  expectedTotalAmount: number
}

const showPrintInvoice = ref(false)
const props = defineProps<Props>()
const printInvoiceData = ref<any | null>(null)

defineEmits<{
  'update:selectedYear': [year: number]
  'monthClick': [month: number]
  'save': []
}>()

const { formatDate, formatCurrency, getMonthName, formatPaymentMethod } = useFormatters()

const showPaymentDetailsModal = ref(false)
const showRecordPaymentModal = ref(false)
const showLeaseInfoModal = ref(false)
const selectedPayment = ref<any>(null)
const selectedPaymentMonth = ref<number>(new Date().getMonth() + 1)

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const hasFixedLeasePayment = computed(() => {
  if (props.tenant?.rentalType !== 'fixed') return false

  // Check if there's a payment that covers the entire lease period
  return props.payments.some(payment =>
    payment.paymentFor?.monthName === 'Fixed Lease'
    || payment.invoiceType === 'fixed_lease',
  )
})

const fixedLeasePayment = computed(() => {
  if (props.tenant?.rentalType !== 'fixed') return null

  return props.payments.find(payment =>
    payment.paymentFor?.monthName === 'Fixed Lease'
    || payment.invoiceType === 'fixed_lease',
  )
})

function showFixedLeasePaymentModal() {
  if (props.tenant?.rentalType === 'fixed') {
    // Set special values for fixed lease payment
    selectedPaymentMonth.value = 0 // Special value to indicate fixed lease
    showRecordPaymentModal.value = true
    showLeaseInfoModal.value = false // Close info modal
  }
}

// Service fee payment handling for fixed lease tenants
function getServiceFeeMonthPayment(month: number) {
  // For fixed lease tenants, get service fee payments (not rent payments)
  return props.payments.find((p: any) =>
    p.paymentFor?.month === month
    && p.paymentFor?.year === props.selectedYear
    && p.paymentFor?.monthName !== 'Fixed Lease'
    && p.invoiceType !== 'fixed_lease',
  )
}

function getServiceFeeMonthStatus(month: number) {
  const payment = getServiceFeeMonthPayment(month)

  if (!payment) {
    if (props.selectedYear < currentYear
      || (props.selectedYear === currentYear && month < currentMonth)) {
      return 'overdue'
    }
    else if (props.selectedYear === currentYear && month === currentMonth) {
      return 'due'
    }
    else {
      return 'future'
    }
  }

  if (payment.isPaid) return 'paid'
  if (payment.isLate) return 'overdue'
  return 'due'
}

function getServiceFeeMonthClass(month: number) {
  // For fixed lease tenants, disable months outside lease period
  if (props.tenant?.rentalType === 'fixed' && !isMonthWithinLeasePeriod(month)) {
    return 'bg-gray-100 border-gray-200 dark:bg-gray-700/30 dark:border-gray-700 opacity-50 cursor-not-allowed'
  }

  const status = getServiceFeeMonthStatus(month)

  switch (status) {
    case 'paid':
      return 'bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700'
    case 'overdue':
      return 'bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-700'
    case 'due':
      return 'bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700'
    case 'future':
      return 'bg-gray-100 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
    default:
      return ''
  }
}

function getServiceFeeMonthStatusColor(month: number) {
  const status = getServiceFeeMonthStatus(month)
  switch (status) {
    case 'paid': return 'success'
    case 'overdue': return 'error'
    case 'due': return 'warning'
    default: return 'neutral'
  }
}

function getServiceFeeMonthStatusText(month: number) {
  const status = getServiceFeeMonthStatus(month)
  switch (status) {
    case 'paid': return 'Paid'
    case 'overdue': return 'Overdue'
    case 'due': return 'Due'
    default: return ''
  }
}

function showServiceFeePaymentDetails(month: number) {
  // For fixed lease tenants, check if month falls within lease period
  if (props.tenant?.rentalType === 'fixed') {
    if (!isMonthWithinLeasePeriod(month)) {
      useToast().add({
        id: 'lease-period-restriction',
        title: 'Outside Lease Period',
        description: `Service fees can only be paid for months within the lease period.`,
        icon: 'i-lucide-calendar-x',
      })
      return
    }
  }

  const payment = getServiceFeeMonthPayment(month)
  if (payment) {
    selectedPayment.value = payment
    showPaymentDetailsModal.value = true
    return
  }

  // Allow creating service fee payment for fixed lease tenants
  selectedPaymentMonth.value = month
  showRecordPaymentModal.value = true
}

function isMonthBeforeLeaseStart(month: number) {
  if (!props.tenant?.leaseStartDate) {
    return false
  }

  const leaseStartDate = new Date(props.tenant.leaseStartDate)
  const leaseStartYear = leaseStartDate.getFullYear()
  const leaseStartMonth = leaseStartDate.getMonth() + 1

  if (props.selectedYear < leaseStartYear) {
    return true
  }

  if (props.selectedYear === leaseStartYear && month < leaseStartMonth) {
    return true
  }

  return false
}

function isMonthDuringFixedLease(month: number) {
  if (!props.tenant?.leaseStartDate || !props.tenant?.leaseEndDate || props.tenant?.rentalType !== 'fixed') {
    return false
  }

  const leaseStartDate = new Date(props.tenant.leaseStartDate)
  const leaseEndDate = new Date(props.tenant.leaseEndDate)

  const leaseStartYear = leaseStartDate.getFullYear()
  const leaseStartMonth = leaseStartDate.getMonth() + 1
  const leaseEndYear = leaseEndDate.getFullYear()
  const leaseEndMonth = leaseEndDate.getMonth() + 1

  // Check if the month/year falls within the lease period
  if (props.selectedYear > leaseStartYear && props.selectedYear < leaseEndYear) {
    return true
  }

  if (props.selectedYear === leaseStartYear && props.selectedYear === leaseEndYear) {
    return month >= leaseStartMonth && month <= leaseEndMonth
  }

  if (props.selectedYear === leaseStartYear && props.selectedYear < leaseEndYear) {
    return month >= leaseStartMonth
  }

  if (props.selectedYear > leaseStartYear && props.selectedYear === leaseEndYear) {
    return month <= leaseEndMonth
  }

  return false
}

function isMonthExcludedFromRent(month: number) {
  return isMonthBeforeLeaseStart(month) || isMonthDuringFixedLease(month)
}

function isMonthWithinLeasePeriod(month: number) {
  if (!props.tenant?.leaseStartDate || !props.tenant?.leaseEndDate) {
    return false
  }

  const leaseStartDate = new Date(props.tenant.leaseStartDate)
  const leaseEndDate = new Date(props.tenant.leaseEndDate)

  const leaseStartYear = leaseStartDate.getFullYear()
  const leaseStartMonth = leaseStartDate.getMonth() + 1
  const leaseEndYear = leaseEndDate.getFullYear()
  const leaseEndMonth = leaseEndDate.getMonth() + 1

  // Check if the month/year falls within the lease period
  if (props.selectedYear > leaseStartYear && props.selectedYear < leaseEndYear) {
    return true
  }

  if (props.selectedYear === leaseStartYear && props.selectedYear === leaseEndYear) {
    return month >= leaseStartMonth && month <= leaseEndMonth
  }

  if (props.selectedYear === leaseStartYear && props.selectedYear < leaseEndYear) {
    return month >= leaseStartMonth
  }

  if (props.selectedYear > leaseStartYear && props.selectedYear === leaseEndYear) {
    return month <= leaseEndMonth
  }

  return false
}

// ...existing code...

function getMonthPayment(month: number) {
  return props.payments.find((p: any) =>
    p.paymentFor?.month === month
    && p.paymentFor?.year === props.selectedYear,
  )
}

function getMonthStatus(month: number) {
  if (isMonthBeforeLeaseStart(month)) {
    return 'before-lease'
  }

  if (isMonthDuringFixedLease(month)) {
    return 'during-fixed-lease'
  }

  const payment = getMonthPayment(month)

  if (!payment) {
    if (props.selectedYear < currentYear
      || (props.selectedYear === currentYear && month < currentMonth)) {
      return 'overdue'
    }
    else if (props.selectedYear === currentYear && month === currentMonth) {
      return 'due'
    }
    else {
      return 'future'
    }
  }

  if (payment.status) return payment.status

  if (payment.isPaid) return 'paid'
  if (payment.isLate) return 'overdue'
  return 'due'
}

function getMonthPaymentClass(month: number) {
  const status = getMonthStatus(month)
  const unpaidMonths = hasUnpaidMonths()
  const isNextRequired
    = (status === 'overdue' && month === unpaidMonths.earliestOverdue)
      || (!unpaidMonths.hasOverdue && status === 'due' && month === unpaidMonths.earliestDue)

  switch (status) {
    case 'paid':
      return 'bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700'
    case 'overdue':
      return isNextRequired
        ? 'bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-700 ring-2 ring-red-500'
        : 'bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-700'
    case 'due':
      return isNextRequired
        ? 'bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700 ring-2 ring-yellow-500'
        : 'bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700'
    case 'future':
      return canPayForMonth(month)
        ? 'bg-gray-100 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
        : 'bg-gray-100 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 opacity-60'
    case 'before-lease':
      return 'bg-gray-100 border-gray-200 dark:bg-gray-700/30 dark:border-gray-700'
    case 'during-fixed-lease':
      return 'bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700'
    default:
      return ''
  }
}

function getMonthStatusColor(month: number) {
  const status = getMonthStatus(month)
  switch (status) {
    case 'paid': return 'success'
    case 'overdue': return 'error'
    case 'due': return 'warning'
    default: return 'neutral'
  }
}

function getMonthStatusText(month: number) {
  const status = getMonthStatus(month)
  switch (status) {
    case 'paid': return 'Paid'
    case 'overdue': return 'Overdue'
    case 'due': return 'Due'
    default: return ''
  }
}

function hasUnpaidMonths() {
  const overdueMonths = []
  const dueMonths = []

  for (let month = 1; month <= 12; month++) {
    const status = getMonthStatus(month)

    if (isMonthExcludedFromRent(month)) {
      continue
    }

    if (status === 'overdue') {
      overdueMonths.push(month)
    }
    else if (status === 'due') {
      dueMonths.push(month)
    }
  }

  overdueMonths.sort()
  dueMonths.sort()

  return {
    hasOverdue: overdueMonths.length > 0,
    hasDue: dueMonths.length > 0,
    overdueMonths,
    dueMonths,
    earliestOverdue: overdueMonths.length > 0 ? overdueMonths[0] : null,
    earliestDue: dueMonths.length > 0 ? dueMonths[0] : null,
  }
}

function canPayForMonth(month: number) {
  if (isMonthExcludedFromRent(month)) {
    return false
  }

  const status = getMonthStatus(month)
  if (getMonthPayment(month)) {
    return true
  }

  const unpaidMonths = hasUnpaidMonths()

  if (status === 'overdue' && month === unpaidMonths.earliestOverdue) {
    return true
  }

  if (unpaidMonths.hasOverdue) {
    return false
  }

  if (status === 'due' && month === unpaidMonths.earliestDue) {
    return true
  }
  if (unpaidMonths.hasDue) {
    return false
  }

  return status === 'future'
}

function showMonthPaymentDetails(month: any) {
  if (isMonthExcludedFromRent(month)) {
    return
  }

  const payment = getMonthPayment(month)
  if (payment) {
    selectedPayment.value = payment
    showPaymentDetailsModal.value = true
    return
  }

  // Handle unpaid months with enforced order
  if (props.unit?.isOccupied && props.tenant) {
    const unpaidMonths = hasUnpaidMonths()
    const status = getMonthStatus(month)

    // Case 1: Trying to pay for a month that's not the earliest overdue
    if (status === 'overdue' && unpaidMonths.earliestOverdue !== month) {
      const earliestMonth = unpaidMonths.earliestOverdue
      useToast().add({
        id: 'payment-order',
        title: 'Payment Order Required',
        description: `You must pay for ${earliestMonth !== null && earliestMonth !== undefined ? getMonthName(earliestMonth) : 'earlier months'} ${props.selectedYear} first.`,
        icon: 'i-lucide-alert-triangle',
      })
      return
    }

    // Case 2: Trying to pay for a due month when there are overdue months
    if (status === 'due' && unpaidMonths.hasOverdue) {
      const earliestMonth = unpaidMonths.earliestOverdue
      useToast().add({
        id: 'payment-order',
        title: 'Overdue Payment Required',
        description: `You must pay for ${earliestMonth !== null && earliestMonth !== undefined ? getMonthName(earliestMonth) : 'overdue months'} ${props.selectedYear} first.`,
        icon: 'i-lucide-alert-triangle',
      })
      return
    }

    // Case 3: Trying to pay for a due month that's not the earliest due
    if (status === 'due' && unpaidMonths.earliestDue !== month) {
      const earliestMonth = unpaidMonths.earliestDue
      useToast().add({
        id: 'payment-order',
        title: 'Payment Order Required',
        description: `You must pay for ${earliestMonth !== null && earliestMonth !== undefined ? getMonthName(earliestMonth) : 'due months'} ${props.selectedYear} first.`,
        icon: 'i-lucide-info',
      })
      return
    }

    // Case 4: Trying to pay for a future month when there are overdue or due months
    if (status === 'future' && (unpaidMonths.hasOverdue || unpaidMonths.hasDue)) {
      const earliestMonth = unpaidMonths.earliestOverdue || unpaidMonths.earliestDue
      const monthStatus = unpaidMonths.hasOverdue ? 'overdue' : 'due'

      useToast().add({
        id: 'payment-order',
        title: 'Payment Order Required',
        description: `You must pay for ${earliestMonth !== null && earliestMonth !== undefined ? getMonthName(earliestMonth) : 'earlier months'} ${props.selectedYear} first (${monthStatus}).`,
        icon: unpaidMonths.hasOverdue ? 'i-lucide-alert-triangle' : 'i-lucide-info',
      })
      return
    }

    // Case 5: Check for sequential months (e.g. trying to pay August before July)
    if (status !== 'overdue' && status !== 'due') {
      // Find the most recent unpaid month before this one
      let previousMonth = month - 1
      while (previousMonth >= 1) {
        if (!getMonthPayment(previousMonth) && !isMonthExcludedFromRent(previousMonth)) {
          useToast().add({
            id: 'payment-order',
            title: 'Sequential Payment Required',
            description: `You must pay for ${getMonthName(previousMonth)} ${props.selectedYear} before ${getMonthName(month)}.`,
            icon: 'i-lucide-info',
          })
          return
        }
        previousMonth--
      }
    }

    // If we passed all checks, allow payment for this month
    selectedPaymentMonth.value = month
    showRecordPaymentModal.value = true
  }
}

function print(invoice?: any) {
  if (invoice) {
    const transformedInvoice = {
      invoiceNumber: invoice.invoiceNumber,
      unitNumber: invoice.unitNumber,
      serviceCharges: invoice.serviceCharges || [],
      totalServiceCharges: invoice.totalServiceCharges || 0,
      tenantName: invoice.tenantName,
      amount: invoice.amount,
      totalAmount: invoice.totalAmount,
      paymentMethod: formatPaymentMethod(invoice.paymentMethod),
      paymentReferenceId: invoice.paymentReferenceId || 'N/A',
      phoneNumber: invoice.phoneNumber || 'N/A',
      paymentDate: invoice.paymentDate,
      dueDate: invoice.dueDate,
      paymentFor: {
        month: invoice.paymentFor.month,
        monthName: invoice.paymentFor.monthName,
        year: invoice.paymentFor.year,
      },
      recordedBy: invoice.recordedBy || 'System',
      status: invoice.status,
      createdAt: invoice.createdAt,
      propertyDetails: {
        propertyName: invoice.propertyName,
        address: invoice.propertyAddress || 'N/A',
        unitType: 'Apartment',
      },
    }

    printInvoiceData.value = transformedInvoice
    showPrintInvoice.value = true

    setTimeout(() => {
      window.print()
    }, 100)
  }
  else {
    // If no invoice is passed, just print the page
    window.print()
  }
}
</script>
