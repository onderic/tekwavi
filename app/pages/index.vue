<template>
  <BasePage
    title="Dashboard"
    icon="i-lucide-home"
    :force-dashboard="true"
    :status="status === 'pending'"
  >
    <DashboardAdmin
      v-if="userRole === 'admin'"
      :analytics="analyticsData"
    />
    <DashboardDeveloper
      v-else-if="userRole === 'developer'"
      :analytics="analyticsData"
      :is-loading="status === 'pending'"
    />
    <DashboardUnitOwner
      v-else-if="userRole === 'unit_owner'"
      :analytics="analyticsData"
      :is-loading="status === 'pending'"
    />
    <DashboardCaretaker
      v-else-if="userRole === 'caretaker'"
      :analytics="analyticsData"
      :is-loading="status === 'pending'"
    />
    <DashboardTenant
      v-else-if="userRole === 'tenant'"
      :tenant-data="data?.tenantUnits || {}"
      :loading="status === 'pending'"
      :selected-year="tenantSelectedYear"
      @refresh="refreshData"
      @update:selected-year="tenantSelectedYear = $event"
    />
    <DashboardDefault
      v-else-if="userRole === 'normal'"
    />

    <!-- Pass notifications as props -->
    <ClientOnly>
      <BaseNotificationsSlideover
        v-if="isUserSessionReady"
        :notifications="notifications"
        :loading="status === 'pending'"
        @refresh="refreshData"
      />
    </ClientOnly>
  </BasePage>
</template>

<script setup lang="ts">
import type { Notification } from '~/types/notification'

definePageMeta({
  title: 'Dashboard',
  layout: 'default',
})

const { user } = useUserSession()
const { propertyId, userRole, propertyChanged } = useCurrentProperty()

const { dateRange, selectedPeriod } = useDateRange()

const tenantSelectedYear = ref(new Date().getFullYear())

const isUserSessionReady = computed(() => {
  return user.value && user.value._id && userRole.value
})

const { data, status, refresh } = await useAsyncData(
  () => `dashboardData-${userRole.value}`,
  async () => {
    if (!isUserSessionReady.value) {
      return { analytics: {}, notifications: [], tenantUnits: undefined }
    }

    // Additional check to ensure user session is valid
    if (!user.value?._id || !userRole.value) {
      return { analytics: {}, notifications: [], tenantUnits: undefined }
    }

    await nextTick()

    if ((user?.value?.role === 'developer' || user?.value?.role === 'caretaker') && !propertyId.value) {
      return { analytics: {}, notifications: [], tenantUnits: undefined }
    }
    const params: Record<string, any> = {}
    if (userRole.value !== 'admin' && propertyId.value) {
      params.propertyId = propertyId.value
    }

    // Add date range parameters for admin and developer roles
    if ((userRole.value === 'admin' || userRole.value === 'developer') && dateRange.value) {
      params.startDate = dateRange.value.start.toISOString()
      params.endDate = dateRange.value.end.toISOString()
    }

    // For tenant, fetch notifications and tenant units data
    if (userRole.value === 'tenant') {
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

    const endpoint = apiEndpoints[userRole.value as keyof typeof apiEndpoints]

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
    watch: [isUserSessionReady, propertyId, computed(() => propertyChanged), userRole, dateRange, selectedPeriod, tenantSelectedYear],
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

if (userRole.value !== 'tenant' || userRole.value !== 'normal') {
  watchEffect(() => {
    console.log(`Dashboard data for ${userRole.value}:`, {
      propertyId: propertyId.value,
      analytics: analyticsData.value,
      rawData: data.value,
    })
  })
}
</script>
