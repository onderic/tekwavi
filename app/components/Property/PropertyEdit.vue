<template>
  <UModal
    :open="props.open"
    :transition="true"
    fullscreen
    :title="props.property ? `Edit ${props.property.propertyName}` : 'Property Details'"
    :close="{ onClick: () => emit('update:open', false) }"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="form"
        class="space-y-6 max-w-7xl mx-auto"
        @submit="handleSubmit"
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
                  v-model="form.propertyName"
                  placeholder="Enter property name"
                  :disabled="isSubmitting"
                />
              </UFormField>

              <UFormField
                label="Category"
                name="categoryName"
                required
              >
                <USelect
                  v-model="form.categoryName"
                  :items="categoryOptions"
                  placeholder="Select property category"
                  :disabled="isSubmitting"
                />
              </UFormField>
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
                name="constructionCost.isExistingProperty"
              >
                <UCheckbox
                  v-model="form.constructionCost.isExistingProperty"
                  label="This is an existing property"
                  :disabled="isSubmitting"
                />
              </UFormField>

              <div
                v-if="form.constructionCost.isExistingProperty"
                class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <p class="text-sm text-blue-700 dark:text-blue-300">
                  Please provide actual investment costs to track your ROI accurately.
                </p>
              </div>

              <UFormField
                :label="form.constructionCost.isExistingProperty ? 'Total Investment Cost' : 'Estimated Construction Cost'"
                name="constructionCost.totalEstimatedCost"
                required
              >
                <UInput
                  v-model.number="form.constructionCost.totalEstimatedCost"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Enter amount"
                  :disabled="isSubmitting"
                />
              </UFormField>

              <UFormField
                :label="form.constructionCost.isExistingProperty ? 'Revenue Generated So Far' : 'Actual Cost Incurred'"
                name="constructionCost.actualCostIncurred"
                :required="!form.constructionCost.isExistingProperty"
              >
                <UInput
                  v-model.number="form.constructionCost.actualCostIncurred"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Enter amount"
                  :disabled="isSubmitting"
                />
              </UFormField>

              <div
                v-if="!form.constructionCost.isExistingProperty"
                class="grid grid-cols-1 lg:grid-cols-2 gap-6 space-y-4"
              >
                <UFormField
                  label="Construction Status"
                  name="constructionCost.constructionStatus"
                  required
                >
                  <USelect
                    v-model="form.constructionCost.constructionStatus"
                    :items="constructionStatusOptions"
                    placeholder="Select status"
                    :disabled="isSubmitting"
                  />
                </UFormField>

                <UFormField
                  label="Construction Start Date"
                  name="constructionCost.constructionStartDate"
                >
                  <UInput
                    v-model="form.constructionCost.constructionStartDate"
                    type="date"
                    :disabled="isSubmitting"
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
                    v-model="form.address.street"
                    placeholder="Enter street address"
                    :disabled="isSubmitting"
                  />
                </UFormField>
              </div>

              <UFormField
                label="City"
                name="address.city"
                required
              >
                <UInput
                  v-model="form.address.city"
                  placeholder="Enter city"
                  :disabled="isSubmitting"
                />
              </UFormField>

              <UFormField
                label="State/Province"
                name="address.state"
                required
              >
                <UInput
                  v-model="form.address.state"
                  placeholder="Enter state"
                  :disabled="isSubmitting"
                />
              </UFormField>

              <UFormField
                label="Postal Code"
                name="address.postalCode"
                required
              >
                <UInput
                  v-model="form.address.postalCode"
                  placeholder="Enter postal code"
                  :disabled="isSubmitting"
                />
              </UFormField>

              <div class="md:col-span-2 lg:col-span-1">
                <UFormField
                  label="Country"
                  name="address.country"
                  required
                >
                  <UInput
                    v-model="form.address.country"
                    placeholder="Enter country"
                    :disabled="isSubmitting"
                  />
                </UFormField>
              </div>

              <UFormField
                label="Latitude (Optional)"
                name="address.latitude"
              >
                <UInput
                  v-model.number="form.address.latitude"
                  placeholder="Latitude"
                  type="number"
                  step="0.000001"
                  :disabled="isSubmitting"
                />
              </UFormField>

              <UFormField
                label="Longitude (Optional)"
                name="address.longitude"
              >
                <UInput
                  v-model.number="form.address.longitude"
                  placeholder="Longitude"
                  type="number"
                  step="0.000001"
                  :disabled="isSubmitting"
                />
              </UFormField>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Property Logo
            </h3>

            <div class="flex items-start gap-6">
              <!-- Logo Preview -->
              <div class="flex-shrink-0">
                <div class="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                  <div
                    v-if="logoPreview || existingLogoUrl"
                    class="w-full h-full rounded-lg overflow-hidden"
                  >
                    <img
                      :src="displayLogoUrl"
                      alt="Property logo preview"
                      class="w-full h-full object-cover"
                      @error="onImageError"
                      @load="onImageLoad"
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
                  description="Recommended size: 512x512px. Max file size: 1MB. Supported formats: JPG, PNG, SVG"
                >
                  <input
                    ref="logoInput"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    :disabled="isSubmitting"
                    @change="handleLogoUpload"
                  >
                  <div class="flex gap-3">
                    <UButton
                      variant="outline"
                      icon="i-lucide-upload"
                      :disabled="isSubmitting"
                      @click="logoInput?.click()"
                    >
                      {{ existingLogoUrl || logoPreview ? 'Change Logo' : 'Choose File' }}
                    </UButton>
                    <UButton
                      v-if="logoPreview || existingLogoUrl"
                      variant="ghost"
                      color="error"
                      icon="i-lucide-trash-2"
                      :disabled="isSubmitting"
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
            :disabled="isSubmitting"
            @click="emit('update:open', false)"
          />
          <UButton
            color="primary"
            label="Save Changes"
            :loading="isSubmitting"
            :disabled="isSubmitting || !props.property"
            icon="i-lucide-save"
            type="submit"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { Property } from '~/types/property'
