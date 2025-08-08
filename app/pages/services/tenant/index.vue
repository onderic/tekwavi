<template>
  <BasePage
    title="Services"
    icon="i-lucide-briefcase"
    :status="loading"
  >
    <template #headerActions>
      <UButton
        v-if="propertyId"
        color="primary"
        variant="solid"
        label="Add Service"
        icon="i-lucide-plus"
        size="sm"
        @click="showAddModal = true"
      />
    </template>

    <UCard>
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <UInput
          v-model="searchQuery"
          class="w-full sm:max-w-sm"
          icon="i-lucide-search"
          placeholder="Search services..."
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
            class="min-w-40"
          />
        </div>
      </div>

      <div
        v-if="!propertyId"
        class="text-center py-8 text-gray-500"
      >
        Please select a property to view services
      </div>

      <UTable
        v-else
        :loading="loading"
        :data="services"
        :columns="columns"
        :empty-state="{
          icon: 'i-lucide-settings',
          label: 'No services found',
        }"
      >
        <template #monthlyCost-cell="{ row }">
          <span class="font-medium">Ksh {{ row.original.monthlyCost.toLocaleString() }}</span>
        </template>

        <template #costPerUnit-cell="{ row }">
          <span>Ksh {{ row.original.costPerUnit.toLocaleString() }}</span>
        </template>

        <template #isActive-cell="{ row }">
          <UBadge :color="row.original.isActive ? 'primary' : 'neutral'">
            {{ row.original.isActive ? 'Active' : 'Inactive' }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-2">
            <UButton
              color="primary"
              variant="ghost"
              icon="i-lucide-edit"
              size="xs"
              @click="editService(row.original)"
            />
            <UButton
              color="error"
              variant="ghost"
              icon="i-lucide-trash"
              size="xs"
              @click="confirmDelete(row.original)"
            />
          </div>
        </template>
      </UTable>

      <div
        v-if="propertyId && totalPages > 1"
        class="flex items-center justify-between border-t pt-4 mt-4"
      >
        <div class="text-sm text-gray-500">
          Showing {{ (currentPage - 1) * perPage + 1 }}-{{ Math.min(currentPage * perPage, totalServices) }} of {{ totalServices }} services
        </div>
        <UPagination
          v-model="currentPage"
          :page-count="totalPages"
          :total="totalServices"
        />
      </div>
    </UCard>

    <!-- Add/Edit Service Modal -->

    <Services
      :open="showAddModal || showEditModal"
      :loading="submitting"
      :property-id="propertyId || ''"
      :total-units="totalUnits"
      :service="editingService"
      @update:open="handleModalClose"
      @submit="handleServiceSubmit"
    />

    <!-- Delete Confirmation Modal -->
    <UModal
      v-model="showDeleteModal"
      title="Delete Service"
      description="Are you sure you want to delete this service? This action cannot be undone."
    >
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="neutral"
            variant="outline"
            @click="showDeleteModal = false"
          >
            Cancel
          </UButton>
          <UButton
            color="error"
            :loading="deleting"
            @click="handleDelete"
          >
            Delete Service
          </UButton>
        </div>
      </template>
    </UModal>
  </BasePage>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import type { Service } from '~/types/service'

definePageMeta({
  title: 'Services',
})

const loading = ref(false)
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const submitting = ref(false)
const deleting = ref(false)

const editingService = ref<Service | null>(null)
const serviceToDelete = ref<Service | null>(null)

const searchQuery = ref('')
const searchTerm = ref('')
const statusFilter = ref('all')
const currentPage = ref(1)
const perPage = ref(10)

const { propertyId } = useCurrentProperty()

const { data, refresh } = await useLazyAsyncData(
  'services',
  async () => {
    if (!propertyId.value) {
      return {
        services: [],
        pagination: { total: 0, pages: 0, page: 1, limit: perPage.value },
        property: null,
      }
    }

    loading.value = true
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.value.toString(),
        limit: perPage.value.toString(),
        propertyId: propertyId.value,
      })

      if (statusFilter.value !== 'all') {
        queryParams.append('isActive', statusFilter.value === 'active' ? 'true' : 'false')
      }
      if (searchTerm.value) queryParams.append('search', searchTerm.value)

      const [servicesData, propertyData] = await Promise.all([
        $fetch<{
          services: Service[]
          pagination: {
            total: number
            pages: number
            page: number
            limit: number
          }
        }>(`/api/services?${queryParams.toString()}`),
        $fetch<any>(`/api/properties/${propertyId.value}`),
      ])

      return {
        services: servicesData.services,
        pagination: servicesData.pagination,
        property: propertyData,
      }
    }
    catch (error) {
      console.error('Error fetching services:', error)
      return {
        services: [],
        pagination: { total: 0, pages: 0, page: 1, limit: perPage.value },
        property: null,
      }
    }
    finally {
      loading.value = false
    }
  },
  {
    watch: [currentPage, perPage, statusFilter, searchTerm, propertyId],
    server: false,
  },
)

const services = computed<Service[]>(() => data.value?.services || [])
const totalUnits = computed(() => data.value?.property?.totalUnits || 0)
const totalServices = computed(() => data.value?.pagination?.total || 0)
const totalPages = computed(() => data.value?.pagination?.pages || 0)

const columns: TableColumn<Service>[] = [
  { accessorKey: 'serviceName', header: 'Service Name' },
  { accessorKey: 'serviceType', header: 'Type' },
  { accessorKey: 'serviceProvider', header: 'Provider' },
  { accessorKey: 'monthlyCost', header: 'Monthly Cost' },
  { accessorKey: 'costPerUnit', header: 'Per Unit' },
  { accessorKey: 'isActive', header: 'Status' },
  { accessorKey: 'actions', header: 'Actions' },
]

function editService(service: Service) {
  editingService.value = service
  showEditModal.value = true
}

function confirmDelete(service: Service) {
  serviceToDelete.value = service
  showDeleteModal.value = true
}

function handleModalClose(value: boolean) {
  showAddModal.value = false
  showEditModal.value = false
  if (!value) {
    editingService.value = null
  }
}
async function handleServiceSubmit(serviceData: Service) {
  submitting.value = true
  try {
    const isEdit = !!editingService.value

    await $fetch(`/api/services${isEdit && editingService.value ? `/${editingService.value._id}` : ''}`, {
      method: isEdit ? 'POST' : 'POST',
      body: serviceData,
    })

    showAddModal.value = false
    showEditModal.value = false
    editingService.value = null

    await refresh()
  }
  catch (error) {
    console.error('Error submitting service:', error)
  }
  finally {
    submitting.value = false
  }
}

async function handleDelete() {
  if (!serviceToDelete.value) return

  deleting.value = true
  try {
    await $fetch(`/api/services/${serviceToDelete.value._id}`, {
    })

    showDeleteModal.value = false
    serviceToDelete.value = null

    await refresh()
  }
  catch (error) {
    console.error('Error deleting service:', error)
  }
  finally {
    deleting.value = false
  }
}
</script>
