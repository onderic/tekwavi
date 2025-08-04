<script setup lang="ts">
import { z } from 'zod'
import type { Unit } from '~/types/property'
import { FlatStatus, FlatType, Furnishing, FlatCategory } from '~/types/property'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  unit: {
    type: Object as PropType<Unit | null>,
    default: null,
  },
  propertyId: {
    type: String,
    required: true,
  },
})

const { user } = useUserSession()

const emit = defineEmits(['update:open', 'save'])

const isUpdating = ref(false)
const toast = useToast()
const isCaretaker = computed(() => user.value?.role === 'caretaker')

const schema = z.object({
  unitId: z.string().optional(),
  unitNumber: z.string().min(1, 'Unit number is required'),
  type: z.nativeEnum(FlatType).optional(),
  furnishing: z.nativeEnum(Furnishing).optional(),
  category: z.nativeEnum(FlatCategory).optional(),
  status: z.nativeEnum(FlatStatus),
  isOccupied: z.boolean().default(false),
  rentAmount: z.number().nonnegative('Rent cannot be negative').optional(),
  tenantId: z.string().optional(),
  tenantName: z.string().optional(),
  notes: z.string().optional(),
  contractStartDate: z.date().optional().nullable(),
  contractEndDate: z.date().optional().nullable(),
})

const unitTypeOptions = Object.entries(FlatType).map(([key, value]) => ({
  label: key.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' '),
  value,
}))

const furnishingOptions = Object.entries(Furnishing).map(([key, value]) => ({
  label: key.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' '),
  value,
}))

const categoryOptions = Object.entries(FlatCategory).map(([_, value]) => ({
  label: value,
  value,
}))

const statusOptions = Object.entries(FlatStatus).map(([key, value]) => ({
  label: key.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' '),
  value,
}))

const form = ref({
  unitId: '',
  unitNumber: '',
  type: FlatType.ONE_BEDUNIT,
  furnishing: Furnishing.UNFURNISHED,
  category: FlatCategory.RESIDENTIAL,
  status: FlatStatus.AVAILABLE,
  isOccupied: false,
  rentAmount: undefined as number | undefined,
  tenantId: undefined as string | undefined,
  tenantName: undefined as string | undefined,
  notes: undefined as string | undefined,
  contractStartDate: null as Date | null,
  contractEndDate: null as Date | null,
})

watch(() => props.unit, (newUnit) => {
  if (newUnit) {
    form.value = {
      unitId: newUnit.unitId || '',
      unitNumber: newUnit.unitNumber || '',
      type: newUnit.type || FlatType.ONE_BEDUNIT,
      furnishing: newUnit.furnishing || Furnishing.UNFURNISHED,
      category: newUnit.category || FlatCategory.RESIDENTIAL,
      status: newUnit.status || FlatStatus.AVAILABLE,
      isOccupied: newUnit.isOccupied || false,
      rentAmount: newUnit.rentAmount,
      tenantId: newUnit.tenantId,
      tenantName: newUnit.tenantName,
      notes: newUnit.notes,
      contractStartDate: newUnit.contractStartDate ? new Date(newUnit.contractStartDate) : null,
      contractEndDate: newUnit.contractEndDate ? new Date(newUnit.contractEndDate) : null,
    }
  }
  else {
    form.value = {
      unitId: '',
      unitNumber: '',
      type: FlatType.ONE_BEDUNIT,
      furnishing: Furnishing.UNFURNISHED,
      category: FlatCategory.RESIDENTIAL,
      status: FlatStatus.AVAILABLE,
      isOccupied: false,
      rentAmount: undefined,
      tenantId: undefined,
      tenantName: undefined,
      notes: undefined,
      contractStartDate: null,
      contractEndDate: null,
    }
  }
}, { immediate: true })

watch(() => form.value.status, (newStatus) => {
  form.value.isOccupied = newStatus === FlatStatus.RENTED
}, { immediate: true })

function updateUnitStatus(value: boolean) {
  form.value.isOccupied = value
  form.value.status = value ? FlatStatus.RENTED : FlatStatus.AVAILABLE
}

