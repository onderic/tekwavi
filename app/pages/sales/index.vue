<template>
  <BasePage
    :title="`${propertyInfo?.name || 'Property'} Sales`"
    icon="i-lucide-shopping-bag"
    :status="status === 'pending'"
  >
    <template #headerActions>
      <!-- <UButton
        color="primary"
        variant="solid"
        label="Reload"
        size="sm"
        :loading="isLoading"
        icon="i-lucide-refresh-cw"
        @click="refresh()"
      /> -->
    </template>

    <UCard>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <UInput
          v-model="searchQuery"
          class="w-full sm:max-w-sm"
          icon="i-lucide-search"
          placeholder="Search owners..."
        />

        <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <USelect
            v-model="ownershipTypeFilter"
            :items="[
              { label: 'All Types', value: 'all' },
              { label: 'Individual', value: 'individual' },
              { label: 'Company', value: 'company' },
              { label: 'Joint', value: 'joint' },
            ]"
            placeholder="Ownership type"
            size="sm"
            class="w-full sm:w-auto sm:min-w-40"
          />

          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'All Status', value: 'all' },
              { label: 'Owned', value: 'owned' },
              { label: 'Available', value: 'available' },
            ]"
            placeholder="Filter by status"
            size="sm"
            class="w-full sm:w-auto sm:min-w-40"
          />
        </div>
      </div>

      <UTable
        :loading="status === 'pending'"
        loading-animation="carousel"
        :data="filteredOwners"
        :columns="columns"
        sticky
        class="flex-1"
        :empty-state="{
          icon: 'i-lucide-users',
          label: 'No unit owners found',
        }"
      >
        <template #owner-cell="{ row }">
          <div
            v-if="row.original.hasOwnership"
            class="flex items-center gap-3"
          >
            <UAvatar
              :src="getAvatarUrl(row.original.ownerName)"
              :alt="row.original.ownerName"
              size="sm"
            />
            <div>
              <p class="font-medium text-sm">
                {{ row.original.ownerName || 'Unknown' }}
              </p>
              <p class="text-xs text-gray-500">
                {{ row.original.ownerEmail || 'No email' }}
              </p>
            </div>
          </div>
          <div
            v-else
            class="text-gray-400 italic"
          >
            No owner
          </div>
        </template>

        <template #unit-cell="{ row }">
          <div>
            <p class="font-medium">
              {{ row.original.unitNumber }}
            </p>
            <p class="text-xs text-gray-500 capitalize">
              {{ row.original.type?.includes('bedunit')
                ? row.original.type.replace(/_/g, '').replace(/(\d)([a-zA-Z])/g, '$1 $2').replace('bedunit', 'bed unit')
                : row.original.type?.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([a-z])(unit)/g, '$1 $2') || 'Not specified' }}
            </p>
          </div>
        </template>

        <template #phone-cell="{ row }">
          <div class="text-sm">
            {{ row.original.hasOwnership ? (row.original.ownerPhone || 'Not provided') : '-' }}
          </div>
        </template>

        <template #purchaseAmount-cell="{ row }">
          <div class="font-medium">
            {{ row.original.hasOwnership ? formatCurrency(row.original.purchaseAmount || 0) : '-' }}
          </div>
        </template>

        <template #purchaseDate-cell="{ row }">
          {{ row.original.hasOwnership && row.original.purchaseDate ? formatDate(row.original.purchaseDate) : '-' }}
        </template>

        <template #ownershipType-cell="{ row }">
          <UBadge
            v-if="row.original.hasOwnership"
            :color="getOwnershipTypeColor(row.original.ownershipType)"
            variant="subtle"
            class="capitalize"
          >
            {{ row.original.ownershipType }}
          </UBadge>
          <span v-else>-</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="row.original.hasOwnership ? 'success' : 'neutral'"
            variant="subtle"
          >
            {{ row.original.hasOwnership ? 'Owned' : 'Available' }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-2">
            <UButton
              v-if="row.original.hasOwnership"
              color="primary"
              variant="ghost"
              icon="i-lucide-eye"
              size="xs"
              @click="viewOwnerDetails(row.original)"
            />
            <UButton
              v-if="!row.original.hasOwnership"
              color="success"
              variant="ghost"
              icon="i-lucide-user-plus"
              size="xs"
              @click="assignOwnerToUnit(row.original)"
            />
            <UButton
              v-if="row.original.hasOwnership && row.original.isActive"
              color="error"
              variant="ghost"
              icon="i-lucide-user-x"
              size="xs"
            />
          </div>
        </template>
      </UTable>

      <div
        v-if="totalOwners > 0"
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-default pt-4 mt-4"
      >
        <div class="text-xs sm:text-sm text-gray-500 w-full sm:w-auto mb-2 sm:mb-0 break-words">
          Showing {{ (currentPage - 1) * limit + 1 }}-{{ Math.min(currentPage * limit, totalOwners) }} of {{ totalOwners }} units
        </div>
        <div class="flex items-center gap-1.5 self-end sm:self-auto">
          <UPagination
            v-model:page="currentPage"
            :page-count="totalPages"
            :total="totalOwners"
            :items-per-page="limit"
            class="flex-shrink-0"
          />
        </div>
      </div>
    </UCard>

    <UModal
      v-model:open="showDetailModal"
      :title="`Owner Details: ${selectedOwner?.ownerName || 'Unknown'}`"
    >
      <UCard v-if="selectedOwner">
        <div class="space-y-6">
          <div>
            <h4 class="text-sm font-medium text-gray-500 mb-2">
              Owner Information
            </h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-500">
                  Name
                </p>
                <p class="font-medium">
                  {{ selectedOwner.ownerName || 'Unknown' }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500">
                  Phone
                </p>
                <p class="font-medium">
                  {{ selectedOwner.ownerPhone || 'Not provided' }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500">
                  Email
                </p>
                <p class="font-medium">
                  {{ selectedOwner.ownerEmail || 'Not provided' }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500">
                  Ownership Type
                </p>
                <p class="font-medium capitalize">
                  {{ selectedOwner.ownershipType }}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-sm font-medium text-gray-500 mb-2">
              Unit Information
            </h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-500">
                  Unit Number
                </p>
                <p class="font-medium">
                  {{ selectedOwner.unitNumber }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500">
                  Property
                </p>
                <p class="font-medium">
                  {{ propertyInfo?.name || 'Unknown Property' }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500">
                  Purchase Date
                </p>
                <p class="font-medium">
                  {{ formatDate(selectedOwner.purchaseDate) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500">
                  Purchase Amount
                </p>
                <p class="font-medium">
                  {{ formatCurrency(selectedOwner.purchaseAmount || 0) }}
                </p>
              </div>
            </div>
          </div>

          <div v-if="selectedOwner.titleDeedNumber || selectedOwner.ownershipNotes">
            <h4 class="text-sm font-medium text-gray-500 mb-2">
              Additional Details
            </h4>
            <div class="space-y-2">
              <div v-if="selectedOwner.titleDeedNumber">
                <p class="text-xs text-gray-500">
                  Title Deed Number
                </p>
                <p class="font-medium">
                  {{ selectedOwner.titleDeedNumber }}
                </p>
              </div>
              <div v-if="selectedOwner.ownershipNotes">
                <p class="text-xs text-gray-500">
                  Notes
                </p>
                <p class="text-sm">
                  {{ selectedOwner.ownershipNotes }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </UModal>

    <ClientOnly>
      <UsersAddOwner
        :open="showOwnerModal"
        :loading="isLoading"
        :selected-unit="selectedUnitWithProperty"
        @save="handleAddOwner"
        @update:open="showOwnerModal = $event"
      />
    </ClientOnly>
  </BasePage>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

interface UnitOwnership {
  _id: string
  unitId: string
  unitNumber: string
  hasOwnership: boolean
  ownerId: string
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  purchaseDate: Date
  purchaseAmount: number
  ownershipType: 'individual' | 'company' | 'joint'
  ownershipPercentage: number
  isActive: boolean
  titleDeedNumber?: string
  registrationDate?: Date
  ownershipNotes?: string
  status?: string
  type?: string
  category?: string
}

interface PropertyInfo {
  _id: string
  name: string
}

definePageMeta({
  title: 'Unit Owners',
})

const isLoading = ref(false)
const showOwnerModal = ref(false)
const showDetailModal = ref(false)
const selectedOwner = ref<UnitOwnership | null>(null)
const selectedUnit = ref<UnitOwnership | null>(null)
const searchQuery = ref('')
const ownershipTypeFilter = ref('all')
const statusFilter = ref('all')
const currentPage = ref(1)
const limit = ref(20)

const { formatCurrency, formatDate } = useFormatters()
const toast = useToast()

const columns: TableColumn<UnitOwnership>[] = [
  {
    accessorKey: 'owner',
    header: 'Owner',
  },
  {
    accessorKey: 'unit',
    header: 'Unit',
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
  },
  {
    accessorKey: 'purchaseAmount',
    header: 'Sales Amount',
  },
  {
    accessorKey: 'purchaseDate',
    header: 'Sales Date',
  },
  {
    accessorKey: 'ownershipType',
    header: 'Type',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
  },
]

const { propertyId, propertyChanged } = useCurrentProperty()

const { data, status, refresh } = await useLazyAsyncData(
  'UnitOwners',
  () => {
    if (!propertyId.value) return Promise.resolve(null)

    const queryParams = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: limit.value.toString(),
      search: searchQuery.value,
      propertyId: propertyId.value,
      ownershipType: ownershipTypeFilter.value !== 'all' ? ownershipTypeFilter.value : '',
      status: statusFilter.value !== 'all' ? statusFilter.value : '',
    })

    return $fetch<{
      property: PropertyInfo
      owners: UnitOwnership[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }>(`/api/properties/unitownership?${queryParams.toString()}`)
  },
  {
    watch: [currentPage, limit, searchQuery, propertyId, computed(() => propertyChanged), ownershipTypeFilter, statusFilter],
    default: () => ({
      property: null,
      owners: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      },
    }),
  },
)

const propertyInfo = computed(() => data.value?.property || null)
const owners = computed(() => data.value?.owners || [])
const totalPages = computed(() => data.value?.pagination.pages || 0)
const totalOwners = computed(() => data.value?.pagination.total || 0)

const filteredOwners = computed(() => {
  let filtered = [...owners.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(owner =>
      owner.ownerName?.toLowerCase().includes(query)
      || owner.ownerEmail?.toLowerCase().includes(query)
      || owner.ownerPhone?.toLowerCase().includes(query)
      || owner.unitNumber?.toLowerCase().includes(query),
    )
  }

  return filtered
})

// Computed property to add property info to selected unit
const selectedUnitWithProperty = computed(() => {
  if (!selectedUnit.value || !propertyInfo.value) return null

  return {
    ...selectedUnit.value,
    propertyId: propertyInfo.value._id,
    propertyName: propertyInfo.value.name,
  }
})

const getAvatarUrl = (name: string) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'UN'
  return `https://ui-avatars.com/api/?name=${initials}&background=0D8ABC&color=fff`
}

const getOwnershipTypeColor = (type: string) => {
  const colors: Record<string, any> = {
    individual: 'primary',
    company: 'warning',
    joint: 'secondary',
  }
  return colors[type] || 'gray'
}

const viewOwnerDetails = (unit: UnitOwnership) => {
  selectedOwner.value = unit
  navigateTo(`/sales/${unit._id}`)
}

const assignOwnerToUnit = (unit: UnitOwnership) => {
  selectedUnit.value = unit
  showOwnerModal.value = true
}

const handleAddOwner = async (payload: any) => {
  isLoading.value = true

  try {
    await $fetch('/api/properties/unitownership', {
      method: 'POST',
      body: payload,
    })

    toast.add({
      title: 'Success',
      description: 'Unit owner added successfully',
      color: 'success',
    })

    showOwnerModal.value = false
    await refresh()
  }
  catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.statusMessage || 'Failed to add owner',
      color: 'error',
    })
  }
  finally {
    isLoading.value = false
  }
}
</script>

<style>
</style>
