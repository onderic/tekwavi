<template>
  <div>
    <UModal
      :open="props.isOpen"
      :transition="true"
      fullscreen
      title="Add New Property"
      :close="{ onClick: () => emit('update:isOpen', false) }"
    >
      <template #body>
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-6"
          @submit="addProperty"
        >
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Property Information
              </h3>

              <div class="space-y-4">
                <UFormField
                  label="Property Name"
                  name="propertyName"
                  required
                >
                  <UInput
                    v-model="state.propertyName"
                    placeholder="Enter property name"
                  />
                </UFormField>

                <UFormField
                  label="Category"
                  name="categoryName"
                  required
                >
                  <USelect
                    v-model="state.categoryName"
                    :items="categoryOptions"
                    placeholder="Select property category"
                  />
                </UFormField>

                <UFormField
                  label="Number of Floors"
                  name="floorCount"
                  required
                  description="Floors will be numbered starting from 0"
                >
                  <UInput
                    v-model="state.floorCount"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Enter number of floors"
                  />
                </UFormField>

                <div
                  v-if="state.floorCount > 0"
                  class="mt-2 text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  This will create {{ state.floorCount }} floor{{ state.floorCount > 1 ? 's' : '' }}
                  (Floor 0 to Floor {{ state.floorCount - 1 }})
                </div>
              </div>
            </div>

            <!-- Right: Financial Information -->
            <div>
              <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Financial Information
              </h3>

              <div class="space-y-4">
                <UFormField
                  label="Property Type"
                  name="isExistingProperty"
                >
                  <UCheckbox
                    v-model="state.constructionCost.isExistingProperty"
                    label="This is an existing property"
                  />
                </UFormField>

                <div
                  v-if="state.constructionCost.isExistingProperty"
                  class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <p class="text-sm text-blue-700 dark:text-blue-300">
                    Please provide actual investment costs to track your ROI accurately.
                  </p>
                </div>

                <UFormField
                  :label="state.constructionCost.isExistingProperty ? 'Total Investment Cost' : 'Estimated Construction Cost'"
                  name="totalEstimatedCost"
                  required
                >
                  <UInput
                    v-model="state.constructionCost.totalEstimatedCost"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Enter amount"
                  />
                </UFormField>

                <UFormField
                  :label="state.constructionCost.isExistingProperty ? 'Revenue Generated So Far' : 'Actual Cost Incurred'"
                  name="actualCostIncurred"
                  :required="!state.constructionCost.isExistingProperty"
                >
                  <UInput
                    v-model="state.constructionCost.actualCostIncurred"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Enter amount"
                  />
                </UFormField>

                <div
                  v-if="!state.constructionCost.isExistingProperty"
                  class="grid grid-cols-1 lg:grid-cols-2 gap-6 space-y-4"
                >
                  <UFormField
                    label="Construction Status"
                    name="constructionStatus"
                    required
                  >
                    <USelect
                      v-model="state.constructionCost.constructionStatus"
                      :items="constructionStatusOptions"
                      placeholder="Select status"
                    />
                  </UFormField>

                  <UFormField
                    label="Construction Start Date"
                    name="constructionStartDate"
                  >
                    <UInput
                      v-model="state.constructionCost.constructionStartDate"
                      type="date"
                    />
                  </UFormField>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Address Information
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="md:col-span-2 lg:col-span-3">
                  <UFormField
                    label="Street"
                    name="address.street"
                    required
                  >
                    <UInput
                      v-model="state.address.street"
                      placeholder="Enter street address"
                    />
                  </UFormField>
                </div>

                <UFormField
                  label="City"
                  name="address.city"
                  required
                >
                  <UInput
                    v-model="state.address.city"
                    placeholder="Enter city"
                  />
                </UFormField>

                <UFormField
                  label="State/Province"
                  name="address.state"
                  required
                >
                  <UInput
                    v-model="state.address.state"
                    placeholder="Enter state"
                  />
                </UFormField>

                <UFormField
                  label="Postal Code"
                  name="address.postalCode"
                  required
                >
                  <UInput
                    v-model="state.address.postalCode"
                    placeholder="Enter postal code"
                  />
                </UFormField>

                <div class="md:col-span-2 lg:col-span-1">
                  <UFormField
                    label="Country"
                    name="address.country"
                    required
                  >
                    <UInput
                      v-model="state.address.country"
                      placeholder="Enter country"
                    />
                  </UFormField>
                </div>

                <UFormField
                  label="Latitude (Optional)"
                  name="address.latitude"
                >
                  <UInput
                    v-model="state.address.latitude"
                    placeholder="Latitude"
                    type="number"
                    step="0.000001"
                  />
                </UFormField>

                <UFormField
                  label="Longitude (Optional)"
                  name="address.longitude"
                >
                  <UInput
                    v-model="state.address.longitude"
                    placeholder="Longitude"
                    type="number"
                    step="0.000001"
                  />
                </UFormField>
              </div>
            </div>
            <div>
              <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Property Logo
              </h3>

              <div class="flex items-start gap-6">
                <div class="flex-shrink-0">
                  <div class="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                    <div
                      v-if="logoPreview"
                      class="w-full h-full rounded-lg overflow-hidden"
                    >
                      <img
                        :src="logoPreview"
                        alt="Property logo preview"
                        class="w-full h-full object-cover"
                      >
                    </div>
                    <div
                      v-else
                      class="text-center text-gray-500 dark:text-gray-400"
                    >
                      <UIcon
                        name="i-lucide-image"
                        class="w-8 h-8 mx-auto mb-2"
                      />
                      <p class="text-sm">
                        Logo Preview
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Logo Upload Controls -->
                <div class="flex-1">
                  <UFormField
                    label="Upload Property Logo"
                    name="logo"
                    description="Recommended size: 512x512px. Supported formats: JPG, PNG, SVG"
                  >
                    <input
                      ref="logoInput"
                      type="file"
                      accept="image/*"
                      class="hidden"
                      @change="handleLogoUpload"
                    >
                    <div class="flex gap-3">
                      <UButton
                        variant="outline"
                        icon="i-lucide-upload"
                        @click="logoInput?.click()"
                      >
                        Choose File
                      </UButton>
                      <UButton
                        v-if="logoPreview"
                        variant="ghost"
                        color="error"
                        icon="i-lucide-trash-2"
                        @click="removeLogo"
                      >
                        Remove
                      </UButton>
                    </div>
                  </UFormField>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <UButton
              color="neutral"
              variant="ghost"
              label="Cancel"
              :disabled="isLoading"
              @click="emit('update:isOpen', false)"
            />
            <UButton
              color="primary"
              label="Create Property"
              :loading="isLoading"
              :disabled="isLoading"
              icon="i-lucide-check"
              type="submit"
            />
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { FlatCategory } from '~~/shared/enums/property'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:isOpen', 'property:added'])