async function handleSubmit() {
  if (!props.unit) return

  isUpdating.value = true
  try {
    const updatedUnit = {
      _id: props.unit._id,
      unitId: form.value.unitId,
      unitNumber: form.value.unitNumber,
      type: form.value.type,
      furnishing: form.value.furnishing,
      category: form.value.category,
      status: form.value.status,
      isOccupied: form.value.isOccupied,
      rentAmount: form.value.rentAmount,
      tenantId: form.value.tenantId,
      tenantName: form.value.tenantName,
      notes: form.value.notes,
      contractStartDate: form.value.contractStartDate,
      contractEndDate: form.value.contractEndDate,
      floorId: (props.unit as any).floorId || '',
    }
    await $fetch(`/api/properties/update/units/`, {
      method: 'POST',
      body: {
        propertyId: props.propertyId,
        updateType: 'unit',
        action: updatedUnit._id ? 'update' : 'add',
        floorId: (props.unit as any).floorId || '',
        unitId: updatedUnit._id || updatedUnit.unitId,
        unitData: updatedUnit,
      },
    })

    toast.add({
      title: 'Unit Updated',
      description: `Unit ${updatedUnit.unitNumber} has been successfully updated.`,
      color: 'success',
      icon: 'i-lucide-check',
    })

    emit('save', updatedUnit)
    emit('update:open', false)
  }
  catch (error: any) {
    console.error('Failed to update unit:', error)
    toast.add({
      title: 'Error updating unit',
      description: error.message || 'Something went wrong',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    })
  }
  finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <UModal
    :open="props.open"
    :title="props.unit ? `Edit Unit ${props.unit.unitNumber}` : 'Unit Details'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="form"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField
            label="Unit Number"
            name="unitNumber"
          >
            <UInput
              v-model="form.unitNumber"
              placeholder="Unit Number"
              :disabled="isUpdating"
            />
          </UFormField>

          <UFormField
            label="Unit Type"
            name="type"
          >
            <USelect
              v-model="form.type"
              :items="unitTypeOptions"
              placeholder="Select unit type"
              :disabled="isUpdating"
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField
            label="Furnishing"
            name="furnishing"
          >
            <USelect
              v-model="form.furnishing"
              :items="furnishingOptions"
              placeholder="Select furnishing type"
              :disabled="isUpdating"
            />
          </UFormField>

          <UFormField
            label="Category"
            name="category"
          >
            <USelect
              v-model="form.category"
              :items="categoryOptions"
              placeholder="Select category"
              :disabled="isUpdating"
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <UFormField
            label="Status"
            name="status"
          >
            <USelect
              v-model="form.status"
              :items="statusOptions"
              placeholder="Select status"
              :disabled="isUpdating"
            />
          </UFormField>

          <UFormField
            label="Monthly Rent"
            name="rentAmount"
          >
            <UInput
              v-model="form.rentAmount"
              placeholder="0.00"
              type="number"
              min="0"
              step="0.01"
              :disabled="isUpdating || isCaretaker"
            />
            <template
              v-if="isCaretaker"
              #help
            >
              <span class="text-amber-500 text-xs">
                <UIcon
                  name="i-lucide-info"
                  class="mr-1"
                />Only developers can edit the rent amount
              </span>
            </template>
          </UFormField>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
          <UFormField
            label="Unit Occupancy"
            name="isOccupied"
            help="This will be automatically set based on status"
          >
            <USwitch
              v-model="form.isOccupied"
              unchecked-icon="i-lucide-x"
              checked-icon="i-lucide-check"
              :values="{ true: 'Occupied', false: 'Vacant' }"
              size="sm"
              :disabled="isUpdating"
              @update:model-value="(value: boolean) => updateUnitStatus(value)"
            />
          </UFormField>
        </div>

        <!-- <div
          class="grid grid-cols-1 md:grid-cols-2 gap-4"
          :class="{ 'opacity-50': !form.isOccupied }"
        >
          <UFormField
            label="Tenant Name"
            name="tenantName"
            :disabled="!form.isOccupied"
          >
            <UInput
              v-model="form.tenantName"
              placeholder="Tenant Name"
              :disabled="!form.isOccupied || isUpdating"
            />
          </UFormField>

          <div class="space-y-4">
            <UFormField
              label="Contract Start Date"
              name="contractStartDate"
              :disabled="!form.isOccupied"
            >
              <UInput
                :model-value="form.contractStartDate ? form.contractStartDate.toISOString().split('T')[0] : ''"
                type="date"
                :disabled="!form.isOccupied || isUpdating"
                @update:model-value="(val) => form.contractStartDate = val ? new Date(val) : null"
              />
            </UFormField>
          </div>
        </div> -->
        <div class="flex justify-end items-end gap-3">
          <UButton
            color="neutral"
            variant="soft"
            label="Cancel"
            :disabled="isUpdating"
            @click="emit('update:open', false)"
          />
          <UButton
            color="primary"
            label="Save Changes"
            icon="i-lucide-save"
            :loading="isUpdating"
            :disabled="isUpdating || !props.unit"
            type="submit"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
