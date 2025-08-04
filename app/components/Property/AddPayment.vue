<template>
  <UModal
    :open="props.open"
    :title="'Record Payment for ' + (tenant?.firstName || '') + ' ' + (tenant?.lastName || '') + ' (Unit ' + (unit?.unitNumber || '') + ')'"
    @update:open="emit('update:open', $event)"
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
              M-PESA Payment Processing
            </h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Please check your phone and enter your M-PESA PIN to complete the payment.
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Your payment is being processed. This window will update automatically when completed.
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
              name="i-lucide-alert-triangle"
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
              v-if="mpesaStatus.status === 'failed'"
              color="primary"
              icon="i-lucide-refresh-cw"
              @click="resetPaymentForm"
            >
              Try Again
            </UButton>
            <UButton
              :color="mpesaStatus.status === 'success' ? 'success' : 'neutral'"
              :icon="mpesaStatus.status === 'success' ? 'i-lucide-check' : 'i-lucide-x'"
              @click="mpesaStatus.status === 'success' ? handleSuccess() : handleCancel()"
            >
              {{ mpesaStatus.status === 'success' ? 'Complete' : 'Close' }}
            </UButton>
          </div>
        </div>
      </div>

      <UForm
        :state="form"
        class="space-y-4"
        @submit="handleAddPayment"
      >
        <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-md mb-4">
          <h3 class="font-medium mb-1">
            Payment for:  <span class="text-lg font-semibold text-primary">
              {{ getMonthYearDisplay() }}
            </span>
          </h3>
        </div>

        <div class="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div class="space-y-2">
            <!-- Main payment line -->
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">
                {{ getPaymentDescription() }}:
              </span>
              <span class="font-medium">{{ formatCurrency(rentAmount) }}</span>
            </div>

            <!-- Breakdown for combined rent + service fee -->
            <div
              v-if="showPaymentBreakdown"
              class="ml-4 space-y-1 text-xs text-gray-500 dark:text-gray-400"
            >
              <div
                v-if="getBaseRentAmount() > 0"
                class="flex items-center justify-between"
              >
                <span>• Base Rent:</span>
                <span>{{ formatCurrency(getBaseRentAmount()) }}</span>
              </div>
              <div
                v-if="getServiceFeeAmount() > 0"
                class="flex items-center justify-between"
              >
                <span>• Service Fee:</span>
                <span>{{ formatCurrency(getServiceFeeAmount()) }}</span>
              </div>
            </div>

            <!-- Service Charges (not shown for fixed lease payment) -->
            <div
              v-if="editableServices.length > 0 && !isFixedLeasePayment"
              class="pt-2 border-t border-gray-200 dark:border-gray-700"
            >
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Service Charges:
              </div>
              <div class="grid grid-cols-1  gap-2">
                <div
                  v-for="(service, index) in editableServices"
                  :key="service.serviceId"
                  class="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div class="flex-1 mr-3">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {{ service.serviceName }}
                    </label>
                    <!-- <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ canEditServiceCharges ? 'Editable charge' : 'Fixed charge' }}
                    </p> -->
                  </div>
                  <div class="w-24">
                    <UInput
                      v-model.number="service.amount"
                      type="number"
                      min="0"
                      step="0.01"
                      size="sm"
                      :disabled="!canEditServiceCharges"
                      @input="updateServiceCharge(index, $event.target.value)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-gray-300 dark:border-gray-600">
              <span class="font-medium">Total Amount:</span>
              <span class="font-semibold text-lg text-primary">{{ formatCurrency(totalAmount) }}</span>
            </div>
          </div>
        </div>

        <UFormField
          label="Payment Amount"
          name="amount"
        >
          <UInput
            v-model.number="form.amount"
            type="number"
            min="0"
            :placeholder="'Expected: ' + formatCurrency(totalAmount)"
            required
            disabled
          />
        </UFormField>

        <!-- Only show payment method selection for non-tenant users -->
        <UFormField
          v-if="!isTenantUser"
          label="Payment Method"
          name="paymentMethod"
        >
          <USelect
            v-model="form.paymentMethod"
            :items="paymentMethods"
            placeholder="Select payment method"
            required
          />
        </UFormField>

        <!-- For tenant users, show M-PESA as the only option -->
        <div
          v-else
          class="space-y-2"
        >
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Payment Method
          </label>
          <div class="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <UIcon
              name="i-lucide-smartphone"
              class="text-blue-600 dark:text-blue-400"
            />
            <span class="text-sm font-medium text-blue-700 dark:text-blue-300">
              M-PESA Payment
            </span>
            <UBadge
              color="primary"
              variant="soft"
              size="xs"
            >
              Secure
            </UBadge>
          </div>
        </div>

        <!-- Phone number field - always show for tenant users, conditionally for others -->
        <UFormField
          v-if="isTenantUser || form.paymentMethod === 'mpesa'"
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
              The phone number used for M-PESA payment
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
            :color="(isTenantUser || form.paymentMethod === 'mpesa') && mpesaStatus.status !== 'primary' ? 'success' : 'primary'"
            :loading="isSubmitting"
            :disabled="isSubmitting || !isFormValid"
            :icon="isTenantUser || form.paymentMethod === 'mpesa' ? 'i-lucide-smartphone' : 'i-lucide-check'"
          >
            {{ buttonText }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  tenant: {
    type: Object,
    default: () => ({}),
  },
  unit: {
    type: Object,
    default: () => ({}),
  },
  paymentMonth: {
    type: Number,
    required: true,
  },
  paymentYear: {
    type: Number,
    required: true,
  },
  expectedAmount: {
    type: Number,
    default: 0,
  },
  services: {
    type: Array as PropType<Array<{
      serviceId: string
      serviceName: string
      amount: number
    }>>,
    default: () => [],
  },
})

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

