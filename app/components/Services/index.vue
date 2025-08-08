<template>
  <UModal
    :open="props.open"
    :title="isEditMode ? 'Edit Service' : 'Add Property Service'"
    :description="isEditMode ? 'Update the service details' : 'Add a new service to this property'"
    :close="{ onClick: () => emit('update:open', false),
              color: 'primary',
              variant: 'outline',
              class: 'rounded-full' }"
    fullscreen
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="form"
        class="space-y-6 max-w-7xl mx-auto"
        @submit="handleSubmit"
      >
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left Column -->
          <div class="space-y-4">
            <UFormField
              label="Service Name"
              name="serviceName"
              help="Name of the service (e.g., WiFi, Security)"
            >
              <UInput
                v-model="form.serviceName"
                placeholder="E.g., High-Speed Internet"
                autocomplete="off"
                :disabled="props.loading"
              />
            </UFormField>

            <UFormField
              label="Service Type"
              name="serviceType"
            >
              <USelect
                v-model="form.serviceType"
                :items="serviceTypeOptions"
                placeholder="Select service type"
                :disabled="props.loading"
                class="w-full"
              />
            </UFormField>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <UFormField
                label="Monthly Operating Cost"
                name="monthlyCost"
                help="Total cost to run this service per month"
              >
                <UInput
                  v-model.number="form.monthlyCost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  :disabled="props.loading"
                >
                  <template #leading>
                    <span class="text-gray-500">Ksh</span>
                  </template>
                </UInput>
              </UFormField>

              <UFormField
                label="Cost per Unit"
                name="costPerUnit"
                help="Amount to bill each unit"
              >
                <UInput
                  v-model.number="form.costPerUnit"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  :disabled="props.loading"
                >
                  <template #leading>
                    <span class="text-gray-500">Ksh</span>
                  </template>
                </UInput>
              </UFormField>
            </div>

            <UFormField
              label="Service Provider"
              name="serviceProvider"
              help="Company or individual providing the service"
            >
              <UInput
                v-model="form.serviceProvider"
                placeholder="E.g., ABC Internet Solutions"
                autocomplete="off"
                :disabled="props.loading"
              />
            </UFormField>

            <UFormField
              label="Provider Contact"
              name="providerContact"
              help="Phone number or email for the service provider"
            >
              <UInput
                v-model="form.providerContact"
                placeholder="E.g., +254 700 123456 or email@provider.com"
                autocomplete="off"
                :disabled="props.loading"
              />
            </UFormField>
          </div>

          <!-- Right Column -->
          <div class="space-y-4">
            <UFormField
              label="Billing Cycle"
              name="billingCycle"
            >
              <USelect
                v-model="form.billingCycle"
                :items="billingCycleOptions"
                placeholder="Select billing cycle"
                :disabled="props.loading"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Contract Details"
              name="contractDetails"
              help="Contract period, renewal date, or other important details"
            >
              <UTextarea
                v-model="form.contractDetails"
                placeholder="E.g., 12-month contract, auto-renews on January 1st. Early termination fee: Ksh 50,000"
                :rows="4"
                :disabled="props.loading"
                class="resize-none w-full"
              />
            </UFormField>

            <UFormField
              label="Additional Notes"
              name="notes"
              help="Any other relevant information"
            >
              <UTextarea
                v-model="form.notes"
                placeholder="E.g., Service includes 24/7 support, equipment maintenance, etc."
                :rows="4"
                :disabled="props.loading"
                class="resize-none w-full"
              />
            </UFormField>

            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <UCheckbox
                  v-model="form.isActive"
                  :disabled="props.loading"
                />
                <label class="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Service is currently active
                </label>
              </div>

              <!-- <div class="flex items-center gap-2">
                <UCheckbox
                  v-model="form.isMandatory"
                  :disabled="props.loading"
                />
                <label class="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Mandatory for all units
                </label>
              </div> -->
            </div>
          </div>
        </div>

        <!-- Service Summary - Full Width -->
        <div class="mt-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 class="text-base font-semibold mb-3">
            Service Summary
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-gray-600 dark:text-gray-400 block">Monthly Operating Cost:</span>
              <span class="font-medium text-lg">Ksh {{ form.monthlyCost.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
            </div>
            <div>
              <span class="text-gray-600 dark:text-gray-400 block">Cost per Unit:</span>
              <span class="font-medium text-lg">Ksh {{ form.costPerUnit.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
            </div>
            <div v-if="props.totalUnits">
              <span class="text-gray-600 dark:text-gray-400 block">Expected Monthly Revenue:</span>
              <span class="font-medium text-lg text-green-600 dark:text-green-400">
                Ksh {{ (form.costPerUnit * props.totalUnits).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
              </span>
            </div>
            <div>
              <span class="text-gray-600 dark:text-gray-400 block">Billing Cycle:</span>
              <span class="font-medium text-lg capitalize">{{ form.billingCycle }}</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 border-t dark:border-gray-700 pt-6">
          <UButton
            type="button"
            label="Cancel"
            color="neutral"
            variant="outline"
            size="lg"
            :disabled="props.loading"
            @click="emit('update:open', false)"
          />
          <UButton
            type="submit"
            color="primary"
            icon="i-lucide-check"
            size="lg"
            :loading="props.loading"
            :disabled="props.loading"
          >
            {{ props.loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Service' : 'Add Service') }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import { z } from 'zod'
import type { Service } from '~/types/service'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  open: {
    type: Boolean,
    default: false,
  },
  propertyId: {
    type: String,
    required: true,
  },
  totalUnits: {
    type: Number,
    default: 0,
  },
  service: {
    type: Object as PropType<Service | null>,
    default: null,
  },
})

const { user } = useUserSession()

const emit = defineEmits(['submit', 'update:open'])

const isEditMode = computed(() => !!props.service)

const serviceTypeOptions = [
  { label: 'Internet/WiFi', value: 'INTERNET' },
  { label: 'Security', value: 'SECURITY' },
  { label: 'Cleaning', value: 'CLEANING' },
  { label: 'Landscaping', value: 'LANDSCAPING' },
  { label: 'Utilities', value: 'UTILITIES' },
  { label: 'Parking', value: 'PARKING' },
  { label: 'Amenities', value: 'AMENITIES' },
  { label: 'Other', value: 'OTHER' },
]

const billingCycleOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Semi-Annually', value: 'semi-annually' },
  { label: 'Annually', value: 'annually' },
]

const schema = z.object({
  serviceName: z.string().min(3, 'Please enter a service name'),
  serviceType: z.string().min(1, 'Please select a service type'),
  monthlyCost: z.number().min(0, 'Monthly cost must be 0 or greater'),
  costPerUnit: z.number().min(0, 'Cost per unit must be 0 or greater'),
  serviceProvider: z.string().optional(),
  providerContact: z.string().optional(),
  billingCycle: z.string(),
  contractDetails: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean(),
  isMandatory: z.boolean(),
})

type FormState = z.infer<typeof schema>

const form = ref<FormState>({
  serviceName: '',
  serviceType: 'OTHER',
  monthlyCost: 0,
  costPerUnit: 0,
  serviceProvider: '',
  providerContact: '',
  billingCycle: 'monthly',
  contractDetails: '',
  notes: '',
  isActive: true,
  isMandatory: true,
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    if (props.service) {
      form.value = {
        serviceName: props.service.serviceName,
        serviceType: props.service.serviceType,
        monthlyCost: props.service.monthlyCost,
        costPerUnit: props.service.costPerUnit,
        serviceProvider: props.service.serviceProvider,
        providerContact: props.service.providerContact,
        billingCycle: props.service.billingCycle || 'monthly',
        contractDetails: props.service.contractDetails || '',
        notes: props.service.notes || '',
        isActive: props.service.isActive,
        isMandatory: props.service.isMandatory,
      }
    }
    else {
      // Add mode - reset form
      form.value = {
        serviceName: '',
        serviceType: 'OTHER',
        monthlyCost: 0,
        costPerUnit: 0,
        serviceProvider: '',
        providerContact: '',
        billingCycle: 'monthly',
        contractDetails: '',
        notes: '',
        isActive: true,
        isMandatory: true,
      }
    }
  }
})

function handleSubmit() {
  if (!user.value || !props.propertyId) return

  const serviceData: any = {
    ...form.value,
    propertyId: props.propertyId,
  }

  if (isEditMode.value && props.service) {
    // Edit mode - add update tracking
    serviceData._id = props.service._id
    serviceData.lastModifiedBy = user.value._id
    serviceData.lastModifiedByName = `${user.value.first_name} ${user.value.last_name || ''}`.trim()
    serviceData.lastModifiedDate = new Date().toISOString()
  }
  else {
    serviceData.createdBy = user.value._id
    serviceData.createdByName = `${user.value.first_name} ${user.value.last_name || ''}`.trim()
    serviceData.createdDate = new Date().toISOString()
  }

  emit('submit', serviceData)
}
</script>

<style>
/* Any custom styles if needed */
</style>