import { FlatCategory } from '~/types/property'

const config = useRuntimeConfig()
const APP_URL = config.public.APP_URL || 'http://localhost:3000'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  property: {
    type: Object as PropType<Property | null>,
    default: null,
  },
})

const isSubmitting = ref(false)
const toast = useToast()

const emit = defineEmits(['update:open', 'save'])

const schema = z.object({
  propertyName: z.string().min(1, 'Property name is required'),
  categoryName: z.nativeEnum(FlatCategory),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  constructionCost: z.object({
    totalEstimatedCost: z.number().min(0, 'Estimated cost must be positive').optional(),
    actualCostIncurred: z.number().min(0, 'Actual cost must be positive').optional(),
    isExistingProperty: z.boolean().optional(),
    constructionStartDate: z.string().optional(),
    constructionEndDate: z.string().optional(),
    constructionStatus: z.enum(['planning', 'in_progress', 'completed', 'on_hold']).optional(),
    currency: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
})

const categoryOptions = Object.entries(FlatCategory).map(([_, value]) => ({
  label: value,
  value,
}))

const constructionStatusOptions = [
  { label: 'Planning', value: 'planning' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'On Hold', value: 'on_hold' },
]

const form = ref({
  propertyName: '',
  categoryName: FlatCategory.COMMERCIAL,
  address: {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  },
  constructionCost: {
    totalEstimatedCost: 0,
    actualCostIncurred: 0,
    isExistingProperty: false,
    constructionStartDate: '',
    constructionEndDate: '',
    constructionStatus: 'completed' as 'planning' | 'in_progress' | 'completed' | 'on_hold',
    currency: 'KES',
    notes: '',
  },
})

const logoInput = ref<HTMLInputElement>()
const logoPreview = ref<string>('')
const logoFile = ref<File | null>(null)
const existingLogoUrl = ref<string>('')
const logoToRemove = ref<boolean>(false)
const imageError = ref<boolean>(false)

// Computed full logo URL for display
const displayLogoUrl = computed(() => {
  const url = logoPreview.value || existingLogoUrl.value
  if (!url) return ''
  if (url.startsWith('http')) return url
  return url.startsWith('/') ? `${APP_URL}${url}` : `${APP_URL}/${url}`
})

const onImageError = (event: Event) => {
  console.error('Failed to load logo image:', event)
  imageError.value = true
  toast.add({
    title: 'Image Load Error',
    description: 'Failed to load the logo image. Please check the file and try again.',
    color: 'error',
  })
}

const onImageLoad = () => {
  imageError.value = false
  console.log('Logo image loaded successfully')
}

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
        description: 'Please select an image smaller than 1MB',
        color: 'error',
      })
      return
    }

    logoFile.value = file
    logoToRemove.value = false

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
  logoToRemove.value = true
  if (logoInput.value) {
    logoInput.value.value = ''
  }
}

