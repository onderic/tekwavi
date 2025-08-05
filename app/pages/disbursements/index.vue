<template>
  <BasePage
    :title="data?.property?.propertyName ? `Disbursements - ${data.property.propertyName}` : 'Disbursements'"
    icon="i-lucide-door-open"
    :status="status === 'pending'"
  >
    <template #headerActions>
      <!-- <UButton
        color="primary"
        variant="solid"
        label="Reload"
        icon="i-lucide-refresh-cw"
        size="sm"
        :loading="status === 'pending'"
        @click="refresh()"
      /> -->
    </template>

    <!-- Summary Cards -->
    <!-- <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <UCard>
        <div class="flex items-center">
          <div class="rounded-full bg-primary-50 dark:bg-primary-900 p-3 mr-3">
            <UIcon
              name="i-lucide-home"
              class="w-5 h-5 text-primary-500 dark:text-primary-400"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Total Units
            </p>
            <p class="text-xl font-medium text-gray-900 dark:text-white">
              {{ summary.totalUnits }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center">
          <div class="rounded-full bg-info-50 dark:bg-info-900 p-3 mr-3">
            <UIcon
              name="i-lucide-file-text"
              class="w-5 h-5 text-info-500 dark:text-info-400"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Total Invoices
            </p>
            <p class="text-xl font-medium text-gray-900 dark:text-white">
              {{ summary.totalInvoices }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center">
          <div class="rounded-full bg-success-50 dark:bg-success-900 p-3 mr-3">
            <UIcon
              name="i-lucide-banknote"
              class="w-5 h-5 text-success-500 dark:text-success-400"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Total Collected
            </p>
            <p class="text-xl font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(summary.totalAmountCollected) }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center">
          <div class="rounded-full bg-warning-50 dark:bg-warning-900 p-3 mr-3">
            <UIcon
              name="i-lucide-clock"
              class="w-5 h-5 text-warning-500 dark:text-warning-400"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Undisbursed
            </p>
            <p class="text-xl font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(summary.totalUndisbursedAmount) }}
            </p>
            <p class="text-xs text-gray-500">
              {{ summary.totalUndisbursedInvoices }} invoice{{ summary.totalUndisbursedInvoices !== 1 ? 's' : '' }}
            </p>
          </div>
        </div>
      </UCard>
    </div> -->

    <!-- Main Table Card -->
    <UCard>
      <template #header>
        <div class="flex flex-col sm:flex-row justify-between gap-2">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">
            Invoice Disbursements
          </h2>
          <UDropdownMenu
            :items="[
              [
                {
                  label: 'Export to CSV',
                  icon: 'i-lucide-file-text',
                },
                {
                  label: 'Export to Excel',
                  icon: 'i-lucide-file-spreadsheet',
                },
                {
                  label: 'Print Report',
                  icon: 'i-lucide-printer',
                },
              ],
            ]"
          >
            <UButton
              color="secondary"
              variant="ghost"
              icon="i-lucide-download"
              size="sm"
            >
              Export
            </UButton>
          </UDropdownMenu>
        </div>
      </template>

      <!-- Filters -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <UInput
          v-model="searchQuery"
          class="w-full sm:max-w-sm"
          icon="i-lucide-search"
          placeholder="Search by unit #, tenant, owner..."
        />

        <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
          <USelect
            v-model="yearFilter"
            :items="yearOptions"
            placeholder="Select Year"
            size="sm"
            class="min-w-32"
          />

          <USelect
            v-model="monthFilter"
            :items="monthOptions"
            placeholder="Select Month"
            size="sm"
            class="min-w-40"
          />

          <USelect
            v-model="floorFilter"
            :items="floorOptions"
            placeholder="Filter by floor"
            size="sm"
            class="min-w-40"
          />
        </div>
      </div>
      <UTable
        ref="table"
        :loading="status === 'pending'"
        loading-animation="carousel"
        :data="filteredInvoices"
        :columns="columns"
        class="flex-1"
        :empty-state="{
          icon: 'i-lucide-door-closed',
          label: 'No invoices found',
        }"
      >
        <template #unitNumber-cell="{ row }">
          <div>
            <div class="font-medium">
              Unit {{ row.original.unitNumber }}
            </div>
            <div class="text-xs text-gray-500">
              <span class="capitalize">{{ row.original.unitType ? row.original.unitType.replace(/_/g, ' ') : 'Type' }}</span>
              <span v-if="row.original.currentTenant"> • {{ row.original.currentTenant.tenantName }}</span>
            </div>
          </div>
        </template>

        <template #invoiceNumber-cell="{ row }">
          <div>
            <div class="font-medium">
              {{ row.original.invoiceNumber }}
            </div>
            <div class="text-xs text-gray-500">
              {{ formatDate(row.original.paymentDate) }}
            </div>
          </div>
        </template>

        <template #paymentFor-cell="{ row }">
          <div>
            <div class="font-medium">
              {{ getMonthName(row.original.paymentFor.month) }} {{ row.original.paymentFor.year }}
            </div>
            <div class="text-xs text-gray-500">
              {{ row.original.paymentMethod || 'N/A' }}
            </div>
          </div>
        </template>

        <template #owner-cell="{ row }">
          <div v-if="row.original.ownerDetails">
            <div class="font-medium">
              {{ row.original.ownerDetails.ownerName }}
            </div>
            <div class="text-xs text-gray-500">
              {{ row.original.ownerDetails.ownerPhone || row.original.ownerDetails.ownerEmail || '-' }}
            </div>
          </div>
          <span
            v-else
            class="text-gray-400"
          >-</span>
        </template>

        <template #amount-cell="{ row }">
          <div>
            <div class="font-medium">
              {{ formatCurrency(row.original.amount) }}
            </div>
            <div class="text-xs text-gray-500">
              Total: {{ formatCurrency(row.original.totalAmount) }}
            </div>
          </div>
        </template>

        <template #serviceFee-cell="{ row }">
          <div>
            <div class="font-medium text-orange-600 dark:text-orange-400">
              {{ formatCurrency(row.original.serviceFeePerMonth || 0) }}
            </div>
            <div class="text-xs text-gray-500">
              Service charges: {{ formatCurrency(row.original.totalServiceCharges || 0) }}
            </div>
          </div>
        </template>

        <template #disbursable-cell="{ row }">
          <div>
            <div class="font-semibold text-primary">
              {{ formatCurrency(row.original.disbursableAmount || 0) }}
            </div>
            <div class="text-xs text-gray-500">
              {{ row.original.isDisbursed ? 'Disbursed' : 'Pending' }}
            </div>
          </div>
        </template>

        <template #status-cell="{ row }">
          <div class="flex items-center gap-2">
            <UBadge
              v-if="row.original.isDisbursed"
              color="success"
              variant="soft"
            >
              <UIcon
                name="i-lucide-check-circle"
                class="w-3 h-3 mr-1"
              />
              Disbursed
            </UBadge>
            <UBadge
              v-else
              color="warning"
              variant="soft"
            >
              <UIcon
                name="i-lucide-alert-circle"
                class="w-3 h-3 mr-1"
              />
              Pending
            </UBadge>
          </div>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-2">
            <UTooltip text="View Details">
              <UButton
                color="primary"
                variant="ghost"
                icon="i-lucide-eye"
                size="xs"
                @click="viewInvoiceDetails(row)"
              />
            </UTooltip>
            <UTooltip
              :text="!row.original.isDisbursed ? 'Process Disbursement' : 'Already disbursed'"
            >
              <UButton
                color="success"
                variant="ghost"
                icon="i-lucide-send"
                size="xs"
                :disabled="row.original.isDisbursed"
                @click="processDisbursement(row)"
              />
            </UTooltip>
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal
      v-model:open="open"
      :title="`Invoice Details - ${selectedInvoice?.invoiceNumber || ''}`"
    >
      <template #body>
        <div
          v-if="selectedInvoice"
          class="space-y-4"
        >
          <!-- Invoice Summary -->
          <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p class="text-sm text-gray-500">
                Unit
              </p>
              <p class="font-medium">
                Unit {{ selectedInvoice.unitNumber }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500">
                Period
              </p>
              <p class="font-medium">
                {{ getMonthName(selectedInvoice.paymentFor.month) }} {{ selectedInvoice.paymentFor.year }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500">
                Owner
              </p>
              <p class="font-medium">
                {{ selectedInvoice.ownerDetails?.ownerName || '-' }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500">
                Tenant
              </p>
              <p class="font-medium">
                {{ selectedInvoice.currentTenant?.tenantName || '-' }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500">
                Rent Amount
              </p>
              <p class="font-medium">
                {{ formatCurrency(selectedInvoice.amount) }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500">
                Total Amount
              </p>
              <p class="font-medium">
                {{ formatCurrency(selectedInvoice.totalAmount) }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500">
                Disbursable Amount
              </p>
              <p class="font-medium text-primary">
                {{ formatCurrency(selectedInvoice.disbursableAmount || 0) }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500">
                Status
              </p>
              <UBadge
                :color="selectedInvoice.isDisbursed ? 'success' : 'warning'"
                variant="soft"
              >
                {{ selectedInvoice.isDisbursed ? 'Disbursed' : 'Pending' }}
              </UBadge>
            </div>
          </div>

          <!-- Service Charges -->
          <div
            v-if="selectedInvoice.serviceCharges && selectedInvoice.serviceCharges.length > 0"
            class="space-y-2"
          >
            <h4 class="font-medium text-sm text-gray-700 dark:text-gray-300">
              Service Charges
            </h4>
            <div class="space-y-1">
              <div
                v-for="service in selectedInvoice.serviceCharges"
                :key="service.serviceId"
                class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
              >
                <span class="text-sm">{{ service.serviceName }}</span>
                <span class="font-medium">{{ formatCurrency(service.amount) }}</span>
              </div>
            </div>
          </div>

          <!-- Disbursement Details -->
          <div
            v-if="selectedInvoice.isDisbursed"
            class="space-y-2"
          >
            <h4 class="font-medium text-sm text-gray-700 dark:text-gray-300">
              Disbursement Details
            </h4>
            <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span class="text-gray-500">Date:</span>
                  <span class="font-medium ml-2">{{ formatDate(selectedInvoice.disbursementDate) }}</span>
                </div>
                <div>
                  <span class="text-gray-500">Method:</span>
                  <span class="font-medium ml-2">{{ selectedInvoice.disbursementMethod || '-' }}</span>
                </div>
                <div>
                  <span class="text-gray-500">Reference:</span>
                  <span class="font-medium ml-2">{{ selectedInvoice.disbursementReference || '-' }}</span>
                </div>
                <div>
                  <span class="text-gray-500">Net Amount:</span>
                  <span class="font-medium ml-2">{{ formatCurrency(selectedInvoice.netDisbursedAmount || 0) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="showDisbursementModal"
      :title="`Disbursement - ${selectedDisbursementInvoice?.invoiceNumber || ''}`"
    >
      <template #body>
        <div
          v-if="selectedDisbursementInvoice"
          class="space-y-2"
        >
          <!-- Disbursement Summary -->
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 class="font-medium mb-3">
              Disbursement Summary
            </h4>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-gray-500">Invoice</span>
                <span class="font-medium">{{ selectedDisbursementInvoice.invoiceNumber }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-500">Unit</span>
                <span class="font-medium">{{ selectedDisbursementInvoice.unitNumber }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-500">Period</span>
                <span class="font-medium">{{ getMonthName(selectedDisbursementInvoice.paymentFor.month) }} {{ selectedDisbursementInvoice.paymentFor.year }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-500">Owner</span>
                <span class="font-medium">{{ selectedDisbursementInvoice.ownerDetails?.ownerName || '-' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-500">Total Collected</span>
                <span class="font-medium">{{ formatCurrency(selectedDisbursementInvoice.amount) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-500">Service Fee</span>
                <span class="font-medium text-orange-600">-{{ formatCurrency(selectedDisbursementInvoice.serviceFeePerMonth || 0) }}</span>
              </div>
              <div class="flex justify-between border-t pt-2">
                <span class="text-sm font-medium">Amount to Disburse</span>
                <span class="font-semibold text-green-600 text-lg">{{ formatCurrency(selectedDisbursementInvoice.disbursableAmount || 0) }}</span>
              </div>
            </div>
          </div>

          <!-- Payment Details Form -->
          <div class="space-y-2">
            <h4 class="font-medium">
              Payment Details
            </h4>

            <UFormField
              label="Payment Method"
              required
            >
              <USelect
                v-model="disbursementForm.paymentMethod"
                :items="paymentMethods"
                placeholder="Select payment method"
              />
            </UFormField>

            <UFormField
              label="Payment Date"
              required
            >
              <UInput
                v-model="disbursementForm.paymentDate"
                type="date"
                :max="new Date().toISOString().split('T')[0]"
              />
            </UFormField>

            <UFormField
              label="Reference Number (If applicable)"
            >
              <UInput
                v-model="disbursementForm.referenceNumber"
                :placeholder="disbursementForm.paymentMethod === 'bank_transfer' ? 'Enter transaction reference' : disbursementForm.paymentMethod === 'cheque' ? 'Enter cheque number' : 'Enter reference'"
              />
            </UFormField>
          </div>

          <!-- Confirmation Notice -->
          <UAlert
            icon="i-lucide-info"
            color="info"
            variant="soft"
          >
            <template #description>
              By confirming, you acknowledge that the payment of <strong>{{ formatCurrency(selectedDisbursementInvoice.disbursableAmount || 0) }}</strong> has been made to the Unit owner.
            </template>
          </UAlert>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            @click="showDisbursementModal = false"
          >
            Cancel
          </UButton>
          <UButton
            color="success"
            variant="solid"
            icon="i-lucide-check"
            :disabled="!disbursementForm.paymentMethod || !disbursementForm.paymentDate || processingDisbursement"
            :loading="processingDisbursement"
            @click="confirmDisbursement"
          >
            {{ processingDisbursement ? 'Processing...' : 'Confirm Disbursement' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </BasePage>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import type {
  DisbursementInvoice,
  DisbursementResponse,
} from '~/types/disbursement'

definePageMeta({
  title: 'Disbursements',
})

const { propertyId } = useCurrentProperty()
const { formatCurrency, formatDate } = useFormatters()
const { formatFloorNumber } = useFormatFloor()
const toast = useToast()

const now = new Date()
const defaultYear = now.getFullYear()

const searchQuery = ref('')
const floorFilter = ref('all')
const monthFilter = ref<number | 'all'>('all')
const yearFilter = ref(defaultYear)
const open = ref(false)
const showDisbursementModal = ref(false)
const selectedInvoice = ref<DisbursementInvoice | null>(null)
const selectedDisbursementInvoice = ref<DisbursementInvoice | null>(null)

const disbursementForm = reactive({
  paymentMethod: 'bank_transfer',
  paymentDate: new Date().toISOString().split('T')[0],
  referenceNumber: '',
  notes: '',
})

const _currentMonth = computed(() => {
  if (monthFilter.value === 'all') {
    return data.value?.filters?.month || 'all'
  }
  return monthFilter.value
})

const paymentMethods = [
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Cash', value: 'cash' },
  { label: 'Cheque', value: 'cheque' },
  { label: 'Mobile Money', value: 'mobile_money' },
]

const columns: TableColumn<DisbursementInvoice>[] = [
  { accessorKey: 'unitNumber', header: 'Unit' },
  { accessorKey: 'invoiceNumber', header: 'Invoice' },
  { accessorKey: 'paymentFor', header: 'Period' },
  { accessorKey: 'owner', header: 'Owner' },
  { accessorKey: 'amount', header: 'Rent' },
  { accessorKey: 'serviceFee', header: 'Service Fee' },
  { accessorKey: 'disbursable', header: 'Disbursable' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actions', header: 'Actions' },
]

const monthOptions = [
  { label: 'All Months', value: 'all' },
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
]

const currentYear = new Date().getFullYear()
const yearOptions = [
  { label: currentYear.toString(), value: currentYear },
  { label: (currentYear - 1).toString(), value: currentYear - 1 },
  { label: (currentYear - 2).toString(), value: currentYear - 2 },
]

const { data, status, refresh } = await useLazyAsyncData<DisbursementResponse | null>(
  'disbursements',
  async () => {
    if (!propertyId.value) {
      return null
    }

    const params = new URLSearchParams({
      propertyId: propertyId.value,
      year: yearFilter.value.toString(),
    })

    if (monthFilter.value !== 'all') {
      params.append('month', monthFilter.value.toString())
    }

    return $fetch<DisbursementResponse>(`/api/invoices/disbursements?${params.toString()}`)
  },
  {
    watch: [propertyId, monthFilter, yearFilter],
    server: false,
  },
)

const invoices = computed<DisbursementInvoice[]>(() => data.value?.invoices || [])
// const summary = computed<DisbursementSummary>(() => data.value?.summary || {
//   totalUnits: 0,
//   totalInvoices: 0,
//   totalRentCollected: 0,
//   totalServiceChargesCollected: 0,
//   totalAmountCollected: 0,
//   totalServiceFees: 0,
//   totalDisbursableAmount: 0,
//   totalUndisbursedAmount: 0,
//   totalUndisbursedInvoices: 0,
//   totalDisbursedAmount: 0,
// })

const floorOptions = computed(() => {
  const floors = new Set(invoices.value.map(invoice => invoice.floorNumber).filter(Boolean))
  const options = [{ label: 'All Floors', value: 'all' }]

  Array.from(floors)
    .sort((a, b) => Number(a) - Number(b))
    .forEach((floor) => {
      const formatted = formatFloorNumber(floor!)
      options.push({
        label: `${formatted.number}${formatted.suffix ? formatted.suffix : ''} Floor`,
        value: floor!.toString(),
      })
    })

  return options
})

const filteredInvoices = computed<DisbursementInvoice[]>(() => {
  let filtered = [...invoices.value]

  // Search filter
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase()
    filtered = filtered.filter((invoice) => {
      return invoice.unitNumber?.toLowerCase().includes(search)
        || invoice.invoiceNumber?.toLowerCase().includes(search)
        || invoice.currentTenant?.tenantName?.toLowerCase().includes(search)
        || invoice.ownerDetails?.ownerName?.toLowerCase().includes(search)
    })
  }

  // Floor filter
  if (floorFilter.value !== 'all') {
    filtered = filtered.filter(invoice =>
      invoice.floorNumber?.toString() === floorFilter.value,
    )
  }

  return filtered
})

function processDisbursement(row: any) {
  selectedDisbursementInvoice.value = row.original
  // Reset form
  disbursementForm.paymentMethod = 'bank_transfer'
  disbursementForm.paymentDate = new Date().toISOString().split('T')[0]
  disbursementForm.referenceNumber = ''
  disbursementForm.notes = ''
  showDisbursementModal.value = true
}

const processingDisbursement = ref(false)

async function confirmDisbursement() {
  if (!selectedDisbursementInvoice.value || processingDisbursement.value) return

  const invoice = selectedDisbursementInvoice.value
  processingDisbursement.value = true

  try {
    const { data, error } = await useFetch('/api/invoices/disbursements/update', {
      method: 'POST',
      body: {
        invoiceId: invoice._id,
        paymentMethod: disbursementForm.paymentMethod,
        paymentDate: disbursementForm.paymentDate,
        referenceNumber: disbursementForm.referenceNumber,
        notes: disbursementForm.notes,
      },
    })

    if (error.value) {
      toast.add({
        title: 'Error',
        description: error.value.data?.statusMessage || 'Failed to process disbursement',
        color: 'error',
        icon: 'i-lucide-x-circle',
      })
    }
    else {
      toast.add({
        title: 'Success',
        description: data.value?.message || `Successfully processed disbursement for Invoice ${invoice.invoiceNumber}`,
        color: 'success',
        icon: 'i-lucide-check-circle',
      })

      showDisbursementModal.value = false
      await refresh()
    }
  }
  catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to process disbursement',
      color: 'error',
      icon: 'i-lucide-x-circle',
    })
  }
  finally {
    processingDisbursement.value = false
  }
}

function viewInvoiceDetails(row: any) {
  selectedInvoice.value = row.original
  open.value = true
}

function getMonthName(month: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return monthNames[month - 1] || ''
}
</script>

<style>

</style>
