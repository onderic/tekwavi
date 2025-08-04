<template>
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
          <UButton
            v-if="user?.role === 'developer' && row.original.status === 'paid'"
            color="error"
            variant="ghost"
            size="sm"
            icon="i-lucide-x-circle"
            @click="openInvalidateModal(row.original)"
          >
            Invalidate
          </UButton>
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
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useFormatters } from '~/composables/formatters'
import type { Invoice } from '~/types/unitOccupation'

interface Props {
  payments: Invoice[]
}

defineProps<Props>()

const emit = defineEmits<{
  refresh: []
}>()

const { user } = useUserSession()
const { formatDate, formatCurrency, formatPaymentMethod, getPaymentStatusColor } = useFormatters()
const toast = useToast()

const showInvalidateModal = ref(false)
const selectedInvoice = ref<Invoice | null>(null)
const isInvalidating = ref(false)

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
</script>