watch(() => props.property, (newProperty) => {
  if (newProperty) {
    form.value = {
      propertyName: newProperty.propertyName || '',
      categoryName: newProperty.categoryName || FlatCategory.COMMERCIAL,
      address: {
        street: newProperty.address?.street || '',
        city: newProperty.address?.city || '',
        state: newProperty.address?.state || '',
        postalCode: newProperty.address?.postalCode || '',
        country: newProperty.address?.country || '',
        latitude: newProperty.address?.latitude,
        longitude: newProperty.address?.longitude,
      },
      constructionCost: {
        totalEstimatedCost: (newProperty as any).constructionCost?.totalEstimatedCost || 0,
        actualCostIncurred: (newProperty as any).constructionCost?.actualCostIncurred || 0,
        isExistingProperty: (newProperty as any).constructionCost?.isExistingProperty || false,
        constructionStartDate: (newProperty as any).constructionCost?.constructionStartDate || '',
        constructionEndDate: (newProperty as any).constructionCost?.constructionEndDate || '',
        constructionStatus: (newProperty as any).constructionCost?.constructionStatus || 'completed',
        currency: (newProperty as any).constructionCost?.currency || 'KES',
        notes: (newProperty as any).constructionCost?.notes || '',
      },
    }

    // Set existing logo
    existingLogoUrl.value = (newProperty as any).logo || ''
    logoPreview.value = ''
    logoFile.value = null
    logoToRemove.value = false
  }
  else {
    // Reset form
    form.value = {
      propertyName: '',
      categoryName: FlatCategory.COMMERCIAL,
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        latitude: undefined,
        longitude: undefined,
      },
      constructionCost: {
        totalEstimatedCost: 0,
        actualCostIncurred: 0,
        isExistingProperty: false,
        constructionStartDate: '',
        constructionEndDate: '',
        constructionStatus: 'completed',
        currency: 'KES',
        notes: '',
      },
    }

    existingLogoUrl.value = ''
    logoPreview.value = ''
    logoFile.value = null
    logoToRemove.value = false
  }
}, { immediate: true })

const handleSubmit = async () => {
  if (!props.property) return

  isSubmitting.value = true

  try {
    if (logoFile.value || logoToRemove.value) {
      // Create FormData for file upload or logo removal
      const formData = new FormData()
      formData.append('propertyId', props.property._id!)
      formData.append('propertyData', JSON.stringify({
        propertyName: form.value.propertyName,
        categoryName: form.value.categoryName,
        address: form.value.address,
        constructionCost: {
          totalEstimatedCost: form.value.constructionCost.totalEstimatedCost,
          actualCostIncurred: form.value.constructionCost.actualCostIncurred,
          isExistingProperty: form.value.constructionCost.isExistingProperty,
          constructionStartDate: form.value.constructionCost.constructionStartDate || undefined,
          constructionEndDate: form.value.constructionCost.constructionEndDate || undefined,
          constructionStatus: form.value.constructionCost.constructionStatus,
          currency: form.value.constructionCost.currency,
          notes: form.value.constructionCost.notes,
          lastUpdated: new Date(),
        },
      }))

      if (logoFile.value) {
        formData.append('logo', logoFile.value)
      }

      await $fetch('/api/properties/update', {
        method: 'POST',
        body: formData,
      })
    }
    else {
      // Send regular JSON if no logo changes
      await $fetch('/api/properties/update', {
        method: 'POST',
        body: {
          propertyId: props.property._id,
          propertyData: {
            propertyName: form.value.propertyName,
            categoryName: form.value.categoryName,
            address: form.value.address,
            constructionCost: {
              totalEstimatedCost: form.value.constructionCost.totalEstimatedCost,
              actualCostIncurred: form.value.constructionCost.actualCostIncurred,
              isExistingProperty: form.value.constructionCost.isExistingProperty,
              constructionStartDate: form.value.constructionCost.constructionStartDate || undefined,
              constructionEndDate: form.value.constructionCost.constructionEndDate || undefined,
              constructionStatus: form.value.constructionCost.constructionStatus,
              currency: form.value.constructionCost.currency,
              notes: form.value.constructionCost.notes,
              lastUpdated: new Date(),
            },
          },
        },
      })
    }

    toast.add({
      title: 'Property Updated',
      description: 'Property details have been successfully updated.',
      color: 'success',
      icon: 'i-lucide-check',
    })

    emit('save')
    emit('update:open', false)
  }
  catch (error: any) {
    console.error('Failed to update property:', error)
    toast.add({
      title: 'Update Failed',
      description: error.data?.message || error.message || 'Something went wrong while updating property details.',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    })
  }
  finally {
    isSubmitting.value = false
  }
}
</script>
