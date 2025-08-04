<template>
  <div class="w-full max-w-none  p-3 text-sm font-inter">
    <div class="max-w-4xl mx-auto">
      <header class="p-4 bg-gradient-to-r from-blue-700 to-blue-900 text-white flex justify-between items-start mb-3 rounded-lg">
        <div class="flex-1">
          <div class="flex items-center mb-2">
            <UIcon
              name="i-lucide-building"
              class="w-6 h-6 mr-2 text-blue-300"
            />
            <h1 class="text-xl font-bold tracking-tight">
              {{ propertyDetails?.propertyName || 'Property Management' }}
            </h1>
          </div>
          <p class="text-xs opacity-90">
            {{ propertyDetails?.address || 'Property Address' }}
          </p>
          <p class="text-xs opacity-90">
            Contact: +1 (555) 123-4567 | info@property.com
          </p>
        </div>

        <div class="text-right">
          <h2 class="text-2xl font-black mb-2">
            INVOICE
          </h2>
          <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <span class="font-semibold text-blue-200">Invoice No:</span>
            <span class="font-medium">{{ invoiceData.invoiceNumber }}</span>
            <span class="font-semibold text-blue-200">Receipt No:</span>
            <span class="font-medium">{{ invoiceData.receiptNumber || 'N/A' }}</span>
            <span class="font-semibold text-blue-200">Invoice Date:</span>
            <span class="font-medium">{{ formatDate(invoiceData.createdAt) }}</span>
            <span class="font-semibold text-blue-200">Due Date:</span>
            <span class="font-medium">{{ formatDate(invoiceData.dueDate) }}</span>
            <span class="font-semibold text-blue-200">Status:</span>
            <span :class="statusClass(invoiceData.status)">{{ invoiceData.status?.toUpperCase() }}</span>
          </div>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-1 gap-4 mb-3">
        <!-- Left Column -->
        <div class="space-y-3">
          <div class="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <h3 class="flex items-center text-sm font-bold text-purple-800 mb-2">
              <UIcon
                name="i-lucide-user"
                class="w-4 h-4 mr-2"
              />
              Tenant Information
            </h3>
            <div class="space-y-1 text-xs text-gray-700">
              <div class="flex justify-between">
                <span class="font-medium">Name:</span>
                <span>{{ invoiceData.tenantName || 'N/A' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Phone:</span>
                <span>{{ invoiceData.phoneNumber || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <!-- Payment Information -->
          <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <h3 class="flex items-center text-sm font-bold text-yellow-800 mb-2">
              <UIcon
                name="i-lucide-credit-card"
                class="w-4 h-4 mr-2"
              />
              Payment Information
            </h3>
            <div class="space-y-1 text-xs text-gray-700">
              <div class="flex justify-between">
                <span class="font-medium">Method:</span>
                <span>{{ formatPaymentMethod(invoiceData.paymentMethod) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Reference:</span>
                <span>{{ invoiceData.paymentReferenceId || 'N/A' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Date:</span>
                <span>{{ invoiceData.paymentDate ? formatDate(invoiceData.paymentDate) : 'Pending' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Status:</span>
                <span :class="statusClass(invoiceData.status)">{{ invoiceData.status?.toUpperCase() }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <!-- Financial Breakdown -->
          <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <h3 class="flex items-center text-sm font-bold text-gray-800 mb-2">
              <UIcon
                name="i-lucide-calculator"
                class="w-4 h-4 mr-2"
              />
              Financial Breakdown
            </h3>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="font-medium">Monthly Rent:</span>
                <span class="font-bold">{{ formatCurrency(invoiceData.amount || 0) }}</span>
              </div>

              <!-- Service Charges -->
              <div
                v-if="invoiceData.serviceCharges && invoiceData.serviceCharges.length > 0"
                class="border-t pt-2"
              >
                <h4 class="text-xs font-medium text-gray-700 mb-1">
                  Service Charges:
                </h4>
                <div class="space-y-1">
                  <div
                    v-for="service in invoiceData.serviceCharges"
                    :key="service.serviceId"
                    class="flex justify-between text-xs text-gray-600"
                  >
                    <span>{{ service.serviceName }}:</span>
                    <span>{{ formatCurrency(service.amount || 0) }}</span>
                  </div>
                </div>
              </div>

              <!-- Total Service Charges -->
              <div
                v-if="invoiceData.totalServiceCharges && invoiceData.totalServiceCharges > 0"
                class="flex justify-between border-t pt-2"
              >
                <span class="font-medium">Total Service Charges:</span>
                <span class="font-bold">{{ formatCurrency(invoiceData.totalServiceCharges) }}</span>
              </div>

              <!-- Grand Total -->
              <div class="flex justify-between text-sm font-bold text-blue-700 border-t-2 pt-2 bg-blue-50 px-2 py-1 rounded">
                <span>Total Amount:</span>
                <span>{{ formatCurrency(invoiceData.totalAmount || 0) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="invoiceData.disbursement?.isDisbursed"
        class="bg-amber-50 p-3 mb-3 rounded-lg border border-amber-200"
      >
        <h3 class="flex items-center text-sm font-bold text-amber-800 mb-2">
          <UIcon
            name="i-lucide-send"
            class="w-4 h-4 mr-2"
          />
          Disbursement Information
        </h3>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="flex justify-between">
            <span class="font-medium">Disbursed:</span>
            <span>{{ formatCurrency(invoiceData.disbursement.disbursedAmount || 0) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Service Fee:</span>
            <span>{{ formatCurrency(invoiceData.disbursement.serviceFeeAmount || 0) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Net Amount:</span>
            <span class="font-bold">{{ formatCurrency(invoiceData.disbursement.netDisbursedAmount || 0) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Date:</span>
            <span>{{ invoiceData.disbursement.disbursedDate ? formatDate(invoiceData.disbursement.disbursedDate) : 'N/A' }}</span>
          </div>
        </div>
      </div>

      <!-- Footer - Compact -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-200">
        <div class="bg-gray-50 p-3 rounded-lg">
          <h4 class="text-sm font-bold text-gray-800 mb-1">
            Invoice Details
          </h4>
          <div class="text-xs text-gray-600 space-y-1">
            <div>Recorded By: {{ invoiceData.recordedBy || 'System' }}</div>
            <div>Type: {{ invoiceData.invoiceType?.replace('_', ' ').toUpperCase() || 'TENANT RENT' }}</div>
          </div>
        </div>
        <div class="text-right bg-blue-50 p-3 rounded-lg">
          <p class="text-blue-600 font-medium text-sm mb-1">
            Thank you for your business!
          </p>
          <p class="text-xs text-gray-500">
            Generated: {{ formatDate(invoiceData.createdAt) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const _props = defineProps({
  invoiceData: {
    type: Object,
    required: false,
    default: () => ({}),
  },
})

// Composables
const { formatCurrency, formatDate } = useFormatters()

const propertyDetails = computed(() => {
  if (import.meta.client) {
    const stored = localStorage.getItem('currentProperty')
    return stored ? JSON.parse(stored) : null
  }
  return null
})

// Helper function to format payment method
const formatPaymentMethod = (method) => {
  if (!method) return 'N/A'

  const methods = {
    cash: 'Cash',
    mpesa: 'M-Pesa',
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque',
    card: 'Card',
    mobile_money: 'Mobile Money',
  }

  return methods[method] || method.charAt(0).toUpperCase() + method.slice(1)
}

// Function to determine status class for styling
const statusClass = (status) => {
  if (!status) return 'bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-xs font-semibold'

  switch (status.toLowerCase()) {
    case 'paid':
      return 'bg-green-200 text-green-800 px-1 py-0.5 rounded text-xs font-semibold'
    case 'issued':
      return 'bg-blue-200 text-blue-800 px-1 py-0.5 rounded text-xs font-semibold'
    case 'draft':
      return 'bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-xs font-semibold'
    case 'cancelled':
      return 'bg-red-200 text-red-800 px-1 py-0.5 rounded text-xs font-semibold'
    case 'refunded':
      return 'bg-purple-200 text-purple-800 px-1 py-0.5 rounded text-xs font-semibold'
    default:
      return 'bg-yellow-200 text-yellow-800 px-1 py-0.5 rounded text-xs font-semibold'
  }
}
</script>
