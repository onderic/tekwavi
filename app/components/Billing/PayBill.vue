<template>
  <UModal
    :open="props.open"
    :title="'Pay Monthly Invoice - ' + getMonthYearDisplay()"
    :close="{ onClick: () => emit('update:open', false) }"
  >
    <template #body>
      <div
        v-if="mpesaStatus.status === 'pending'"
        class="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-95 dark:bg-opacity-95 z-10 flex flex-col items-center justify-center p-6"
      >
        <div class="flex flex-col items-center justify-center space-y-6 max-w-md">
          <!-- Animation -->
          <div class="relative w-24 h-24 mb-4">
            <div class="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <div class="absolute inset-2 rounded-full border-4 border-t-transparent border-r-primary border-b-transparent border-l-transparent animate-spin animation-delay-150" />
            <div class="absolute inset-4 rounded-full border-4 border-t-transparent border-r-transparent border-b-primary border-l-transparent animate-spin animation-delay-300" />
            <UIcon
              name="i-lucide-smartphone"
              class="absolute inset-0 m-auto text-3xl text-gray-500 dark:text-gray-400"
            />
          </div>

          <div class="text-center">
            <h3 class="text-lg font-semibold text-primary mb-2">
              Processing M-PESA Payment
            </h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm mb-4">
              {{ mpesaStatus.message }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Please check your phone and enter your M-PESA PIN
            </p>
          </div>
          <UButton
            color="neutral"
            variant="soft"
            size="sm"
            icon="i-lucide-x"
            @click="handleCancel"
          >
            Cancel Payment
          </UButton>
        </div>
      </div>

      <div
        v-else-if="mpesaStatus.status === 'success' || mpesaStatus.status === 'failed'"
        class="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-95 dark:bg-opacity-95 z-10 flex flex-col items-center justify-center p-6"
      >
        <div class="flex flex-col items-center justify-center space-y-6 max-w-md">
          <div
            v-if="mpesaStatus.status === 'success'"
            class="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center"
          >
            <UIcon
              name="i-lucide-check"
              class="text-4xl text-green-600 dark:text-green-400"
            />
          </div>
          <div
            v-else
            class="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center"
          >
            <UIcon
              name="i-lucide-x"
              class="text-4xl text-red-600 dark:text-red-400"
            />
          </div>
          <div class="text-center">
            <h3
              class="text-lg font-semibold mb-2"
              :class="mpesaStatus.status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
            >
              {{ mpesaStatus.status === 'success' ? 'Payment Successful!' : 'Payment Failed' }}
            </h3>
            <p class="text-gray-600 dark:text-gray-300 mb-2">
              {{ mpesaStatus.message }}
            </p>
          </div>
          <div class="flex space-x-4">
            <UButton
              color="neutral"
              variant="soft"
              @click="resetPaymentForm"
            >
              Try Again
            </UButton>
            <UButton
              color="primary"
              @click="mpesaStatus.status === 'success' ? handleSuccess() : handleCancel()"
            >
              {{ mpesaStatus.status === 'success' ? 'Close' : 'Cancel' }}
            </UButton>
          </div>
        </div>
      </div>

      <UForm
        :state="form"
        class="space-y-4"
        @submit="handlePayment"
      >
        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <h3 class="font-medium mb-2">
            Invoice Details
          </h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600 dark:text-gray-400">Invoice Number:</span>
              <span class="font-medium ml-2">{{ invoice?.invoiceNumber }}</span>
            </div>
            <div>
              <span class="text-gray-600 dark:text-gray-400">Due Date:</span>
              <span class="font-medium ml-2">{{ formatDate(invoice?.dueDate) }}</span>
            </div>
            <div>
              <span class="text-gray-600 dark:text-gray-400">Payment For:</span>
              <span class="font-medium ml-2">{{ getMonthYearDisplay() }}</span>
            </div>
            <div>
              <span class="text-gray-600 dark:text-gray-400">Status:</span>
              <UBadge
                :color="getStatusColor(invoice?.status)"
                variant="subtle"
                size="xs"
                class="ml-2"
              >
                {{ invoice?.status?.charAt(0).toUpperCase() + invoice?.status?.slice(1) }}
              </UBadge>
            </div>
          </div>
        </div>

        <div class="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 class="font-medium text-sm text-gray-700 dark:text-gray-300">
            Billing Summary
          </h4>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Monthly Service Fee</span>
              <span class="font-medium">{{ formatCurrency(invoice?.amount || 0) }}</span>
            </div>
          </div>
          <div class="flex items-center justify-between pt-3 border-t border-gray-300 dark:border-gray-600">
            <span class="font-semibold text-gray-900 dark:text-gray-100">Total Amount:</span>
            <span class="font-bold text-lg text-primary">{{ formatCurrency(invoice?.amount || 0) }}</span>
          </div>
        </div>

        <UFormField
          label="Payment Amount"
          name="amount"
        >
          <UInput
            v-model.number="form.amount"
            type="number"
            :placeholder="'Amount: ' + formatCurrency(invoice?.amount || 0)"
            required
            disabled
          />
        </UFormField>

        <!-- M-PESA Payment Method (Fixed) -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Payment Method
          </label>
          <div class="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <UIcon
              name="i-lucide-smartphone"
              class="text-green-600 dark:text-green-400"
            />
            <span class="text-sm font-medium text-green-700 dark:text-green-300">
              M-PESA (Lipa Na M-PESA)
            </span>
            <UBadge
              color="success"
              variant="subtle"
              size="xs"
            >
              Secure
            </UBadge>
          </div>
        </div>

        <UFormField
          label="Phone Number"
          name="phoneNumber"
        >
          <UInput
            v-model="form.phoneNumber"
            placeholder="e.g., 0712345678"
            type="tel"
            required
          />
          <template #help>
            <span class="text-xs text-gray-500">
              Enter your M-PESA registered phone number
            </span>
          </template>
        </UFormField>

        <div class="flex items-center justify-end gap-3 mt-6">
          <UButton
            color="neutral"
            variant="soft"
            label="Cancel"
            :disabled="isSubmitting"
            @click="handleCancel"
          />
          <UButton
            type="submit"
            color="success"
            :loading="isSubmitting"
            :disabled="isSubmitting || !isFormValid"
            icon="i-lucide-smartphone"
          >
            {{ buttonText }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
interface Props {
  open?: boolean
  invoice?: any
}

interface STKResponse {
  success: boolean
  error?: string
  data?: {
    merchantRequestId?: string
    checkoutRequestId?: string
    message?: string
    customerMessage?: string
    [key: string]: any
  }
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  invoice: null,
})

const emit = defineEmits(['update:open', 'payment-completed'])
const toast = useToast()
const isSubmitting = ref(false)
const { user: _user } = useUserSession()

const { formatCurrency } = useFormatters()

const mpesaStatus = ref({
  status: '',
  checkoutRequestId: '',
  message: '',
  receiptNumber: '',
})

let eventSource: EventSource | null = null

const form = ref({
  amount: 0,
  phoneNumber: '',
})

// Initialize form when component is created
watch(() => props.invoice, (invoice) => {
  if (invoice) {
    form.value.amount = invoice.amount || 0
  }
}, { immediate: true })

const buttonText = computed(() => {
  if (mpesaStatus.value.status === 'success') {
    return 'Finalize Payment'
  }
  return 'Pay with M-PESA'
})

const isFormValid = computed(() => {
  return form.value.amount > 0 && !!form.value.phoneNumber
})

function getMonthYearDisplay() {
  if (!props.invoice) return ''
  return `${props.invoice.monthName} ${props.invoice.year}`
}

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

// Get status color based on status
const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary' | 'tertiary' | 'neutral' | undefined => {
  const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary' | 'tertiary' | 'neutral'> = {
    paid: 'success',
    issued: 'primary',
    overdue: 'warning',
    cancelled: 'neutral',
    refunded: 'info',
  }
  return statusColors[status] || 'neutral'
}

