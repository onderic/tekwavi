<template>
  <BasePage
    title="Rental Payments"
    icon="i-lucide-bar-chart-3"
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
    <!-- Active Filters Display -->
    <div
      v-if="hasActiveFilters"
      class="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-1 mb-4 print:hidden"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-filter"
            class="w-4 h-4 text-blue-600 dark:text-blue-400"
          />
          <span class="text-sm text-blue-700 dark:text-blue-300">
            Showing data for:
            <strong>{{ getActiveFiltersText() }}</strong>
          </span>
        </div>
        <UButton
          v-if="hasActiveFilters"
          color="primary"
          variant="ghost"
          size="xs"
          icon="i-lucide-x"
          @click="clearAllFilters"
        >
          Clear filters
        </UButton>
      </div>
    </div>

    <div class="space-y-6 print:hidden">
      <!-- Filters and Table -->
      <UCard>
        <template #header>
          <div class="flex flex-col sm:flex-row justify-between gap-2 print:hidden">
            <div class="flex flex-wrap items-center">
              <h2 class="text-lg font-medium text-gray-900 dark:text-white mr-2">
                Payment Records
              </h2>
            </div>
            <div class="mt-2 sm:mt-0 gap-2 flex items-center">
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
                      label: 'Print Invoices',
                      icon: 'i-lucide-printer',
                      click: () => printReceipt(),
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
          </div>
        </template>

        <div class="flex flex-wrap items-center justify-between gap-3 mb-4 print:hidden">
          <div class="flex items-center w-full lg:w-64">
            <UInput
              v-model="searchQuery"
              class="w-full"
              icon="i-lucide-search"
              placeholder="Search by tenant, unit, invoice #..."
            />
          </div>

          <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            <USelect
              v-model="yearFilter"
              :items="yearOptions"
              placeholder="Select Year"
              size="sm"
              class="w-full"
            />

            <USelect
              v-model="monthFilter"
              :items="monthOptions"
              placeholder="Select Month"
              size="sm"
              class="w-full"
            />

            <USelect
              v-model="statusFilter"
              :items="[
                { label: 'All Status', value: 'all' },
                { label: 'Paid', value: 'paid' },
                { label: 'Issued', value: 'issued' },
                { label: 'Cancelled', value: 'cancelled' },
                { label: 'Refunded', value: 'refunded' },
              ]"
              placeholder="Filter by status"
              size="sm"
              class="w-full"
            />

            <UTooltip text="Clear all filters">
              <UButton
                v-if="hasActiveFilters"
                color="neutral"
                variant="ghost"
                icon="i-lucide-filter-x"
                size="sm"
                class="ml-1"
                @click="clearAllFilters"
              />
            </UTooltip>
          </div>
        </div>

        <UTable
          :loading="status === 'pending'"
          :columns="columns"
          :data="invoices"
          :empty-state="{
            icon: 'i-lucide-file-text',
            label: 'No payment records found',
          }"
          class="mt-3"
        >
          <template #invoiceNumber-cell="{ row }">
            <UButton
              variant="link"
              color="primary"
              @click="viewInvoiceDetails(row.original)"
            >
              {{ row.original.invoiceNumber }}
            </UButton>
          </template>
          <template #tenantName-cell="{ row }">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-user"
                class="w-4 h-4 text-gray-500"
              />
              <span>{{ row.original.tenantName }}</span>
            </div>
          </template>
          <template #floorNumber-cell="{ row }">
            <span class="capitalize">
              <span>
                {{ formatFloorNumber(row.original.floorNumber).number }}
                <sup v-if="formatFloorNumber(row.original.floorNumber).suffix">
                  {{ formatFloorNumber(row.original.floorNumber).suffix }}
                </sup>
                {{ formatFloorNumber(row.original.floorNumber).number === 'Ground' ? ' Fr' : ' Floor' }}
              </span>
            </span>
          </template>
          <template #totalAmount-cell="{ row }">
            <div>
              <span class="font-medium">{{ formatCurrency(row.original.totalAmount) }}</span>
              <div
                v-if="row.original.totalServiceCharges && row.original.totalServiceCharges > 0"
                class="text-xs text-gray-500"
              >
                Rent: {{ formatCurrency(row.original.amount) }} + Services: {{ formatCurrency(row.original.totalServiceCharges) }}
              </div>
            </div>
          </template>

          <template #status-cell="{ row }">
            <UBadge
              class="capitalize"
              :color="getStatusColor(row.original.status)"
            >
              {{ row.original.status }}
            </UBadge>
          </template>

          <template #paymentMethod-cell="{ row }">
            <div class="flex items-center">
              <UIcon
                :name="getPaymentIcon(row.original.paymentMethod)"
                class="mr-1.5 w-4 h-4"
              />
              <span class="capitalize">{{ formatPaymentMethod(row.original.paymentMethod) }}</span>
            </div>
          </template>

          <template #paymentDate-cell="{ row }">
            {{ formatDate(row.original.paymentDate) || 'N/A' }}
          </template>

          <template #paymentFor-cell="{ row }">
            {{ row.original.paymentFor.monthName }} {{ row.original.paymentFor.year }}
          </template>
          <template #actions-cell="{ row }">
            <div class="flex items-center gap-2">
              <UTooltip text="View Details">
                <UButton
                  color="primary"
                  variant="ghost"
                  icon="i-lucide-eye"
                  size="xs"
                  @click="viewInvoiceDetails(row.original)"
                />
              </UTooltip>
              <UTooltip text="Print Receipt">
                <UButton
                  color="secondary"
                  variant="ghost"
                  icon="i-lucide-printer"
                  size="xs"
                  @click="print(row.original)"
                />
              </UTooltip>
            </div>
          </template>
        </UTable>

        <div
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-default pt-4 mt-4"
        >
          <div class="text-xs sm:text-sm text-gray-500 w-full sm:w-auto mb-2 sm:mb-0 break-words">
            Showing {{ (currentPage - 1) * limit + 1 }}-{{ Math.min(currentPage * limit, totalInvoices) }} of {{ totalInvoices }} payments
          </div>
          <div class="flex items-center gap-1.5 self-end sm:self-auto">
            <UPagination
              v-model:page="currentPage"
              :page-count="totalPages"
              :total="totalInvoices"
              :items-per-page="limit"
              class="flex-shrink-0"
            />
          </div>
        </div>
      </UCard>
    </div>

    <PrintsTenantInvoice
      v-if="selectedInvoice"
      :invoice="selectedInvoice"
      :tenant-info="tenantInfo"
      :is-visible="isPrinting"
    />
  </BasePage>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import type { InvoiceListItem, PaymentMethod } from '~/types/invoice'

