<script setup lang="ts">
import { z } from 'zod'
import type { Unit } from '~/types/property'
import type { RadioGroupItem } from '#ui/types'

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
  tenantData: {
    type: Object as PropType<any>,
    default: null,
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
  ownership: {
    type: Object as PropType<any>,
    default: null,
  },
})

const emit = defineEmits(['update:open', 'save'])
const isUpdating = ref(false)
const toast = useToast()
const modalTitle = computed(() => props.isEditing
  ? `Edit Tenant for Unit ${props.unit?.unitNumber || ''}`
  : `Assign Tenant to Unit ${props.unit?.unitNumber || ''}`,
)
const actionButtonLabel = computed(() => props.isEditing ? 'Update Tenant' : 'Add Tenant')

const { user } = useUserSession()

const rentalTypeOptions = ref<RadioGroupItem[]>([
  { label: 'Monthly rental', value: 'monthly' },
  { label: 'Fixed-term lease', value: 'fixed' },
  { label: 'Occupied by owner', value: 'owner_occupied' },
])

const getLeaseStartDate = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
}

const getLeaseEndDate = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
}

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
    .refine(val => val.trim().length > 0, 'Phone number is required'),
  nationalId: z.string().optional(),
  rentalType: z.enum(['monthly', 'fixed', 'owner_occupied']),
  leaseStartDate: z.string().min(1, 'Lease start date is required'),
  leaseEndDate: z.string().min(1, 'Lease end date is required'),
  monthlyRent: z.number().nonnegative('Rent cannot be negative'),
  depositAmount: z.number().nonnegative('Deposit cannot be negative'),
})

const form = ref({
  firstName: '',
  lastName: '',
  phoneNumber: '',
  nationalId: '',
  rentalType: 'monthly' as 'monthly' | 'fixed' | 'owner_occupied',
  leaseStartDate: getLeaseStartDate(),
  leaseEndDate: getLeaseEndDate(),
  monthlyRent: props.unit?.rentAmount || 0,
  depositAmount: 0,
})

// Watch for rental type changes
watch(() => form.value.rentalType, (newType) => {
  if (newType === 'owner_occupied') {
    if (!props.ownership) {
      toast.add({
        title: 'Owner Information Missing',
        description: 'This unit has not been sold yet. Please go to Revenue > Unit Sales to assign an owner before marking it as owner-occupied.',
        color: 'error',
        icon: 'i-lucide-alert-triangle',
      })
      // Reset to previous rental type
      form.value.rentalType = 'monthly'
      return
    }

    form.value.firstName = props.ownership.ownerName?.split(' ')[0] || ''
    form.value.lastName = props.ownership.ownerName?.split(' ').slice(1).join(' ') || ''
    form.value.phoneNumber = props.ownership.ownerPhone || ''
    form.value.monthlyRent = 0
    form.value.depositAmount = 0
    // For owner-occupied, allow custom dates but default to current month
    if (!props.isEditing) {
      form.value.leaseStartDate = getLeaseStartDate()
      form.value.leaseEndDate = getLeaseEndDate()
    }
  }
  else if (newType === 'fixed') {
    // For fixed-term lease, allow custom dates but default to current month
    if (props.unit?.rentAmount) {
      if (!props.isEditing) {
        form.value.firstName = ''
        form.value.lastName = ''
        form.value.phoneNumber = ''
        form.value.nationalId = ''
        form.value.leaseStartDate = getLeaseStartDate()
        form.value.leaseEndDate = getLeaseEndDate()
      }
      form.value.monthlyRent = props.unit.rentAmount
      form.value.depositAmount = props.unit.rentAmount
    }
  }
  else if (newType === 'monthly') {
    // For monthly rental, lock dates to current month
    if (props.unit?.rentAmount) {
      if (!props.isEditing) {
        form.value.firstName = ''
        form.value.lastName = ''
        form.value.phoneNumber = ''
        form.value.nationalId = ''
      }
      form.value.monthlyRent = props.unit.rentAmount
      form.value.depositAmount = props.unit.rentAmount
    }
    // Always set to current month for monthly rentals
    form.value.leaseStartDate = getLeaseStartDate()
    form.value.leaseEndDate = getLeaseEndDate()
  }
})

