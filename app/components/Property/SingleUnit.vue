<template>
  <UModal
    :open="open"
    :title="`Edit Unit ${unit?.unitNumber || ''}`"
    @update:open="$emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="form"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 class="text-lg font-medium">
              Unit Details
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Update the unit information below
            </p>
          </div>
          <UBadge
            v-if="form.isOccupied"
            color="warning"
            variant="soft"
          >
            Occupied
          </UBadge>
        </div>

        <UAlert
          v-if="form.isOccupied"
          icon="i-lucide-info"
          color="secondary"
          variant="subtle"
          title="Unit is occupied"
          description="Some fields cannot be edited while the unit has a tenant."
        />

        <UFormField
          label="Unit Number"
          name="unitNumber"
          required
        >
          <UInput
            v-model="form.unitNumber"
            placeholder="e.g., A101"
            :disabled="loading || form.isOccupied"
            icon="i-lucide-hash"
          />
        </UFormField>

        <!-- Unit Type and Furnishing -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Unit Type"
            name="type"
          >
            <USelect
              v-model="form.type"
              :items="flatTypeOptions"
              placeholder="Select type"
              :disabled="loading"
              icon="i-lucide-home"
            />
          </UFormField>

          <UFormField
            label="Furnishing"
            name="furnishing"
          >
            <USelect
              v-model="form.furnishing"
              :items="furnishingOptions"
              placeholder="Select furnishing"
              :disabled="loading"
              icon="i-lucide-sofa"
            />
          </UFormField>
        </div>

        <!-- Category and Status -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Category"
            name="category"
          >
            <USelect
              v-model="form.category"
              :items="categoryOptions"
              placeholder="Select category"
              :disabled="loading"
              icon="i-lucide-tag"
            />
          </UFormField>

          <UFormField
            label="Status"
            name="status"
          >
            <USelect
              v-model="form.status"
              :items="statusOptions"
              placeholder="Select status"
              :disabled="loading || form.isOccupied"
              icon="i-lucide-circle-dot"
            />
          </UFormField>
        </div>

        <!-- Rent Amount -->
        <UFormField
          label="Rent Amount"
          name="rentAmount"
        >
          <UInput
            v-model.number="form.rentAmount"
            type="number"
            min="0"
            step="100"
            placeholder="0"
            :disabled="loading"
            icon="i-lucide-banknote"
          >
            <template #trailing>
              <span class="text-gray-500 dark:text-gray-400 text-xs">KES/month</span>
            </template>
          </UInput>
        </UFormField>

        <UFormField
          label="Occupancy"
          name="isOccupied"
        >
          <div class="flex items-center justify-between">
            <USwitch
              v-model="form.isOccupied"
              :disabled="!!unit?.tenantId"
            />
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ form.isOccupied ? 'Occupied' : 'Vacant' }}
            </span>
          </div>
        </UFormField>
        <div
          v-if="unit?.tenantId"
          class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
        >
          <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <UIcon
              name="i-lucide-user"
              class="text-gray-400"
            />
            <span>This unit has an active tenant</span>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            label="Cancel"
            :disabled="loading"
            @click="handleCancel()"
          />
          <UButton
            type="submit"
            color="primary"
            label="Save Changes"
            icon="i-lucide-save"
            :loading="loading"
            :disabled="!hasChanges"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { FlatStatus, FlatType, Furnishing, FlatCategory } from '~~/shared/enums/property'
import type { Unit } from '~/types/property'

interface Props {
  open: boolean
  unit: Unit | null
  propertyId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': []
}>()

const toast = useToast()
const loading = ref(false)

const form = ref({
  unitNumber: '',
  type: FlatType.ONE_BEDUNIT,
  furnishing: Furnishing.UNFURNISHED,
  category: FlatCategory.RESIDENTIAL,
  status: FlatStatus.AVAILABLE,
  isOccupied: false,
  rentAmount: 0,
})

const originalForm = ref('')

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
  unitNumber: z.string().min(1, 'Unit number is required'),
  type: z.nativeEnum(FlatType).optional(),
  furnishing: z.nativeEnum(Furnishing).optional(),
  category: z.nativeEnum(FlatCategory).optional(),
  status: z.nativeEnum(FlatStatus),
  isOccupied: z.boolean().default(false),
  rentAmount: z.number().nonnegative('Rent cannot be negative').optional(),
})

const hasChanges = computed(() => {
  return JSON.stringify(form.value) !== originalForm.value
})

watch(() => props.unit, (newUnit) => {
  if (newUnit) {
    form.value = {
      unitNumber: newUnit.unitNumber || '',
      type: newUnit.type as FlatType || FlatType.ONE_BEDUNIT,
      furnishing: newUnit.furnishing as Furnishing || Furnishing.UNFURNISHED,
      category: newUnit.category as FlatCategory || FlatCategory.RESIDENTIAL,
      status: newUnit.status as FlatStatus || FlatStatus.AVAILABLE,
      isOccupied: newUnit.isOccupied || false,
      rentAmount: newUnit.rentAmount || 0,
    }
    originalForm.value = JSON.stringify(form.value)
  }
}, { immediate: true })

watch(() => form.value.isOccupied, (isOccupied) => {
  if (!props.unit?.tenantId) {
    form.value.status = isOccupied ? FlatStatus.RENTED : FlatStatus.AVAILABLE
  }
})

const handleCancel = () => {
  emit('update:open', false)
}

const handleSubmit = async () => {
  if (!props.unit?._id) {
    toast.add({
      title: 'Error',
      description: 'No unit selected for editing',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    })
    return
  }

  try {
    loading.value = true

    await $fetch('/api/properties/update/single', {
      method: 'POST',
      body: {
        unitId: props.unit._id,
        ...form.value,
      },
    })

    toast.add({
      title: 'Success',
      description: 'Unit updated successfully',
      color: 'success',
      icon: 'i-lucide-check',
    })

    emit('save')
    emit('update:open', false)
  }
  catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message || error.message || 'Failed to update unit',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    })
  }
  finally {
    loading.value = false
  }
}
</script>
