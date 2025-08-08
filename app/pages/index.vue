<template>
  <BasePage
    title="Dashboard"
    icon="i-lucide-home"
    :force-dashboard="true"
    :status="status === 'pending'"
  >
    <DashboardAdmin
      v-if="user?.role === 'admin'"
      :analytics="analyticsData"
    />
    <DashboardDeveloper
      v-else-if="user?.role === 'developer'"
      :analytics="analyticsData"
      :is-loading="status === 'pending'"
    />
    <DashboardUnitOwner
      v-else-if="user?.role === 'unit_owner'"
      :analytics="analyticsData"
      :is-loading="status === 'pending'"
    />
    <DashboardCaretaker
      v-else-if="user?.role === 'caretaker'"
      :analytics="analyticsData"
      :is-loading="status === 'pending'"
    />
    <DashboardTenant
      v-else-if="user?.role === 'tenant'"
      :tenant-data="data?.tenantUnits || {}"
      :loading="status === 'pending'"
      :selected-year="tenantSelectedYear"
      @refresh="refreshData"
      @update:selected-year="tenantSelectedYear = $event"
    />
    <DashboardDefault
      v-else-if="user?.role === 'normal'"
    />
    <ClientOnly>
      <BaseNotificationsSlideover
        v-if="user?.role"
        :notifications="notifications"
        :loading="status === 'pending'"
        @refresh="refreshData"
      />
    </ClientOnly>
    />
  </BasePage>
</template>

<script setup lang="ts">
import type { Notification } from '~/types/notification'

definePageMeta({
  title: 'Dashboard',
  layout: 'default',
})

const { user } = useUserSession()
const { propertyId } = useCurrentProperty()
const { dateRange, selectedPeriod } = useDateRange()
const tenantSelectedYear = ref(new Date().getFullYear())

const { data, status, refresh } = await useAsyncData(
  () => `dashboardData-${user?.value?.role}`,
  async () => {
    if (!user.value?.role) {
      return { analytics: {}, notifications: [], tenantUnits: undefined }
    }

    if ((user.value.role === 'developer' || user.value.role === 'caretaker') && !propertyId.value) {
      return { analytics: {}, notifications: [], tenantUnits: undefined }
    }

    const params: Record<string, any> = {}
    if (user.value.role !== 'admin' && propertyId.value) {
      params.propertyId = propertyId.value
    }

    // Add date range parameters for admin and developer roles
    if ((user.value.role === 'admin' || user.value.role === 'developer') && dateRange.value) {
      params.startDate = dateRange.value.start.toISOString()
      params.endDate = dateRange.value.end.toISOString()
    }

    // For tenant, fetch notifications and tenant units data
    if (user.value.role === 'tenant') {
      const [notifications, tenantUnits] = await Promise.all([
        $fetch<Notification[]>('/api/notifications', { query: params }),
        $fetch<any>('/api/tenants/units', { query: { year: tenantSelectedYear.value } }),
      ])
      return { analytics: {}, notifications, tenantUnits }
    }

    const apiEndpoints = {
      admin: '/api/analytics/admin',
      developer: '/api/analytics/developer',
      unit_owner: '/api/analytics/owner',
      caretaker: '/api/analytics/caretaker',
    }

    const endpoint = apiEndpoints[user.value.role as keyof typeof apiEndpoints]

    if (!endpoint) {
      return { analytics: {}, notifications: [], tenantUnits: undefined }
    }

    const [analyticsResponse, notifications] = await Promise.all([
      $fetch<any>(endpoint, { query: params }),
      $fetch<Notification[]>('/api/notifications', { query: params }),
    ])

    return {
      analytics: analyticsResponse,
      notifications,
      tenantUnits: undefined,
    }
  },
  {
    default: () => ({ analytics: {}, notifications: [], tenantUnits: undefined }),
    watch: [user, propertyId, dateRange, selectedPeriod, tenantSelectedYear],
    server: false,
  },
)

const analyticsData = computed(() => {
  return data.value?.analytics?.analytics || {}
})

const notifications = computed(() => data.value?.notifications || [])

const refreshData = async () => {
  await refresh()
}
</script>
