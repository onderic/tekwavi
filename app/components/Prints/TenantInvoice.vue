<template>
  <div
    v-if="isVisible"
    class="print:block hidden print:min-h-screen print:flex print:flex-col"
  >
    <div class="max-w-4xl mx-auto print:max-w-none print:mx-0 print:w-full print:flex print:flex-col print:min-h-screen">
      <!-- Top Header -->
      <div class="bg-orange-500 text-white py-4 px-8 print:py-3 print:px-8">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-bold print:text-xl">
              TEKWAVI PROPERTY MANAGEMENT
            </h2>
            <p class="text-sm print:text-xs">
              Excellence in Property Solutions
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm print:text-xs">
              www.tekwavi.com
            </p>
            <p class="text-sm print:text-xs">
              support@tekwavi.com | +1 (555) 123-4567
            </p>
          </div>
        </div>
      </div>

      <!-- Main content wrapper with flex-grow -->
      <div class="print:flex-grow">
        <div class="p-8 print:p-6">
          <div class="flex justify-between items-start mb-8 print:mb-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <img
                  :src="currentProperty?.logo ? `${$config.public.APP_URL}${currentProperty.logo}` : '/logo.png'"
                  :alt="currentProperty?.name || 'Amaam'"
                  class="h-16 w-16 rounded-lg object-cover  shadow-none"
                >
              </div>
              <div class="ml-4 print:ml-3">
                <p class="font-bold text-lg print:text-base">
                  {{ currentProperty?.name || 'Property Name' }}
                </p>
                <p class="text-sm text-gray-600 print:text-xs">
                  {{ currentProperty?.address || 'Property Address' }}
                </p>
                <p class="text-sm text-gray-600 print:text-xs">
                  Property Manager: {{ user?.first_name }} {{ user?.last_name }}
                </p>
              </div>
            </div>
            <div>
              <h1 class="text-3xl font-bold uppercase text-gray-700 print:text-2xl">
                RENT RECEIPT
              </h1>
              <p class="mt-2 text-sm text-right print:mt-1 print:text-xs">
                Date: <span class="font-semibold">{{ formatDate(invoice.paymentDate) }}</span>
              </p>
              <p class="text-sm text-right print:text-xs">
                Receipt No: <span class="font-semibold">{{ invoice.invoiceNumber }}</span>
              </p>
              <p class="text-sm text-right print:text-xs">
                Unit: <span class="font-semibold">{{ invoice.unitNumber }}</span>
              </p>
            </div>
          </div>

          <div class="border-t-4 border-orange-500 pt-4 mb-8 print:pt-3 print:mb-4">
            <h2 class="font-bold text-lg mb-2 text-gray-700 print:text-base print:mb-1">
              BILLED TO
            </h2>
            <div class="grid grid-cols-2 gap-4 print:gap-2">
              <div>
                <p class="text-sm print:text-xs">
                  <span class="font-semibold">Tenant Name:</span> {{ invoice.tenantName }}
                </p>
                <p class="text-sm print:text-xs">
                  <span class="font-semibold">Unit Address:</span> Unit {{ invoice.unitNumber }}, {{ currentProperty?.name || 'Property Name' }}
                </p>
              </div>
              <div>
                <p class="text-sm print:text-xs">
                  <span class="font-semibold">Email:</span> {{ tenantInfo?.email || 'N/A' }}
                </p>
                <p class="text-sm print:text-xs">
                  <span class="font-semibold">Phone:</span> {{ invoice.phoneNumber }}
                </p>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto mb-8 print:mb-4">
            <table class="min-w-full">
              <thead>
                <tr class="bg-orange-500 text-white">
                  <th class="py-3 px-4 text-left font-semibold print:py-2 print:px-3 print:text-sm">
                    DESCRIPTION
                  </th>
                  <th class="py-3 px-4 text-center font-semibold print:py-2 print:px-3 print:text-sm">
                    PERIOD
                  </th>
                  <th class="py-3 px-4 text-right font-semibold print:py-2 print:px-3 print:text-sm">
                    AMOUNT
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-if="invoice.amount > 0"
                  class="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td class="py-3 px-4 print:py-2 print:px-3 print:text-sm">
                    Monthly Rent
                  </td>
                  <td class="py-3 px-4 text-center print:py-2 print:px-3 print:text-sm">
                    {{ invoice.paymentFor.monthName }} {{ invoice.paymentFor.year }}
                  </td>
                  <td class="py-3 px-4 text-right print:py-2 print:px-3 print:text-sm">
                    {{ formatCurrency(invoice.amount) }}
                  </td>
                </tr>
                <tr
                  v-for="service in invoice.serviceCharges"
                  :key="service.serviceId"
                  class="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td class="py-3 px-4 print:py-2 print:px-3 print:text-sm capitalize">
                    {{ service.serviceName }}
                  </td>
                  <td class="py-3 px-4 text-center print:py-2 print:px-3 print:text-sm capitalize">
                    {{ invoice.paymentFor.monthName }} {{ invoice.paymentFor.year }}
                  </td>
                  <td class="py-3 px-4 text-right print:py-2 print:px-3 print:text-sm">
                    {{ formatCurrency(service.amount) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-between gap-8 print:gap-4">
            <div class="w-1/2">
              <div class="bg-gray-100 p-4 rounded print:p-3">
                <p class="text-sm font-bold mb-2 print:text-xs print:mb-1">
                  Payment Information
                </p>
                <p class="text-sm text-gray-600 mb-1 print:text-xs print:mb-0.5">
                  <span class="font-semibold">Payment Method:</span> {{ formatPaymentMethod(invoice.paymentMethod) }}
                </p>
                <p class="text-sm text-gray-600 mb-1 print:text-xs print:mb-0.5">
                  <span class="font-semibold">Transaction ID:</span> {{ invoice.paymentReferenceId || invoice.invoiceNumber }}
                </p>
                <p class="text-sm text-gray-600 print:text-xs">
                  <span class="font-semibold">Payment Date:</span> {{ formatDate(invoice.paymentDate) }}
                </p>
              </div>

              <div class="mt-4 p-4 border border-gray-300 rounded print:mt-3 print:p-3">
                <p class="text-sm font-bold mb-2 print:text-xs print:mb-1">
                  Notes
                </p>
                <p class="text-sm text-gray-600 print:text-xs">
                  Payment received for {{ invoice.paymentFor.monthName }} {{ invoice.paymentFor.year }}.
                  Next payment due on {{ formatDate(nextDueDate) }}.
                </p>
              </div>
            </div>

            <div class="w-1/2">
              <div class="bg-gray-50 p-4 rounded print:p-3">
                <div class="flex justify-between items-center mb-2 print:mb-1">
                  <p class="text-sm print:text-xs">
                    SUBTOTAL
                  </p>
                  <p class="font-semibold text-sm print:text-xs">
                    {{ formatCurrency(invoice.totalAmount) }}
                  </p>
                </div>
                <div class="flex justify-between items-center mb-2 print:mb-1">
                  <p class="text-sm print:text-xs">
                    LATE FEE
                  </p>
                  <p class="font-semibold text-sm print:text-xs">
                    {{ formatCurrency(0) }}
                  </p>
                </div>
                <div class="flex justify-between items-center mb-2 print:mb-1">
                  <p class="text-sm print:text-xs">
                    DISCOUNT
                  </p>
                  <p class="font-semibold text-sm text-green-600 print:text-xs">
                    -{{ formatCurrency(0) }}
                  </p>
                </div>
                <div class="flex justify-between items-center mb-2 print:mb-1">
                  <p class="text-sm font-bold print:text-xs">
                    SUBTOTAL AFTER ADJUSTMENTS
                  </p>
                  <p class="font-bold text-sm print:text-xs">
                    {{ formatCurrency(invoice.totalAmount) }}
                  </p>
                </div>
                <div class="flex justify-between items-center mb-2 print:mb-1">
                  <p class="text-sm print:text-xs">
                    TAX (0%)
                  </p>
                  <p class="font-semibold text-sm print:text-xs">
                    {{ formatCurrency(0) }}
                  </p>
                </div>
                <div class="border-t-2 border-gray-300 mt-3 pt-3 flex justify-between items-center print:mt-2 print:pt-2">
                  <p class="text-lg font-bold print:text-base">
                    TOTAL PAID
                  </p>
                  <p class="text-2xl font-bold text-orange-500 print:text-xl">
                    {{ formatCurrency(invoice.totalAmount) }}
                  </p>
                </div>
                <div class="flex justify-between items-center mt-2 print:mt-1">
                  <p class="text-sm font-semibold print:text-xs">
                    Balance Due
                  </p>
                  <p class="text-lg font-semibold text-red-600 print:text-base">
                    {{ formatCurrency(0) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-8 pt-4 border-t border-gray-300 print:mt-4 print:pt-3">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-xs text-gray-600 print:text-[10px]">
                  This is a computer-generated receipt and does not require a signature.
                </p>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-600 print:text-[10px]">
                  Authorized by: {{ user?.first_name }} {{ user?.last_name }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Footer - will stick to bottom -->
      <div class="bg-gray-800 text-white py-4 px-8 print:py-3 print:px-8">
        <div class="flex justify-between items-center">
          <div>
            <p class="text-sm print:text-xs">
              Thank you for your payment!
            </p>
            <p class="text-xs text-gray-400 print:text-[10px]">
              Please keep this receipt for your records.
            </p>
          </div>
          <div class="text-right">
            <p class="text-xs print:text-[10px]">
              © 2025 Tekwavi Property Management. All rights reserved.
            </p>
            <p class="text-xs text-gray-400 print:text-[10px]">
              For inquiries, contact us at support@tekwavi.com
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  invoice: any

  tenantInfo?: {
    email?: string
  }
  isVisible?: boolean
}

const { user } = useUserSession()
const { currentProperty } = useCurrentProperty()

const props = withDefaults(defineProps<Props>(), {
  isVisible: false,
  tenantInfo: () => ({ email: 'N/A' }),
})

const { formatCurrency, formatDate, formatPaymentMethod } = useFormatters()

const nextDueDate = computed(() => {
  if (!props.invoice) return new Date()

  const monthNameToNumber: Record<string, number> = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12,
  }

  const paymentMonth = monthNameToNumber[props.invoice.paymentFor.monthName] || 1
  const paymentYear = props.invoice.paymentFor.year

  let nextMonth = paymentMonth + 1
  let nextYear = paymentYear

  if (nextMonth > 12) {
    nextMonth = 1
    nextYear += 1
  }

  return new Date(nextYear, nextMonth - 1, 1)
})
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

  /* Force single page layout */
  html, body {
    height: 100vh !important;
    max-height: 100vh !important;
    overflow: hidden !important;
  }

  /* Flexbox layout for print */
  .print\:min-h-screen {
    min-height: 100vh !important;
    max-height: 100vh !important;
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

  /* Force single page - no page breaks */
  * {
    page-break-inside: avoid !important;
    page-break-after: avoid !important;
    page-break-before: avoid !important;
    break-inside: avoid !important;
    break-after: avoid !important;
    break-before: avoid !important;
  }

  /* Specific container rules to fit on one page */
  .print\:min-h-screen.print\:flex.print\:flex-col {
    height: 100vh !important;
    max-height: 100vh !important;
    page-break-after: avoid !important;
  }

  /* Main wrapper should fit exactly one page */
  .print\:min-h-screen > .print\:flex {
    height: 100vh !important;
    max-height: 100vh !important;
    padding-bottom: 0.5rem !important; /* Add padding to container instead */
  }

}
</style>
