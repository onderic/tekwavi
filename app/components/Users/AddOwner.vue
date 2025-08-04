<script setup lang="ts">
import { z } from 'zod'

interface Unit {
  _id: string
  unitId: string
  unitNumber: string
  propertyId: string
  propertyName: string
  hasOwnership: boolean
}

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  open: {
    type: Boolean,
    default: false,
  },
  selectedUnit: {
    type: Object as PropType<Unit | null>,
    default: null,
  },
})

const emit = defineEmits(['save', 'update:open'])

const schema = z.object({
  unitId: z.string().min(1, 'Please select a unit'),
  createNewUser: z.string(),
  existingUserId: z.string().optional(),
  ownerDetails: z.object({
    phone: z.string()
      .min(1, 'Phone number is required')
      .length(10, 'Phone number must be exactly 10 digits')
      .regex(/^\d+$/, 'Phone number must contain only numbers'),
    email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    nationalId: z.string().min(8, 'National ID or Passport is required'),
    titleDeedNumber: z.string().min(1, 'Title deed number is required').or(z.literal('')),
  }).optional(),
  ownershipDetails: z.object({
    purchaseDate: z.string().min(1, 'Purchase date is required'),
    purchaseAmount: z.number().min(0, 'Purchase amount must be positive'),
    ownershipType: z.enum(['individual', 'company', 'joint']),
    ownershipPercentage: z.number().min(0).max(100),
  }),
})

const form = ref({
  unitId: '',
  createNewUser: 'true',
  existingUserId: '',
  ownerDetails: {
    phone: '',
    email: '',
    first_name: '',
    last_name: '',
    nationalId: '',
    titleDeedNumber: '',
  },
  ownershipDetails: {
    purchaseDate: new Date().toISOString().split('T')[0] || '',
    purchaseAmount: 0,
    ownershipType: 'individual' as const,
    ownershipPercentage: 100,
  },
})

const ownershipTypeOptions = [
  { label: 'Individual', value: 'individual' },
  { label: 'Company', value: 'company' },
  { label: 'Joint', value: 'joint' },
]

watch(() => props.open, (isOpen) => {
  if (isOpen && props.selectedUnit) {
    // Reset form with selected unit
    form.value = {
      unitId: props.selectedUnit.unitId || props.selectedUnit._id,
      createNewUser: 'true',
      existingUserId: '',
      ownerDetails: {
        phone: '',
        email: '',
        first_name: '',
        last_name: '',
        nationalId: '',
        titleDeedNumber: '',
      },
      ownershipDetails: {
        purchaseDate: new Date().toISOString().split('T')[0] || '',
        purchaseAmount: 0,
        ownershipType: 'individual',
        ownershipPercentage: 100,
      },
    }
  }
})

const handleSubmit = async () => {
  const createNewUserBool = form.value.createNewUser === 'true'

  // Build the ownership object matching the schema
  const ownership = {
    purchaseDate: form.value.ownershipDetails.purchaseDate,
    purchaseAmount: form.value.ownershipDetails.purchaseAmount,
    ownershipType: form.value.ownershipDetails.ownershipType,
    ownershipPercentage: form.value.ownershipDetails.ownershipPercentage,
    isActive: true,
  }

  // If creating new user, include user details for the owner fields
  if (createNewUserBool) {
    Object.assign(ownership, {
      ownerName: `${form.value.ownerDetails.first_name} ${form.value.ownerDetails.last_name}`,
      ownerPhone: form.value.ownerDetails.phone,
      ownerEmail: form.value.ownerDetails.email || undefined,
    })
  }

  const payload = {
    unitId: form.value.unitId,
    createNewUser: createNewUserBool,
    userDetails: createNewUserBool
      ? {
          phone: form.value.ownerDetails.phone,
          email: form.value.ownerDetails.email,
          first_name: form.value.ownerDetails.first_name,
          last_name: form.value.ownerDetails.last_name,
          nationalId: form.value.ownerDetails.nationalId,
          titleDeedNumber: form.value.ownerDetails.titleDeedNumber,
          role: 'unit_owner',
        }
      : undefined,
    ownership,
  }

  emit('save', payload)
}
</script>

