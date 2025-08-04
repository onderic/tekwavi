<script setup lang="ts">
import { z } from 'zod'
import type { Property } from '~/types/property'
import { FlatCategory } from '~/types/property'

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
  }
  else {
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
  }
}, { immediate: true })

const handleSubmit = async () => {
  if (!props.property) return

  isSubmitting.value = true

  try {
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
      description: error.message || 'Something went wrong while updating property details.',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    })
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal
    :open="props.open"
    :title="props.property ? `Edit ${props.property.propertyName}` : 'Property Details'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="form"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <UFormField
          label="Property Name"
          name="propertyName"
        >
          <UInput
            v-model="form.propertyName"
            placeholder="Property Name"
            :disabled="isSubmitting"
          />
        </UFormField>

        <UFormField
          label="Property Category"
          name="categoryName"
        >
          <USelect
            v-model="form.categoryName"
            :items="categoryOptions"
            placeholder="Select property category"
            :disabled="isSubmitting"
            class="w-full"
          />
        </UFormField>

        <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Address Details
          </h3>

          <div class="grid grid-cols-1 gap-4">
            <UFormField
              label="Street"
              name="address.street"
            >
              <UInput
                v-model="form.address.street"
                placeholder="Street Address"
                :disabled="isSubmitting"
              />
            </UFormField>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField
                label="City"
                name="address.city"
              >
                <UInput
                  v-model="form.address.city"
                  placeholder="City"
                  :disabled="isSubmitting"
                />
              </UFormField>

              <UFormField
                label="State/Province"
                name="address.state"
              >
                <UInput
                  v-model="form.address.state"
                  placeholder="State/Province"
                  :disabled="isSubmitting"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField
                label="Postal Code"
                name="address.postalCode"
              >
                <UInput
                  v-model="form.address.postalCode"
                  placeholder="Postal Code"
                  :disabled="isSubmitting"
                />
              </UFormField>

              <UFormField
                label="Country"
                name="address.country"
              >
                <UInput
                  v-model="form.address.country"
                  placeholder="Country"
                  :disabled="isSubmitting"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Construction Cost Details
          </h3>

          <div class="grid grid-cols-1 gap-4">
            <UFormField
              label="Is Existing Property"
              name="constructionCost.isExistingProperty"
            >
              <UCheckbox
                v-model="form.constructionCost.isExistingProperty"
                label="This is an existing property (not newly constructed)"
                :disabled="isSubmitting"
              />
            </UFormField>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField
                label="Total Estimated Cost"
                name="constructionCost.totalEstimatedCost"
              >
                <UInput
                  v-model.number="form.constructionCost.totalEstimatedCost"
                  type="number"
                  placeholder="0"
                  :disabled="isSubmitting"
                />
              </UFormField>

              <UFormField
                label="Actual Cost Incurred"
                name="constructionCost.actualCostIncurred"
              >
                <UInput
                  v-model.number="form.constructionCost.actualCostIncurred"
                  type="number"
                  placeholder="0"
                  :disabled="isSubmitting"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UFormField
                label="Construction Status"
                name="constructionCost.constructionStatus"
              >
                <USelect
                  v-model="form.constructionCost.constructionStatus"
                  :items="[
                    { label: 'Planning', value: 'planning' },
                    { label: 'In Progress', value: 'in_progress' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'On Hold', value: 'on_hold' },
                  ]"
                  placeholder="Select status"
                  :disabled="isSubmitting"
                />
              </UFormField>

              <UFormField
                label="Currency"
                name="constructionCost.currency"
              >
                <USelect
                  v-model="form.constructionCost.currency"
                  :items="[
                    { label: 'KES', value: 'KES' },

                  ]"
                  placeholder="Select currency"
                  :disabled="isSubmitting"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <UFormField
                label="Construction End Date"
                name="constructionCost.constructionEndDate"
              >
                <UInput
                  v-model="form.constructionCost.constructionEndDate"
                  type="date"
                  :disabled="isSubmitting"
                />
              </UFormField>
            </div>

            <!-- <UFormField
              label="Notes"
              name="constructionCost.notes"
            >
              <UTextarea
                v-model="form.constructionCost.notes"
                placeholder="Additional notes about construction costs..."
                :disabled="isSubmitting"
              />
            </UFormField> -->
          </div>
        </div>

        <div class="flex justify-end items-end gap-3 pt-4">
          <UButton
            color="neutral"
            variant="soft"
            label="Cancel"
            :disabled="isSubmitting"
            @click="emit('update:open', false)"
          />
          <UButton
            color="primary"
            label="Save Changes"
            icon="i-lucide-save"
            :loading="isSubmitting"
            :disabled="isSubmitting || !props.property"
            type="submit"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
