<template>
  <BasePage
    :title="data?.property?.propertyName || 'Property Details'"
    icon="i-lucide-layout-dashboard"
    :status="status === 'pending'"
  >
    <template #headerActions>
      <UButton
        color="primary"
        variant="solid"
        label="Edit Property"
        icon="i-lucide-edit"
        size="sm"
        @click="editProperty = true"
      />
    </template>

    <div
      v-if="data?.property"
      class="space-y-6"
    >
      <UAlert
        v-if="(data?.stats?.totalUnits || 0) === 0 && !showInfoDismissed"
        icon="i-lucide-info"
        color="primary"
        variant="soft"
        title="Getting Started"
        :closable="true"
        @close="showInfoDismissed = true"
      >
        <template #description>
          <div class="space-y-2">
            <p class="text-sm font-medium">
              Set up floors and units to get started with your property management.
            </p>
            <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>• Use the <strong>"Add Floor"</strong> button to create additional floors</p>
              <p>• Click the <strong>plus (+)</strong> and <strong>edit</strong> icons within each floor to add and manage units</p>
              <p>• Use <strong>"Edit Property"</strong> in the header to update property details</p>
            </div>
          </div>
        </template>
      </UAlert>

      <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <UCard>
          <div class="flex items-center">
            <div class="rounded-full bg-tertiary-50 dark:bg-tertiary-900 p-3 mr-3">
              <UIcon
                name="i-lucide-building"
                class="w-5 h-5 text-tertiary-500 dark:text-tertiary-400"
              />
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Total Floors
              </p>
              <p class="text-xl font-medium text-gray-900 dark:text-white">
                {{ data?.stats?.totalFloors || 0 }}
              </p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center">
            <div class="rounded-full bg-primary-50 dark:bg-primary-900 p-3 mr-3">
              <UIcon
                name="i-lucide-home"
                class="w-5 h-5 text-primary-500 dark:text-primary-400"
              />
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Total Units
              </p>
              <p class="text-xl font-medium text-gray-900 dark:text-white">
                {{ data?.stats?.totalUnits || 0 }}
              </p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center">
            <div class="rounded-full bg-secondary-50 dark:bg-secondary-900 p-3 mr-3">
              <UIcon
                name="i-lucide-key"
                class="w-5 h-5 text-secondary-500 dark:text-secondary-400"
              />
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Occupied Units
              </p>
              <p class="text-xl font-medium text-gray-900 dark:text-white">
                {{ data?.stats?.occupiedUnits || 0 }}
              </p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center">
            <div class="rounded-full bg-success-50 dark:bg-success-900 p-3 mr-3">
              <UIcon
                name="i-lucide-pie-chart"
                class="w-5 h-5 text-success-500 dark:text-success-400"
              />
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Vacancy Rate
              </p>
              <p class="text-xl font-medium text-gray-900 dark:text-white">
                {{ data?.stats?.vacancyRate || '0%' }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <UCard class="mb-8">
        <template #header>
          <div class="flex flex-row justify-between items-center gap-2">
            <div class="flex sm:hidden items-center">
              <UBadge
                color="secondary"
              >
                <div class="flex items-center gap-1">
                  <UIcon
                    name="i-lucide-tag"
                    class="w-4 h-4"
                  />
                  {{ data?.property.categoryName }}
                </div>
              </UBadge>
            </div>
            <div class="hidden sm:flex flex-wrap items-center">
              <h2 class="text-lg font-medium text-gray-900 dark:text-white mr-2">
                {{ data?.property.propertyName }}
              </h2>
              <div class="flex items-center">
                <span class="text-sm text-gray-500 dark:text-gray-400 mr-2">Floors & Units Layout</span>
                <UBadge
                  color="secondary"
                  size="sm"
                >
                  {{ data?.property.categoryName }}
                </UBadge>
              </div>
            </div>

            <div class="gap-2 flex items-center">
              <UButton
                color="primary"
                variant="solid"
                label="Listing"
                icon="i-lucide-list"
                size="sm"
                @click="navigateTo(`/units/?propertyId=${propertyId}`)"
              />
              <UButton
                color="primary"
                variant="solid"
                label="Add Floor"
                icon="i-lucide-plus"
                size="sm"
                @click="showFloor = true"
              />
            </div>
          </div>
        </template>
        <div
          v-if="data?.property.floors && data?.property.floors.length"
          class="space-y-6"
        >
          <div
            v-for="(floor, floorIndex) in data?.property.floors"
            :key="floorIndex"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-2"
          >
            <div class="flex items-center justify-between mb-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
              <div class="flex items-center">
                <UIcon
                  name="i-lucide-layers"
                  class="mr-2 text-secondary"
                />
                <h3 class="font-medium text-gray-800 dark:text-gray-200 flex items-center flex-1">
                  {{ floor.floorNumber }}
                  <UBadge
                    class="ml-2"
                    size="sm"
                  >
                    {{ floor.units ? floor.units.length : 0 }} units
                  </UBadge>
                </h3>
              </div>
              <div>
                <UButton
                  v-if="!floor.units || floor.units.length === 0"
                  color="primary"
                  variant="solid"
                  icon="i-lucide-plus"
                  class="ml-2"
                  size="sm"
                  @click="addUnits(floor)"
                />
                <UButton
                  v-if="floor.units && floor.units.length > 0"
                  color="primary"
                  variant="solid"
                  icon="i-lucide-edit-3"
                  class="ml-2"
                  size="sm"
                  title="Edit Units"
                  @click="editUnits(floor)"
                />
              </div>
            </div>

            <div class="flex flex-wrap p-2 bg-gray-100 dark:bg-gray-800 rounded-lg min-h-[100px]">
              <div class="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center border-r-4 border-gray-400 dark:border-gray-600 mr-2">
                <UIcon
                  name="i-lucide-circle-dot"
                  class="text-gray-600 dark:text-gray-400"
                />
              </div>

              <div class="grid grid-cols-3 lg:grid-cols-8 gap-2 flex-1">
                <div
                  v-for="(unit, unitIndex) in floor.units"
                  :key="unitIndex"
                  class="h-12 flex items-center justify-center rounded-md border cursor-pointer transition-colors"
                  :class="[
                    unit.isOccupied
                      ? 'bg-primary-100 dark:bg-primary-900/50 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600',
                  ]"
                  @click="showUnitDetails(unit._id)"
                >
                  <div class="text-xs text-center">
                    {{ unit.unitNumber || `R${unitIndex + 1}` }}
                    <UIcon
                      v-if="unit.isOccupied"
                      name="i-lucide-user"
                      class="w-3 h-3 mx-auto mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="text-center py-8 text-gray-500 dark:text-gray-400"
        >
          <UIcon
            name="i-lucide-building-2"
            class="w-12 h-12 mx-auto mb-4 text-gray-400"
          />
          <h3 class="text-lg font-medium mb-2">
            No floors or units defined
          </h3>
          <p class="text-sm mb-4">
            Get started by adding your first floor to this property.
          </p>
          <UButton
            color="primary"
            variant="solid"
            label="Add Floor"
            icon="i-lucide-plus"
            size="sm"
            @click="showFloor = true"
          />
        </div>

        <div
          v-if="(data?.pagination?.total ?? 0) > limit"
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-default pt-4 mt-auto"
        >
          <div class="text-xs sm:text-sm text-gray-500 w-full sm:w-auto mb-2 sm:mb-0 break-words">
            Showing {{ (data?.pagination.page - 1) * data?.pagination.limit + 1 }}-{{ Math.min(data?.pagination.page * data?.pagination.limit, data?.pagination.total) }} of {{ data?.pagination.total }} floors
          </div>
          <div class="flex items-center gap-1.5 self-end sm:self-auto">
            <UPagination
              v-model:page="currentPage"
              :page-count="data?.pagination?.pages"
              :total="data?.pagination?.total || 0"
              :items-per-page="limit"
              class="flex-shrink-0"
            />
          </div>
        </div>
      </UCard>
    </div>

    <PropertyAddUnit
      v-if="selectedFloorToAddUnits"
      :key="`add-unit-${selectedFloorToAddUnits._id || selectedFloorToAddUnits.floorNumber}`"
      v-model:open="showAddUnitModal"
      :floor="selectedFloorToAddUnits"
      :property-id="String(propertyId)"
      @refresh="refresh"
    />
    <PropertyEditUnit
      v-if="selectedFloorToEditUnits"
      :key="`edit-unit-${selectedFloorToEditUnits._id || selectedFloorToEditUnits.floorNumber}`"
      v-model:open="showEditUnitModal"
      :floor="selectedFloorToEditUnits"
      :units="selectedFloorToEditUnits?.units || []"
      :property-id="String(propertyId)"
      @refresh="refresh"
    />

    <PropertyFloor
      v-model:open="showFloor"
      :property-id="String(propertyId)"
      :floor-number="data?.stats?.totalFloors || 0"
      :rent-amount="data?.property?.floors?.[0]?.units?.[0]?.rentAmount || 0"
      @refresh="refresh"
    />

    <PropertyEdit
      v-if="data?.property"
      v-model:open="editProperty"
      :property="data?.property"
      :loading="status === 'pending'"
      @update:open="editProperty = $event"
      @save="refresh"
    />
  </BasePage>
