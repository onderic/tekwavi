<template>
  <BasePage
    :title="`Unit ${data?.unit?.unitNumber || ''} Details`"
    icon="i-lucide-home"
    :status="status === 'pending'"
  >
    <template #headerActions>
      <UButton
        color="primary"
        variant="solid"
        label="Back to Units"
        icon="i-lucide-arrow-left"
        size="sm"
        @click="navigateTo('/units/ownership')"
      />
    </template>

    <div
      v-if="data"
      class="space-y-6"
    >
      <!-- Financial Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Total Collected
              </p>
              <p class="text-2xl font-semibold text-green-600 dark:text-green-400">
                {{ formatCurrency(data.unit.financialSummary.totalCollected) }}
              </p>
            </div>
            <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UIcon
                name="i-lucide-trending-up"
                class="w-6 h-6 text-green-600 dark:text-green-400"
              />
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Total Disbursed
              </p>
              <p class="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                {{ formatCurrency(data.unit.financialSummary.totalDisbursed || 0) }}
              </p>
            </div>
            <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <UIcon
                name="i-lucide-banknotes"
                class="w-6 h-6 text-blue-600 dark:text-blue-400"
              />
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Pending Disbursement
              </p>
              <p class="text-2xl font-semibold text-orange-600 dark:text-orange-400">
                {{ formatCurrency(data.unit.financialSummary.pendingDisbursement || 0) }}
              </p>
            </div>
            <div class="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <UIcon
                name="i-lucide-clock"
                class="w-6 h-6 text-orange-600 dark:text-orange-400"
              />
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Total Service Fees
              </p>
              <p class="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                {{ formatCurrency(data.unit.financialSummary.totalServiceFees || 0) }}
              </p>
            </div>
            <div class="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <UIcon
                name="i-lucide-percent"
                class="w-6 h-6 text-purple-600 dark:text-purple-400"
              />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Unit Information -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Unit Information
            </h3>
          </template>

          <dl class="divide-y divide-gray-200 dark:divide-gray-700">
            <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Status
              </dt>
              <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                <UBadge
                  :color="data.unit.status === 'occupied' ? 'success' : 'neutral'"
                  variant="subtle"
                  class="capitalize"
                >
                  {{ data.unit.status }}
                </UBadge>
              </dd>
            </div>
            <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Type
              </dt>
              <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0 capitalize">
                {{ data.unit.type?.replace(/_/g, ' ') || 'Not specified' }}
              </dd>
            </div>
            <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Monthly Rent
              </dt>
              <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                {{ formatCurrency(data.unit.rentAmount || 0) }}
              </dd>
            </div>
            <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Service Fee/Month
              </dt>
              <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                {{ formatCurrency(data.unit.serviceFeePerMonth || 0) }}
              </dd>
            </div>
          </dl>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Property Information
            </h3>
          </template>

          <dl class="divide-y divide-gray-200 dark:divide-gray-700">
            <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Property
              </dt>
              <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                {{ data.unit.property?.propertyName || 'N/A' }}
              </dd>
            </div>
            <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Address
              </dt>
              <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                {{ data.unit.property?.address || 'N/A' }}
              </dd>
            </div>
            <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Location
              </dt>
              <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                {{ [data.unit.property?.city, data.unit.property?.state].filter(Boolean).join(', ') || 'N/A' }}
              </dd>
            </div>
            <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Type
              </dt>
              <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0 capitalize">
                {{ data.unit.property?.propertyType || 'N/A' }}
              </dd>
            </div>
          </dl>
        </UCard>
      </div>

      <!-- Ownership & Tenant Information -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Ownership Details
            </h3>
          </template>

          <dl class="divide-y divide-gray-200 dark:divide-gray-700">
            <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Owner Name
              </dt>
              <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                {{ data.unit.ownership?.ownerName || 'N/A' }}
              </dd>
            </div>
            <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Contact
              </dt>
              <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                {{ data.unit.ownership?.ownerEmail || 'N/A' }}
              </dd>
            </div>
            <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Title Deed
              </dt>
              <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                {{ data.unit.titleDeedNumber || 'N/A' }}
              </dd>
            </div>
            <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Ownership %
              </dt>
              <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                {{ data.unit.ownership?.ownershipPercentage || 100 }}%
              </dd>
            </div>
          </dl>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Current Tenant
            </h3>
          </template>

          <div v-if="data.unit.currentTenant">
            <dl class="divide-y divide-gray-200 dark:divide-gray-700">
              <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Name
                </dt>
                <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {{ data.unit.currentTenant.name }}
                </dd>
              </div>
              <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Contact
                </dt>
                <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {{ data.unit.currentTenant.phoneNumber }}
                </dd>
              </div>
              <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Lease Period
                </dt>
                <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {{ formatDate(data.unit.currentTenant.leaseStartDate) }} - {{ formatDate(data.unit.currentTenant.leaseEndDate) }}
                </dd>
              </div>
              <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Rent
                </dt>
                <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {{ formatCurrency(data.unit.currentTenant.rentAmount) }}
                </dd>
              </div>
            </dl>
          </div>
          <div
            v-else
            class="text-center py-8 text-gray-500"
          >
            <UIcon
              name="i-lucide-user-x"
              class="w-12 h-12 mx-auto mb-2 opacity-50"
            />
            <p>No current tenant</p>
          </div>
        </UCard>
      </div>

      <!-- Payment History with Disbursement Status -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">
            Payment & Disbursement History
          </h3>
        </template>

        <UTable
          :data="data.paymentHistory || []"
          :columns="disbursementColumns"
          :empty-state="{
            icon: 'i-lucide-receipt',
            label: 'No payments recorded',
          }"
        >
          <template #receiptNumber-data="{ row }">
            <span class="font-mono text-sm">{{ row.original.receiptNumber || row.original.invoiceNumber }}</span>
          </template>

          <template #amount-data="{ row }">
            <div>
              <p class="font-medium">
                {{ formatCurrency(row.original.amount) }}
              </p>
              <p class="text-xs text-gray-500">
                Gross Amount
              </p>
            </div>
          </template>

          <template #serviceFee-data="{ row }">
            <div>
              <p class="font-medium text-orange-600 dark:text-orange-400">
                {{ formatCurrency(row.original.serviceFeeAmount || 0) }}
              </p>
              <p class="text-xs text-gray-500">
                Service Fee
              </p>
            </div>
          </template>

          <template #netAmount-data="{ row }">
            <div>
              <p class="font-medium text-green-600 dark:text-green-400">
                {{ formatCurrency(row.original.netDisbursedAmount || (row.original.amount - (row.original.serviceFeeAmount || 0))) }}
              </p>
              <p class="text-xs text-gray-500">
                Net Amount
              </p>
            </div>
          </template>

          <template #paymentDate-data="{ row }">
            {{ formatDate(row.original.paymentDate) }}
          </template>

          <template #paymentFor-data="{ row }">
            {{ row.original.paymentFor?.monthName }} {{ row.original.paymentFor?.year }}
          </template>

          <template #disbursementStatus-data="{ row }">
            <div>
              <UBadge
                :color="row.original.isDisbursed ? 'success' : 'warning'"
                variant="subtle"
                :label="row.original.isDisbursed ? 'Disbursed' : 'Pending'"
              />
              <p
                v-if="row.original.isDisbursed && row.original.disbursementDate"
                class="text-xs text-gray-500 mt-1"
              >
                {{ formatDate(row.original.disbursementDate) }}
              </p>
            </div>
          </template>

          <template #disbursementMethod-data="{ row }">
            <div v-if="row.original.isDisbursed">
              <p class="capitalize">
                {{ row.original.disbursementMethod?.replace(/_/g, ' ') || 'N/A' }}
              </p>
              <p
                v-if="row.original.disbursementReference"
                class="text-xs text-gray-500"
              >
                Ref: {{ row.original.disbursementReference }}
              </p>
            </div>
            <span
              v-else
              class="text-gray-500"
            >-</span>
          </template>
        </UTable>
      </UCard>

      <!-- Outstanding Invoices -->
      <UCard v-if="data.outstandingInvoices && data.outstandingInvoices.length > 0">
        <template #header>
          <h3 class="text-lg font-semibold">
            Outstanding Invoices
          </h3>
        </template>

        <UTable
          :data="data.outstandingInvoices"
          :columns="outstandingColumns"
        >
          <template #invoiceNumber-data="{ row }">
            <span class="font-mono text-sm">{{ row.original.invoiceNumber }}</span>
          </template>

          <template #amount-data="{ row }">
            <span class="font-medium text-red-600 dark:text-red-400">{{ formatCurrency(row.original.amount) }}</span>
          </template>

          <template #dueDate-data="{ row }">
            <div>
              <p>{{ formatDate(row.original.dueDate) }}</p>
              <p
                v-if="row.original.isLate"
                class="text-xs text-red-500"
              >
                Overdue
              </p>
            </div>
          </template>

          <template #paymentFor-data="{ row }">
            {{ row.original.paymentFor?.monthName && row.original.paymentFor?.year
              ? `${row.original.paymentFor.monthName} ${row.original.paymentFor.year}`
              : 'N/A' }}
          </template>

          <template #tenantName-data="{ row }">
            {{ row.original.tenantName || 'N/A' }}
          </template>
        </UTable>
      </UCard>
    </div>
  </BasePage>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'default',
})

