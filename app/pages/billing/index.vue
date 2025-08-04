<template>
  <BasePage
    title="Billing"
    icon="i-lucide-scroll"
    :status="status === 'pending'"
  >
    <template #headerActions>
      <!-- <UButton
        icon="i-lucide-refresh-cw"
        color="gray"
        variant="ghost"
        :loading="status === 'pending'"
        @click="refresh"
      /> -->
    </template>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <ClientOnly>
          <BillingSummary
            :stats="billingData?.stats"
            :next-billing="billingData?.nextBilling"
            :current-month-status="billingData?.currentMonthStatus"
            :loading="status === 'pending'"
          />
        </ClientOnly>
        <ClientOnly>
          <BillingMonthlyReceipts
            :invoices="billingData?.invoices || []"
            :loading="status === 'pending'"
            @payment-completed="handlePaymentCompleted"
          />
        </ClientOnly>
        <ClientOnly>
          <BillingRecentTransactions
            :invoices="paidInvoices"
            :loading="status === 'pending'"
          />
        </ClientOnly>
      </div>

      <div class="lg:col-span-1 space-y-6">
        <ClientOnly>
          <BillingMySubscription
            :stats="billingData?.stats"
            :next-billing="billingData?.nextBilling"
            :loading="status === 'pending'"
          />
        </ClientOnly>
        <ClientOnly>
          <BillingPaymentMethods />
        </ClientOnly>
        <ClientOnly>
          <BillingPropertyUsageOverTime
            :invoices="billingData?.invoices || []"
          />
        </ClientOnly>
      </div>
    </div>
  </BasePage>
</template>

<script setup lang="ts">
const { user } = useUserSession()

if (user.value?.role !== 'developer') {
  await navigateTo('/')
}

const { data, status, refresh } = await useAsyncData(
  'billingData',
  () => $fetch<any>('/api/billing'),
  {
    default: () => null,
  },
)

const billingData = computed(() => data.value?.data || null)

const paidInvoices = computed(() => {
  if (!billingData.value?.invoices) return []
  return billingData.value.invoices
    .filter((invoice: any) => invoice.isPaid)
})

// Handle payment completion
const handlePaymentCompleted = async () => {
  await refresh()
}
</script>