function disconnectSSE() {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
}

function resetPaymentForm() {
  mpesaStatus.value = {
    status: '',
    checkoutRequestId: '',
    message: '',
    receiptNumber: '',
  }

  form.value = {
    amount: props.invoice?.amount || 0,
    phoneNumber: '',
  }

  disconnectSSE()
}

function handleCancel() {
  mpesaStatus.value = {
    status: '',
    checkoutRequestId: '',
    message: '',
    receiptNumber: '',
  }
  disconnectSSE()
  resetPaymentForm()
  emit('update:open', false)
}

function handleSuccess() {
  resetPaymentForm()
  emit('payment-completed')
  emit('update:open', false)
}

watch(() => props.open, (newValue) => {
  if (newValue) {
    form.value.amount = props.invoice?.amount || 0
    form.value.phoneNumber = ''

    mpesaStatus.value = {
      status: '',
      checkoutRequestId: '',
      message: '',
      receiptNumber: '',
    }
  }
})

watch(() => props.open, (newValue, oldValue) => {
  if (oldValue === true && newValue === false) {
    resetPaymentForm()
  }
})

function monitorMpesaTransaction(checkoutRequestId: string) {
  mpesaStatus.value = {
    status: 'pending',
    checkoutRequestId,
    message: 'Please check your phone and enter your M-PESA PIN to complete the payment.',
    receiptNumber: '',
  }

  disconnectSSE()

  eventSource = new EventSource(`/api/routes/sse?checkoutRequestId=${checkoutRequestId}`)

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)

      if (data.type === 'heartbeat') {
        return
      }

      if (data.type === 'mpesa_update') {
        if (data.data.ResultCode === 'TIMEOUT') {
          mpesaStatus.value.status = 'failed'
          mpesaStatus.value.message = data.data.ResultDesc || 'Transaction timed out after 2 minutes with no response. Please try again.'

          toast.add({
            title: 'Transaction Timed Out',
            description: mpesaStatus.value.message,
            color: 'warning',
            icon: 'i-lucide-clock',
          })

          disconnectSSE()
          return
        }

        if (data.success) {
          mpesaStatus.value.status = 'success'
          mpesaStatus.value.receiptNumber = data.data.MpesaReceiptNumber || ''
          mpesaStatus.value.message = `Payment of ${formatCurrency(data.data.Amount || form.value.amount)} confirmed.${data.data.MpesaReceiptNumber ? ` Receipt: ${data.data.MpesaReceiptNumber}` : ''}`
        }
        else {
          mpesaStatus.value.status = 'failed'
          mpesaStatus.value.message = data.data.ResultDesc || 'Payment processing failed.'

          toast.add({
            title: 'Payment Failed',
            description: mpesaStatus.value.message,
            color: 'error',
            icon: 'i-lucide-alert-triangle',
          })
        }
        disconnectSSE()
      }
    }
    catch (error) {
      console.error('Error parsing SSE message:', error)
    }
  }

  eventSource.onerror = () => {
    console.error('SSE connection error')
    disconnectSSE()

    mpesaStatus.value.status = 'failed'
    mpesaStatus.value.message = 'Connection to payment server lost. Please try again.'

    toast.add({
      title: 'Connection Error',
      description: 'Lost connection to the payment server. Please try again.',
      color: 'error',
      icon: 'i-lucide-wifi-off',
    })
  }
}

