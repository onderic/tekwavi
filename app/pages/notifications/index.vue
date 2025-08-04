<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Notification } from '~/types/notification'

definePageMeta({
  title: 'Notifications & Invitations',
  actions: [

  ],
})

const isOpen = ref(false)
const isLoading = ref(false)

const toast = useToast()
const UBadge = resolveComponent('UBadge')
const UAvatar = resolveComponent('UAvatar')

const columns: TableColumn<Notification>[] = [
  {
    accessorKey: 'title',
    header: 'Details',
    size: 300,
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const color = {
        pending: 'amber',
        accepted: 'green',
        rejected: 'red',
        expired: 'gray',
      }[status] || 'blue'

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => status)
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      const label = type.replace(/_/g, ' ')

      const color = {
        system: 'blue',
        payment: 'emerald',
        message: 'sky',
        invite_property_owner: 'purple',
        invite_caretaker: 'indigo',
        invite_tenant: 'violet',
      }[type] || 'gray'

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => label)
    },
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.getValue('role') as string
      const color = {
        developer: 'purple',
        caretaker: 'indigo',
        tenant: 'sky',
        admin: 'fuchsia',
      }[role as string] || 'gray'

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => role)
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Sent',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return formatDistanceToNow(date, { addSuffix: true })
    },
  },

  {
    id: 'action',
    size: 120,
  },
]

const { user, fetch } = useUserSession()

const { data: notifications, status, refresh } = useLazyAsyncData(
  'notificationsListings',
  () => {
    const params: Record<string, string> = {}

    // Filter by user's email and phone
    if (user.value?.email) {
      params.email = user.value.email
    }

    if (user.value?.phone) {
      params.phone = user.value.phone
    }

    return $fetch<Notification[]>('/api/notifications', {
      query: params,
    })
  },
  {
    watch: [() => user.value?.email, () => user.value?.phone],
    default: () => [],
  },
)

const selectedInvitation = ref<Notification | null>(null)

const markAsRead = async (notificationId: string) => {
  try {
    await $fetch('/api/notifications/read', {
      method: 'POST',
      body: { notificationId },
    })

    toast.add({
      title: 'Notification marked as read',
      color: 'success',
      icon: 'i-lucide-check',
    })
    refresh()
  }
  catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to update notification',
      color: 'error',
    })
  }
}

async function acceptInvitation() {
  if (!selectedInvitation.value) return
  isLoading.value = true
  try {
    await useFetch('api/notifications/accept', {
      method: 'POST',
      body: {
        notificationId: selectedInvitation.value._id,
      },
    })
    toast.add({
      title: 'Accepted invitation',
      description: `You have accepted the invitation for ${selectedInvitation.value.title}`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
    await fetch()
    isOpen.value = false
    window.location.reload()
  }
  catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to accept invitation',
      color: 'error',
    })
  }
  finally {
    isLoading.value = false
    selectedInvitation.value = null
  }
}

