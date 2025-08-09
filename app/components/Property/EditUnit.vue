<template>
  <UModal
    :open="open"
    fullscreen
    :title="`${isCaretaker ? 'View' : 'Update'} Units on Floor ${floor?.floorNumber}`"
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
            Managing {{ state.units.length }} unit{{ state.units.length > 1 ? 's' : '' }}
          </div>
          <div
            v-if="!isCaretaker"
            class="flex items-center gap-2"
          >
            <UInput
              v-model="unitPrefix"
              placeholder="Unit prefix (e.g. A)"
              size="sm"
              class="w-32"
              :disabled="isLoading"
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

        <!-- Caretaker Alert -->
        <div
          v-if="isCaretaker"
          class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 mb-4"
        >
          <div class="flex items-start gap-3">
            <UIcon
              name="i-heroicons-information-circle"
              class="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5"
            />
            <div>
              <h4 class="text-sm font-medium text-amber-800 dark:text-amber-200">
                View Only Access
              </h4>
              <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">
                As a caretaker, you can view unit details but cannot modify rent amounts, add new units, or delete existing units.
              </p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(unit, unitIndex) in state.units"
            :key="unit._id || `new-${unitIndex}`"
            class="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
          >
            <div class="flex justify-between items-center mb-3">
              <h5 class="text-base font-medium flex items-center gap-2">
                Unit {{ unit.unitNumber }}
                <UBadge
                  v-if="!unit._id"
                  color="primary"
                  variant="soft"
                  size="xs"
                >
                  New
                </UBadge>
              </h5>
              <div class="flex gap-2">
                <UBadge
                  v-if="unit.isOccupied"
                  color="error"
                  variant="soft"
                  size="xs"
                >
                  Occupied
                </UBadge>
                <UButton
                  v-if="!unit.isOccupied && !isCaretaker"
                  size="xs"
                  color="error"
                  icon="i-lucide-trash-2"
                  :disabled="isLoading"
                  :title="unit.isOccupied ? 'Cannot delete occupied unit' : 'Delete unit'"
                  @click="markForDeletion(unitIndex)"
                />
              </div>
            </div>

            <div
              v-if="unit.markedForDeletion"
              class="text-center py-8 text-red-500"
            >
              <UIcon
                name="i-lucide-trash-2"
                class="w-8 h-8 mx-auto mb-2"
              />
              <p class="text-sm">
                This unit will be {{ unit._id ? 'deleted' : 'removed' }}
              </p>
              <UButton
                size="xs"
                color="primary"
                variant="soft"
                label="Undo"
                class="mt-2"
                @click="undoDeletion(unitIndex)"
              />
            </div>

            <div
              v-else
              class="grid grid-cols-2 gap-3"
            >
              <UFormField
                :label="`Unit Number`"
                :name="`units[${unitIndex}].unitNumber`"
                class="col-span-2"
              >
                <UInput
                  v-model="unit.unitNumber"
                  placeholder="Unit number"
                  size="sm"
                  :disabled="isLoading || (!!unit.isOccupied && !!unit._id) || isCaretaker"
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
                  :disabled="isLoading || isCaretaker"
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
                v-if="unit._id"
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
          <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div
              v-if="newUnitsCount > 0 && !isCaretaker"
              class="text-green-600"
            >
              {{ newUnitsCount }} new unit{{ newUnitsCount > 1 ? 's' : '' }} will be added
            </div>
            <div
              v-if="deletedCount > 0 && !isCaretaker"
              class="text-red-500"
            >
              {{ deletedCount }} unit{{ deletedCount > 1 ? 's' : '' }} will be deleted
            </div>
          </div>
          <div class="flex gap-2">
            <UButton
              color="neutral"
              variant="soft"
              :label="isCaretaker ? 'Close' : 'Cancel'"
              :disabled="isLoading"
              @click="handleCancel"
            />
            <UButton
              type="submit"
              color="primary"
              label="Save Changes"
              icon="i-lucide-save"
              :loading="isLoading"
              :disabled="isLoading"
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
import type { Unit } from '~/types/property'

const props = defineProps({
  propertyId: { type: String, required: true },
  floor: {
    type: Object as PropType<any>,
    required: true,
  },
  units: {
    type: Array as PropType<Unit[]>,
    default: () => [],
  },
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'refresh'])

const toast = useToast()
const isLoading = ref(false)
const originalUnits = ref<string>('')
const unitPrefix = ref('A')
const { user } = useUserSession()

const isCaretaker = computed(() => user.value?.role === 'caretaker')

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
      _id: z.string().optional(),
      unitNumber: z.string().min(1, 'Unit number is required'),
      type: z.nativeEnum(FlatType).optional(),
      furnishing: z.nativeEnum(Furnishing).optional(),
      category: z.nativeEnum(FlatCategory).optional(),
      status: z.nativeEnum(FlatStatus),
      isOccupied: z.boolean().default(false),
      rentAmount: z.number().nonnegative('Rent cannot be negative').optional(),
      markedForDeletion: z.boolean().optional(),
    }),
  ).min(0),
})