interface PaymentRecord {
  _id: string
  receiptNumber?: string
  invoiceNumber?: string
  amount: number
  totalAmount?: number
  paymentDate: string
  paymentMethod?: string
  paymentReferenceId?: string
  paymentFor?: {
    monthName: string
    year: number
  }
  tenantName?: string
  recordedBy?: any
  status: string
  // Disbursement fields
  isDisbursed?: boolean
  disbursementDate?: string
  disbursementMethod?: string
  disbursementReference?: string
  disbursedAmount?: number
  serviceFeeAmount?: number
  netDisbursedAmount?: number
  disbursedBy?: any
}

interface OutstandingInvoice {
  _id: string
  invoiceNumber: string
  amount: number
  dueDate: string
  isLate: boolean
  paymentFor?: {
    month: number
    monthName: string
    year: number
  }
  tenantName?: string
  status: string
}

interface UnitDetailsResponse {
  success: boolean
  unit: {
    _id: string
    unitNumber: string
    type?: string
    furnishing?: string
    category?: string
    status: string
    isOccupied: boolean
    rentAmount?: number
    serviceFeePerMonth?: number
    property?: {
      _id: string
      propertyName: string
      address?: string
      city?: string
      state?: string
      zipCode?: string
      country?: string
      propertyType?: string
    }
    floor?: {
      _id: string
      floorNumber: number
      floorName?: string
    }
    currentTenant?: {
      _id: string
      name: string
      phoneNumber: string
      email?: string
      leaseStartDate: string
      leaseEndDate: string
      rentAmount: number
      depositAmount: number
    }
    ownership?: {
      ownerId?: string
      ownerName?: string
      ownerPhone?: string
      ownerEmail?: string
      purchaseDate?: string
      purchaseAmount?: number
      ownershipType?: string
      ownershipPercentage?: number
      transferDate?: string
      isActive?: boolean
      titleDeedNumber?: string
    }
    previousOwners?: any[]
    titleDeedNumber?: string
    registrationDate?: string
    ownershipNotes?: string
    financialSummary: {
      totalCollected: number
      totalOutstanding: number
      lastPaymentDate?: string | null
      totalPayments: number
      totalDisbursed?: number
      pendingDisbursement?: number
      totalServiceFees?: number
    }
  }
  paymentHistory: PaymentRecord[]
  outstandingInvoices: OutstandingInvoice[]
}