function formatDistanceToNow(date: Date, options: { addSuffix: boolean } = { addSuffix: false }) {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return options.addSuffix ? 'just now' : 'just now'

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''}${options.addSuffix ? ' ago' : ''}`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hr${diffInHours > 1 ? 's' : ''}${options.addSuffix ? ' ago' : ''}`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''}${options.addSuffix ? ' ago' : ''}`

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''}${options.addSuffix ? ' ago' : ''}`

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''}${options.addSuffix ? ' ago' : ''}`
}

function getSenderInfo(notification: Notification) {
  if (notification.metadata?.invitedBy) {
    return notification.metadata.invitedBy
  }
  return null
}
</script>

<template>
  <BasePage
    title="Notifications"
    icon="i-lucide-bell"
    :actions="[]"
  >
    <template #headerActions>
      <UButton
        variant="outline"
        label="Refresh"
        icon="i-lucide-refresh-cw"
        :loading="status === 'pending'"
        @click="refresh()"
      />
    </template>
    <div>
      <UCard>
        <UTable
          ref="table"
          :data="notifications ?? []"
          :loading="status === 'pending'"
          :columns="columns"

          class="flex-1"
        >
          <template #title-cell="{ row }">
            <div class="flex items-start gap-3">
              <UIcon
                :name="row.original.isRead ? 'i-lucide-bell' : 'i-lucide-bell-ring'"
                class="mt-1 flex-shrink-0 w-5 h-5"
              />
              <div>
                <div class="flex items-center gap-1">
                  <p
                    class="font-medium"
                    :class="{ 'text-indigo-600': !row.original.isRead }"
                  >
                    {{ row.original.title }}
                  </p>
                  <UBadge
                    v-if="!row.original.isRead"
                    color="indigo"
                    size="xs"
                    class="ml-2"
                  >
                    New
                  </UBadge>
                </div>
                <p class="text-sm text-gray-500 line-clamp-1 mt-0.5">
                  {{ row.original.message }}
                </p>
                <div
                  v-if="getSenderInfo(row.original)"
                  class="flex items-center gap-2 mt-1.5"
                >
                  <UAvatar
                    size="xs"
                    :text="getSenderInfo(row.original).name.charAt(0)"
                  />
                  <span class="text-xs text-gray-500">
                    Sent by {{ getSenderInfo(row.original).name }}
                  </span>
                </div>
              </div>
            </div>
          </template>

          <template #action-cell="{ row }">
            <div class="flex items-center justify-end gap-1">
              <UButton
                v-if="row.original.status === 'pending'"
                icon="i-lucide-mail"
                color="secondary"
                variant="ghost"
                size="xs"
                aria-label="Resend"
              />
              <UDropdownMenu
                :items="[
                  [

                    {
                      label: row.original.isRead ? 'Mark as unread' : 'Mark as read',
                      icon: row.original.isRead ? 'i-lucide-eye' : 'i-lucide-check',
                      onSelect: (e: Event) => {
                        e.preventDefault()
                        markAsRead(row.original._id)
                      },
                    },
                  ],
                  [
                    ...(row.original.type.includes('invite') && row.original.status !== 'expired' ? [{
                      label: 'Copy Invite Link',
                      icon: 'i-lucide-link',
                      onSelect: (e: Event) => {
                        e.preventDefault()
                        toast.add({
                          title: 'Link copied',
                          description: 'Invitation link copied to clipboard',
                          color: 'success',
                        })
                      },
                    }] : []),
                  ],
                ].filter(section => section.length > 0)"
              >
                <UButton
                  icon="i-lucide-more-vertical"
                  color="primary"
                  variant="ghost"
                  size="xs"
                />
              </UDropdownMenu>
            </div>
          </template>

          <template #empty-state>
            <div class="flex flex-col items-center justify-center py-10">
              <UIcon
                name="i-lucide-bell-off"
                class="text-gray-400 w-12 h-12 mb-4"
              />
              <p class="text-gray-700 font-medium dark:text-gray-300">
                No notifications found
              </p>
              <p class="text-gray-500 text-sm mt-1">
                You don't have any pending notifications or invitations.
              </p>
              <UButton
                class="mt-4"
                variant="outline"
                label="Refresh"
                icon="i-lucide-refresh-cw"
                :loading="status === 'pending'"
                @click="refresh()"
              />
            </div>
          </template>
        </UTable>
      </UCard>

      <UModal
        v-model:open="isOpen"
        :dismissible="false"
        title="Accept Invitation"
      >
        <template #body>
          <div
            v-if="selectedInvitation"
            class="py-4"
          >
            <div class="mb-4">
              <h4 class="font-medium">
                {{ selectedInvitation.title }}
              </h4>
              <p class="text-sm text-gray-600 mt-1">
                {{ selectedInvitation.message }}
              </p>
            </div>

            <div class="grid gap-3 text-sm">
              <div class="flex justify-between py-1 border-b border-gray-100">
                <span class="text-gray-600">Type:</span>
                <UBadge
                  :color="selectedInvitation.type.includes('property') ? 'purple' : 'indigo'"
                  class="capitalize"
                >
                  {{ selectedInvitation.type.replace(/_/g, ' ') }}
                </UBadge>
              </div>

              <div class="flex justify-between py-1 border-b border-gray-100">
                <span class="text-gray-600">Role:</span>
                <UBadge
                  :color="selectedInvitation.role === 'developer' ? 'purple' : selectedInvitation.role === 'caretaker' ? 'indigo' : 'sky'"
                  class="capitalize"
                >
                  {{ selectedInvitation.role || 'Not specified' }}
                </UBadge>
              </div>

              <div
                v-if="selectedInvitation.metadata?.property?.name"
                class="flex justify-between py-1 border-b border-gray-100"
              >
                <span class="text-gray-600">Property:</span>
                <span class="font-medium">{{ selectedInvitation.metadata.property.name }}</span>
              </div>

              <div
                v-if="selectedInvitation.metadata?.property?.unitNumber"
                class="flex justify-between py-1 border-b border-gray-100"
              >
                <span class="text-gray-600">Unit Number:</span>
                <span class="font-medium">{{ selectedInvitation.metadata.property.unitNumber }}</span>
              </div>

              <div class="flex justify-between py-1 border-b border-gray-100">
                <span class="text-gray-600">Expires:</span>
                <span>
                  {{ formatDistanceToNow(new Date(selectedInvitation.createdAt), { addSuffix: true }) }}
                </span>
              </div>
            </div>

            <div class="mt-6 bg-amber-50 text-amber-800 rounded p-3 text-sm">
              <div class="flex items-start gap-2">
                <UIcon
                  name="i-lucide-alert-triangle"
                  class="w-4 h-4 mt-0.5 flex-shrink-0"
                />
                <p>By accepting this invitation, you agree to the terms and conditions associated with this role.</p>
              </div>
            </div>
          </div>
          <div class="flex justify-end items-end gap-3">
            <UButton
              variant="ghost"
              label="Cancel"
              @click="isOpen = false"
            />
            <UButton
              label="Accept Invitation"
              color="primary"
              icon="i-lucide-check-circle"
              :loading="isLoading"
              :disabled="isLoading"
              @click="acceptInvitation"
            />
          </div>
        </template>
      </UModal>
    </div>
  </BasePage>
</template>
