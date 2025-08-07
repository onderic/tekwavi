<template>
  <div>
    <UCard class="mb-8">
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-bold">
            Payment History
          </h2>
        </div>
      </template>

      <div>
        <UTable
          :columns="paymentColumns"
          :data="payments"
        >
          <template #invoiceNumber-cell="{ row }">
            <span class="font-mono font-bold dark:text-white text-gray-900">{{ row.original.invoiceNumber }}</span>
          </template>

          <template #totalAmount-cell="{ row }">
            <span class="font-medium">{{ formatCurrency(row.original.totalAmount) }}</span>
          </template>

          <template #paymentDate-cell="{ row }">
            {{ formatDate(row.original.paymentDate) }}
          </template>

          <template #dueDate-cell="{ row }">
            {{ formatDate(row.original.dueDate) }}
          </template>

          <template #status-cell="{ row }">
            <UBadge
              :color="getPaymentStatusColor(row.original)"
              variant="subtle"
              class="capitalize"
            >
              {{ row.original.status }}
            </UBadge>
          </template>

          <template #paymentFor-cell="{ row }">
            {{ row.original.paymentFor.monthName }} {{ row.original.paymentFor.year }}
          </template>

          <template #paymentMethod-cell="{ row }">
            <span class="capitalize">{{ formatPaymentMethod(row.original.paymentMethod) }}</span>
          </template>

          <template #action-cell="{ row }">
            <div class="flex items-center gap-1 justify-end">
              <UTooltip
                v-if="row.original.status === 'paid'"
                text="Print Receipt"
              >
                <UButton
                  color="primary"
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-printer"
                  square
                  @click="print(row.original)"
                />
              </UTooltip>

              <UTooltip
                v-if="user?.role === 'developer' && row.original.status === 'paid'"
                text="Invalidate Invoice"
              >
                <UButton
                  color="error"
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-x-circle"
                  square
                  @click="openInvalidateModal(row.original)"
                />
              </UTooltip>
            </div>
          </template>
        </UTable>
      </div>

      <UModal v-model:open="showInvalidateModal">
        <template #content>
          <UCard>
            <div class="flex items-center gap-3 mb-4">
              <UIcon
                name="i-lucide-alert-triangle"
                class="text-red-500 text-xl"
              />
              <h3 class="text-lg font-semibold">
                Invalidate Invoice
              </h3>
            </div>

            <div class="space-y-4 mb-6">
              <p class="text-gray-600 dark:text-gray-400">
                Are you sure you want to invalidate invoice
                <span class="font-mono font-bold">{{ selectedInvoice?.invoiceNumber }}</span>?
              </p>
              <p class="text-sm text-red-600 dark:text-red-400">
                This action will mark the payment as cancelled and cannot be undone.
              </p>
            </div>

            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                @click="showInvalidateModal = false"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                variant="solid"
                :loading="isInvalidating"
                @click="handleInvalidateInvoice"
              >
                Yes, Invalidate
              </UButton>
            </div>
          </UCard>
        </template>
      </UModal>
    </UCard>
    <div>
      <PrintsTenantInvoice
        v-if="selectedPrintInvoice"
        :invoice="selectedPrintInvoice"
        :tenant-info="tenantInfo"
        :is-visible="isPrinting"
        @ready-to-print="handleReadyToPrint"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useFormatters } from '~/composables/formatters'
import type { Invoice } from '~/types/unitOccupation'

interface Props {
  payments: Invoice[]
  tenant?: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  refresh: []
}>()

const { user } = useUserSession()
const { formatDate, formatCurrency, formatPaymentMethod, getPaymentStatusColor } = useFormatters()
const toast = useToast()
const { currentProperty } = useCurrentProperty()

const showInvalidateModal = ref(false)
const selectedInvoice = ref<Invoice | null>(null)
const isInvalidating = ref(false)
const isPrinting = ref(false)
const selectedPrintInvoice = ref<any>(null)

// Computed tenant info
const tenantInfo = computed(() => ({
  email: props.tenant?.email || 'N/A',
  phone: props.tenant?.phoneNumber || 'N/A',
}))

function openInvalidateModal(invoice: Invoice) {
  selectedInvoice.value = invoice
  showInvalidateModal.value = true
}

async function handleInvalidateInvoice() {
  if (!selectedInvoice.value) return

  isInvalidating.value = true

  try {
    await $fetch(`/api/invoices/${selectedInvoice.value._id}/invalidate`, {
      method: 'PATCH',
      body: {
        status: 'cancelled',
      },
    })

    toast.add({
      title: 'Invoice Invalidated',
      description: `Invoice ${selectedInvoice.value.invoiceNumber} has been successfully invalidated.`,
      color: 'success',
    })

    showInvalidateModal.value = false
    selectedInvoice.value = null
    emit('refresh')
  }
  catch (error: any) {
    console.error('Error invalidating invoice:', error)
    toast.add({
      title: 'Error',
      description: error.data?.message || error.message || 'Something went wrong',
      color: 'error',
    })
  }
  finally {
    isInvalidating.value = false
  }
}

const paymentColumns: TableColumn<Invoice>[] = [
  {
    accessorKey: 'invoiceNumber',
    header: 'Invoice #',
    cell: row => row.getValue(),
  },
  {
    accessorKey: 'paymentFor',
    header: 'Month',
  },
  {
    accessorKey: 'totalAmount',
    header: 'Amount',
  },
  {
    accessorKey: 'paymentDate',
    header: 'Payment Date',
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Method',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    id: 'action',
    header: '',
  },
]

function handleReadyToPrint() {
  setTimeout(() => {
    window.print()

    setTimeout(() => {
      isPrinting.value = false
      selectedPrintInvoice.value = null
      document.title = originalTitle
    }, 100)
  }, 100) // buffer in case of font/image loading
}

let originalTitle = ''

function print(invoice?: any) {
  if (invoice) {
    originalTitle = document.title
    selectedPrintInvoice.value = invoice
    isPrinting.value = true

    nextTick(() => {
      const receiptDate = new Date(invoice.paymentDate).toISOString().split('T')[0]
      const tenantName = invoice.tenantName.replace(/\s+/g, '_')
      document.title = `Receipt_${invoice.invoiceNumber}_${tenantName}_${receiptDate}`
    })

    // We DO NOT call window.print() here anymore — wait for child to emit
  }
  else {
    // Bulk/record printing — no child involved
    const currentDate = new Date().toISOString().split('T')[0]
    document.title = `Payment_Records_${currentProperty.value?.name || 'Property'}_${currentDate}`

    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 200)
  }
}
</script>
