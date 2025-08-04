<template>
  <UModal
    :open="open"
    fullscreen
    :title="`Add New Floor - Floor ${nextFloorNumber}`"
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
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Adding {{ state.units.length }} unit{{ state.units.length > 1 ? 's' : '' }} to Floor {{ nextFloorNumber }}
          </div>
          <div class="flex items-center gap-2">
            <UInput
              v-model="unitPrefix"
              placeholder="Unit prefix (e.g. A)"
              size="sm"
              class="w-32"
              :disabled="isLoading"
              @update:model-value="updateAllUnitNumbers"
            />
            <UButton
              color="primary"
              size="sm"
              icon="i-lucide-plus"
              label="Add Unit"
              :disabled="isLoading"
              @click="addUnit"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(unit, unitIndex) in state.units"
            :key="`new-${unitIndex}`"
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
                title="Remove unit"
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

        <div class="flex justify-between items-center mt-4">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <span class="text-green-600">
              Floor {{ nextFloorNumber }} with {{ state.units.length }} unit{{ state.units.length > 1 ? 's' : '' }} will be created
            </span>
          </div>
          <div class="flex gap-2">
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
              label="Create Floor"
              icon="i-lucide-save"
              :loading="isLoading"
              :disabled="isLoading || state.units.length === 0"
            />
          </div>
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { FlatStatus, FlatType, Furnishing, FlatCategory } from '~/types/property'

const props = defineProps({
  propertyId: {
    type: String,
    required: true,
  },
  floorNumber: {
    type: Number,
    default: 0,
  },
  rentAmount: {
    type: Number,
    default: 0,
  },
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:open', 'refresh'])

const toast = useToast()
const isLoading = ref(false)
const unitPrefix = ref('A')

// Options for select inputs
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

// Schema for validation
const schema = z.object({
  floorNumber: z.number().int().min(0, 'Floor number must be a non-negative integer'),
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

const nextFloorNumber = computed(() => props.floorNumber + 1)

const state = reactive({
  floorNumber: nextFloorNumber.value,
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

// Watch for changes in floor number prop
watch(() => props.floorNumber, (newValue) => {
  state.floorNumber = newValue + 1
})

// Initialize units when modal opens
watch(() => props.open, (newVal) => {
  if (newVal) {
    resetForm()
    // Add 6 units by default
    for (let i = 0; i < 6; i++) {
      addUnit()
    }
  }
})

function resetForm() {
  state.floorNumber = props.floorNumber + 1
  state.units = []
}

function generateUnitNumber(index: number) {
  return `${unitPrefix.value}${state.floorNumber}${String(index + 1).padStart(2, '0')}`
}

function updateAllUnitNumbers() {
  state.units.forEach((unit, index) => {
    unit.unitNumber = generateUnitNumber(index)
  })
}

function addUnit() {
  const unitIndex = state.units.length
  state.units.push({
    unitNumber: generateUnitNumber(unitIndex),
    type: FlatType.ONE_BEDUNIT,
    furnishing: Furnishing.FULLY_FURNISHED,
    category: FlatCategory.COMMERCIAL,
    status: FlatStatus.AVAILABLE,
    isOccupied: false,
    rentAmount: props.rentAmount || 0,
  })
}

function removeUnit(unitIndex: number) {
  if (state.units.length > 1) {
    state.units.splice(unitIndex, 1)
    // Re-generate unit numbers for remaining units
    updateAllUnitNumbers()
  }
}

function updateUnitOccupancy(unitIndex: number, isOccupied: boolean) {
  const unit = state.units[unitIndex]
  if (unit) {
    unit.status = isOccupied ? FlatStatus.RENTED : FlatStatus.AVAILABLE
    unit.isOccupied = isOccupied
  }
}

const handleSubmit = async () => {
  try {
    isLoading.value = true

    const floor = {
      propertyId: props.propertyId,
      floorNumber: state.floorNumber,
      units: state.units.map(unit => ({
        unitNumber: unit.unitNumber,
        type: unit.type,
        furnishing: unit.furnishing,
        category: unit.category,
        status: unit.status,
        isOccupied: unit.isOccupied,
        rentAmount: unit.rentAmount,
      })),
    }

    await $fetch('/api/properties/add/floor', {
      method: 'POST',
      body: floor,
    })

    toast.add({
      title: 'Floor added successfully',
      description: `Floor ${state.floorNumber} created with ${state.units.length} units`,
      color: 'success',
      icon: 'i-lucide-check',
    })

    emit('refresh')
    emit('update:open', false)
  }
  catch (error: any) {
    toast.add({
      title: 'Error adding floor',
      description: error.data?.message || error.message || 'Something went wrong',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    })
  }
  finally {
    isLoading.value = false
  }
}
</script>
