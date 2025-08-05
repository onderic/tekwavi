<template>
  <BasePage
    title="Maintenance Requests"
    icon="i-lucide-wrench"
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
          class="w=full sm:max-w-sm"
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
        loading-color="primary"
        loading-animation="carousel"
      >
        <template #status-cell="{ row }">
          <UBadge
            :color="getStatusColor(row.original.status)"
            class="capitalize"
          >
            {{ formatStatus(row.original.status) }}
          </UBadge>
        </template>

        <template #category-cell="{ row }">
          <span class="capitalize">{{ formatCategory(row.original.category) }}</span>
        </template>

        <template #priority-cell="{ row }">
          <UBadge
            :color="getPriorityColor(row.original.priority)"
            class="capitalize"
          >
            {{ row.original.priority }}
          </UBadge>
        </template>

        <template #date-cell="{ row }">
          {{ formatDate(row.original.submittedDate) }}
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-2">
            <UButton
              color="primary"
              variant="ghost"
              icon="i-lucide-eye"
              size="xs"
              @click="viewRequest(row.original)"
            />
            <UButton
              color="primary"
              variant="ghost"
              icon="i-lucide-edit"
              size="xs"
              @click="editRequest(row.original)"
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

    <UModal
      v-model:open="showDetailsModal"
      :title="`Request #${selectedRequest?.maintenanceNumber}`"
    >
      <template #body>
        <div
          v-if="selectedRequest"
          class="space-y-4"
        >
          <div class="flex justify-between">
            <UBadge
              :color="getStatusColor(selectedRequest.status)"
              class="capitalize"
            >
              {{ formatStatus(selectedRequest.status) }}
            </UBadge>
            <UBadge
              :color="getPriorityColor(selectedRequest.priority)"
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
                <div v-if="typeof note === 'string'">
                  {{ note }}
                </div>
                <div
                  v-else
                  class="space-y-1"
                >
                  <p>{{ (note as any).text }}</p>
                  <div class="text-xs text-gray-500">
                    By {{ (note as any).addedByName }} on {{ formatDate((note as any).date) }}
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div class="flex justify-between w-full mt-4">
          <UButton
            color="neutral"
            @click="showDetailsModal = false"
          >
            Close
          </UButton>
          <UButton
            color="primary"
            @click="selectedRequest && editRequest(selectedRequest)"
          >
            Edit Request
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="showEditModal"
      :title="`Edit Request #${editingRequest?.maintenanceNumber}`"
    >
      <template #body>
        <div
          v-if="editingRequest"
          class="space-y-4"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <UFormField label="Status">
                <USelect
                  v-model="editingRequest.status"
                  :items="[
                    { label: 'Pending', value: 'pending' },
                    { label: 'In Progress', value: 'in_progress' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Cancelled', value: 'cancelled' },
                  ]"
                  placeholder="Select status"
                />
              </UFormField>
            </div>
            <div>
              <UFormField label="Priority">
                <USelect
                  v-model="editingRequest.priority"
                  :items="[
                    { label: 'Low', value: 'low' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'High', value: 'high' },
                    { label: 'Urgent', value: 'urgent' },
                  ]"
                  placeholder="Select priority"
                />
              </UFormField>
            </div>
          </div>

          <UFormField label="Maintenance Cost">
            <UInput
              v-model="editingRequest.cost"
              type="number"
              placeholder="Enter cost (Ksh)"
              min="0"
              step="1"
            />
          </UFormField>

          <UFormField label="Scheduled Date">
            <UInput
              v-model="editingRequest.scheduledDate"
              type="datetime-local"
              placeholder="Select scheduled date"
            />
          </UFormField>

          <UFormField label="Notes">
            <UTextarea
              v-model="newNote"
              placeholder="Add a note about this maintenance request..."
              :rows="3"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="flex justify-between w-full mt-4">
          <UButton
            color="neutral"
            @click="cancelEdit"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            :loading="updateLoading"
            @click="updateRequest"
          >
            Update Request
          </UButton>
        </div>
      </template>
    </UModal>
  </BasePage>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import type { Maintenance } from '~/types/maintenance'

