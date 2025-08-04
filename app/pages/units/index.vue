<template>
  <BasePage
    :title="data?.property?.propertyName ? `Units - ${data.property.propertyName}` : 'Units'"
    icon="i-lucide-door-open"
    :status="status === 'pending'"
  >
    <template #headerActions>
      <!-- <UButton
        color="primary"
        variant="solid"
        label="Reload"
        icon="i-lucide-refresh-cw"
        size="sm"
        :loading="status === 'pending'"
        @click="refresh()"
      /> -->
    </template>

    <UCard>
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <UInput
          v-model="searchQuery"
          class="w-full sm:max-w-sm"
          icon="i-lucide-search"
          placeholder="Search by unit #, floor #, or tenant..."
        />

        <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'All Status', value: 'all' },
              { label: 'Occupied', value: 'occupied' },
              { label: 'Vacant', value: 'vacant' },
            ]"
            placeholder="Filter by status"
            size="sm"
            class="min-w-40 w-full sm:w-auto"
          />

          <USelect
            v-model="floorFilter"
            :items="floorOptions"
            placeholder="Filter by floor"
            size="sm"
            class="min-w-40 w-full sm:w-auto"
          />
        </div>
      </div>

      <UTable
        ref="table"
        :loading="status === 'pending'"
        loading-animation="carousel"
        :data="data?.units || []"
        :columns="columns"
        class="flex-1"
        :empty-state="{
          icon: 'i-lucide-door-closed',
          label: 'No units found',
        }"
        @select="(row: any) => {
          if (row.original?._id) {
            navigateTo(`/units/${row.original._id}?propertyId=${propertyId}`)
          }
        }"
      >
        <template #unitNumber-cell="{ row }">
          <div class="flex items-center gap-3">
            <div
              class="min-w-10 h-10 flex items-center justify-center rounded-lg px-2"
              :class="row.original.isOccupied ? 'bg-primary-100 border border-primary-300 text-primary-700 dark:bg-primary-900/50 dark:border-primary-700 dark:text-primary-300' : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600'"
            >
              <span class="font-medium text-xs whitespace-nowrap truncate">{{ row.original.unitNumber }}</span>
            </div>
            <div>
              <p class="font-medium text-highlighted">
                Unit {{ row.original.unitNumber }}
              </p>
              <p class="text-xs text-gray-500">
                Floor {{ row.original.floorNumber }}
              </p>
            </div>
          </div>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="row.original.isOccupied ? 'success' : 'neutral'"
            variant="subtle"
            class="capitalize"
          >
            {{ row.original.isOccupied ? 'Occupied' : 'Vacant' }}
          </UBadge>
        </template>
        <template #type-cell="{ row }">
          <div class="capitalize font-medium">
            {{ row.original.type?.includes('bedunit')
              ? row.original.type.replace(/_/g, '').replace(/(\d)([a-zA-Z])/g, '$1 $2').replace('bedunit', 'bed unit')
              : row.original.type?.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([a-z])(unit)/g, '$1 $2') || 'Not specified' }}
          </div>
        </template>
        <template #furnishing-cell="{ row }">
          <div class="capitalize font-medium">
            {{ row.original.furnishing
              ? row.original.furnishing.replace(/_/g, ' ')
              : 'Not specified' }}
          </div>
        </template>

        <template #rentAmount-cell="{ row }">
          <div class="font-medium">
            {{ row.original.rentAmount ? formatCurrency(row.original.rentAmount) : 'Not set' }}
          </div>
        </template>

        <template #tenant-cell="{ row }">
          <div
            v-if="row.original.tenantName"
            class="flex items-center gap-2"
          >
            <UAvatar
              size="sm"
              :text="getTenantInitials(row.original.tenantName)"
              :alt="row.original.tenantName"
            />
            {{ row.original.tenantName }}
          </div>
          <div
            v-else
            class="text-gray-500 text-sm"
          >
            No tenant
          </div>
        </template>
      </UTable>

      <div
        v-if="data?.pagination?.total"
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-default pt-4 mt-4"
      >
        <div class="text-xs sm:text-sm text-gray-500 w-full sm:w-auto mb-2 sm:mb-0">
          Showing {{ (data.pagination.page - 1) * data.pagination.limit + 1 }}-{{ Math.min(data.pagination.page * data.pagination.limit, data.pagination.total) }}
          of {{ data.pagination.total }} units
        </div>
        <UPagination
          v-model:page="currentPage"
          :page-count="data.pagination.pages"
          :total="data.pagination.total"
          :items-per-page="limit"
          class="flex-shrink-0"
        />
      </div>
    </UCard>
  </BasePage>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import type { Unit } from '~/types/property'

definePageMeta({
  layout: 'default',
})

type ExtendedUnit = Unit & {
  floorId: string
  floorNumber: number
}

const { propertyId, propertyChanged } = useCurrentProperty()

const currentPage = ref(1)
const limit = ref(20)
const searchQuery = ref('')
const statusFilter = ref('all')
const floorFilter = ref('all')

const columns: TableColumn<ExtendedUnit>[] = [
  {
    accessorKey: 'unitNumber',
    header: 'Unit',
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
    accessorKey: 'furnishing',
    header: 'Furnishing',
  },
  {
    accessorKey: 'rentAmount',
    header: 'Rent',
  },
  {
    id: 'tenant',
    header: 'Tenant',
  },
]

interface UnitsResponse {
  property: {
    _id: string
    propertyName: string
  }
  units: ExtendedUnit[]
  floors?: { _id: string, floorNumber: number }[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const { data, status } = await useLazyAsyncData<UnitsResponse>(
  'PropertyUnits',
  () => {
    if (!propertyId.value) return Promise.resolve(null as unknown as UnitsResponse)

    const queryParams = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: limit.value.toString(),
      search: searchQuery.value,
      status: statusFilter.value,
      floorId: floorFilter.value !== 'all' ? floorFilter.value : '',
    })

    return $fetch<UnitsResponse>(`/api/properties/${propertyId.value}/units?${queryParams.toString()}`)
  },
  {
    watch: [currentPage, limit, searchQuery, statusFilter, floorFilter, propertyId, computed(() => propertyChanged)],
  },
)

const floorOptions = computed(() => {
  const options = [{ label: 'All Floors', value: 'all' }]

  if (data.value?.floors) {
    data.value.floors.forEach((floor) => {
      options.push({
        label: `Floor ${floor.floorNumber}`,
        value: floor._id,
      })
    })
  }

  return options
})

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount)
}

function getTenantInitials(name: string) {
  if (!name) return ''

  const parts = name.split(' ')
  if (parts.length >= 2) {
    return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
  }

  return name.substring(0, 2).toUpperCase()
}

watch([searchQuery, statusFilter, floorFilter], () => {
  currentPage.value = 1
})

watch(limit, () => {
  currentPage.value = 1
})
</script>
