<template>
  <div class="max-w-4xl mx-auto bg-white shadow-lg">
    <!-- Top Header -->
    <div class="bg-orange-500 text-white py-4 px-8">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold">
            TEKWAVI PROPERTY MANAGEMENT
          </h2>
          <p class="text-sm">
            Excellence in Property Solutions
          </p>
        </div>
        <div class="text-right">
          <p class="text-sm">
            www.tekwavi.com
          </p>
          <p class="text-sm">
            support@tekwavi.com | +1 (555) 123-4567
          </p>
        </div>
      </div>
    </div>

    <div class="p-8">
      <div class="flex justify-between items-start mb-8">
        <div class="flex items-center">
          <div class="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0" />
          <div class="ml-4">
            <p class="font-bold text-lg">
              {{ propertyName }}
            </p>
            <p class="text-sm text-gray-600">
              {{ propertyAddress }}
            </p>
            <p class="text-sm text-gray-600">
              Property Manager: {{ propertyManager }}
            </p>
          </div>
        </div>
        <div>
          <h1 class="text-3xl font-bold uppercase text-gray-700">
            RENT RECEIPT
          </h1>
          <p class="mt-2 text-sm text-right">
            Date: <span class="font-semibold">{{ date }}</span>
          </p>
          <p class="text-sm text-right">
            Receipt No: <span class="font-semibold">{{ receiptNo }}</span>
          </p>
          <p class="text-sm text-right">
            Unit: <span class="font-semibold">{{ unitNumber }}</span>
          </p>
        </div>
      </div>

      <div class="border-t-4 border-orange-500 pt-4 mb-8">
        <h2 class="font-bold text-lg mb-2 text-gray-700">
          BILLED TO
        </h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm">
              <span class="font-semibold">Tenant Name:</span> {{ tenantName }}
            </p>
            <p class="text-sm">
              <span class="font-semibold">Unit Address:</span> {{ unitAddress }}
            </p>
          </div>
          <div>
            <p class="text-sm">
              <span class="font-semibold">Email:</span> {{ tenantEmail }}
            </p>
            <p class="text-sm">
              <span class="font-semibold">Phone:</span> {{ tenantPhone }}
            </p>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto mb-8">
        <table class="min-w-full">
          <thead>
            <tr class="bg-orange-500 text-white">
              <th class="py-3 px-4 text-left font-semibold">
                DESCRIPTION
              </th>
              <th class="py-3 px-4 text-center font-semibold">
                PERIOD
              </th>
              <th class="py-3 px-4 text-right font-semibold">
                AMOUNT
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in items"
              :key="index"
              class="border-b border-gray-200 hover:bg-gray-50"
            >
              <td class="py-3 px-4">
                {{ item.description }}
              </td>
              <td class="py-3 px-4 text-center">
                {{ item.period }}
              </td>
              <td class="py-3 px-4 text-right">
                ${{ item.amount }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-between gap-8">
        <div class="w-1/2">
          <div class="bg-gray-100 p-4 rounded">
            <p class="text-sm font-bold mb-2">
              Payment Information
            </p>
            <p class="text-sm text-gray-600 mb-1">
              <span class="font-semibold">Payment Method:</span> {{ paymentMethod }}
            </p>
            <p class="text-sm text-gray-600 mb-1">
              <span class="font-semibold">Transaction ID:</span> {{ transactionId }}
            </p>
            <p class="text-sm text-gray-600">
              <span class="font-semibold">Payment Date:</span> {{ paymentDate }}
            </p>
          </div>

          <div class="mt-4 p-4 border border-gray-300 rounded">
            <p class="text-sm font-bold mb-2">
              Notes
            </p>
            <p class="text-sm text-gray-600">
              {{ notes }}
            </p>
          </div>
        </div>

        <div class="w-1/2">
          <div class="bg-gray-50 p-4 rounded">
            <div class="flex justify-between items-center mb-2">
              <p class="text-sm">
                SUBTOTAL
              </p>
              <p class="font-semibold text-sm">
                ${{ subtotal }}
              </p>
            </div>
            <div class="flex justify-between items-center mb-2">
              <p class="text-sm">
                LATE FEE
              </p>
              <p class="font-semibold text-sm">
                ${{ lateFee }}
              </p>
            </div>
            <div class="flex justify-between items-center mb-2">
              <p class="text-sm">
                DISCOUNT
              </p>
              <p class="font-semibold text-sm text-green-600">
                -${{ discount }}
              </p>
            </div>
            <div class="flex justify-between items-center mb-2">
              <p class="text-sm font-bold">
                SUBTOTAL AFTER ADJUSTMENTS
              </p>
              <p class="font-bold text-sm">
                ${{ subtotalAfterAdjustments }}
              </p>
            </div>
            <div class="flex justify-between items-center mb-2">
              <p class="text-sm">
                TAX ({{ taxRate }})
              </p>
              <p class="font-semibold text-sm">
                ${{ totalTax }}
              </p>
            </div>
            <div class="border-t-2 border-gray-300 mt-3 pt-3 flex justify-between items-center">
              <p class="text-lg font-bold">
                TOTAL PAID
              </p>
              <p class="text-2xl font-bold text-orange-500">
                ${{ totalPaid }}
              </p>
            </div>
            <div class="flex justify-between items-center mt-2">
              <p class="text-sm font-semibold">
                Balance Due
              </p>
              <p class="text-lg font-semibold text-red-600">
                ${{ balanceDue }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8 pt-4 border-t border-gray-300">
        <div class="flex justify-between items-center">
          <div>
            <p class="text-xs text-gray-600">
              This is a computer-generated receipt and does not require a signature.
            </p>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-600">
              Authorized by: {{ authorizedBy }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Footer -->
    <div class="bg-gray-800 text-white py-4 px-8">
      <div class="flex justify-between items-center">
        <div>
          <p class="text-sm">
            Thank you for your payment!
          </p>
          <p class="text-xs text-gray-400">
            Please keep this receipt for your records.
          </p>
        </div>
        <div class="text-right">
          <p class="text-xs">
            © 2025 Tekwavi Property Management. All rights reserved.
          </p>
          <p class="text-xs text-gray-400">
            For inquiries, contact us at support@tekwavi.com
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Property Information
const propertyName = ref('Sunset Heights Apartments')
const propertyAddress = ref('456 Sunset Boulevard, Miami, FL 33101')
const propertyManager = ref('Sarah Johnson')

// Receipt Information
const date = ref('August 6, 2025')
const receiptNo = ref('RCP-2025-001234')
const unitNumber = ref('B-205')

// Tenant Information
const tenantName = ref('John Doe')
const unitAddress = ref('Unit B-205, Sunset Heights Apartments')
const tenantEmail = ref('john.doe@email.com')
const tenantPhone = ref('+1 (555) 123-4567')

// Payment Details
const paymentMethod = ref('Bank Transfer')
const transactionId = ref('TXN-20250806-1234')
const paymentDate = ref('August 6, 2025')
const authorizedBy = ref('Sarah Johnson, Property Manager')

// Billing Items
const items = ref([
  { description: 'Monthly Rent', period: 'August 2025', amount: '1,500.00' },
  { description: 'Water & Sewage', period: 'August 2025', amount: '75.00' },
  { description: 'Electricity', period: 'August 2025', amount: '120.00' },
  { description: 'Internet/WiFi Service', period: 'August 2025', amount: '60.00' },
  { description: 'Parking Space', period: 'August 2025', amount: '50.00' },
  { description: 'Garbage Collection', period: 'August 2025', amount: '25.00' },
  { description: 'Building Maintenance', period: 'August 2025', amount: '40.00' },
  { description: 'Security Service', period: 'August 2025', amount: '30.00' },
])

// Calculate totals
const subtotal = computed(() => {
  return items.value.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2)
})

const lateFee = ref('0.00')
const discount = ref('50.00')
const taxRate = ref('7%')

const subtotalAfterAdjustments = computed(() => {
  const sub = parseFloat(subtotal.value)
  const late = parseFloat(lateFee.value)
  const disc = parseFloat(discount.value)
  return (sub + late - disc).toFixed(2)
})

const totalTax = computed(() => {
  const taxableAmount = parseFloat(subtotalAfterAdjustments.value)
  const rate = parseFloat(taxRate.value) / 100
  return (taxableAmount * rate).toFixed(2)
})

const totalPaid = computed(() => {
  return (parseFloat(subtotalAfterAdjustments.value) + parseFloat(totalTax.value)).toFixed(2)
})

const balanceDue = ref('0.00')

const notes = ref('All utilities are included in the above charges. Next payment due on September 1, 2025.')
</script>
