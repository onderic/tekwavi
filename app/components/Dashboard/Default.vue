<script setup lang="ts">
import type { Notification } from '~/types/notification'

const isLoading = ref(false)
const toast = useToast()
const router = useRouter()

const { user, fetch } = useUserSession()

const { data: notifications, status, refresh } = useLazyAsyncData(
  'notificationsListings',
  () => {
    // Only fetch if user is available
    if (!user.value) {
      return Promise.resolve([])
    }

    const params: Record<string, string> = {}

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
    server: false,
  },
)

const pendingInvitations = computed(() => {
  return notifications.value?.filter(n => n.status === 'pending' && n.type.includes('invite')) || []
})

const otherNotifications = computed(() => {
  return notifications.value?.filter(n => !(n.status === 'pending' && n.type.includes('invite'))) || []
})

const markAsRead = async (notificationId: string) => {
  try {
    await $fetch('/api/notifications/read', {
      method: 'POST',
      body: { notificationId },
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

async function acceptInvitation(invitation: Notification) {
  isLoading.value = true
  try {
    await useFetch('api/notifications/accept', {
      method: 'POST',
      body: {
        notificationId: invitation._id,
      },
    })

    toast.add({
      title: 'Invitation Accepted!',
      description: `You are now a ${invitation.role} for ${invitation.metadata?.property?.name || 'this property'}`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    })

    await fetch()

    if (user.value?.role === 'developer') {
      await router.push('/properties/listing')
    }
    else {
      await refresh()
    }
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
  }
}

function formatDistanceToNow(date: Date) {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`
}

function getRoleColor(role: string): 'success' | 'error' | 'primary' | 'secondary' | 'info' | 'warning' | 'neutral' | undefined {
  const colors = {
    developer: 'success',
    caretaker: 'secondary',
    tenant: 'info',
    admin: 'warning',
  }
  return colors[role as keyof typeof colors] as 'success' | 'error' | 'primary' | 'secondary' | 'info' | 'warning' | 'neutral' || 'neutral'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Pending Invitations -->
    <div v-if="pendingInvitations.length > 0">
      <div class="flex items-center gap-2 mb-4">
        <UIcon
          name="i-lucide-mail-open"
          class="w-5 h-5 text-amber-500"
        />
        <h3 class="text-lg font-medium">
          Pending Invitations
        </h3>
        <UBadge
          color="warning"
          size="sm"
        >
          {{ pendingInvitations.length }}
        </UBadge>
      </div>

      <div class="grid gap-4">
        <UCard
          v-for="invitation in pendingInvitations"
          :key="invitation._id"
          class="border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <UIcon
                  name="i-lucide-user-plus"
                  class="w-5 h-5 text-amber-600"
                />
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-white">
                    {{ invitation.title }}
                  </h4>
                  <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {{ invitation.message }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-4 text-sm text-gray-500">
                <div class="flex items-center gap-1">
                  <UIcon
                    name="i-lucide-shield"
                    class="w-4 h-4"
                  />
                  <UBadge
                    :color="getRoleColor(invitation.role || '')"
                    size="sm"
                    class="capitalize"
                  >
                    {{ invitation.role }}
                  </UBadge>
                </div>

                <div
                  v-if="invitation.metadata?.property?.name"
                  class="flex items-center gap-1"
                >
                  <UIcon
                    name="i-lucide-building"
                    class="w-4 h-4"
                  />
                  <span>{{ invitation.metadata.property.name }}</span>
                </div>

                <div class="flex items-center gap-1">
                  <UIcon
                    name="i-lucide-clock"
                    class="w-4 h-4"
                  />
                  <span>{{ formatDistanceToNow(new Date(invitation.createdAt)) }}</span>
                </div>
              </div>
            </div>

            <div class="flex gap-2 ml-4">
              <UButton
                color="primary"
                variant="solid"
                size="sm"
                :loading="isLoading"
                @click="acceptInvitation(invitation)"
              >
                <UIcon
                  name="i-lucide-check"
                  class="w-4 h-4 mr-1"
                />
                Accept
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Other Notifications -->
    <div v-if="otherNotifications.length > 0">
      <div class="flex items-center gap-2 mb-4">
        <UIcon
          name="i-lucide-bell"
          class="w-5 h-5 text-gray-500"
        />
        <h3 class="text-lg font-medium">
          Recent Notifications
        </h3>
      </div>

      <div class="space-y-3">
        <UCard
          v-for="notification in otherNotifications"
          :key="notification._id"
          class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          :class="{ 'border-l-4 border-l-primary-500': !notification.isRead }"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-3 flex-1">
              <UIcon
                :name="notification.isRead ? 'i-lucide-bell' : 'i-lucide-bell-ring'"
                class="w-5 h-5 mt-1 text-gray-500"
                :class="{ 'text-primary-500': !notification.isRead }"
              />

              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h4
                    class="font-medium"
                    :class="{ 'text-primary-600 dark:text-primary-400': !notification.isRead }"
                  >
                    {{ notification.title }}
                  </h4>
                  <UBadge
                    v-if="!notification.isRead"
                    color="primary"
                    size="xs"
                  >
                    New
                  </UBadge>
                </div>

                <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {{ notification.message }}
                </p>

                <div class="flex items-center gap-4 text-xs text-gray-500">
                  <div class="flex items-center gap-1">
                    <UIcon
                      name="i-lucide-clock"
                      class="w-3 h-3"
                    />
                    <span>{{ formatDistanceToNow(new Date(notification.createdAt)) }}</span>
                  </div>

                  <UBadge
                    v-if="notification.status !== 'pending'"
                    :color="notification.status === 'accepted' ? 'success' : notification.status === 'rejected' ? 'error' : 'neutral'"
                    size="xs"
                    class="capitalize"
                  >
                    {{ notification.status }}
                  </UBadge>
                </div>
              </div>
            </div>

            <UButton
              v-if="!notification.isRead"
              variant="ghost"
              size="sm"
              icon="i-lucide-check"
              @click="markAsRead(notification._id)"
            />
          </div>
        </UCard>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="(!notifications || notifications.length === 0)">
      <UCard>
        <div class="flex flex-col items-center justify-center py-12">
          <UIcon
            name="i-lucide-inbox"
            class="w-16 h-16 text-gray-400 mb-4"
          />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            All caught up!
          </h3>
          <p class="text-gray-500 text-center max-w-md">
            You don't have any notifications or invitations at the moment.
          </p>
          <UButton
            variant="outline"
            size="sm"
            class="mt-4"
            icon="i-lucide-refresh-cw"
            :loading="status === 'pending'"
            @click="refresh()"
          >
            Refresh
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Loading State -->
    <div v-if="status === 'pending'">
      <UCard>
        <div class="flex items-center justify-center py-12">
          <UIcon
            name="i-lucide-loader-2"
            class="w-6 h-6 animate-spin text-gray-500"
          />
          <span class="ml-2 text-gray-500">Loading notifications...</span>
        </div>
      </UCard>
    </div>
  </div>
</template>
