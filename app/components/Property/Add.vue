<template>
  <div>
    <UModal
      :open="props.isOpen"
      :transition="true"
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
          <!-- Basic Property Information -->
          <div>
            <h3 class="text-lg font-semibold mb-4">
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
            </div>
          </div>

          <!-- Address Information -->
          <div>
            <h3 class="text-lg font-semibold mb-4">
              Address
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Enter state or province"
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

              <div>
                <UFormField
                  label="Coordinates (Optional)"
                  name="coordinates"
                >
                  <div class="grid grid-cols-2 gap-2">
                    <UInput
                      v-model="state.address.latitude"
                      placeholder="Latitude"
                      type="number"
                      step="0.000001"
                    />
                    <UInput
                      v-model="state.address.longitude"
                      placeholder="Longitude"
                      type="number"
                      step="0.000001"
                    />
                  </div>
                </UFormField>
              </div>
            </div>
          </div>

          <!-- Floor Configuration -->
          <div>
            <h3 class="text-lg font-semibold mb-4">
              Floor Configuration
            </h3>

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
              class="mt-2 text-sm text-gray-600 dark:text-gray-400"
            >
              This will create {{ state.floorCount }} floor{{ state.floorCount > 1 ? 's' : '' }}
              (Floor 0 to Floor {{ state.floorCount - 1 }})
            </div>
          </div>

          <!-- Construction Cost Information -->
          <div>
            <h3 class="text-lg font-semibold mb-4">
              Construction Cost Information
            </h3>

            <div class="space-y-4">
              <UFormField
                label="Is this an existing property?"
                name="isExistingProperty"
              >
                <UCheckbox
                  v-model="state.constructionCost.isExistingProperty"
                  label="Yes, this property already exists"
                />
              </UFormField>

              <div
                v-if="state.constructionCost.isExistingProperty"
                class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              >
                <p class="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Since this is an existing property, please provide the actual cost information to accurately track your investment.
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div
                v-if="!state.constructionCost.isExistingProperty"
                class="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <UFormField
                  label="Construction Status"
                  name="constructionStatus"
                  required
                >
                  <USelect
                    v-model="state.constructionCost.constructionStatus"
                    :items="constructionStatusOptions"
                    placeholder="Select construction status"
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

              <!-- <UFormField
                label="Additional Notes"
                name="notes"
              >
                <UInput
                  v-model="state.constructionCost.notes"
                  placeholder="Any additional information about construction costs or investment"
                />
              </UFormField> -->
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4">
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
    required_error: 'Category is required',
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

const state = reactive<PropertyState>({
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
})

// Reset form when modal opens/closes
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
