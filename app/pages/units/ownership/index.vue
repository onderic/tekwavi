<template>
  <BasePage
    title="My Units"
    icon="i-lucide-home"
    :status="status === 'pending'"
  >
    <template #headerActions>
      <UButton
        color="primary"
        variant="solid"
        label="Reload"
        icon="i-lucide-refresh-cw"
        size="sm"
        :loading="status === 'pending'"
        @click="refresh()"
      />
    </template>

    <UCard>
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <UInput
          v-model="searchQuery"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search by unit #, property, or tenant..."
        />

        <div class="flex flex-wrap items-center gap-3">
          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'All Status', value: 'all' },
              { label: 'Occupied', value: 'occupied' },
              { label: 'Vacant', value: 'vacant' },
            ]"
            placeholder="Filter by status"
            size="sm"
            class="min-w-48 w-full lg:w-auto"
          />

          <USelect
            v-model="propertyFilter"
            :items="propertyOptions"
            placeholder="Filter by property"
            size="sm"
            class="min-w-48 w-full lg:w-auto"
          />
        </div>
      </div>

      <UTable
        ref="table"
        :loading="status === 'pending'"
        loading-animation="carousel"
        :data="filteredUnits"
        :columns="columns"
        class="flex-1"
        :empty-state="{
          icon: 'i-lucide-home-x',
          label: 'No units found',
        }"
        @select="(row: any) => {
          if (row.original?._id) {
            navigateTo(`/units/ownership/${row.original._id}`)
          }
        }"
      >
        <template #unitNumber-cell="{ row }">
          <div class="flex items-center gap-3">
            <div
              class="min-w-10 h-10 flex items-center justify-center rounded-lg px-2"
              :class="row.original.status === 'occupied' ? 'bg-primary-100 border border-primary-300 text-primary-700 dark:bg-primary-900/50 dark:border-primary-700 dark:text-primary-300' : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600'"
            >
              <span class="font-medium text-xs whitespace-nowrap truncate">{{ row.original.unitNumber }}</span>
            </div>

            <div>
              <p class="font-medium text-highlighted">
                Unit {{ row.original.unitNumber }}
              </p>
              <p class="text-xs text-gray-500">
                {{ row.original.property?.propertyName || 'Unknown Property' }}
              </p>
            </div>
          </div>
        </template>

        <template #property-cell="{ row }">
          <div>
            <p class="font-medium">
              {{ row.original.property?.propertyName || 'Unknown' }}
            </p>
            <p class="text-xs text-gray-500">
              Floor {{ row.original.floor?.floorNumber || 'N/A' }}
            </p>
          </div>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="row.original.status === 'occupied' ? 'success' : 'neutral'"
            variant="subtle"
            class="capitalize"
          >
            {{ row.original.status }}
          </UBadge>
        </template>

        <template #type-cell="{ row }">
          <div class="capitalize font-medium">
            {{ row.original.type
              ? row.original.type.replace(/_/g, ' ')
              : 'Not specified' }}
          </div>
        </template>

        <template #rentAmount-cell="{ row }">
          <div class="font-medium">
            {{ row.original.rentAmount ? formatCurrency(row.original.rentAmount) : 'Not set' }}
          </div>
        </template>

        <template #ownership-cell="{ row }">
          <div
            v-if="row.original.ownership?.ownershipPercentage"
            class="text-sm"
          >
            <span class="font-medium">{{ row.original.ownership.ownershipPercentage }}%</span>
            <span class="text-gray-500"> ownership</span>
          </div>
          <div
            v-else
            class="text-gray-500 text-sm"
          >
            100% ownership
          </div>
        </template>
      </UTable>

      <div
        v-if="totalUnits > 0"
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-default pt-4 mt-4"
      >
        <div class="text-xs sm:text-sm text-gray-500 w-full sm:w-auto mb-2 sm:mb-0">
          Showing {{ Math.min(filteredUnits.length, totalUnits) }} of {{ totalUnits }} units
        </div>
      </div>
    </UCard>
  </BasePage>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'default',
})

interface UnitData {
  _id: string
  unitNumber: string
  status: string
  type: string
  rentAmount: number
  property: {
    _id: string
    propertyName: string
  }
  floor: {
    _id: string
    floorNumber: number
  }
  ownership: {
    ownershipPercentage?: number
    ownerName?: string
    ownershipType?: string
  }
}

const { user } = useUserSession()
const searchQuery = ref('')
const statusFilter = ref('all')
const propertyFilter = ref('all')

const columns: TableColumn<UnitData>[] = [
  {
    accessorKey: 'unitNumber',
    header: 'Unit',
  },
  {
    id: 'property',
    header: 'Property',
  },
  {
    id: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'rentAmount',
    header: 'Rent',
  },
  {
    id: 'ownership',
    header: 'Ownership',
  },
]

interface UnitsResponse {
  success: boolean
  count: number
  units: UnitData[]
}

const { data, status, refresh } = await useLazyAsyncData<UnitsResponse>(
  'OwnedUnits',
  async () => {
    if (!user.value?.ownedUnits || user.value.ownedUnits.length === 0) {
      return { success: true, count: 0, units: [] }
    }

    const unitIds = user.value.ownedUnits.join(',')
    return await $fetch<UnitsResponse>(`/api/properties/unitownership/owner?unitIds=${unitIds}`)
  },
  {
    watch: [user],
  },
)

const propertyOptions = computed(() => {
  const options = [{ label: 'All Properties', value: 'all' }]

  if (data.value?.units) {
    const uniqueProperties = new Map()

    data.value.units.forEach((unit) => {
      if (unit.property && !uniqueProperties.has(unit.property._id)) {
        uniqueProperties.set(unit.property._id, unit.property.propertyName)
      }
    })

    uniqueProperties.forEach((name, id) => {
      options.push({
        label: name,
        value: id,
      })
    })
  }

  return options
})

const filteredUnits = computed(() => {
  if (!data.value?.units) return []

  let units = [...data.value.units]

  // Apply search filter
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase()
    units = units.filter(unit =>
      unit.unitNumber.toLowerCase().includes(search)
      || unit.property?.propertyName?.toLowerCase().includes(search),
    )
  }

  // Apply status filter
  if (statusFilter.value !== 'all') {
    units = units.filter(unit => unit.status === statusFilter.value)
  }

  // Apply property filter
  if (propertyFilter.value !== 'all') {
    units = units.filter(unit => unit.property?._id === propertyFilter.value)
  }

  return units
})

const totalUnits = computed(() => data.value?.count || 0)

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount)
}
</script>
