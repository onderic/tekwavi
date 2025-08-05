<template>
  <BasePage
    :title="`Unit ${unit?.unitNumber || ''} Details`"
    icon="i-lucide-home"
    :status="status === 'pending'"
  >
    <template #headerActions>
      <div class="flex items-center gap-3">
        <UButton
          v-if="unit?.ownership?.isActive && !isEditing"
          color="primary"
          variant="outline"
          icon="i-lucide-edit"
          label="Edit Ownership"
          size="sm"
          @click="startEditing"
        />
      </div>
    </template>

    <div
      v-if="status === 'pending'"
      class="space-y-4"
    >
      <USkeleton class="h-32 w-full" />
      <USkeleton class="h-48 w-full" />
      <USkeleton class="h-32 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      icon="i-lucide-alert-circle"
      color="error"
      title="Error loading unit details"
      :description="error.message || 'An error occurred while fetching unit details'"
    />

    <!-- Main Content -->
    <div
      v-else-if="unit"
      class="space-y-6"
    >
      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-primary-50 dark:bg-primary-950 rounded-lg">
              <UIcon
                name="i-lucide-home"
                class="text-primary-500 text-xl"
              />
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Unit Number
              </p>
              <p class="font-semibold text-lg">
                {{ unit.unitNumber }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <UIcon
                name="i-lucide-building"
                class="text-blue-500 text-xl"
              />
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Property
              </p>
              <p class="font-semibold">
                {{ property?.propertyName || 'Unknown' }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-green-50 dark:bg-green-950 rounded-lg">
              <UIcon
                name="i-lucide-layers"
                class="text-green-500 text-xl"
              />
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Floor
              </p>
              <p class="font-semibold">
                {{ floor?.name || `Floor ${floor?.floorNumber || 0}` }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <div
              :class="[
                'p-2 rounded-lg',
                unit.ownership?.isActive ? 'bg-success-50 dark:bg-success-950' : 'bg-gray-50 dark:bg-gray-950',
              ]"
            >
              <UIcon
                :name="unit.ownership?.isActive ? 'i-lucide-user-check' : 'i-lucide-user-x'"
                :class="[
                  'text-xl',
                  unit.ownership?.isActive ? 'text-success-500' : 'text-gray-500',
                ]"
              />
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Status
              </p>
              <UBadge
                :color="unit.ownership?.isActive ? 'success' : 'neutral'"
                variant="subtle"
              >
                {{ unit.ownership?.isActive ? 'Owned' : 'Available' }}
              </UBadge>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Unit Details Card -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-info"
              class="text-gray-400"
            />
            <h3 class="text-lg font-semibold">
              Unit Information
            </h3>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="space-y-1">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Type
            </p>
            <div class="flex items-center gap-2">
              <UIcon
                :name="getUnitTypeIcon(unit.type)"
                class="text-gray-400"
              />
              <p class="font-medium">
                {{ formatUnitType(unit.type) }}
              </p>
            </div>
          </div>

          <div class="space-y-1">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Category
            </p>
            <p class="font-medium">
              {{ unit.category || 'Standard' }}
            </p>
          </div>

          <div class="space-y-1">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Furnishing
            </p>
            <p class="font-medium">
              {{ formatFurnishing(unit.furnishing) }}
            </p>
          </div>

          <div class="space-y-1">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Rent Status
            </p>
            <UBadge
              :color="unit.isOccupied ? 'warning' : 'success'"
              variant="subtle"
            >
              {{ unit.isOccupied ? 'Occupied' : 'Vacant' }}
            </UBadge>
          </div>

          <div
            v-if="unit.rentAmount"
            class="space-y-1"
          >
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Rent Amount
            </p>
            <p class="font-medium">
              {{ formatCurrency(unit.rentAmount) }}/month
            </p>
          </div>

          <div class="space-y-1">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Unit Status
            </p>
            <UBadge
              :color="getStatusColor(unit.status)"
              variant="subtle"
              class="capitalize"
            >
              {{ unit.status }}
            </UBadge>
          </div>
        </div>
      </UCard>

      <!-- Current Ownership Card -->
      <UCard v-if="unit.ownership?.isActive">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-user"
                class="text-gray-400"
              />
              <h3 class="text-lg font-semibold">
                Current Owner
              </h3>
            </div>
            <div
              v-if="!isEditing"
              class="flex items-center gap-2"
            >
              <UTooltip text="Owner since">
                <UBadge
                  color="primary"
                  variant="subtle"
                  size="sm"
                >
                  <UIcon
                    name="i-lucide-calendar"
                    class="mr-1"
                  />
                  {{ formatDate(unit.ownership.purchaseDate) }}
                </UBadge>
              </UTooltip>
            </div>
          </div>
        </template>
        <div
          v-if="!isEditing"
          class="space-y-6"
        >
          <!-- Owner Info Header -->
          <div class="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div class="p-3 bg-primary-100 dark:bg-primary-900 rounded-full">
              <UIcon
                name="i-lucide-user"
                class="text-2xl text-primary-600 dark:text-primary-400"
              />
            </div>
            <div class="flex-1">
              <h4 class="text-lg font-semibold">
                {{ unit.ownership.ownerName }}
              </h4>
              <div class="flex flex-wrap items-center gap-4 mt-2 text-sm">
                <div class="flex items-center gap-1">
                  <UIcon
                    name="i-lucide-phone"
                    class="text-gray-400"
                  />
                  <span>{{ unit.ownership.ownerPhone || 'No phone' }}</span>
                </div>
                <div
                  v-if="unit.ownership.ownerEmail"
                  class="flex items-center gap-1"
                >
                  <UIcon
                    name="i-lucide-mail"
                    class="text-gray-400"
                  />
                  <span>{{ unit.ownership.ownerEmail }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Ownership Details Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <UIcon
                  name="i-lucide-briefcase"
                  class="text-gray-400"
                />
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Ownership Type
                </p>
              </div>
              <UBadge
                :color="getOwnershipTypeColor(unit.ownership.ownershipType || '')"
                variant="subtle"
                class="capitalize"
              >
                {{ unit.ownership.ownershipType }}
              </UBadge>
            </div>

            <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <UIcon
                  name="i-lucide-calendar"
                  class="text-gray-400"
                />
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Purchase Date
                </p>
              </div>
              <p class="font-medium">
                {{ formatDate(unit.ownership.purchaseDate) }}
              </p>
            </div>

            <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <UIcon
                  name="i-lucide-banknote"
                  class="text-gray-400"
                />
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Purchase Amount
                </p>
              </div>
              <p class="font-medium text-lg">
                {{ formatCurrency(unit.ownership.purchaseAmount || 0) }}
              </p>
            </div>

            <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <UIcon
                  name="i-lucide-percent"
                  class="text-gray-400"
                />
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Ownership Share
                </p>
              </div>
              <div class="flex items-center gap-2">
                <p class="font-medium text-lg">
                  {{ unit.ownership.ownershipPercentage }}%
                </p>
                <UProgress
                  :value="unit.ownership.ownershipPercentage || 0"
                  :max="100"
                  size="sm"
                  class="flex-1"
                />
              </div>
            </div>

            <div
              v-if="unit.ownership.titleDeedNumber"
              class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div class="flex items-center gap-2 mb-2">
                <UIcon
                  name="i-lucide-file-text"
                  class="text-gray-400"
                />
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Title Deed
                </p>
              </div>
              <p class="font-medium">
                {{ unit.ownership.titleDeedNumber }}
              </p>
            </div>

            <div
              v-if="unit.ownership.ownerId"
              class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div class="flex items-center gap-2 mb-2">
                <UIcon
                  name="i-lucide-user-check"
                  class="text-gray-400"
                />
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Registered User
                </p>
              </div>
              <UBadge
                color="success"
                variant="subtle"
              >
                <UIcon
                  name="i-lucide-check"
                  class="mr-1"
                />
                System User
              </UBadge>
            </div>
          </div>
        </div>

        <!-- Edit Mode -->
        <UForm
          v-else
          :schema="ownershipSchema"
          :state="editForm"
          class="space-y-4"
          @submit="handleUpdate"
        >
          <UAlert
            icon="i-lucide-info"
            color="primary"
            variant="subtle"
            title="Editing Ownership Details"
            description="Update the owner information below. Some fields like Owner ID cannot be changed."
          />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup
              label="Owner Name"
              name="ownerName"
              required
            >
              <UInput
                v-model="editForm.ownerName"
                icon="i-lucide-user"
                placeholder="John Doe"
              />
            </UFormGroup>

            <UFormGroup
              label="Phone Number"
              name="ownerPhone"
              required
            >
              <UInput
                v-model="editForm.ownerPhone"
                icon="i-lucide-phone"
                placeholder="+254712345678"
              />
            </UFormGroup>

            <UFormGroup
              label="Email"
              name="ownerEmail"
            >
              <UInput
                v-model="editForm.ownerEmail"
                type="email"
                icon="i-lucide-mail"
                placeholder="john@example.com"
              />
            </UFormGroup>

            <UFormGroup
              label="Ownership Type"
              name="ownershipType"
              required
            >
              <USelect
                v-model="editForm.ownershipType"
                icon="i-lucide-briefcase"
                :items="[
                  { label: 'Individual', value: 'individual' },
                  { label: 'Company', value: 'company' },
                  { label: 'Joint', value: 'joint' },
                ]"
              />
            </UFormGroup>

            <UFormGroup
              label="Purchase Date"
              name="purchaseDate"
              required
            >
              <UInput
                v-model="editForm.purchaseDate"
                type="date"
                icon="i-lucide-calendar"
              />
            </UFormGroup>

            <UFormGroup
              label="Purchase Amount"
              name="purchaseAmount"
              required
            >
              <UInput
                v-model.number="editForm.purchaseAmount"
                type="number"
                icon="i-lucide-banknote"
                placeholder="5000000"
              >
                <template #trailing>
                  <span class="text-gray-500 dark:text-gray-400 text-xs">KES</span>
                </template>
              </UInput>
            </UFormGroup>

            <UFormGroup
              label="Ownership Percentage"
              name="ownershipPercentage"
              required
            >
              <UInput
                v-model.number="editForm.ownershipPercentage"
                type="number"
                min="1"
                max="100"
                icon="i-lucide-percent"
                placeholder="100"
              >
                <template #trailing>
                  <span class="text-gray-500 dark:text-gray-400 text-xs">%</span>
                </template>
              </UInput>
            </UFormGroup>

            <UFormGroup
              label="Title Deed Number"
              name="titleDeedNumber"
            >
              <UInput
                v-model="editForm.titleDeedNumber"
                icon="i-lucide-file-text"
                placeholder="TD/123/456"
              />
            </UFormGroup>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-x"
              label="Cancel"
              @click="cancelEditing"
            />
            <UButton
              type="submit"
              color="primary"
              icon="i-lucide-save"
              label="Save Changes"
              :loading="isUpdating"
            />
          </div>
        </UForm>
      </UCard>

      <!-- No Owner Card -->
      <UCard v-else>
        <div class="text-center py-12">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <UIcon
              name="i-lucide-user-x"
              class="text-3xl text-gray-400"
            />
          </div>
          <h3 class="text-lg font-semibold mb-2">
            No Owner Assigned
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            This unit is currently available for ownership. Assign an owner to manage this property.
          </p>
          <UButton
            color="primary"
            size="lg"
            label="Assign Owner"
            icon="i-lucide-user-plus"
            @click="showAssignOwnerModal = true"
          />
        </div>
      </UCard>

      <!-- Ownership History -->
      <UCard v-if="unit.previousOwners && unit.previousOwners.length > 0">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-history"
              class="text-gray-400"
            />
            <h3 class="text-lg font-semibold">
              Ownership History
            </h3>
            <UBadge
              color="neutral"
              variant="subtle"
              size="sm"
            >
              {{ unit.previousOwners.length }} Previous {{ unit.previousOwners.length === 1 ? 'Owner' : 'Owners' }}
            </UBadge>
          </div>
        </template>

        <div class="relative">
          <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

          <div class="space-y-6">
            <div
              v-for="(owner, index) in unit.previousOwners"
              :key="index"
              class="relative flex gap-4"
            >
              <div class="relative z-10 flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-full">
                <UIcon
                  name="i-lucide-user"
                  class="text-gray-400"
                />
              </div>

              <div class="flex-1 pb-6">
                <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <h4 class="font-semibold">
                        {{ owner.ownerName }}
                      </h4>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        <UIcon
                          name="i-lucide-calendar"
                          class="inline mr-1"
                        />
                        {{ formatDate(owner.purchaseDate) }} - {{ formatDate(owner.transferDate) }}
                      </p>
                    </div>
                    <UBadge
                      color="neutral"
                      variant="subtle"
                      size="xs"
                    >
                      Previous Owner
                    </UBadge>
                  </div>
                  <div class="flex items-center gap-4 text-sm">
                    <span class="text-gray-600 dark:text-gray-300">
                      <UIcon
                        name="i-lucide-banknote"
                        class="inline mr-1"
                      />
                      {{ formatCurrency(owner.purchaseAmount || 0) }}
                    </span>
                    <span class="text-gray-500 dark:text-gray-400">
                      <UIcon
                        name="i-lucide-clock"
                        class="inline mr-1"
                      />
                      {{ getDuration(owner.purchaseDate, owner.transferDate) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Additional Details -->
      <UCard v-if="unit.titleDeedNumber || unit.registrationDate || unit.ownershipNotes">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-file-plus"
              class="text-gray-400"
            />
            <h3 class="text-lg font-semibold">
              Additional Information
            </h3>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-if="unit.titleDeedNumber"
            class="space-y-1"
          >
            <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <UIcon name="i-lucide-file-text" />
              Unit Title Deed Number
            </p>
            <p class="font-medium">
              {{ unit.titleDeedNumber }}
            </p>
          </div>

          <div
            v-if="unit.registrationDate"
            class="space-y-1"
          >
            <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <UIcon name="i-lucide-calendar-check" />
              Registration Date
            </p>
            <p class="font-medium">
              {{ formatDate(unit.registrationDate) }}
            </p>
          </div>

          <div
            v-if="unit.ownershipNotes"
            class="md:col-span-2 space-y-1"
          >
            <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <UIcon name="i-lucide-sticky-note" />
              Notes
            </p>
            <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p class="text-sm whitespace-pre-wrap">
                {{ unit.ownershipNotes }}
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Timestamps -->
      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Created: {{ formatDate(unit.createdAt) }}</span>
        <span>Last Updated: {{ formatDate(unit.updatedAt) }}</span>
      </div>
    </div>

    <!-- Assign Owner Modal -->
    <UsersAddOwner
      :open="showAssignOwnerModal"
      :loading="isUpdating"
      :selected-unit="selectedUnitForAssignment"
      @save="handleAssignOwner"
      @update:open="showAssignOwnerModal = $event"
    />
  </BasePage>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { formatDistanceStrict } from 'date-fns'

interface Unit {
  _id: string
  unitNumber: string
  type?: string
  category?: string
  furnishing?: string
  status?: string
  isOccupied?: boolean
  rentAmount?: number
  floorNumber?: string
  floorId: string
  propertyId: string
  ownership?: {
    ownerId?: string
    ownerName?: string
    ownerPhone?: string
    ownerEmail?: string
    purchaseDate?: Date | string
    purchaseAmount?: number
    ownershipType?: string
    ownershipPercentage?: number
    titleDeedNumber?: string
    isActive?: boolean
  }
  previousOwners?: Array<{
    ownerName?: string
    purchaseDate?: Date | string
    transferDate?: Date | string
    purchaseAmount?: number
  }>
  titleDeedNumber?: string
  registrationDate?: Date | string
  ownershipNotes?: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

interface Property {
  _id: string
  propertyName: string
  address?: any
}

interface Floor {
  _id: string
  floorNumber: number
  name?: string
}

definePageMeta({
  title: 'Unit Details',
})

const route = useRoute()
const toast = useToast()
const { formatCurrency, formatDate } = useFormatters()

const unitId = computed(() => route.params.id as string)
const isEditing = ref(false)
const isUpdating = ref(false)
const showAssignOwnerModal = ref(false)

const ownershipSchema = z.object({
  ownerName: z.string().min(2, 'Name is required'),
  ownerPhone: z.string().min(10, 'Valid phone number is required'),
  ownerEmail: z.string().email().optional().or(z.literal('')),
  ownershipType: z.enum(['individual', 'company', 'joint']),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  purchaseAmount: z.number().positive('Purchase amount must be positive'),
  ownershipPercentage: z.number().min(1).max(100),
  titleDeedNumber: z.string().optional(),
})

const editForm = ref({
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  ownershipType: 'individual' as 'individual' | 'company' | 'joint',
  purchaseDate: '',
  purchaseAmount: 0,
  ownershipPercentage: 100,
  titleDeedNumber: '',
})

const { data, status, error, refresh } = await useLazyAsyncData(
  `unit-${unitId.value}`,
  () => $fetch<{ unit: Unit, property: Property, floor: Floor }>(`/api/properties/unitownership/${unitId.value}`),
  {
    default: () => ({ unit: null, property: null, floor: null }),
    server: false,
  },
)

const unit = computed(() => data.value?.unit)
const property = computed(() => data.value?.property)
const floor = computed(() => data.value?.floor)

const selectedUnitForAssignment = computed(() => {
  if (!unit.value || !property.value) return null

  return {
    _id: unit.value._id,
    unitId: unit.value._id,
    unitNumber: unit.value.unitNumber,
    propertyId: property.value._id,
    propertyName: property.value.propertyName,
    hasOwnership: !!unit.value.ownership,
  }
})

const formatUnitType = (type: string | undefined) => {
  if (!type) return 'Standard'
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const formatFurnishing = (furnishing: string | undefined) => {
  if (!furnishing) return 'Unfurnished'
  return furnishing
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const getUnitTypeIcon = (type: string | undefined) => {
  const icons: Record<string, string> = {
    shop: 'i-lucide-store',
    apartment: 'i-lucide-building-2',
    office: 'i-lucide-briefcase',
    warehouse: 'i-lucide-package',
    studio: 'i-lucide-home',
  }
  return icons[type || ''] || 'i-lucide-home'
}

const getStatusColor = (status: string | undefined) => {
  const colors: Record<string, 'success' | 'warning' | 'primary' | 'secondary' | 'info' | 'neutral' | 'error'> = {
    available: 'success',
    rented: 'warning',
    maintenance: 'warning',
    reserved: 'primary',
  }
  return colors[status || ''] || 'neutral'
}

const getOwnershipTypeColor = (type: string): 'primary' | 'warning' | 'secondary' | 'neutral' => {
  const colors: Record<string, 'primary' | 'warning' | 'secondary'> = {
    individual: 'primary',
    company: 'warning',
    joint: 'secondary',
  }
  return colors[type] || 'neutral'
}

const getDuration = (start: Date | string | undefined, end: Date | string | undefined) => {
  if (!start || !end) return 'Unknown duration'
  try {
    return formatDistanceStrict(new Date(start), new Date(end))
  }
  catch {
    return 'Unknown duration'
  }
}

const startEditing = () => {
  if (unit.value?.ownership) {
    editForm.value = {
      ownerName: unit.value.ownership.ownerName || '',
      ownerPhone: unit.value.ownership.ownerPhone || '',
      ownerEmail: unit.value.ownership.ownerEmail ?? '',
      ownershipType: unit.value.ownership.ownershipType as any || 'individual',
      purchaseDate: String(unit.value.ownership.purchaseDate),
      purchaseAmount: unit.value.ownership.purchaseAmount || 0,
      ownershipPercentage: unit.value.ownership.ownershipPercentage || 100,
      titleDeedNumber: unit.value.ownership.titleDeedNumber || '',
    }
  }
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
}

const handleUpdate = async () => {
  isUpdating.value = true

  try {
    await $fetch(`/api/properties/unitownership/${unitId.value}`, {
      body: {
        ownership: editForm.value,
      },
    })

    toast.add({
      title: 'Success',
      description: 'Ownership details updated successfully',
      color: 'success',
    })

    isEditing.value = false
    await refresh()
  }
  catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.statusMessage || 'Failed to update ownership details',
      color: 'error',
    })
  }
  finally {
    isUpdating.value = false
  }
}

const handleAssignOwner = async (payload: any) => {
  isUpdating.value = true

  try {
    await $fetch('/api/properties/unitownership', {
      method: 'POST',
      body: payload,
    })

    toast.add({
      title: 'Success',
      description: 'Unit owner assigned successfully',
      color: 'success',
    })

    showAssignOwnerModal.value = false
    await refresh()
  }
  catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.statusMessage || 'Failed to assign owner',
      color: 'error',
    })
  }
  finally {
    isUpdating.value = false
  }
}
</script>