</template>

<script lang="ts" setup>
import type { Property, Floor } from '~/types/property'

definePageMeta({
  layout: 'default',
})

const showFloor = ref(false)
const editProperty = ref(false)
const showAddUnitModal = ref(false)
const showEditUnitModal = ref(false)
const showInfoDismissed = ref(false)
const { fetch: fetchSession, user } = useUserSession()

const route = useRoute()
const { propertyId: currentPropertyId } = useCurrentProperty()
const propertyId = computed(() => route.query.propertyId || currentPropertyId.value || user.value?.assignedProperty || '')

const selectedFloorToAddUnits = ref<Floor | null>(null)
const selectedFloorToEditUnits = ref<Floor | null>(null)

const currentPage = ref(1)
const limit = ref(10)

const { data, status, refresh } = await useLazyAsyncData(
  'property_details',
  async () => {
    await fetchSession()
    if (!propertyId.value) {
      return
    }
    const queryParams = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: limit.value.toString(),
    })

    return $fetch<{
      property: Property
      stats: {
        totalFloors: number
        totalUnits: number
        occupiedUnits: number
        vacancyRate: string
      }
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }>(`/api/properties/${propertyId.value}?${queryParams.toString()}`)
  },
  {
    watch: [currentPage, limit, propertyId],
    server: false,
  },
)

watch(limit, () => {
  currentPage.value = 1
})

function editUnits(floor: Floor) {
  selectedFloorToEditUnits.value = floor
  // Use nextTick to ensure the ref is updated before showing the modal
  nextTick(() => {
    showEditUnitModal.value = true
  })
}

function addUnits(floor: Floor) {
  selectedFloorToAddUnits.value = floor
  nextTick(() => {
    showAddUnitModal.value = true
  })
}

function showUnitDetails(unitId: any) {
  const router = useRouter()
  router.push({
    path: `/units/${unitId}`,
    query: {
      propertyId: propertyId.value,
    },
  })
}
</script>
