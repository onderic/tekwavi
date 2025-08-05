<template>
  <BasePage
    title="Service Fees"
    icon="i-lucide-check-square"
    :status="status === 'pending'"
  >
    <UCard>
      <div
        v-if="propertyId"
        class="mb-6"
      >
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Configure monthly service fees for different unit types in your property. These fees will be automatically applied to unit owners and deducted based on their type.
        </p>
        <!--
        <div
          v-if="summary"
          class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4"
        >
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Total Units
            </p>
            <p class="text-2xl font-semibold">
              {{ summary.totalUnits }}
            </p>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Fee Types
            </p>
            <p class="text-2xl font-semibold">
              {{ summary.totalFeeTypes }}
            </p>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Configured
            </p>
            <p class="text-2xl font-semibold">
              {{ summary.configuredFees }}
            </p>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Monthly Revenue
            </p>
            <p class="text-2xl font-semibold">
              Ksh {{ summary.totalMonthlyRevenue.toLocaleString() }}
            </p>
          </div>
        </div> -->
      </div>

      <div
        v-if="!propertyId"
        class="text-center py-8 text-gray-500"
      >
        Please select a property to view service fees
      </div>

      <div v-else>
        <!-- Search Input -->
        <div class="mb-4">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Search by unit type..."
            class="max-w-sm"
          />
        </div>

        <UTable
          :loading="status === 'pending'"
          :data="filteredServiceFees"
          :columns="columns"
          :empty-state="{
            icon: 'i-lucide-receipt',
            label: searchQuery ? 'No service fees found matching your search' : 'No service fees found',
          }"
        >
          <template #unitType-cell="{ row }">
            <div>
              <div class="text-sm font-medium">
                {{ row.original.unitTypeLabel }}
              </div>
              <div class="text-xs text-gray-500">
                {{ row.original.unitCount }} {{ row.original.unitCount === 1 ? 'unit' : 'units' }}
              </div>
            </div>
          </template>

          <template #monthlyFee-cell="{ row }">
            <div>
              <span>Ksh {{ row.original.monthlyFee.toLocaleString() }}</span>
              <div
                v-if="row.original.unitCount > 0"
                class="text-xs text-gray-500"
              >
                per unit
              </div>
            </div>
          </template>

          <template #totalRevenue-cell="{ row }">
            <div>
              <span>Ksh {{ row.original.totalMonthlyRevenue.toLocaleString() }}</span>
              <div class="text-xs text-gray-500">
                per month
              </div>
            </div>
          </template>

          <template #updatedAt-cell="{ row }">
            <span class="text-sm text-gray-500">
              {{ new Date(row.original.updatedAt).toLocaleDateString() }}
            </span>
          </template>

          <template #actions-cell="{ row }">
            <UButton
              color="primary"
              variant="ghost"
              icon="i-lucide-edit"
              size="xs"
              @click="openEditModal(row.original)"
            />
          </template>
        </UTable>
      </div>
    </UCard>

    <UModal
      v-model:open="showEditModal"
      title="Edit Service Fee"
    >
      <template #content>
        <UForm
          :schema="schema"
          :state="editForm"
          class="p-6"
          @submit="updateFee"
        >
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Unit Type
              </label>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ selectedFee?.unitTypeLabel }}
              </p>
              <p
                v-if="selectedFee?.unitCount"
                class="text-xs text-gray-500"
              >
                {{ selectedFee.unitCount }} {{ selectedFee.unitCount === 1 ? 'unit' : 'units' }} of this type
              </p>
            </div>

            <UFormField
              label="Monthly Fee (Ksh)"
              name="monthlyFee"
              help="Enter the monthly service fee for this unit type"
            >
              <UInput
                v-model.number="editForm.monthlyFee"
                type="number"
                min="0"
                step="100"
                placeholder="Enter monthly fee amount"
                :disabled="saving"
              />
            </UFormField>

            <div
              v-if="selectedFee?.unitCount && editForm.monthlyFee"
              class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
            >
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Projected Monthly Revenue
              </p>
              <p class="text-lg font-semibold">
                Ksh {{ (editForm.monthlyFee * selectedFee.unitCount).toLocaleString() }}
              </p>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <UButton
              type="button"
              color="neutral"
              variant="outline"
              :disabled="saving"
              @click="showEditModal = false"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              color="primary"
              :loading="saving"
              :disabled="saving"
            >
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </BasePage>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import { z } from 'zod'

definePageMeta({
  title: 'Service Fees',
})

const { propertyId } = useCurrentProperty()
const toast = useToast()

const showEditModal = ref(false)
const selectedFee = ref<any>(null)
const saving = ref(false)
const searchQuery = ref('')

const { data: feeData, status, refresh } = await useLazyAsyncData(
  'service-fees',
  () => {
    if (!propertyId.value) return Promise.resolve(null)

    return $fetch<any>('/api/services/settings', {
      query: { propertyId: propertyId.value },
    })
  },
  {
    watch: [propertyId],
    server: false,
  },
)

const serviceFees = computed(() => feeData.value?.data?.fees || [])
// const summary = computed(() => feeData.value?.data?.summary || null)

const filteredServiceFees = computed(() => {
  if (!searchQuery.value) return serviceFees.value

  return serviceFees.value.filter((fee: any) =>
    fee.unitTypeLabel.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const columns: TableColumn<any>[] = [
  { accessorKey: 'unitType', header: 'Unit Type' },
  { accessorKey: 'monthlyFee', header: 'Monthly Fee' },
  { accessorKey: 'totalRevenue', header: 'Total Revenue' },
  { accessorKey: 'updatedAt', header: 'Last Updated' },
  { accessorKey: 'actions', header: 'Actions' },
]

const schema = z.object({
  monthlyFee: z.number().min(0, 'Monthly fee must be 0 or greater'),
})

const editForm = ref({
  monthlyFee: 0,
})

function openEditModal(fee: any) {
  selectedFee.value = fee
  editForm.value.monthlyFee = fee.monthlyFee
  showEditModal.value = true
}

async function updateFee() {
  if (!selectedFee.value) return

  try {
    saving.value = true

    await $fetch(`/api/services/settings/${selectedFee.value._id}`, {
      method: 'POST',
      body: {
        propertyId: propertyId.value,
        fees: [{
          _id: selectedFee.value._id,
          monthlyFee: editForm.value.monthlyFee,
        }],
      },
    })

    toast.add({
      title: 'Success',
      description: 'Service fee updated successfully',
      color: 'success',
    })

    showEditModal.value = false
    await refresh()
  }
  catch (error: any) {
    console.error('Error updating fee:', error)
    toast.add({
      title: 'Error',
      description: error.data?.statusMessage || 'Failed to update service fee',
      color: 'error',
    })
  }
  finally {
    saving.value = false
  }
}
</script>