const state = reactive({
  units: [] as Array<Unit & { markedForDeletion?: boolean, currentTenant?: any }>,
})

const deletedCount = computed(() =>
  state.units.filter(unit => unit.markedForDeletion && unit._id).length,
)

const newUnitsCount = computed(() =>
  state.units.filter(unit => !unit._id && !unit.markedForDeletion).length,
)

const hasChanges = computed(() => {
  const currentState = JSON.stringify(state.units.map((u) => {
    const { markedForDeletion, currentTenant, ...unit } = u
    return markedForDeletion ? { _id: unit._id, markedForDeletion } : unit
  }))
  return currentState !== originalUnits.value
})

function populateUnits() {
  if (props.units && props.units.length > 0) {
    state.units = props.units.map(unit => ({
      ...unit,
      markedForDeletion: false,
    }))

    // Set unit prefix based on existing units
    const firstUnit = props.units[0]
    if (firstUnit?.unitNumber) {
      const match = firstUnit.unitNumber.match(/^([A-Za-z]+)/)
      if (match) {
        unitPrefix.value = match[1] ?? ''
      }
    }
  }
  else {
    state.units = []
  }

  originalUnits.value = JSON.stringify(state.units.map((u) => {
    const { markedForDeletion, currentTenant, ...unit } = u
    return unit
  }))
}

function addUnit() {
  const existingNumbers = state.units
    .filter(u => !u.markedForDeletion)
    .map(u => u.unitNumber)

  let unitNumber = 1
  let newUnitNumber = ''
  do {
    newUnitNumber = `${unitPrefix.value}${props.floor?.floorNumber}${String(unitNumber).padStart(2, '0')}`
    unitNumber++
  } while (existingNumbers.includes(newUnitNumber))

  // Get rent amount from existing units or default
  const defaultRent = state.units.find(u => u.rentAmount)?.rentAmount || 0

  state.units.push({
    unitNumber: newUnitNumber,
    type: FlatType.ONE_BEDUNIT,
    furnishing: Furnishing.FULLY_FURNISHED,
    category: FlatCategory.COMMERCIAL,
    status: FlatStatus.AVAILABLE,
    isOccupied: false,
    rentAmount: defaultRent,
    floorId: props.floor._id,
    propertyId: props.propertyId,
    markedForDeletion: false,
  } as Unit & { markedForDeletion?: boolean })
}

function updateUnitOccupancy(unitIndex: number, isOccupied: boolean) {
  const unit = state.units[unitIndex]
  if (unit && !unit.currentTenant) {
    unit.status = isOccupied ? FlatStatus.RENTED : FlatStatus.AVAILABLE
    unit.isOccupied = isOccupied
  }
}

function markForDeletion(unitIndex: number) {
  const unit = state.units[unitIndex]
  if (unit && !unit.isOccupied) {
    unit.markedForDeletion = true
  }
  else if (unit?.isOccupied) {
    toast.add({
      title: 'Cannot delete occupied unit',
      description: 'This unit is currently occupied and cannot be deleted.',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    })
  }
}

function undoDeletion(unitIndex: number) {
  const unit = state.units[unitIndex]
  if (unit) {
    unit.markedForDeletion = false
  }
}

function handleCancel() {
  if (hasChanges.value) {
    const confirmed = confirm('You have unsaved changes. Are you sure you want to cancel?')
    if (!confirmed) return
  }
  emit('update:open', false)
}

watch(() => props.open, (newVal) => {
  if (newVal) {
    populateUnits()
  }
})

watch(() => props.units, () => {
  if (props.open) {
    populateUnits()
  }
}, { deep: true })

const handleSubmit = async () => {
  try {
    isLoading.value = true

    // Separate units to update, create, and delete
    const unitsToUpdate = state.units.filter(unit => unit._id && !unit.markedForDeletion)
    const unitsToCreate = state.units.filter(unit => !unit._id && !unit.markedForDeletion)
    const unitsToDelete = state.units.filter(unit => unit.markedForDeletion && unit._id && !unit.isOccupied).map(u => u._id)

    // If there are new units to create
    if (unitsToCreate.length > 0) {
      await $fetch('/api/properties/add/units', {
        method: 'POST',
        body: {
          propertyId: props.propertyId,
          floorId: props.floor?._id,
          units: unitsToCreate,
        },
      })
    }

    // If there are existing units to update or delete
    if (unitsToUpdate.length > 0 || unitsToDelete.length > 0) {
      await $fetch('/api/properties/update/units', {
        method: 'POST',
        body: {
          propertyId: props.propertyId,
          floorId: props.floor?._id,
          unitsToUpdate,
          unitsToDelete,
        },
      })
    }

    toast.add({
      title: 'Changes saved successfully',
      description: `${unitsToCreate.length} added, ${unitsToUpdate.length} updated, ${unitsToDelete.length} deleted`,
      color: 'success',
      icon: 'i-lucide-check',
    })

    emit('refresh')
    emit('update:open', false)
  }
  catch (error: any) {
    toast.add({
      title: 'Error saving changes',
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