interface InvoiceResponse {
  success: boolean
  message?: string
  invoice: {
    _id: string
    [key: string]: any
  }
}

const emit = defineEmits(['update:open', 'payment-added'])
const toast = useToast()
const isSubmitting = ref(false)
const { user } = useUserSession()

const { formatCurrency } = useFormatters()

// Create editable services - all services are now editable
const editableServices = ref<Array<{
  serviceId: string
  serviceName: string
  amount: number
}>>([])

const mpesaStatus = ref({
  status: '',
  checkoutRequestId: '',
  message: '',
  receiptNumber: '',
})

let eventSource: EventSource | null = null

const isTenantUser = computed(() => {
  return user.value?.role === 'tenant'
})

const canEditServiceCharges = computed(() => {
  return user.value?.role === 'developer' || user.value?.role === 'caretaker'
})

const isFixedLeasePayment = computed(() => {
  return props.tenant?.rentalType === 'fixed' && props.paymentMonth === 0
})

// Calculate amounts
const rentAmount = computed(() => {
  // For fixed lease tenants, if this is a monthly payment (not the initial lease payment)
  // they should only pay service fees (no rent)
  if (props.tenant?.rentalType === 'fixed' && props.paymentMonth !== 0) {
    return 0 // No rent payment for fixed lease monthly payments
  }
  return props.expectedAmount || 0
})
const serviceChargesTotal = computed(() => {
  // For fixed lease payments, exclude service charges
  if (isFixedLeasePayment.value) {
    return 0
  }
  return editableServices.value.reduce((sum, service) => sum + (service.amount || 0), 0)
})
const totalAmount = computed(() => rentAmount.value + serviceChargesTotal.value)

// Function to update service charge amount
function updateServiceCharge(index: number, value: string | number) {
  // Only allow updates if user can edit service charges
  if (!canEditServiceCharges.value) return

  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
  if (editableServices.value[index]) {
    editableServices.value[index].amount = numValue

    // Update form amount to reflect new total
    form.value.amount = totalAmount.value
  }
}

// Initialize editable services when props change
function initializeEditableServices() {
  editableServices.value = props.services.map(service => ({
    serviceId: service.serviceId,
    serviceName: service.serviceName,
    amount: service.amount,
  }))
}

const paymentMethods = computed(() => {
  const allMethods = [
    { label: 'Cash', value: 'cash' },
    { label: 'M-PESA', value: 'mpesa' },
    { label: 'Bank Transfer', value: 'bank_transfer' },
    { label: 'Cheque', value: 'cheque' },
    { label: 'Card', value: 'card' },
  ]

  if (isTenantUser.value) {
    return allMethods.filter(method => method.value === 'mpesa')
  }

  return allMethods
})

const form = ref({
  amount: totalAmount.value || 0,
  paymentMethod: isTenantUser.value ? 'mpesa' : 'cash',
  phoneNumber: props.tenant?.phoneNumber || '',
})

const buttonText = computed(() => {
  if (isTenantUser.value || form.value.paymentMethod === 'mpesa') {
    if (mpesaStatus.value.status === 'success') {
      return 'Finalize Payment'
    }
    return 'Lipa Na M-PESA'
  }
  return 'Record Payment'
})

const isFormValid = computed(() => {
  const baseValidation = form.value.amount > 0

  if (isTenantUser.value || form.value.paymentMethod === 'mpesa') {
    return baseValidation && !!form.value.phoneNumber
  }

  return baseValidation && form.value.paymentMethod
})

