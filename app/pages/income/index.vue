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

    <div class="space-y-6 print:hidden ">
      <!-- <div class="grid grid-cols-1 md:grid-cols-2  lg:grid-cols-5 gap-4 mb-8 print:hidden">
        <UCard>
          <div class="flex items-center">
            <div class="rounded-full bg-primary-50 dark:bg-primary-900 p-3 mr-3">
              <UIcon
                name="i-lucide-credit-card"
                class="w-5 h-5 text-primary-500 dark:text-primary-400"
              />
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Total Revenue
              </p>
              <p class="text-xl font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(summaryStats.totalIncome) }}
              </p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center">
            <div class="rounded-full bg-info-50 dark:bg-info-900 p-3 mr-3">
              <UIcon
                name="i-lucide-target"
                class="w-5 h-5 text-info-500 dark:text-info-400"
              />
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Expected {{ getFilterPeriodText() }}
              </p>
              <p class="text-xl font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(summaryStats.thisMonthExpectedRevenue) }}
              </p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center">
            <div class="rounded-full bg-success-50 dark:bg-success-900 p-3 mr-3">
              <UIcon
                name="i-lucide-circle-check"
                class="w-5 h-5 text-success-500 dark:text-success-400"
              />
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Collected {{ getFilterPeriodText() }}
              </p>
              <p class="text-xl font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(summaryStats.thisMonthIncome) }}
              </p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center">
            <div class="rounded-full bg-warning-50 dark:bg-warning-900 p-3 mr-3">
              <UIcon
                name="i-lucide-alert-circle"
                class="w-5 h-5 text-warning-500 dark:text-warning-400"
              />
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Outstanding
              </p>
              <p class="text-xl font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(summaryStats.outstandingAmount) }}
              </p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center">
            <div class="rounded-full bg-purple-50 dark:bg-purple-900 p-3 mr-3">
              <UIcon
                name="i-lucide-trending-up"
                class="w-5 h-5 text-purple-500 dark:text-purple-400"
              />
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Collection Rate
              </p>
              <p class="text-xl font-medium text-gray-900 dark:text-white">
                {{ summaryStats.collectionRate || 0 }}%
              </p>
            </div>
          </div>
        </UCard>
      </div> -->

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
                    },
                  ],
                ]"
              >
                <UButton
                  color="secondary"
                  variant="ghost"
                  icon="i-lucide-download"
                  size="sm"
                  @click="print()"
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

    <div
      v-if="showPrintInvoice"
      class="hidden print:block"
    >
      <ClientOnly>
        <PrintsTenantInvoice :invoice-data="selectedInvoiceForPrint" />
      </ClientOnly>
    </div>

    <div class="print:hidden">
      <UModal
        v-if="selectedInvoice"
        v-model:open="open"
        :title="`Invoice #${selectedInvoice.invoiceNumber}`"
        size="lg"
      >
        <template #body>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <UBadge
                class="capitalize"
                :color="getStatusColor(selectedInvoice.status)"
              >
                {{ selectedInvoice.status }}
              </UBadge>
              <p class="text-sm text-gray-500">
                {{ formatDate(selectedInvoice.paymentDate) }}
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 class="text-sm font-medium text-gray-500 mb-1">
                  Tenant
                </h3>
                <p class="font-medium">
                  {{ selectedInvoice.tenantName }}
                </p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500 mb-1">
                  Total Amount
                </h3>
                <p class="font-medium">
                  {{ formatCurrency(selectedInvoice.totalAmount) }}
                </p>
                <div
                  v-if="selectedInvoice.totalServiceCharges && selectedInvoice.totalServiceCharges > 0"
                  class="text-sm text-gray-500"
                >
                  Rent: {{ formatCurrency(selectedInvoice.amount) }}<br>
                  Services: {{ formatCurrency(selectedInvoice.totalServiceCharges) }}
                </div>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500 mb-1">
                  Property
                </h3>
                <p class="font-medium">
                  {{ selectedInvoice.propertyName }}
                </p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500 mb-1">
                  Unit
                </h3>
                <p class="font-medium">
                  {{ selectedInvoice.unitNumber }}
                </p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500 mb-1">
                  Payment Method
                </h3>
                <p class="font-medium capitalize">
                  {{ formatPaymentMethod(selectedInvoice.paymentMethod) }}
                </p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500 mb-1">
                  Period
                </h3>
                <p class="font-medium">
                  {{ selectedInvoice.paymentFor.monthName }} {{ selectedInvoice.paymentFor.year }}
                </p>
              </div>
              <div v-if="selectedInvoice.paymentReferenceId">
                <h3 class="text-sm font-medium text-gray-500 mb-1">
                  Reference ID
                </h3>
                <p class="font-medium">
                  {{ selectedInvoice.paymentReferenceId }}
                </p>
              </div>
              <div v-if="selectedInvoice.phoneNumber">
                <h3 class="text-sm font-medium text-gray-500 mb-1">
                  Phone Number
                </h3>
                <p class="font-medium">
                  {{ selectedInvoice.phoneNumber }}
                </p>
              </div>
            </div>

            <!-- Service Charges Breakdown -->
            <div
              v-if="selectedInvoice.serviceCharges && selectedInvoice.serviceCharges.length > 0"
              class="border-t pt-4"
            >
              <h3 class="text-sm font-medium text-gray-500 mb-2">
                Service Charges
              </h3>
              <div class="space-y-1">
                <div
                  v-for="service in selectedInvoice.serviceCharges"
                  :key="service.serviceId"
                  class="flex justify-between text-sm"
                >
                  <span>{{ service.serviceName }}</span>
                  <span class="font-medium">{{ formatCurrency(service.amount) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-between w-full mt-6">
            <UButton
              color="neutral"
              @click="open = false"
            >
              Close
            </UButton>
            <UButton
              color="primary"
              icon="i-lucide-printer"
              @click="print()"
            >
              Print Receipt
            </UButton>
          </div>
        </template>
      </UModal>
    </div>
  </BasePage>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import type { InvoiceListItem, PaymentMethod } from '~/types/invoice'

definePageMeta({
  title: 'Payments',
})

const { propertyId, propertyChanged } = useCurrentProperty()
const { formatCurrency, formatDate, formatPaymentMethod } = useFormatters()
const { formatFloorNumber } = useFormatFloor()

const now = new Date()
const currentMonth = (now.getMonth() + 1).toString() // 1-12
const currentYear = now.getFullYear()
const showPrintInvoice = ref(false)

const open = ref(false)
const selectedInvoice = ref<InvoiceListItem | null>(null)
const searchQuery = ref('')
const statusFilter = ref('all')
const monthFilter = ref(currentMonth)
const yearFilter = ref(currentYear.toString())
const currentPage = ref(1)
const limit = ref(25)
const selectedInvoiceForPrint = ref<any | null>(null)

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
  month: currentMonth,
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
    watch: [currentPage, limit, searchQuery, statusFilter, monthFilter, yearFilter, propertyId,
      () => propertyChanged],
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
// const summaryStats = computed(() => data.value?.summary || {
//   totalIncome: 0,
//   thisMonthIncome: 0,
//   outstandingAmount: 0,
//   totalInvoices: 0,
//   thisMonthExpectedRevenue: 0,
//   collectionRate: 0,
//   filters: {
//     month: parseInt(currentMonth),
//     year: currentYear,
//     propertyId: null,
//   },
// })

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
  open.value = true
}

function getStatusColor(status: string): 'success' | 'error' | 'info' | 'warning' | 'primary' | 'secondary' | 'tertiary' | 'neutral' | undefined {
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

// function getFilterPeriodText() {
//   if (monthFilter.value === 'all' && yearFilter.value === 'all') {
//     return 'All Time'
//   }
//   else if (monthFilter.value === 'all') {
//     return `in ${yearFilter.value}`
//   }
//   else if (yearFilter.value === 'all') {
//     const monthName = monthOptions.find(m => m.value === monthFilter.value)?.label
//     return monthName || 'This Month'
//   }
//   else {
//     const monthName = monthOptions.find(m => m.value === monthFilter.value)?.label
//     return `${monthName} ${yearFilter.value}`
//   }
// }

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

    selectedInvoiceForPrint.value = transformedInvoice
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
