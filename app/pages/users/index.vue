<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { UserType } from '~~/shared/types/user'

const UButton = resolveComponent('UButton')

const showInviteModal = ref(false)

definePageMeta({
  title: 'Users',
})

interface InviteForm {
  email: string
  role: 'tenant' | 'caretaker' | 'developer' | 'admin'
}

const toast = useToast()
const isLoading = ref(false)

const UBadge = resolveComponent('UBadge')

const columns: TableColumn<UserType>[] = [
  {
    accessorKey: 'first_name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('isActive')
      const status = isActive ? 'active' : 'inactive'
      const color = isActive ? 'success' : 'error'

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => status)
    },
  },
  {
    accessorKey: 'role',
    header: 'Role',
  },
  {
    id: 'action',
  },
]

const { data, status, refresh } = await useLazyAsyncData('UsersList', async () => {
  const [users, pending] = await Promise.all([
    $fetch<UserType[]>('/api/users'),
    $fetch<Notification[]>('/api/notifications'),
  ])

  return {
    users,
    pending,
  }
}, {
  server: false,
})

function getInitials(firstName: string, lastName?: string): string {
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : ''
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : ''

  return firstInitial + (lastInitial || '')
}

const handleInvite = async (form: InviteForm) => {
  if (isLoading.value) return

  isLoading.value = true

  try {
    await $fetch('/api/notifications', {
      method: 'POST',
      body: form,
    })

    toast.add({
      title: 'Invitation sent',
      description: 'User has been invited successfully',
      color: 'success',
      icon: 'i-lucide-check',
    })
    showInviteModal.value = false
    refresh()
  }
  catch (error: any) {
    if (error && typeof error === 'object' && 'statusMessage' in error) {
      toast.add({
        color: 'error',
        title: 'Failed to send invitation',
        description: error.statusMessage as string,
      })
    }
    else {
      console.error(error)
      toast.add({
        color: 'error',
        title: 'Failed to send invitation',
        description: error?.message || 'An unexpected error occurred',
      })
    }
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <BasePage
      title="Users"
      icon="i-lucide-users"
      :status="status=== 'pending'"
    >
      <template #headerActions>
        <UButton
          color="primary"
          variant="solid"
          label="Invite User"
          :loading="isLoading"
          icon="i-lucide-users"
          @click="showInviteModal = true"
        />
      </template>

      <UCard>
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <UInput
            class="w-full sm:max-w-sm"
            icon="i-lucide-search"
            placeholder="Search users..."
          />

          <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <USelect
              :items="[
                { label: 'All Roles', value: 'all' },
                { label: 'Admin', value: 'developer' },
                { label: 'Tenant', value: 'tenant' },
                { label: 'Caretaker', value: 'caretaker' },
              ]"
              placeholder="Filter by role"
              size="sm"
              class="w-full sm:w-auto"
            />

            <USelect
              :items="[
                { label: 'All Status', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]"
              placeholder="Filter by status"
              size="sm"
              class="w-full sm:w-auto"
            />

            <UDropdownMenu
              :items="[
                [
                  {
                    label: 'Export to CSV',
                    icon: 'i-lucide-file-text',
                  },
                  {
                    label: 'Export to Excel',
                    icon: 'i-lucide-file-spreadsheet',
                  },
                ],
                [
                  {
                    label: 'Bulk delete',
                    icon: 'i-lucide-trash-2',
                    color: 'red',
                  },
                ],
              ]"
              class="w-full sm:w-auto"
            />
          </div>
        </div>

        <UsersInvite
          v-if="showInviteModal"
          v-model:open="showInviteModal"
          :loading="isLoading"
          @invite="handleInvite"
        />

        <UTable
          ref="table"
          :loading="status === 'pending'"
          loading-animation="carousel"
          :data="data?.users || []"
          :columns="columns"
          class="flex-1"
          :empty-state="{
            icon: 'i-lucide-users',
            label: 'No users found',
          }"
          @select="(row: any) => {
            if (row.original?._id) {
              navigateTo(`/users/${row.original._id}`)
            }
          }"
        >
          <template #first_name-cell="{ row }">
            <div class="flex items-center gap-3">
              <UAvatar
                size="lg"
                :text="getInitials(row.original.first_name, row.original.last_name)"
                :alt="`${row.original.first_name} avatar`"
              />
              <div>
                <p class="font-medium text-highlighted capitalize">
                  {{ row.original.first_name }} {{ row.original.last_name }}
                </p>
                <p>
                  {{ row.original.role }}
                </p>
              </div>
            </div>
          </template>
          <template #role-cell="{ row }">
            <div class="capitalize">
              {{ row.original.role }}
            </div>
          </template>
        </UTable>
      </UCard>
    </BasePage>
  </div>
</template>
