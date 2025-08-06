<template>
  <BasePage
    title="Listing"
    description="Manage and view all properties in the system"
    icon="i-lucide-list"
    :status="loading"
  >
    <template #headerActions>
      <UButton
        v-if="hasProperties || data?.properties?.length"
        color="primary"
        variant="solid"
        label="Add Property"
        icon="i-lucide-plus"
        size="sm"
        @click="showAddModal = true"
      />
    </template>
    <div>
      <div
        v-if="!loading && totalProperties === 0 && !hasProperties"
        class="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-900"
      >
        <div class="text-center max-w-md mx-auto">
          <div class="mb-6">
            <div class="w-20 h-20 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <UIcon
                name="i-lucide-building-2"
                class="w-10 h-10 text-gray-600 dark:text-gray-400"
              />
            </div>
          </div>

          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to {{ useRuntimeConfig().public.APP_NAME }}
          </h3>

          <p class="text-gray-600 dark:text-gray-400 mb-8">
            Start by adding your first property. You'll be able to manage units, tenants, and track occupancy all in one place.
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <UButton
              color="primary"
              variant="solid"
              label="Add Your First Property"
              icon="i-lucide-plus"
              size="lg"
              @click="showAddModal = true"
            />

            <UButton
              color="neutral"
              variant="outline"
              label="Logout"
              icon="i-lucide-log-out"
              size="lg"
              @click="logout"
            />
          </div>

          <div class="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-check-circle"
                class="w-4 h-4 text-gray-400 dark:text-gray-500"
              />
              <span>Easy setup</span>
            </div>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-check-circle"
                class="w-4 h-4 text-gray-400 dark:text-gray-500"
              />
              <span>Manage units</span>
            </div>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-check-circle"
                class="w-4 h-4 text-gray-400 dark:text-gray-500"
              />
              <span>Track tenants</span>
            </div>
          </div>
        </div>
      </div>

      <UCard
        v-else
        class="mb-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <UInput
            v-model="searchQuery"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="Search properties..."
          />

          <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <USelect
              v-model="categoryFilter"
              :items="categoryOptions"
              placeholder="Filter by category"
              size="sm"
              class="w-full sm:w-auto"
            />

            <USelect
              v-model="statusFilter"
              :items="statusOptions"
              placeholder="Filter by occupancy"
              size="sm"
              class="w-full sm:w-auto"
            />
          </div>
        </div>

        <UTable
          :loading="loading"
          :data="data?.properties || []"
          :columns="columns"
          :empty-state="{
            icon: 'i-lucide-search',
            label: 'No properties found',
            description: 'Try adjusting your filters or search query.',
          }"
          @select="async (row: any) => {
            if (row.original) {
              setCurrentProperty(row.original._id.toString())
              await navigateTo('/properties', { replace: true })
            }
          }"
        >
          <template #name-cell="{ row }">
            <div class="flex items-center gap-3">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <UIcon
                    name="i-lucide-building-2"
                    class="w-5 h-5 text-gray-500"
                  />
                </div>
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ row.original.propertyName }}
                </p>
                <p class="text-sm text-gray-500 truncate max-w-xs">
                  {{ formatAddress(row.original.address) }}
                </p>
              </div>
            </div>
          </template>

          <template #category-cell="{ row }">
            <UBadge class="capitalize">
              {{ row.original.categoryName }}
            </UBadge>
          </template>

          <template #occupancy-cell="{ row }">
            <div class="text-center">
              <div class="flex items-center justify-center gap-2">
                <div class="w-2 h-2 rounded-full bg-green-500" />
                <span class="text-sm font-medium">{{ row.original.stats?.occupiedUnits || 0 }}</span>
                <span class="text-gray-400">/</span>
                <span class="text-sm text-gray-500">{{ row.original.stats?.totalUnits || 0 }}</span>
              </div>
              <div class="text-xs text-gray-500 mt-1">
                {{ row.original.stats?.vacancyRate || '0%' }} vacancy
              </div>
            </div>
          </template>

          <template #floors-cell="{ row }">
            <div class="text-center">
              <span class="font-medium">{{ row.original.stats?.totalFloors || row.original.floors?.length || 0 }}</span>
              <span class="text-gray-500 text-xs block">floors</span>
            </div>
          </template>

          <template #units-cell="{ row }">
            <div class="text-center">
              <span class="font-medium">{{ row.original.stats?.totalUnits || 0 }}</span>
              <span class="text-gray-500 text-xs block">units</span>
            </div>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex items-center gap-2">
              <UButton
                color="error"
                variant="solid"
                icon="i-lucide-trash"
                size="xs"
                @click="deleteProperty(row.original._id)"
              />
            </div>
          </template>
        </UTable>

        <div
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-default pt-4 mt-4"
        >
          <div class="text-xs sm:text-sm text-gray-500 w-full sm:w-auto mb-2 sm:mb-0 break-words">
            Showing {{ (currentPage - 1) * perPage + 1 }}-{{ Math.min(currentPage * perPage, totalProperties) }} of {{ totalProperties }} properties
          </div>
          <div class="flex items-center gap-1.5 self-end sm:self-auto">
            <UPagination
              v-model="currentPage"
              :page-count="Math.ceil(totalProperties / perPage)"
              :total="totalProperties"
              :items-per-page="perPage"
            />
          </div>
        </div>
      </UCard>
    </div>

    <ClientOnly>
      <PropertyAdd
        v-model:is-open="showAddModal"
        @property:added="refresh"
      />
    </ClientOnly>
  </BasePage>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import type { Property } from '~/types/property'
