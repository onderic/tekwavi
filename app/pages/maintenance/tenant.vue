<template>
  <BasePage
    title="Claims"
    icon="i-lucide-clipboard-list"
    :status="loading"
  >
    <template #headerActions>
      <UButton
        color="primary"
        variant="solid"
        label="New Request"
        icon="i-lucide-plus"
        size="sm"
        @click="showAddModal = true"
      />
    </template>

    <UCard class="mb-4">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <UInput
          v-model="searchQuery"
          class="sm:max-w-sm w-full"
          icon="i-lucide-search"
          placeholder="Search maintenance requests..."
        />

        <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'All Status', value: 'all' },
              { label: 'Pending', value: 'pending' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Completed', value: 'completed' },
              { label: 'Cancelled', value: 'cancelled' },
            ]"
            placeholder="Filter by status"
            size="sm"
            class="w-full sm:w-auto"
          />

          <USelect
            v-model="priorityFilter"
            :items="[
              { label: 'All Priorities', value: 'all' },
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
              { label: 'Urgent', value: 'urgent' },
            ]"
            placeholder="Filter by priority"
            size="sm"
            class="w-full sm:w-auto"
          />
        </div>
      </div>

      <UTable
        :loading="loading"
        :data="filteredRequests"
        :columns="columns"
        :empty-state="{
          icon: 'i-lucide-tool',
          label: 'No maintenance requests found',
        }"
      >
        <template #status-cell="{ row }">
          <UBadge
            class="capitalize"
          >
            {{ formatStatus(row.original.status) }}
          </UBadge>
        </template>

        <template #priority-cell="{ row }">
          <UBadge
            class="capitalize"
          >
            {{ row.original.priority }}
          </UBadge>
        </template>

        <template #category-cell="{ row }">
          <span class="capitalize">{{ formatCategory(row.original.category) }}</span>
        </template>

        <template #date-cell="{ row }">
          {{ formatDate(row.original.submittedDate) }}
        </template>

        <template #actions-cell="{ }">
          <div class="flex items-center gap-2">
            <UButton
              color="primary"
              variant="ghost"
              icon="i-lucide-eye"
              size="xs"
            />
            <UButton
              color="primary"
              variant="ghost"
              icon="i-lucide-edit"
              size="xs"
            />
          </div>
        </template>
      </UTable>

      <div
        v-if="totalRequests > 10"
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-default pt-4 mt-4"
      >
        <div class="text-xs sm:text-sm text-gray-500 w-full sm:w-auto mb-2 sm:mb-0 break-words">
          Showing {{ (currentPage - 1) * perPage + 1 }}-{{ Math.min(currentPage * perPage, totalRequests) }} of {{ totalRequests }} maintenance requests
        </div>
        <div class="flex items-center gap-1.5 self-end sm:self-auto">
          <UPagination
            v-model="currentPage"
            :page-count="Math.ceil(totalRequests / perPage)"
            :total="totalRequests"
            :items-per-page="perPage"
          />
        </div>
      </div>
    </UCard>

    <!-- Maintenance Request Details Modal -->
    <UModal
      v-if="selectedRequest"
      v-model="showDetailsModal"
      :title="`Request #${selectedRequest.maintenanceNumber}`"
    >
      <div class="space-y-4">
        <div class="flex justify-between">
          <UBadge
            class="capitalize"
          >
            {{ formatStatus(selectedRequest.status) }}
          </UBadge>
          <UBadge
            class="capitalize"
          >
            {{ selectedRequest.priority }}
          </UBadge>
        </div>
        <h3 class="text-lg font-semibold">
          {{ selectedRequest.title }}
        </h3>
        <p class="text-gray-700 dark:text-gray-300">
          {{ selectedRequest.description }}
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500 mb-1">
              Property
            </p>
            <p class="font-medium">
              {{ selectedRequest.propertyName }}
            </p>
          </div>
          <div v-if="selectedRequest.unitNumber">
            <p class="text-sm text-gray-500 mb-1">
              Unit
            </p>
            <p class="font-medium">
              {{ selectedRequest.unitNumber }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">
              Category
            </p>
            <p class="font-medium capitalize">
              {{ formatCategory(selectedRequest.category) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">
              Submitted
            </p>
            <p class="font-medium">
              {{ formatDate(selectedRequest.submittedDate) }}
            </p>
          </div>
          <div v-if="selectedRequest.assignedToName">
            <p class="text-sm text-gray-500 mb-1">
              Assigned To
            </p>
            <p class="font-medium">
              {{ selectedRequest.assignedToName }}
            </p>
          </div>
          <div v-if="selectedRequest.scheduledDate">
            <p class="text-sm text-gray-500 mb-1">
              Scheduled
            </p>
            <p class="font-medium">
              {{ formatDate(selectedRequest.scheduledDate) }}
            </p>
          </div>
          <div v-if="selectedRequest.cost">
            <p class="text-sm text-gray-500 mb-1">
              Cost
            </p>
            <p class="font-medium">
              Ksh {{ selectedRequest.cost.toLocaleString() }}
            </p>
          </div>
        </div>

        <div v-if="selectedRequest.notes && selectedRequest.notes.length">
          <h4 class="font-medium mb-2">
            Notes
          </h4>
          <ul class="space-y-2">
            <li
              v-for="(note, i) in selectedRequest.notes"
              :key="i"
              class="bg-gray-50 dark:bg-gray-800 p-2 rounded"
            >
              {{ note }}
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between w-full">
          <UButton
            color="neutral"
            @click="showDetailsModal = false"
          >
            Close
          </UButton>
          <UButton
            color="primary"
          >
            Edit Request
          </UButton>
        </div>
      </template>
    </UModal>
    <ClientOnly>
      <Maintenance
        v-if="showAddModal"
        :open="showAddModal"
        :loading="submitting"
        :units-data="unitsData"
        @update:open="showAddModal = $event"
        @submit="handleMaintenanceSubmit"
      />
    </ClientOnly>
  </BasePage>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import type { Maintenance } from '~/types/maintenance'

definePageMeta({
  title: 'Maintenance',
})

const loading = ref(true)
const submitting = ref(false)
const showAddModal = ref(false)
const showDetailsModal = ref(false)
const selectedRequest = ref<Maintenance | null>(null)

const searchQuery = ref('')
const statusFilter = ref('all')
const priorityFilter = ref('all')
const currentPage = ref(1)
const perPage = ref(10)
const toast = useToast()

const { formatDate } = useFormatters()

const { data, status, refresh } = await useLazyAsyncData(
  'maintenance_requests',
  async () => {
    const queryParams = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: perPage.value.toString(),
    })
    if (statusFilter.value !== 'all') queryParams.append('status', statusFilter.value)
    if (priorityFilter.value !== 'all') queryParams.append('priority', priorityFilter.value)

    const [maintenanceData, unitsData] = await Promise.all([
      $fetch<{
        maintenance: Maintenance[]
        pagination: {
          total: number
          pages: number
        }
      }>(`/api/maintenance?${queryParams.toString()}`),
      $fetch('/api/tenants/units'),
    ])

    return {
      maintenance: maintenanceData.maintenance,
      pagination: maintenanceData.pagination,
      units: unitsData,
    }
  },
  {
    watch: [currentPage, perPage, statusFilter, priorityFilter],
    server: false,
  },
)

watch(status, (newStatus) => {
  loading.value = newStatus === 'pending'
})

const maintenanceRequests = computed<Maintenance[]>(() => data.value?.maintenance || [])
const unitsData = computed(() => data.value?.units || { data: [] })

const filteredRequests = computed(() => {
  let filtered = [...maintenanceRequests.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(req =>
      req.title.toLowerCase().includes(query)
      || req.description.toLowerCase().includes(query)
      || req.maintenanceNumber.toLowerCase().includes(query)
      || req.propertyName?.toLowerCase().includes(query)
      || req.unitNumber?.toLowerCase().includes(query),
    )
  }

  return filtered
})

const totalRequests = computed(() => data.value?.pagination?.total || filteredRequests.value.length)

const columns: TableColumn<Maintenance>[] = [
  { accessorKey: 'maintenanceNumber', header: 'ID' },
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'propertyName', header: 'Property' },
  { accessorKey: 'unitNumber', header: 'Unit' },
  { accessorKey: 'category', header: 'Category' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'priority', header: 'Priority' },
  { accessorKey: 'date', header: 'Submitted' },
  { accessorKey: 'actions', header: 'Actions' },
]

async function handleMaintenanceSubmit(request: Partial<Maintenance>, files: File[]) {
  submitting.value = true

  try {
    console.log(files)
    await $fetch('/api/maintenance', {
      method: 'POST',
      body: request,
    })

    await refresh()

    toast.add({
      title: 'Success',
      description: 'Maintenance request submitted successfully',
      color: 'success',
    })

    showAddModal.value = false
  }
  catch (error) {
    console.error('Error submitting maintenance request:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to submit maintenance request',
      color: 'error',
    })
  }
  finally {
    submitting.value = false
  }
}

function formatStatus(status: string) {
  return status ? status.replace(/_/g, ' ') : ''
}

function formatCategory(category: string) {
  return category ? category.replace(/_/g, ' ') : ''
}
</script>
