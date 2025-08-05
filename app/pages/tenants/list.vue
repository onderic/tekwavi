<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useFormatters } from '~/composables/formatters'
import type { Tenant } from '~/types/tenant'

const UBadge = resolveComponent('UBadge')
const UAvatar = resolveComponent('UAvatar')

definePageMeta({
  title: 'Tenants',
})

interface ApiResponse {
  success: boolean
  data: {
    tenants: Tenant[]
    pagination: {
      total: number
      page: number
      limit: number
      pages: number
      hasNext: boolean
      hasPrev: boolean
    }
    filters: {
      propertyId: string
      search: string | null
      status: string | null
      rentalType: string | null
    }
  }
}
const { propertyId } = useCurrentProperty()
const { formatCurrency, formatDate } = useFormatters()

const currentPage = ref(1)
const limit = ref(20)
const searchQuery = ref('')
const statusFilter = ref('all')
const rentalTypeFilter = ref('all')

const columns: TableColumn<Tenant>[] = [
  {
    accessorKey: 'name',
    header: 'Tenant Details',
  },
  {
    accessorKey: 'unitNumber',
    header: 'Unit',
  },
  {
    accessorKey: 'rentalType',
    header: 'Type',
  },
  {
    id: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'leaseStartDate',
    header: 'Tenant Since',
  },
]

const { data, status } = await useLazyAsyncData<ApiResponse>(
  'tenants_list',
  () => {
    if (!propertyId.value) return Promise.resolve(null as unknown as ApiResponse)

    const queryParams = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: limit.value.toString(),
      search: searchQuery.value,
      status: statusFilter.value,
      rentalType: rentalTypeFilter.value !== 'all' ? rentalTypeFilter.value : '',
    })

    if (propertyId.value) {
      queryParams.append('propertyId', propertyId.value)
    }

    return $fetch<ApiResponse>(`/api/tenants?${queryParams.toString()}`)
  },
  {
    watch: [currentPage, limit, searchQuery, statusFilter, rentalTypeFilter, propertyId],
    server: false,
  },
)

const tenants = computed(() => {
  return (data.value?.data?.tenants || []).map(tenant => ({
    ...tenant,
    name: `${tenant.firstName} ${tenant.lastName}`,
  }))
})

function getInitials(firstName: string, lastName?: string): string {
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : ''
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : ''
  return firstInitial + (lastInitial || '')
}

function getContactInfo(phone: string, email?: string): string {
  return email ? `${phone} • ${email}` : phone
}

watch([searchQuery, statusFilter, rentalTypeFilter], () => {
  currentPage.value = 1
})

watch(limit, () => {
  currentPage.value = 1
})
</script>

<template>
  <BasePage
    title="Tenants"
    icon="i-lucide-users"
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
          placeholder="Search by name, phone, email, unit..."
        />

        <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'All Status', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]"
            placeholder="Filter by status"
            size="sm"
            class="w-full sm:w-auto"
          />

          <USelect
            v-model="rentalTypeFilter"
            :items="[
              { label: 'All Types', value: 'all' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Fixed', value: 'fixed' },
            ]"
            placeholder="Filter by type"
            size="sm"
            class="w-full sm:w-auto"
          />
        </div>
      </div>

      <UTable
        ref="table"
        :loading="status === 'pending'"
        loading-animation="carousel"
        :data="tenants"
        :columns="columns"
        class="flex-1"
        :empty-state="{
          icon: 'i-lucide-users',
          label: 'No tenants found',
        }"
        @select="(row: any) => {
          if (row.original?._id) {
            navigateTo(`/units/${row.original.unitId}?propertyId=${propertyId}`)
          }
        }"
      >
        <template #name-cell="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar
              size="md"
              :text="getInitials(row.original.firstName, row.original.lastName)"
              :alt="`${row.original.firstName} ${row.original.lastName} avatar`"
            />
            <div class="min-w-0 flex-1">
              <p class="font-medium text-highlighted">
                {{ row.original.firstName }} {{ row.original.lastName }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                {{ getContactInfo(row.original.phoneNumber, row.original.email) }}
              </p>
            </div>
          </div>
        </template>

        <template #unitNumber-cell="{ row }">
          <div class="flex items-center gap-3">
            <div
              class="min-w-10 h-10 flex items-center justify-center rounded-lg px-2 bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 border border-primary-200 dark:border-primary-700"
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

        <template #rentAmount-cell="{ row }">
          <div class="font-medium">
            {{ row.original.rentAmount ? formatCurrency(row.original.rentAmount) : 'Not set' }}
          </div>
        </template>

        <template #rentalType-cell="{ row }">
          <div
            :color="row.original.rentalType === 'monthly' ? 'primary' : 'tertiary'"
            variant="subtle"
            class="capitalize"
          >
            {{ row.original.rentalType?.replace(/_/g, ' ') || '' }}
          </div>
        </template>

        <template #leaseStatus-cell="{ row }">
          <UBadge
            :color="(() => {
              const leaseEndDate = new Date(row.original.leaseEndDate)
              const now = new Date()
              const daysUntilExpiry = Math.ceil((leaseEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

              if (daysUntilExpiry < 0) return 'error'
              if (daysUntilExpiry <= 30) return 'warning'
              return 'success'
            })()"
            variant="subtle"
            class="capitalize"
          >
            {{
              (() => {
                const leaseEndDate = new Date(row.original.leaseEndDate)
                const now = new Date()
                const daysUntilExpiry = Math.ceil((leaseEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

                if (daysUntilExpiry < 0) return 'Expired'
                if (daysUntilExpiry <= 30) return 'Expiring Soon'
                return 'Active'
              })()
            }}
          </UBadge>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="row.original.isActive ? 'success' : 'neutral'"
            variant="subtle"
            class="capitalize"
          >
            {{ row.original.isActive ? 'Active' : 'Inactive' }}
          </UBadge>
        </template>
        <template #leaseStartDate-cell="{ row }">
          {{ formatDate(row.original.leaseStartDate) }}
        </template>
      </UTable>

      <div
        v-if="data?.data?.pagination?.total"
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-default pt-4 mt-4"
      >
        <div class="text-xs sm:text-sm text-gray-500 w-full sm:w-auto mb-2 sm:mb-0">
          Showing {{ (data.data.pagination.page - 1) * data.data.pagination.limit + 1 }}-{{ Math.min(data.data.pagination.page * data.data.pagination.limit, data.data.pagination.total) }}
          of {{ data.data.pagination.total }} tenants
        </div>
        <UPagination
          v-model:page="currentPage"
          :page-count="data.data.pagination.pages"
          :total="data.data.pagination.total"
          :items-per-page="limit"
          class="flex-shrink-0"
        />
      </div>
    </UCard>
  </BasePage>
</template>