<template>
  <UModal
    :open="props.open"
    :title="`Add Owner to Unit ${selectedUnit?.unitNumber || ''}`"
    :description="`Assign ownership for ${selectedUnit?.unitNumber || ''} in ${selectedUnit?.propertyName || ''}`"
    :close="{ onClick: () => emit('update:open', false) }"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="form"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <div class="space-y-4">
          <div
            v-if="selectedUnit"
            class="bg-gray-50 dark:bg-gray-800 p-3 rounded-md"
          >
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium">Property:</span> {{ selectedUnit.propertyName }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              <span class="font-medium">Unit:</span> {{ selectedUnit.unitNumber }}
            </p>
          </div>

          <!-- Owner Details Section -->
          <div class="space-y-4">
            <h4 class="font-medium text-sm">
              Owner Details
            </h4>

            <div class="grid grid-cols-2 gap-4">
              <UFormField
                label="First Name"
                name="ownerDetails.first_name"
                required
              >
                <UInput
                  v-model="form.ownerDetails.first_name"
                  placeholder="John"
                  :disabled="props.loading"
                />
              </UFormField>

              <UFormField
                label="Last Name"
                name="ownerDetails.last_name"
                required
              >
                <UInput
                  v-model="form.ownerDetails.last_name"
                  placeholder="Doe"
                  :disabled="props.loading"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <UFormField
                label="Phone Number"
                name="ownerDetails.phone"
                required
              >
                <UInput
                  v-model="form.ownerDetails.phone"
                  placeholder="+254712345678"
                  :disabled="props.loading"
                />
              </UFormField>

              <UFormField
                label="Email"
                name="ownerDetails.email"
              >
                <UInput
                  v-model="form.ownerDetails.email"
                  placeholder="john@example.com"
                  type="email"
                  :disabled="props.loading"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <UFormField
                label="National ID / Passport"
                name="ownerDetails.nationalId"
                required
              >
                <UInput
                  v-model="form.ownerDetails.nationalId"
                  placeholder="37282828"
                  :disabled="props.loading"
                />
              </UFormField>

              <UFormField
                label="Title Deed Number"
                name="ownerDetails.titleDeedNumber"
              >
                <UInput
                  v-model="form.ownerDetails.titleDeedNumber"
                  placeholder="TD123456789"
                  type="text"
                  :disabled="props.loading"
                />
              </UFormField>
            </div>
          </div>

          <div class="space-y-4 border-t pt-4">
            <h4 class="font-medium text-sm">
              Ownership Details
            </h4>

            <div class="grid grid-cols-2 gap-4">
              <UFormField
                label="Purchase Date"
                name="ownershipDetails.purchaseDate"
                required
              >
                <UInput
                  v-model="form.ownershipDetails.purchaseDate"
                  type="date"
                  :disabled="props.loading"
                />
              </UFormField>

              <UFormField
                label="Purchase Amount"
                name="ownershipDetails.purchaseAmount"
                required
              >
                <UInput
                  v-model.number="form.ownershipDetails.purchaseAmount"
                  type="number"
                  min="0"
                  placeholder="0"
                  :disabled="props.loading"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <UFormField
                label="Ownership Type"
                name="ownershipDetails.ownershipType"
                required
              >
                <USelect
                  v-model="form.ownershipDetails.ownershipType"
                  :items="ownershipTypeOptions"
                  :disabled="props.loading"
                />
              </UFormField>

              <UFormField
                label="Ownership Percentage"
                name="ownershipDetails.ownershipPercentage"
                required
              >
                <UInput
                  v-model.number="form.ownershipDetails.ownershipPercentage"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="100"
                  :disabled="props.loading"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <div class="flex justify-end items-end gap-3 mt-6">
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
            icon="i-lucide-user-plus"
            :loading="props.loading"
            :disabled="props.loading"
          >
            {{ props.loading ? 'Assigning...' : 'Assign Owner' }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
