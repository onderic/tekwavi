<template>
  <UModal
    :open="open"
    fullscreen
    :title="`Add Units to Floor ${floor?.floorNumber}`"
    :close="{ onClick: () => emit('update:open', false), color: 'primary', variant: 'outline', class: 'rounded-full' }"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <div class="flex justify-between items-center mb-3">
          <div>
            <label class="font-medium">Unit Prefix:</label>
            <UInput
              v-model="unitPrefix"
              placeholder="e.g. A, 0"
              size="sm"
              style="max-width: 120px"
              :disabled="isLoading"
            />
          </div>
          <UButton
            color="primary"
            size="sm"
            icon="i-lucide-plus"
            :disabled="isLoading"
            @click="addUnit"
          >
            Add Unit
          </UButton>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(unit, unitIndex) in state.units"
            :key="unitIndex"
            class="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
          >
            <div class="flex justify-between items-center mb-3">
              <h5 class="text-base font-medium">
                Unit {{ unit.unitNumber }}
              </h5>
              <UButton
                size="xs"
                color="error"
                icon="i-lucide-trash-2"
                :disabled="isLoading || state.units.length <= 1"
                @click="removeUnit(unitIndex)"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <UFormField
                :label="`Unit Number`"
                :name="`units[${unitIndex}].unitNumber`"
                class="col-span-2"
              >
                <UInput
                  v-model="unit.unitNumber"
                  placeholder="Unit number"
                  size="sm"
                  :disabled="isLoading"
                />
              </UFormField>
              <UFormField
                label="Unit Type"
                :name="`units[${unitIndex}].type`"
              >
                <USelect
                  v-model="unit.type"
                  :items="flatTypeOptions"
                  placeholder="Select type"
                  size="sm"
                  :disabled="isLoading"
                />
              </UFormField>
              <UFormField
                label="Furnishing"
                :name="`units[${unitIndex}].furnishing`"
              >
                <USelect
                  v-model="unit.furnishing"
                  :items="furnishingOptions"
                  placeholder="Select furnishing"
                  size="sm"
                  :disabled="isLoading"
                />
              </UFormField>
              <UFormField
                label="Category"
                :name="`units[${unitIndex}].category`"
              >
                <USelect
                  v-model="unit.category"
                  :items="categoryOptions"
                  placeholder="Select category"
                  size="sm"
                  :disabled="isLoading"
                />
              </UFormField>
              <UFormField
                label="Rent Amount"
                :name="`units[${unitIndex}].rentAmount`"
              >
                <template #prepend>
                  <span class="text-gray-500 text-xs">KES</span>
                </template>
                <UInput
                  v-model.number="unit.rentAmount"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0.00"
                  size="sm"
                  :disabled="isLoading"
                />
              </UFormField>
              <UFormField
                label="Status"
                :name="`units[${unitIndex}].status`"
              >
                <USelect
                  v-model="unit.status"
                  :items="statusOptions"
                  placeholder="Status"
                  size="sm"
                  disabled
                />
              </UFormField>
              <UFormField
                label="Occupancy"
                :name="`units[${unitIndex}].isOccupied`"
              >
                <USwitch
                  v-model="unit.isOccupied"
                  unchecked-icon="i-lucide-x"
                  checked-icon="i-lucide-check"
                  :values="{ true: 'Occupied', false: 'Vacant' }"
                  size="sm"
                  disabled
                  @update:model-value="(value) => updateUnitOccupancy(unitIndex, value)"
                />
              </UFormField>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <UButton
            color="neutral"
            variant="soft"
            label="Cancel"
            :disabled="isLoading"
            @click="emit('update:open', false)"
          />
          <UButton
            type="submit"
            color="primary"
            label="Add Units"
            icon="i-lucide-save"
            :loading="isLoading"
            :disabled="isLoading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { FlatStatus, FlatType, Furnishing, FlatCategory } from '~/types/property'

const props = defineProps({
  propertyId: { type: String, required: true },
  floor: {
    type: Object as PropType<any>,
    required: true,
  },
  rentAmount: { type: Number, default: 0 },
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'refresh'])

const toast = useToast()
const isLoading = ref(false)
const unitPrefix = ref('A')

const statusOptions = Object.values(FlatStatus).map(status => ({
  label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
  value: status,
}))
const flatTypeOptions = Object.values(FlatType).map(type => ({
  label: type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
  value: type,
}))
const furnishingOptions = Object.values(Furnishing).map(furnishing => ({
  label: furnishing.charAt(0).toUpperCase() + furnishing.slice(1).replace(/_/g, ' '),
  value: furnishing,
}))
const categoryOptions = Object.values(FlatCategory).map(category => ({
  label: category,
  value: category,
}))

const schema = z.object({
  units: z.array(
    z.object({
      unitNumber: z.string().min(1, 'Unit number is required'),
      type: z.nativeEnum(FlatType).optional(),
      furnishing: z.nativeEnum(Furnishing).optional(),
      category: z.nativeEnum(FlatCategory).optional(),
      status: z.nativeEnum(FlatStatus),
      isOccupied: z.boolean().default(false),
      rentAmount: z.number().nonnegative('Rent cannot be negative').optional(),
    }),
  ).min(1, 'At least one unit is required'),
})

const state = reactive({
  units: [] as {
    unitNumber: string
    type?: FlatType
    furnishing?: Furnishing
    category?: FlatCategory
    status: FlatStatus
    isOccupied: boolean
    rentAmount?: number
  }[],
})

function updateAllUnitNumbers() {
  state.units.forEach((unit, idx) => {
    unit.unitNumber = `${unitPrefix.value}${props.floor?.floorNumber}${String(idx + 1).padStart(2, '0')}`
  })
}

function createNewUnit(unitIndex: number): any {
  return {
    unitNumber: `${unitPrefix.value}${props.floor?.floorNumber}${String(unitIndex + 1).padStart(2, '0')}`,
    type: FlatType.ONE_BEDUNIT,
    furnishing: Furnishing.FULLY_FURNISHED,
    category: FlatCategory.COMMERCIAL,
    status: FlatStatus.AVAILABLE,
    isOccupied: false,
    rentAmount: props.rentAmount,
  }
}

function updateUnitOccupancy(unitIndex: number, isOccupied: boolean) {
  const unit = state.units[unitIndex]
  if (unit) {
    unit.status = isOccupied ? FlatStatus.RENTED : FlatStatus.AVAILABLE
    unit.isOccupied = isOccupied
  }
}

function resetUnits() {
  state.units = []
  for (let i = 0; i < 6; i++) {
    state.units.push(createNewUnit(i))
  }
}

onMounted(resetUnits)
watch(() => props.open, (newVal) => {
  if (newVal) resetUnits()
})
watch(unitPrefix, () => {
  updateAllUnitNumbers()
})

const handleSubmit = async () => {
  try {
    isLoading.value = true
    await $fetch('/api/properties/add/units', {
      method: 'POST',
      body: {
        propertyId: props.propertyId,
        floorId: props.floor?._id,
        units: state.units,
      },
    })
    toast.add({
      title: 'Units added successfully',
      color: 'success',
      icon: 'i-lucide-check',
    })
    emit('refresh')
    emit('update:open', false)
  }
  catch (error: any) {
    toast.add({
      title: 'Error adding units',
      description: error.message || 'Something went wrong',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    })
  }
  finally {
    isLoading.value = false
  }
}

function addUnit() {
  state.units.push(createNewUnit(state.units.length))
}

function removeUnit(unitIndex: number) {
  if (state.units.length > 1) {
    state.units.splice(unitIndex, 1)
    updateAllUnitNumbers()
  }
}
</script>