async function handlePayment() {
  if (!props.invoice?.id) {
    toast.add({
      title: 'Error',
      description: 'Invoice information is missing',
      color: 'error',
    })
    return
  }

  isSubmitting.value = true

  try {
    if (mpesaStatus.value.status === 'success') {
      toast.add({
        title: 'Payment Complete',
        description: `Payment of ${formatCurrency(form.value.amount)} for ${getMonthYearDisplay()} has been processed.`,
        color: 'success',
        icon: 'i-lucide-check',
      })

      emit('payment-completed')
      emit('update:open', false)
      return
    }

    const stkResponse = await $fetch<STKResponse>('/api/billing/paybill', {
      method: 'POST',
      body: {
        invoiceId: props.invoice.id,
        phoneNumber: form.value.phoneNumber,
        amount: form.value.amount,
        account_number: `BILL-${props.invoice.invoiceNumber}`,
      },
    })

    if (!stkResponse.success) {
      throw new Error(stkResponse.error || 'Failed to initiate M-PESA payment')
    }

    if (stkResponse.data && stkResponse.data.checkoutRequestId) {
      monitorMpesaTransaction(stkResponse.data.checkoutRequestId)
    }
    else {
      throw new Error('Failed to get checkout request ID for M-PESA payment')
    }
  }
  catch (error: any) {
    console.error('Error processing payment:', error)
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to process payment',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    })
  }
  finally {
    isSubmitting.value = false
  }
}

onUnmounted(() => {
  disconnectSSE()
})
</script>

<style scoped>
.animation-delay-150 {
  animation-delay: 150ms;
}

.animation-delay-300 {
  animation-delay: 300ms;
}
</style>