definePageMeta({
  title: 'Payments',
})

const { propertyId, currentProperty } = useCurrentProperty()
const { formatCurrency, formatDate, formatPaymentMethod } = useFormatters()
const { formatFloorNumber } = useFormatFloor()

const now = new Date()
const currentMonth = (now.getMonth() + 1).toString() // 1-12
const currentYear = now.getFullYear()

const selectedInvoice = ref<InvoiceListItem | null>(null)
const searchQuery = ref('')
const statusFilter = ref('all')
const monthFilter = ref('all')
const yearFilter = ref(currentYear.toString())
const currentPage = ref(1)
const limit = ref(25)
const tenantInfo = ref({ email: 'tenant@email.com' })
const isPrinting = ref(false)

const columns: TableColumn<InvoiceListItem>[] = [
  { accessorKey: 'invoiceNumber', header: 'Invoice #' },
  { accessorKey: 'tenantName', header: 'Tenant' },
  { accessorKey: 'floorNumber', header: 'Floor' },
  { accessorKey: 'unitNumber', header: 'Unit' },
  { accessorKey: 'totalAmount', header: 'Total Amount' },
  { accessorKey: 'paymentMethod', header: 'Payment Method' },
  { accessorKey: 'paymentFor', header: 'Period' },
  { accessorKey: 'paymentDate', header: 'Paid On' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actions', header: 'Actions' },
]

const monthOptions = [
  { label: 'All Months', value: 'all' },
  { label: 'January', value: '1' },
  { label: 'February', value: '2' },
  { label: 'March', value: '3' },
  { label: 'April', value: '4' },
  { label: 'May', value: '5' },
  { label: 'June', value: '6' },
  { label: 'July', value: '7' },
  { label: 'August', value: '8' },
  { label: 'September', value: '9' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
]

const yearOptions = [
  { label: 'All Years', value: 'all' },
  { label: currentYear.toString(), value: currentYear.toString() },
  { label: (currentYear - 1).toString(), value: (currentYear - 1).toString() },
  { label: (currentYear - 2).toString(), value: (currentYear - 2).toString() },
  { label: (currentYear - 3).toString(), value: (currentYear - 3).toString() },
]

const defaultFilters = {
  search: '',
  year: currentYear.toString(),
  month: 'all',
  status: 'all',
  page: 1,
}

const hasActiveFilters = computed(() => {
  return searchQuery.value !== defaultFilters.search
    || yearFilter.value !== defaultFilters.year
    || monthFilter.value !== defaultFilters.month
    || statusFilter.value !== defaultFilters.status
})

function clearAllFilters() {
  searchQuery.value = defaultFilters.search
  yearFilter.value = defaultFilters.year
  monthFilter.value = defaultFilters.month
  statusFilter.value = defaultFilters.status
  currentPage.value = defaultFilters.page

  // Show feedback to the user
  useToast().add({
    title: 'Filters Cleared',
    description: 'All filters have been reset to defaults',
    color: 'info',
    icon: 'i-lucide-filter-x',
  })
}

const { data, status } = await useLazyAsyncData(
  'invoices',
  async () => {
    if (!propertyId.value) {
      return {
        invoices: [] as InvoiceListItem[],
        pagination: {
          page: 1,
          limit: limit.value,
          total: 0,
          pages: 0,
        },
        summary: {
          totalIncome: 0,
          thisMonthIncome: 0,
          outstandingAmount: 0,
          thisMonthExpectedRevenue: 0,
          totalInvoices: 0,
          collectionRate: 0,
          filters: {
            month: parseInt(currentMonth),
            year: currentYear,
            propertyId: null,
          },
        },
      }
    }

    const queryParams = new URLSearchParams({
      propertyId: propertyId.value,
      page: currentPage.value.toString(),
      limit: limit.value.toString(),
      search: searchQuery.value,
      status: statusFilter.value !== 'all' ? statusFilter.value : '',
      month: monthFilter.value !== 'all' ? monthFilter.value : '',
      year: yearFilter.value !== 'all' ? yearFilter.value : '',
    })

    return $fetch<{
      invoices: InvoiceListItem[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
      summary: {
        totalIncome: number
        thisMonthIncome: number
        outstandingAmount: number
        totalInvoices: number
        thisMonthExpectedRevenue: number
        collectionRate: number
        filters: {
          month: number
          year: number
          propertyId: string | null
        }
      }
    }>(`/api/invoices?${queryParams.toString()}`)
  },
  {
    watch: [currentPage, limit, searchQuery, statusFilter, monthFilter, yearFilter, propertyId],
    server: false,
    default: () => ({
      invoices: [] as InvoiceListItem[],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      },
      summary: {
        totalIncome: 0,
        thisMonthIncome: 0,
        outstandingAmount: 0,
        thisMonthExpectedRevenue: 0,
        totalInvoices: 0,
        collectionRate: 0,
        filters: {
          month: parseInt(currentMonth),
          year: currentYear,
          propertyId: null,
        },
      },
    }),
  },
)

const invoices = computed(() => data.value?.invoices || [])
const totalPages = computed(() => data.value?.pagination?.pages || 1)
const totalInvoices = computed(() => data.value?.pagination?.total || 0)

watch([searchQuery, statusFilter, monthFilter, yearFilter], () => {
  currentPage.value = 1
})

function getPaymentIcon(method: PaymentMethod) {
  const icons: Record<PaymentMethod, string> = {
    cash: 'i-lucide-banknote',
    mpesa: 'i-lucide-smartphone',
    bank_transfer: 'i-lucide-landmark',
    cheque: 'i-lucide-file-check',
    card: 'i-lucide-credit-card',
  }
  return icons[method] || 'i-lucide-credit-card'
}

function viewInvoiceDetails(invoice: InvoiceListItem) {
  selectedInvoice.value = invoice
  // No need to set open.value since we're not using a modal
}

function getStatusColor(status: string): 'success' | 'error' | 'info' | 'warning' | 'primary' | 'secondary' | 'neutral' | undefined {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'success'
    case 'issued':
      return 'secondary'
    case 'draft':
      return 'neutral'
    case 'cancelled':
      return 'error'
    case 'refunded':
      return 'warning'
    default:
      return 'neutral'
  }
}

function getActiveFiltersText() {
  const filters = []

  // Always show current period
  const monthName = monthOptions.find(m => m.value === monthFilter.value)?.label
  if (monthFilter.value !== 'all' && yearFilter.value !== 'all') {
    filters.push(`${monthName} ${yearFilter.value}`)
  }
  else if (monthFilter.value !== 'all') {
    filters.push(monthName)
  }
  else if (yearFilter.value !== 'all') {
    filters.push(`Year ${yearFilter.value}`)
  }

  if (searchQuery.value) {
    filters.push(`Search: "${searchQuery.value}"`)
  }
  if (statusFilter.value !== 'all') {
    filters.push(`Status: ${statusFilter.value.charAt(0).toUpperCase() + statusFilter.value.slice(1)}`)
  }
  return filters.join(', ')
}

function printReceipt() {
  window.print()
}

function print(invoice?: any) {
  if (invoice) {
    const originalTitle = document.title

    selectedInvoice.value = invoice
    isPrinting.value = true

    // Wait for Vue to render the receipt card, then print
    nextTick(() => {
      // Set a unique document title for the receipt
      // Format: Receipt_InvoiceNumber_TenantName_Date
      const receiptDate = new Date(invoice.paymentDate).toISOString().split('T')[0]
      const tenantName = invoice.tenantName.replace(/\s+/g, '_')
      document.title = `Receipt_${invoice.invoiceNumber}_${tenantName}_${receiptDate}`

      window.print()

      // Reset the printing state and document title after printing
      setTimeout(() => {
        isPrinting.value = false
        selectedInvoice.value = null
        document.title = originalTitle
      }, 100)
    })
  }
  else {
    // For printing the table view, set a general title
    const originalTitle = document.title
    const currentDate = new Date().toISOString().split('T')[0]
    document.title = `Payment_Records_${currentProperty.value?.name || 'Property'}_${currentDate}`

    window.print()

    // Restore original title
    setTimeout(() => {
      document.title = originalTitle
    }, 100)
  }
}
</script>

<style>
@media print {
  @page {
    size: A4;
    margin: 0;
  }

  body {
    margin: 0;
    padding: 0;
  }

   /* Flexbox layout for print */
  .print\:min-h-screen {
    min-height: 100vh !important;
  }

  .print\:flex {
    display: flex !important;
  }

  .print\:flex-col {
    flex-direction: column !important;
  }

  .print\:flex-grow {
    flex-grow: 1 !important;
  }

  .print\:mt-auto {
    margin-top: auto !important;
  }

  /* Compact spacing for print */
  .print\:p-6 {
    padding: 1.5rem !important;
  }

  .print\:p-3 {
    padding: 0.75rem !important;
  }

  .print\:px-8 {
    padding-left: 2rem !important;
    padding-right: 2rem !important;
  }

  .print\:py-3 {
    padding-top: 0.75rem !important;
    padding-bottom: 0.75rem !important;
  }

  .print\:py-2 {
    padding-top: 0.5rem !important;
    padding-bottom: 0.5rem !important;
  }

  .print\:px-3 {
    padding-left: 0.75rem !important;
    padding-right: 0.75rem !important;
  }

  .print\:mb-4 {
    margin-bottom: 1rem !important;
  }

  .print\:mb-1 {
    margin-bottom: 0.25rem !important;
  }

  .print\:mt-3 {
    margin-top: 0.75rem !important;
  }

  .print\:mt-1 {
    margin-top: 0.25rem !important;
  }

  .print\:gap-4 {
    gap: 1rem !important;
  }

  .print\:gap-2 {
    gap: 0.5rem !important;
  }

  /* Text size adjustments */
  .print\:text-xl {
    font-size: 1.25rem !important;
  }

  .print\:text-base {
    font-size: 1rem !important;
  }

  .print\:text-sm {
    font-size: 0.875rem !important;
  }

  .print\:text-xs {
    font-size: 0.75rem !important;
  }

  .print\:text-\[10px\] {
    font-size: 10px !important;
  }

  /* Logo size adjustment */
  .print\:h-12 {
    height: 3rem !important;
  }

  .print\:w-12 {
    width: 3rem !important;
  }

  /* Ensure full width for print */
  .print\:max-w-none {
    max-width: none !important;
  }

  .print\:mx-0 {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  .print\:w-full {
    width: 100% !important;
  }

  /* Hide elements not needed for print */
  .print\:hidden {
    display: none !important;
  }

  /* Show receipt when printing */
  .print\:block {
    display: block !important;
  }

  /* Ensure colors print properly */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Fix table layout for print */
  table {
    width: 100% !important;
    border-collapse: collapse !important;
  }

  /* Ensure proper page breaks */
  .page-break-avoid {
    page-break-inside: avoid !important;
  }
}
</style>