const isLoading = ref(false)
const toast = useToast()
const propertyStore = usePropertyStore()
const { fetch } = useUserSession()

const categoryOptions = Object.values(FlatCategory).map(category => ({
  label: category,
  value: category,
}))

const constructionStatusOptions = [
  { label: 'Planning', value: 'planning' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'On Hold', value: 'on_hold' },
]

const schema = z.object({
  propertyName: z.string().min(1, 'Property name is required'),
  categoryName: z.nativeEnum(FlatCategory, {
    message: 'Category is required',
  }),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  floorCount: z.number()
    .min(1, 'At least one floor is required')
    .max(100, 'Maximum 100 floors allowed'),
  constructionCost: z.object({
    isExistingProperty: z.boolean().default(false),
    totalEstimatedCost: z.number().min(0, 'Cost must be positive'),
    actualCostIncurred: z.number().min(0, 'Cost must be positive').optional(),
    constructionStatus: z.enum(['planning', 'in_progress', 'completed', 'on_hold']).default('completed'),
    constructionStartDate: z.string().optional(),
    notes: z.string().optional(),
  }),
})

interface PropertyState {
  propertyName: string
  categoryName: FlatCategory | undefined
  address: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
    latitude?: number
    longitude?: number
  }
  floorCount: number
  constructionCost: {
    isExistingProperty: boolean
    totalEstimatedCost: number
    actualCostIncurred: number
    constructionStatus: 'planning' | 'in_progress' | 'completed' | 'on_hold'
    constructionStartDate: string
    notes: string
  }
}

const state = reactive<PropertyState & { logo?: File }>({
  propertyName: '',
  categoryName: undefined,
  address: {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    latitude: undefined,
    longitude: undefined,
  },
  floorCount: 1,
  constructionCost: {
    isExistingProperty: false,
    totalEstimatedCost: 0,
    actualCostIncurred: 0,
    constructionStatus: 'completed' as 'planning' | 'in_progress' | 'completed' | 'on_hold',
    constructionStartDate: '',
    notes: '',
  },
  logo: undefined,
})

const logoInput = ref<HTMLInputElement>()
const logoPreview = ref<string>('')
const logoFile = ref<File | null>(null)

const handleLogoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.add({
        title: 'Invalid File',
        description: 'Please select an image file',
        color: 'error',
      })
      return
    }

    // Validate file size (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      toast.add({
        title: 'File Too Large',
        description: 'Please select an image smaller than 5MB',
        color: 'error',
      })
      return
    }

    logoFile.value = file
    state.logo = file

    const reader = new FileReader()
    reader.onload = (e) => {
      logoPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const removeLogo = () => {
  logoPreview.value = ''
  logoFile.value = null
  state.logo = undefined
  if (logoInput.value) {
    logoInput.value.value = ''
  }
}

// Reset form when modal opens/closes - include logo reset
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    state.propertyName = ''
    state.categoryName = undefined
    state.address = {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      latitude: undefined,
      longitude: undefined,
    }
    state.floorCount = 1
    state.constructionCost = {
      isExistingProperty: false,
      totalEstimatedCost: 0,
      actualCostIncurred: 0,
      constructionStatus: 'completed' as 'planning' | 'in_progress' | 'completed' | 'on_hold',
      constructionStartDate: '',
      notes: '',
    }
    removeLogo()
  }
})

const addProperty = async (event: FormSubmitEvent<z.infer<typeof schema>>) => {
  try {
    isLoading.value = true

    const propertyResponse = await $fetch('/api/properties/add/property', {
      method: 'POST',
      body: event.data,
    })

    await new Promise(resolve => setTimeout(resolve, 200))
    await fetch()

    if (propertyResponse.property) {
      propertyStore.setCurrentProperty(propertyResponse.property)

      await nextTick()
      navigateTo('/properties')
    }

    toast.add({
      title: 'Success',
      description: propertyResponse.message,
      color: 'success',
      icon: 'i-lucide-check',
    })

    emit('property:added', propertyResponse)
    emit('update:isOpen', false)
  }
  catch (error: any) {
    console.error('Error adding property:', error)
    toast.add({
      title: 'Error',
      description: error.data?.message || error.message || 'Failed to create property',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  }
  finally {
    isLoading.value = false
  }
}
</script>
