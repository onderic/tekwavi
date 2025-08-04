<script setup lang="ts">
import { z } from 'zod'
import type { Maintenance } from '~/types/maintenance'
import { MaintenanceStatus, MaintenancePriority, MaintenanceCategory } from '~/types/maintenance'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  open: {
    type: Boolean,
    default: false,
  },
  unitsData: {
    type: Object,
    default: () => ({ data: [] }),
  },
})

const { user } = useUserSession()

const emit = defineEmits(['submit', 'update:open'])

const schema = z.object({
  title: z.string().min(3, 'Please enter a title for the request'),
  description: z.string().min(10, 'Please provide more details about the issue'),
  category: z.nativeEnum(MaintenanceCategory),
  priority: z.nativeEnum(MaintenancePriority),
  propertyId: z.string().min(1, 'Please select a property'),
  floorId: z.string().optional(),
  unitId: z.string().min(1, 'Please select a unit'),
  media: z.array(z.any()).optional(),
})

type FormState = z.infer<typeof schema>

const form = ref<FormState>({
  title: '',
  description: '',
  category: MaintenanceCategory.OTHER,
  priority: MaintenancePriority.MEDIUM,
  propertyId: '',
  floorId: '',
  unitId: '',
  media: [],
})

const propertyOptions = computed(() => {
  if (!props.unitsData?.data) return []

  const properties = props.unitsData.data
  return properties.map((property: any) => ({
    label: property.name,
    value: property.propertyId,
  }))
})

const unitOptions = computed(() => {
  if (!props.unitsData?.data || !form.value.propertyId) return []

  const selectedProperty = props.unitsData.data.find(
    (property: any) => property.propertyId === form.value.propertyId,
  )

  if (!selectedProperty?.units) return []

  return selectedProperty.units.map((unit: any) => ({
    label: `Unit ${unit.unitNumber} (${unit.floorNumber}${getFloorSuffix(unit.floorNumber)} Floor)`,
    value: unit.unitId,
    floorId: unit.floorId,
  }))
})

const selectedPropertyName = computed(() => {
  if (!props.unitsData?.data || !form.value.propertyId) return ''

  const property = props.unitsData.data.find((p: any) => p.propertyId === form.value.propertyId)
  return property?.name || ''
})

const selectedUnitInfo = computed(() => {
  if (!props.unitsData?.data || !form.value.propertyId || !form.value.unitId) return null

  const property = props.unitsData.data.find((p: any) => p.propertyId === form.value.propertyId)
  if (!property?.units) return null

  return property.units.find((unit: any) => unit.unitId === form.value.unitId)
})

function getFloorSuffix(floor: number): string {
  if (floor === 1) return 'st'
  if (floor === 2) return 'nd'
  if (floor === 3) return 'rd'
  return 'th'
}

// Watch for when properties are loaded and auto-select first one
watch(() => propertyOptions.value, (options) => {
  if (options.length > 0 && !form.value.propertyId) {
    form.value.propertyId = options[0].value
  }
})

// Watch for when units are loaded and auto-select first one
watch(() => unitOptions.value, (options) => {
  if (options.length > 0 && !form.value.unitId) {
    form.value.unitId = options[0].value
    form.value.floorId = options[0].floorId
  }
})

watch(() => form.value.propertyId, (newPropertyId) => {
  if (newPropertyId) {
    form.value.unitId = ''
    form.value.floorId = ''
  }
})

watch(() => form.value.unitId, (newUnitId) => {
  if (newUnitId && selectedUnitInfo.value) {
    form.value.floorId = selectedUnitInfo.value.floorId
  }
})

const categoryOptions = [
  { label: 'Plumbing', value: MaintenanceCategory.PLUMBING },
  { label: 'Electrical', value: MaintenanceCategory.ELECTRICAL },
  { label: 'Structural', value: MaintenanceCategory.STRUCTURAL },
  { label: 'Appliance', value: MaintenanceCategory.APPLIANCE },
  { label: 'Heating/Cooling', value: MaintenanceCategory.HEATING_COOLING },
  { label: 'General', value: MaintenanceCategory.GENERAL },
  { label: 'Other', value: MaintenanceCategory.OTHER },
]

const priorityOptions = [
  { label: 'Low', value: MaintenancePriority.LOW, icon: 'i-lucide-arrow-down', color: 'blue' },
  { label: 'Medium', value: MaintenancePriority.MEDIUM, icon: 'i-lucide-minus', color: 'yellow' },
  { label: 'High', value: MaintenancePriority.HIGH, icon: 'i-lucide-arrow-up', color: 'orange' },
  { label: 'Urgent', value: MaintenancePriority.URGENT, icon: 'i-lucide-alert-triangle', color: 'red' },
]

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    // Reset form
    form.value = {
      title: '',
      description: '',
      category: MaintenanceCategory.OTHER,
      priority: MaintenancePriority.MEDIUM,
      propertyId: '',
      floorId: '',
      unitId: '',
      media: [],
    }
    uploadedFiles.value = []

    // Auto-select first property if available
    if (propertyOptions.value.length > 0) {
      form.value.propertyId = propertyOptions.value[0].value
    }
  }
})

const fileInput = ref<HTMLInputElement | null>(null)
const uploadedFiles = ref<File[]>([])

function triggerFileInput() {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.length) {
    const newFiles = Array.from(input.files)
    uploadedFiles.value = [...uploadedFiles.value, ...newFiles]
    form.value.media = uploadedFiles.value
  }
}