function getMonthYearDisplay() {
  // Handle fixed lease payment case
  if (props.paymentMonth === 0 && props.tenant?.rentalType === 'fixed') {
    const leaseStart = new Date(props.tenant.leaseStartDate)
    const leaseEnd = new Date(props.tenant.leaseEndDate)
    return `Fixed Lease (${leaseStart.toLocaleDateString()} - ${leaseEnd.toLocaleDateString()})`
  }

  const date = new Date(props.paymentYear, props.paymentMonth - 1, 1)
  return date.toLocaleString('default', { month: 'long', year: 'numeric' })
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

  // Reinitialize services to reset any changes
  initializeEditableServices()

  form.value = {
    amount: totalAmount.value || 0,
    paymentMethod: isTenantUser.value ? 'mpesa' : 'cash',
    phoneNumber: props.tenant?.phoneNumber || '',
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
  emit('payment-added')
  emit('update:open', false)
}

watch(() => props.open, (newValue) => {
  if (newValue) {
    initializeEditableServices()
    form.value.amount = totalAmount.value || 0
    form.value.paymentMethod = isTenantUser.value ? 'mpesa' : 'cash'
    form.value.phoneNumber = props.tenant?.phoneNumber || ''

    mpesaStatus.value = {
      status: '',
      checkoutRequestId: '',
      message: '',
      receiptNumber: '',
    }
  }
})

// Watch for changes in services to reinitialize
watch(() => props.services, () => {
  if (props.open) {
    initializeEditableServices()
  }
}, { deep: true })

// Watch for changes in expected amount (when switching between units/properties)
watch(() => props.expectedAmount, (newAmount) => {
  if (props.open) {
    form.value.amount = newAmount || 0
  }
})

watch(() => props.tenant, (newTenant) => {
  if (props.open && newTenant) {
    form.value.phoneNumber = newTenant.phoneNumber || ''
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
        console.log('Received M-PESA update:', data)

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

async function handleAddPayment() {
  if (!props.tenant?._id || !props.unit?._id) {
    toast.add({
      title: 'Error',
      description: 'Tenant or unit information is missing',
      color: 'error',
    })
    return
  }

  isSubmitting.value = true

  try {
    const paymentData = {
      tenantId: props.tenant._id,
      unitId: props.unit._id,
      propertyId: props.unit.propertyId,
      floorId: props.unit.floorId,
      amount: rentAmount.value,
      totalAmount: totalAmount.value,
      serviceCharges: isFixedLeasePayment.value
        ? []
        : editableServices.value.map(service => ({
            serviceId: service.serviceId,
            serviceName: service.serviceName,
            amount: service.amount,
          })),
      totalServiceCharges: serviceChargesTotal.value,
      paymentMethod: isTenantUser.value ? 'mpesa' : form.value.paymentMethod,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentFor: {
        month: props.paymentMonth,
        year: props.paymentYear,
      },
      phoneNumber: form.value.phoneNumber || '',
    }

    if ((isTenantUser.value || form.value.paymentMethod === 'mpesa') && mpesaStatus.value.status !== 'success') {
      const invoiceResponse = await $fetch<InvoiceResponse>('/api/invoices', {
        method: 'POST',
        body: paymentData,
      })

      if (!invoiceResponse.success) {
        throw new Error(invoiceResponse.message || 'Failed to create invoice')
      }

      const stkResponse = await $fetch<STKResponse>('/api/mpesa/stk', {
        method: 'POST',
        body: {
          propertyId: props.unit.propertyId,
          invoiceId: invoiceResponse.invoice._id,
          phoneNumber: form.value.phoneNumber,
          amount: totalAmount.value, // Use total amount for payment
          account_number: `RENT-${props.unit.unitNumber}-${props.paymentMonth}`,
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

      isSubmitting.value = false
      return
    }
    else if ((isTenantUser.value || form.value.paymentMethod === 'mpesa') && mpesaStatus.value.status === 'success') {
      toast.add({
        title: 'Payment Complete',
        description: `Payment of ${formatCurrency(totalAmount.value)} for ${getMonthYearDisplay()} has been recorded.`,
        color: 'success',
        icon: 'i-lucide-check',
      })

      emit('payment-added')
      emit('update:open', false)
      return
    }
    else {
      await $fetch('/api/invoices', {
        method: 'POST',
        body: paymentData,
      })

      toast.add({
        title: 'Payment Recorded',
        description: `Payment of ${formatCurrency(totalAmount.value)} for ${getMonthYearDisplay()} has been recorded.`,
        color: 'success',
        icon: 'i-lucide-check',
      })

      emit('payment-added')
      emit('update:open', false)
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

const showPaymentBreakdown = computed(() => {
  // Don't show breakdown since backend handles service fee calculation
  return false
})

function getBaseRentAmount() {
  if (props.tenant?.rentalType === 'owner_occupied') {
    return 0
  }
  // For fixed lease tenants, if this is a monthly payment (not the initial lease payment)
  // they should only pay service fees (no rent)
  if (props.tenant?.rentalType === 'fixed' && props.paymentMonth !== 0) {
    return 0 // No rent payment for fixed lease monthly payments
  }
  // This would be the original rent amount from the tenant
  return props.tenant?.rentAmount || 0
}

function getServiceFeeAmount() {
  // Calculate service fee amount from the expectedAmount
  const baseRent = getBaseRentAmount()
  const serviceFee = rentAmount.value - baseRent
  return serviceFee > 0 ? serviceFee : 0
}

function getPaymentDescription() {
  if (props.paymentMonth === 0 && props.tenant?.rentalType === 'fixed') {
    return 'Fixed Lease Payment'
  }
  if (props.tenant?.rentalType === 'fixed' && props.paymentMonth !== 0) {
    return 'Service Fees'
  }
  if (props.tenant?.rentalType === 'owner_occupied') {
    return 'Service Fee'
  }
  return 'Monthly Payment'
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