const route = useRoute()
const unitId = route.params.id as string
const { formatDate, formatCurrency } = useFormatters()

const disbursementColumns: TableColumn<PaymentRecord>[] = [
  {
    accessorKey: 'receiptNumber',
    header: 'Receipt #',
  },
  {
    accessorKey: 'amount',
    header: 'Collected',
  },
  {
    accessorKey: 'serviceFee',
    header: 'Service Fee',
  },
  {
    accessorKey: 'netAmount',
    header: 'Net Amount',
  },
  {
    accessorKey: 'paymentDate',
    header: 'Payment Date',
  },
  {
    accessorKey: 'paymentFor',
    header: 'Month',
  },
  {
    accessorKey: 'disbursementStatus',
    header: 'Status',
  },
  {
    accessorKey: 'disbursementMethod',
    header: 'Disbursement',
  },
]

const outstandingColumns: TableColumn<OutstandingInvoice>[] = [
  {
    accessorKey: 'invoiceNumber',
    header: 'Invoice #',
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
  },
  {
    accessorKey: 'paymentFor',
    header: 'Month',
  },
  {
    accessorKey: 'tenantName',
    header: 'Tenant',
  },
]

const { data, status } = await useLazyAsyncData(
  `unit-details-${unitId}`,
  () => $fetch<UnitDetailsResponse>(`/api/properties/unitownership/owner/${unitId}`),
)
</script>

<style>
</style>