import { FlatCategory } from '~/types/property'

const { user } = useUserSession()
const { logout } = useLogout()

definePageMeta({
  title: 'Properties Listing',
})

const hasProperties = computed(() => {
  return user.value?.ownedProperties && user.value.ownedProperties.length > 0
})

watch(hasProperties, (hasProps) => {
  setPageLayout(hasProps ? 'default' : 'empty')
}, { immediate: true })

const loading = ref(true)
const showAddModal = ref(false)

const searchQuery = ref('')
const categoryFilter = ref('all')
const statusFilter = ref('all')
const currentPage = ref(1)
const perPage = ref(30)
const { setCurrentProperty } = useCurrentProperty()

const categoryOptions = [
  { label: 'All Categories', value: 'all' },
  { label: 'Residential', value: FlatCategory.RESIDENTIAL },
  { label: 'Commercial', value: FlatCategory.COMMERCIAL },
]

const statusOptions = [
  { label: 'All Properties', value: 'all' },
  { label: 'Fully Occupied', value: 'full' },
  { label: 'Has Vacancies', value: 'vacant' },
  { label: 'Empty', value: 'empty' },
]

const { data, status, refresh } = await useLazyAsyncData(
  'properties',
  () => {
    const queryParams = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: perPage.value.toString(),
    })

    if (categoryFilter.value !== 'all') queryParams.append('category', categoryFilter.value)
    if (statusFilter.value !== 'all') queryParams.append('occupancy', statusFilter.value)
    if (searchQuery.value) queryParams.append('search', searchQuery.value)

    return $fetch<{
      properties: Property[]
      pagination: {
        total: number
        pages: number
      }
    }>(`/api/properties/list?${queryParams.toString()}`)
  },
  {
    watch: [currentPage, perPage, categoryFilter, statusFilter, searchQuery],
    server: false,
  },
)

watch(status, (newStatus) => {
  loading.value = newStatus === 'pending'
})

const totalProperties = computed(() => data.value?.pagination?.total ?? 0)

const columns: TableColumn<Property>[] = [
  { accessorKey: 'propertyName', header: 'Property' },
  { accessorKey: 'categoryName', header: 'Category' },
  { accessorKey: 'stats.totalFloors', header: 'Floors' },
  { accessorKey: 'stats.totalUnits', header: 'Units' },
  { accessorKey: 'stats.occupiedUnits', header: 'Occupied' },
  { accessorKey: 'stats.vacancyRate', header: 'Vacancy' },
  { accessorKey: 'actions', header: 'Actions' },
]

function formatAddress(address: any) {
  if (!address) return 'No address'
  return `${address.street}, ${address.city}`
}

function deleteProperty(propertyId: any) {
  if (confirm('Are you sure you want to delete this property?')) {
    $fetch(`/api/properties/update/delete/${propertyId}`, {
      method: 'POST',
    })
      .then(() => {
        refresh()
      })
      .catch((error) => {
        console.error('Error deleting property:', error)
      })
  }
}
</script>