function removeFile(index: number) {
  uploadedFiles.value.splice(index, 1)
  form.value.media = uploadedFiles.value
}

function handleSubmit() {
  if (!user.value || !selectedUnitInfo.value) return

  const maintenanceRequest: Partial<Maintenance> = {
    title: form.value.title,
    description: form.value.description,
    category: form.value.category,
    priority: form.value.priority,
    propertyId: form.value.propertyId,
    propertyName: selectedPropertyName.value,
    floorId: form.value.floorId,
    unitId: form.value.unitId,
    unitNumber: selectedUnitInfo.value.unitNumber,
    status: MaintenanceStatus.PENDING,
    requestedBy: user.value._id,
    requestedByName: `${user.value.first_name} ${user.value.last_name || ''}`.trim(),
    submittedDate: new Date().toISOString(),
    notes: [],
  }

  emit('submit', maintenanceRequest, uploadedFiles.value)
}

function formatPriority(priority: MaintenancePriority) {
  const option = priorityOptions.find(opt => opt.value === priority)
  return {
    label: option?.label || 'Unknown',
    icon: option?.icon || '',
    color: option?.color || 'gray',
  }
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Submit Maintenance Request"
    description="Please provide details about the maintenance issue"
    :close="{ onClick: () => emit('update:open', false),
              color: 'primary',
              variant: 'outline',
              class: 'rounded-full' }"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="form"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <div class="space-y-4">
          <UFormField
            label="Title"
            name="title"
            help="Brief description of the issue"
          >
            <UInput
              v-model="form.title"
              placeholder="E.g., Leaking Faucet"
              autocomplete="off"
              :disabled="props.loading"
            />
          </UFormField>

          <UFormField
            label="Description"
            name="description"
            help="Please provide detailed information about the issue"
          >
            <UTextarea
              v-model="form.description"
              placeholder="Please describe the problem in detail. Include when you first noticed it, any symptoms, and how it affects your living space."
              :rows="4"
              :disabled="props.loading"
              class="resize-none w-full"
            />
          </UFormField>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField
              label="Property"
              name="propertyId"
              required
            >
              <USelect
                v-model="form.propertyId"
                :items="propertyOptions"
                placeholder="Select a property"
                :disabled="props.loading"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Unit"
              name="unitId"
              required
            >
              <USelect
                v-model="form.unitId"
                :items="unitOptions"
                placeholder="Select a unit"
                :disabled="props.loading || !form.propertyId"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField
              label="Category"
              name="category"
            >
              <USelect
                v-model="form.category"
                class="w-full"
                :items="categoryOptions"
                placeholder="Select category"
                :disabled="props.loading"
              />
            </UFormField>

            <UFormField
              label="Priority"
              name="priority"
            >
              <USelect
                v-model="form.priority"
                class="w-full"
                :items="priorityOptions"
                placeholder="Select priority"
                :disabled="props.loading"
              >
                <template #item="{ item }">
                  <div class="flex items-center gap-2">
                    <UIcon
                      :name="item.icon"
                      :class="`text-${item.color}-500`"
                    />
                    <span>{{ item.label }}</span>
                  </div>
                </template>
              </USelect>
            </UFormField>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Upload Photos (Optional)
            </label>

            <div class="border-2 border-dashed dark:border-gray-700 rounded-lg p-4 text-center">
              <input
                ref="fileInput"
                type="file"
                multiple
                accept="image/*"
                class="hidden"
                @change="onFileChange"
              >

              <UButton
                type="button"
                variant="outline"
                icon="i-lucide-upload"
                class="mb-2"
                :disabled="props.loading"
                @click="triggerFileInput"
              >
                Upload Images
              </UButton>

              <p class="text-xs text-gray-500">
                JPG, PNG or GIF, up to 5MB each
              </p>
            </div>

            <!-- Show uploaded files -->
            <div
              v-if="uploadedFiles.length"
              class="mt-3"
            >
              <p class="text-sm font-medium mb-2">
                Uploaded Files ({{ uploadedFiles.length }})
              </p>
              <ul class="space-y-1">
                <li
                  v-for="(file, index) in uploadedFiles"
                  :key="index"
                  class="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded"
                >
                  <div class="flex items-center">
                    <UIcon
                      name="i-lucide-image"
                      class="mr-2"
                    />
                    <span class="text-sm truncate max-w-56">{{ file.name }}</span>
                  </div>
                  <UButton
                    color="error"
                    variant="ghost"
                    icon="i-lucide-x"
                    size="xs"
                    :disabled="props.loading"
                    @click="removeFile(index)"
                  />
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center border-t dark:border-gray-700 pt-4 mt-4">
          <div>
            <p class="text-sm font-medium">
              Current Priority:
            </p>
            <UBadge
              class="capitalize mt-1"
            >
              <UIcon
                :name="formatPriority(form.priority).icon"
                class="mr-1"
              />
              {{ formatPriority(form.priority).label }}
            </UBadge>
          </div>

          <div class="flex gap-3">
            <UButton
              type="button"
              label="Cancel"
              color="neutral"
              variant="outline"
              :disabled="props.loading"
              @click="emit('update:open', false)"
            />
            <UButton
              type="submit"
              color="primary"
              icon="i-lucide-check"
              :loading="props.loading"
              :disabled="props.loading || !form.propertyId || !form.unitId"
            >
              {{ props.loading ? 'Submitting...' : 'Submit Request' }}
            </UButton>
          </div>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
