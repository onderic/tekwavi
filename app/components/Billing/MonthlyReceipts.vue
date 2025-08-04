<template>
  <UCard>
    <div class="flex items-center space-x-2 mb-4">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
        Monthly Invoices
      </h2>
    </div>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
      Overview of your invoices by month (Jan - Dec).
    </p>

    <div
      v-if="loading"
      class="space-y-3"
    >
      <USkeleton
        v-for="i in 5"
        :key="i"
        class="h-12 w-full"
      />
    </div>

    <UTable
      v-else
      :columns="columns"
      :data="formattedInvoices"
      :loading="loading"
    >
      <template #month-cell="{ row }">
        <div class="flex items-center gap-2">
          <div class="font-medium text-gray-900 dark:text-gray-100">
            {{ row.original.monthName }} {{ row.original.year }}
          </div>
          <UBadge
            v-if="row.original.isCurrentMonth"
            color="primary"
            variant="subtle"
            size="xs"
          >
            Current
          </UBadge>
        </div>
      </template>

      <template #dueDate-cell="{ row }">
        <div class="text-sm text-gray-600 dark:text-gray-400">
          {{ formatDate(row.original.dueDate) }}
        </div>
      </template>

      <template #amount-cell="{ row }">
        <div class="font-medium">
          {{ formatCurrency(row.original.amount) }}
        </div>
      </template>

      <template #status-cell="{ row }">
        <UBadge
          :color="getStatusColor(row.original.status)"
          variant="subtle"
          size="sm"
        >
          {{ row.original.status.toLowerCase() === 'issued' ? 'Unpaid' : row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1) }}
        </UBadge>
      </template>
      <template #actions-cell="{ row }">
        <div class="flex justify-end gap-2">
          <UButton
            v-if="row.original.isPaid"
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-file-text"
            @click="viewInvoice(row)"
          >
            View
          </UButton>
          <UButton
            v-if="!row.original.isPaid"
            color="primary"
            variant="soft"
            size="xs"
            icon="i-lucide-credit-card"
            @click="payNow(row)"
          >
            Pay Now
          </UButton>
        </div>
      </template>
    </UTable>

    <BillingPayBill
      :open="showPayBillModal"
      :invoice="selectedInvoice"
      @update:open="showPayBillModal = $event"
      @payment-completed="handlePaymentCompleted"
    />

    <UModal v-model="showViewModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Invoice Details
            </h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              @click="showViewModal = false"
            />
          </div>
        </template>

        <div
          v-if="selectedViewInvoice"
          class="space-y-4"
        >
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Invoice Number
              </p>
              <p class="text-sm text-gray-900 dark:text-gray-100">
                {{ selectedViewInvoice.invoiceNumber }}
              </p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Month
              </p>
              <p class="text-sm text-gray-900 dark:text-gray-100">
                {{ selectedViewInvoice.monthName }} {{ selectedViewInvoice.year }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Amount
              </p>
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {{ formatCurrency(selectedViewInvoice.amount) }}
              </p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Status
              </p>
              <UBadge
                :color="getStatusColor(selectedViewInvoice.status)"
                variant="subtle"
                size="sm"
              >
                {{ selectedViewInvoice.status.charAt(0).toUpperCase() + selectedViewInvoice.status.slice(1) }}
              </UBadge>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Due Date
              </p>
              <p class="text-sm text-gray-900 dark:text-gray-100">
                {{ formatDate(selectedViewInvoice.dueDate) }}
              </p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Created Date
              </p>
              <p class="text-sm text-gray-900 dark:text-gray-100">
                {{ formatDate(selectedViewInvoice.createdAt) }}
              </p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              color="neutral"
              variant="soft"
              @click="showViewModal = false"
            >
              Close
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </UCard>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const emit = defineEmits(['payment-completed'])
const { formatCurrency: _formatCurrencyUtil, formatDate: _formatDateUtil } = useFormatters()

interface Invoice {
  id: string
  month: number
  monthName: string
  year: number
  amount: number
  isPaid: boolean
  dueDate: string
  status: string
  invoiceNumber: string
  isCurrentMonth: boolean
  createdAt: string
}

interface Props {
  invoices?: any[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  invoices: () => [],
  loading: false,
})

const showPayBillModal = ref(false)
const selectedInvoice = ref<any>(null)
const showViewModal = ref(false)
const selectedViewInvoice = ref<any>(null)

const columns: TableColumn<Invoice>[] = [
  {
    accessorKey: 'month',
    header: 'Month',
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'actions',
    header: '',
  },
]

const formattedInvoices = computed(() => {
  return props.invoices.map(invoice => ({
    ...invoice,
    id: invoice.id,
  }))
})

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'success'
    case 'pending':
      return 'warning'
    case 'overdue':
      return 'error'
    default:
      return 'neutral'
  }
}

// Check if an invoice can be paid (must pay earlier unpaid invoices first)
const _canPayInvoice = (invoice: any) => {
  if (invoice.isCurrentMonth) {
    return true
  }

  const relevantInvoices = props.invoices.filter((inv) => {
    if (inv.year < invoice.year) return true
    if (inv.year === invoice.year && inv.month < invoice.month) return true
    return false
  })

  // Check if all earlier invoices are paid
  const hasUnpaidEarlierInvoice = relevantInvoices.some(inv => !inv.isPaid)

  return !hasUnpaidEarlierInvoice
}

// Pay now
const payNow = (row: any) => {
  // Check if this is a future invoice with unpaid invoices before it
  const currentInvoice = row.original
  const invoiceDate = new Date(currentInvoice.year, currentInvoice.month - 1)

  // Check if there are unpaid invoices before this one
  const unpaidEarlierInvoices = props.invoices.filter((invoice) => {
    const invoiceDate2 = new Date(invoice.year, invoice.month - 1)
    return !invoice.isPaid && invoiceDate2 < invoiceDate
  })

  if (unpaidEarlierInvoices.length > 0) {
    useToast().add({
      title: 'Payment Order Required',
      description: 'Please pay earlier invoices first before paying this one.',
      color: 'warning',
      icon: 'i-lucide-alert-triangle',
    })
    return
  }

  selectedInvoice.value = currentInvoice
  showPayBillModal.value = true
}

// View invoice details
const viewInvoice = (row: any) => {
  selectedViewInvoice.value = row.original
  showViewModal.value = true
}

// Handle payment completion
const handlePaymentCompleted = () => {
  emit('payment-completed')

  useToast().add({
    title: 'Payment Completed',
    description: `Payment for ${selectedInvoice.value.monthName} ${selectedInvoice.value.year} has been processed successfully.`,
    icon: 'i-lucide-check',
    color: 'success',
  })
}
</script>
