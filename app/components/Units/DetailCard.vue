<template>
  <UCard class="lg:col-span-1">
    <template #header>
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-bold">
          Unit Details
        </h2>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-pencil"
          size="sm"
          @click="$emit('edit', unit)"
        />
      </div>
    </template>

    <div class="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-1 gap-1">
      <div>
        <p class="text-sm text-gray-500">
          Unit Number
        </p>
        <p class="font-medium">
          {{ unit?.unitNumber }}
        </p>
      </div>

      <div>
        <p class="text-sm text-gray-500">
          Floor
        </p>
        <p class="font-medium">
          <span>
            {{ formatFloorNumber(unit?.floorNumber).number }}
            <sup v-if="formatFloorNumber(unit?.floorNumber).suffix">
              {{ formatFloorNumber(unit?.floorNumber).suffix }}
            </sup>
            {{ formatFloorNumber(unit?.floorNumber).number !== 'Ground' ? ' Floor' : ' Floor' }}
          </span>
        </p>
      </div>

      <div>
        <p class="text-sm text-gray-500">
          Type
        </p>
        <p class="font-medium capitalize">
          {{ unit?.type?.includes('bedunit')
            ? unit.type.replace(/_/g, '').replace(/(\d)([a-zA-Z])/g, '$1 $2').replace('bedunit', 'bed unit')
            : unit?.type?.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([a-z])(unit)/g, '$1 $2') || 'Not specified' }}
        </p>
      </div>

      <div>
        <p class="text-sm text-gray-500">
          Furnishing
        </p>
        <p class="font-medium capitalize">
          {{ formatFurnishing(unit?.furnishing) }}
        </p>
      </div>

      <div>
        <p class="text-sm text-gray-500">
          Category
        </p>
        <p class="font-medium">
          {{ unit?.category || 'Not specified' }}
        </p>
      </div>

      <div>
        <p class="text-sm text-gray-500">
          Rent Amount
        </p>
        <p class="font-medium">
          {{ formatCurrency(unit?.rentAmount) }}
        </p>
      </div>
    </div>
    <PropertySingleUnit
      v-model:open="showUnitModal"
      :unit="selectedUnit"
      :property-id="propertyId"
      @save="$emit('save')"
    />
  </UCard>
</template>

<script setup lang="ts">
import { useFormatters } from '~/composables/formatters'

interface Props {
  unit: any
  propertyId: string
}

const _props = defineProps<Props>()

defineEmits<{
  edit: [unit: any]
  save: []
}>()

const { formatFloorNumber } = useFormatFloor()
const { formatCurrency, formatFurnishing } = useFormatters()

const showUnitModal = ref(false)
const selectedUnit = ref<any>(null)

function handleEdit(unit: any) {
  selectedUnit.value = {
    ...unit,
    floorId: unit?.floorId || '',
  }
  showUnitModal.value = true
}

defineExpose({
  showEdit: handleEdit,
})
</script>