watch(() => props.tenantData, (newTenantData) => {
  if (newTenantData && props.isEditing) {
    form.value = {
      firstName: newTenantData.firstName || '',
      lastName: newTenantData.lastName || '',
      phoneNumber: newTenantData.phoneNumber || '',
      nationalId: newTenantData.nationalId || '',
      rentalType: newTenantData.rentalType || 'monthly',
      leaseStartDate: getLeaseStartDate(),
      leaseEndDate: getLeaseEndDate(),
      monthlyRent: newTenantData.rentAmount || (props.unit?.rentAmount || 0),
      depositAmount: newTenantData.depositAmount || 0,
    }
  }
  else if (!props.isEditing) {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  form.value = {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    nationalId: '',
    rentalType: 'monthly' as 'monthly' | 'fixed' | 'owner_occupied',
    leaseStartDate: getLeaseStartDate(),
    leaseEndDate: getLeaseEndDate(),
    monthlyRent: props.unit?.rentAmount || 0,
    depositAmount: 0,
  }
}

watch(() => form.value.leaseStartDate, () => {
  // Only auto-update end date for monthly rentals
  if (form.value.rentalType === 'monthly') {
    form.value.leaseEndDate = getLeaseEndDate()
  }
})

watch(() => props.unit, (newUnit) => {
  if (newUnit && newUnit.rentAmount && !props.isEditing) {
    form.value.monthlyRent = newUnit.rentAmount
    form.value.depositAmount = newUnit.rentAmount
  }
}, { immediate: true })

async function handleSubmit() {
  if (!props.unit) return

  // Validate owner-occupied scenario
  if (form.value.rentalType === 'owner_occupied' && !props.ownership) {
    toast.add({
      title: 'Cannot Proceed',
      description: 'This unit must be sold to an owner first. Please go to Revenue > Unit Sales to complete the sale.',
      color: 'error',
      icon: 'i-lucide-x-circle',
    })
    return
  }

  isUpdating.value = true
  try {
    const tenantData = {
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      phoneNumber: form.value.phoneNumber,
      nationalId: form.value.nationalId || '',
      rentalType: form.value.rentalType,
      leaseStartDate: form.value.leaseStartDate,
      leaseEndDate: form.value.leaseEndDate,
      rentAmount: form.value.monthlyRent,
      depositAmount: form.value.depositAmount,
      unitId: props.unit._id,
      floorId: (props.unit as any).floorId || '',
      floorNumber: (props.unit as any).floorNumber || '',
      propertyId: props.propertyId,
    }

    if (props.isEditing && props.tenantData?._id) {
      await $fetch(`/api/tenants/${props.tenantData._id}`, {
        method: 'PUT',
        body: tenantData,
      })

      toast.add({
        title: 'Tenant Updated',
        description: `${form.value.firstName} ${form.value.lastName}'s details have been updated.`,
        color: 'success',
        icon: 'i-lucide-check',
      })
    }
    else {
      await $fetch('/api/tenants', {
        method: 'POST',
        body: tenantData,
      })

      toast.add({
        title: 'Tenant Added',
        description: `${form.value.firstName} ${form.value.lastName} has been assigned to Unit ${props.unit.unitNumber}.`,
        color: 'success',
        icon: 'i-lucide-check',
      })
    }

    emit('save')
    emit('update:open', false)
  }
  catch (error: any) {
    console.error(`Failed to ${props.isEditing ? 'update' : 'add'} tenant:`, error)
    toast.add({
      title: `Error ${props.isEditing ? 'updating' : 'adding'} tenant`,
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
    :title="modalTitle"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="form"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <!-- Rental Type at the top -->
        <div class="grid grid-cols-1 gap-4">
          <UFormField
            label="Rental Type"
            name="rentalType"
            help="Monthly (fixed dates), Fixed-term (custom dates), or Owner-occupied (custom dates, services only)."
          >
            <URadioGroup
              v-model="form.rentalType"
              orientation="horizontal"
              :items="rentalTypeOptions"
              :disabled="isUpdating || props.isEditing"
            />
          </UFormField>

          <UAlert
            v-if="props.isEditing"
            color="info"
            icon="i-lucide-info"
            title="Rental Type Locked"
            description="Rental type cannot be changed when editing an existing tenant. Create a new tenant record if you need to change the rental type."
          />
        </div>

        <UAlert
          v-if="form.rentalType === 'owner_occupied'"
          icon="i-lucide-info"
          color="info"
          variant="soft"
          title="Owner Occupied Unit"
          description="This unit is occupied by the owner. No monthly rent will be charged, but the owner will be responsible for service charges such as WiFi, security, and other amenities."
        />

        <UAlert
          v-if="form.rentalType === 'owner_occupied' && !props.ownership"
          icon="i-lucide-alert-triangle"
          color="warning"
          variant="soft"
          title="No Owner Information"
          description="This unit does not have ownership information. Please go to Revenue > Unit Sales to assign an owner first."
        />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField
            label="First Name"
            name="firstName"
          >
            <UInput
              v-model="form.firstName"
              placeholder="First Name"
              :disabled="isUpdating || (form.rentalType === 'owner_occupied')"
              :readonly="form.rentalType === 'owner_occupied'"
            />
          </UFormField>

          <UFormField
            label="Last Name"
            name="lastName"
          >
            <UInput
              v-model="form.lastName"
              placeholder="Last Name"
              :disabled="isUpdating || (form.rentalType === 'owner_occupied')"
              :readonly="form.rentalType === 'owner_occupied'"
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField
            label="Phone Number"
            name="phoneNumber"
          >
            <UInput
              v-model="form.phoneNumber"
              placeholder="Phone Number"
              :disabled="isUpdating || (form.rentalType === 'owner_occupied')"
              :readonly="form.rentalType === 'owner_occupied'"
            />
          </UFormField>
          <UFormField
            label="National ID (optional)"
            name="nationalId"
          >
            <UInput
              v-model="form.nationalId"
              placeholder="National ID (optional)"
              :disabled="isUpdating"
            />
          </UFormField>
        </div>

        <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <UFormField
              label="Lease Start Date"
              name="leaseStartDate"
              :help="form.rentalType === 'monthly' ? 'Fixed to 1st day of current month' : 'Editable for fixed-term and owner-occupied leases'"
            >
              <UInput
                v-model="form.leaseStartDate"
                type="date"
                :disabled="form.rentalType === 'monthly' || isUpdating"
                :readonly="form.rentalType === 'monthly'"
              />
            </UFormField>

            <UFormField
              label="Lease End Date"
              name="leaseEndDate"
              :help="form.rentalType === 'monthly' ? 'Fixed to last day of current month' : 'Editable for fixed-term and owner-occupied leases'"
            >
              <UInput
                v-model="form.leaseEndDate"
                type="date"
                :disabled="form.rentalType === 'monthly' || isUpdating"
                :readonly="form.rentalType === 'monthly'"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField
              label="Monthly Rent"
              name="monthlyRent"
            >
              <UInput
                v-model.number="form.monthlyRent"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                :disabled="user?.role === 'caretaker' || isUpdating"
              />
              <template
                v-if="form.rentalType === 'owner_occupied'"
                #help
              >
                <span class="text-yellow-600 dark:text-yellow-400 text-xs">
                  No rent for owner-occupied units
                </span>
              </template>
            </UFormField>

            <UFormField
              label="Deposit Amount"
              name="depositAmount"
            >
              <UInput
                v-model.number="form.depositAmount"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                :disabled="user?.role === 'caretaker' || isUpdating"
              />
              <template
                v-if="form.rentalType === 'owner_occupied'"
                #help
              >
                <span class="text-yellow-600 dark:text-yellow-400 text-xs">
                  No deposit for owner-occupied units
                </span>
              </template>
            </UFormField>
          </div>
        </div>

        <div class="flex justify-end items-end gap-3 mt-4">
          <UButton
            color="neutral"
            variant="soft"
            label="Cancel"
            :disabled="isUpdating"
            @click="emit('update:open', false)"
          />
          <UButton
            color="primary"
            :label="actionButtonLabel"
            :icon="props.isEditing ? 'i-lucide-save' : 'i-lucide-user-plus'"
            :loading="isUpdating"
            :disabled="isUpdating || !props.unit || (form.rentalType === 'owner_occupied' && !props.ownership)"
            type="submit"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
