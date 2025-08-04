<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'
import type { Notification } from '~/types/notification'
import { useDashboard } from '~/composables/useDashboard'

interface Props {
  notifications?: Notification[]
  loading?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  notifications: () => [],
  loading: false,
})

const emit = defineEmits<{
  refresh: []
}>()

const { isNotificationsSlideoverOpen } = useDashboard()
const { user } = useUserSession()

const handleRefresh = () => {
  // Only refresh if user is available
  if (user.value) {
    emit('refresh')
  }
}

// Watch for user changes and refresh notifications
watch(() => user.value, (newUser) => {
  if (newUser) {
    handleRefresh()
  }
}, { immediate: true })
</script>

<template>
  <USlideover
    v-model:open="isNotificationsSlideoverOpen"
    title="Notifications"
  >
    <template #description>
      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-500">{{ notifications?.length }} notifications</span>
        <UButton
          size="xs"
          color="info"
          variant="ghost"
          icon="i-lucide-refresh-cw"
          :loading="loading"
          :disabled="!user"
          @click="handleRefresh"
        />
      </div>
    </template>

    <template #body>
      <div
        v-if="!user"
        class="flex justify-center py-8"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="animate-spin w-6 h-6 text-primary-500"
        />
      </div>
      <div
        v-else-if="loading && !notifications?.length"
        class="flex justify-center py-8"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="animate-spin w-6 h-6 text-primary-500"
        />
      </div>
      <div
        v-else-if="!notifications?.length"
        class="py-4 text-center"
      >
        <UIcon
          name="i-lucide-inbox"
          class="mx-auto h-12 w-12 text-gray-400"
        />
        <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
          No notifications
        </h3>
        <p class="mt-1 text-sm text-gray-500 mb-4">
          You don't have any notifications at the moment.
        </p>

        <UButton
          color="primary"
          label="Refresh"
          :loading="loading"
          size="sm"
          @click="handleRefresh"
        />
      </div>

      <div v-else>
        <RouterLink
          v-for="notification in notifications"
          :key="notification?._id"
          :to="notification?.actionUrl || ''"
          class="px-3 py-2.5 rounded-md hover:bg-elevated/50 flex items-center gap-3 relative -mx-3 first:-mt-3 last:-mb-3"
        >
          <UChip
            color="info"
            :show="!notification.isRead"
            inset
          >
            <UAvatar
              :icon="notification.type === 'system' ? 'i-lucide-bell'
                : notification.type === 'payment' ? 'i-lucide-credit-card'
                  : notification.type === 'message' ? 'i-lucide-message-circle'
                    : notification.type.includes('invite') ? 'i-lucide-mail' : 'i-lucide-bell'"
              size="md"
            />
          </UChip>

          <div class="text-sm flex-1">
            <p class="flex items-center justify-between">
              <span class="text-highlighted font-medium">{{ notification.title }}</span>

              <time
                :datetime="notification.createdAt"
                class="text-muted text-xs"
                v-text="formatTimeAgo(new Date(notification.createdAt))"
              />
            </p>

            <p class="text-dimmed">
              {{ notification.message }}
            </p>
          </div>
        </RouterLink>
      </div>
    </template>
  </USlideover>
</template>