definePageMeta({
  title: 'Maintenance',
})

const loading = ref(true)
const showAddModal = ref(false)
const showDetailsModal = ref(false)
const showEditModal = ref(false)
const selectedRequest = ref<Maintenance | null>(null)
const editingRequest = ref<Maintenance | null>(null)

const searchQuery = ref('')
const statusFilter = ref('all')
const priorityFilter = ref('all')
const currentPage = ref(1)
const perPage = ref(10)
const updateLoading = ref(false)
const newNote = ref('')
const { propertyId } = useCurrentProperty()

const { formatDate } = useFormatters()

const { data, status, refresh } = await useLazyAsyncData(
  'maintenance_requests',
  () => {
    const queryParams = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: perPage.value.toString(),
    })

    if (propertyId.value) queryParams.append('propertyId', propertyId.value)

    if (statusFilter.value !== 'all') queryParams.append('status', statusFilter.value)
    if (priorityFilter.value !== 'all') queryParams.append('priority', priorityFilter.value)

    return $fetch<{
      maintenance: Maintenance[]
      pagination: {
        total: number
        pages: number
      }
    }>(`/api/maintenance?${queryParams.toString()}`)
  },
  {
    watch: [currentPage, perPage, statusFilter, priorityFilter, propertyId],
  },
)

watch(status, (newStatus) => {
  loading.value = newStatus === 'pending'
})

const maintenanceRequests = computed<Maintenance[]>(() => data.value?.maintenance || [])

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
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'category', header: 'Category' },
  { accessorKey: 'priority', header: 'Priority' },
  { accessorKey: 'date', header: 'Submitted' },
  { accessorKey: 'actions', header: 'Actions' },
]

function formatStatus(status: string) {
  return status ? status.replace(/_/g, ' ') : ''
}

function formatCategory(category: string) {
  return category ? category.replace(/_/g, ' ') : ''
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'in_progress':
      return 'primary'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'error'
    default:
      return 'neutral'
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'low':
      return 'success'
    case 'medium':
      return 'warning'
    case 'high':
      return 'error'
    case 'urgent':
      return 'error'
    default:
      return 'neutral'
  }
}

function viewRequest(request: Maintenance) {
  selectedRequest.value = request
  showDetailsModal.value = true
}

function editRequest(request: Maintenance) {
  editingRequest.value = { ...request }
  // Format the scheduled date for datetime-local input
  if (editingRequest.value.scheduledDate) {
    const date = new Date(editingRequest.value.scheduledDate)
    editingRequest.value.scheduledDate = date.toISOString().slice(0, 16)
  }
  showDetailsModal.value = false
  showEditModal.value = true
}

function cancelEdit() {
  showEditModal.value = false
  editingRequest.value = null
  newNote.value = ''
}

async function updateRequest() {
  if (!editingRequest.value) return

  updateLoading.value = true
  try {
    const updateData: any = {
      status: editingRequest.value.status,
      priority: editingRequest.value.priority,
      cost: editingRequest.value.cost ? Number(editingRequest.value.cost) : null,
      scheduledDate: editingRequest.value.scheduledDate || null,
    }
    if (newNote.value.trim()) {
      updateData.note = newNote.value.trim()
    }
    if (editingRequest.value.status === 'completed') {
      updateData.completedDate = new Date().toISOString()
    }

    await $fetch(`/api/maintenance/${editingRequest.value._id}`, {
      method: 'PATCH' as any,
      body: updateData,
    })

    await refresh()

    const toast = useToast()
    toast.add({
      title: 'Success',
      description: 'Maintenance request updated successfully',
      color: 'success',
    })

    await $fetch('/api/invalidate', {
      method: 'POST',
      query: { propertyId: propertyId.value },
    })

    cancelEdit()
  }
  catch (error: any) {
    console.error('Error updating maintenance request:', error)

    const toast = useToast()
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to update maintenance request',
      color: 'error',
    })
  }
  finally {
    updateLoading.value = false
  }
}
</script>
