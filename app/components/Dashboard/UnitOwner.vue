<template>
  <div>
    <SkeletonOwnerDashboard v-if="isLoading" />

    <!-- Show actual content when not loading -->
    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <UCard>
          <div class="card-content">
            <div class="card-icon total-revenue">
              <UIcon
                name="i-heroicons-banknotes"
                size="xl"
              />
            </div>
            <div class="card-info">
              <h3 class="card-title">
                Total Revenue
              </h3>
              <p class="card-value">
                {{ formatCurrency(analytics?.totalRevenue || 0) }}
              </p>
              <p class="card-subtext">
                All time earnings
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="card-content">
            <div class="card-icon units">
              <UIcon
                name="i-heroicons-building-office-2"
                size="xl"
              />
            </div>
            <div class="card-info">
              <h3 class="card-title">
                Total Units
              </h3>
              <p class="card-value">
                {{ analytics?.totalUnits || 0 }}
              </p>
              <p class="card-subtext">
                <span class="highlight">{{ analytics?.occupiedUnits || 0 }}</span> occupied,
                <span class="highlight">{{ analytics?.vacantUnits || 0 }}</span> vacant
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="card-content">
            <div class="card-icon revenue">
              <UIcon
                name="i-heroicons-currency-dollar"
                size="xl"
              />
            </div>
            <div class="card-info">
              <h3 class="card-title">
                Monthly Income
              </h3>
              <p class="card-value">
                {{ formatCurrency(analytics?.monthlyIncome || 0) }}
              </p>
              <p class="card-subtext">
                Current month
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="card-content">
            <div class="card-icon charges">
              <UIcon
                name="i-heroicons-document-text"
                size="xl"
              />
            </div>
            <div class="card-info">
              <h3 class="card-title">
                Service Charges
              </h3>
              <p class="card-value">
                {{ formatCurrency(analytics?.serviceCharges || 0) }}
              </p>
              <p class="card-subtext">
                {{ analytics?.serviceChargesCollected || 0 }}% collected
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Income History Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                Rent Income History
              </h3>
              <USelectMenu
                v-model="selectedYear"
                :options="yearOptions"
                size="sm"
              />
            </div>
          </template>

          <div class="chart-container">
            <Bar
              :height="300"
              :chart-id="'rent-income-history'"
              :data="incomeData"
              :options="incomeOptions"
            />
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Occupancy Timeline
            </h3>
          </template>

          <div class="chart-container">
            <Line
              :height="300"
              :chart-id="'occupancy-timeline'"
              :data="occupancyTimelineData"
              :options="occupancyTimelineOptions"
            />
          </div>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              Monthly Income Breakdown
            </h3>
            <UButton
              icon="i-heroicons-arrow-down-tray"
              size="sm"
              @click="exportAllReports"
            >
              Export Report
            </UButton>
          </div>
        </template>

        <div class="chart-container">
          <Bar
            :height="300"
            :chart-id="'monthly-breakdown'"
            :data="monthlyBreakdownData"
            :options="monthlyBreakdownOptions"
          />
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js'

import { Bar, Line } from 'vue-chartjs'

definePageMeta({
 //nothing
  title: 'Dashboard',
})

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
)

interface AnalyticsData {
  totalRevenue?: number
  totalUnits?: number
  occupiedUnits?: number
  vacantUnits?: number
  monthlyIncome?: number
  serviceCharges?: number
  serviceChargesCollected?: number
  currentYear?: number
  incomeHistory?: {
    labels: string[]
    rentIncome: number[]
    serviceCharges: number[]
  }
  occupancyTimeline?: {
    labels: string[]
    data: number[]
  }
  monthlyBreakdown?: {
    rentIncome: number
    serviceCharges: number
    total: number
  }
}

const props = defineProps<{
  analytics?: AnalyticsData
  isLoading?: boolean
}>()

const { $colorMode } = useNuxtApp()
const isDark = computed(() => $colorMode.value === 'dark')

// Use current year from analytics or default to current year
const selectedYear = ref(props.analytics?.currentYear || new Date().getFullYear())

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - i)
})

// Chart colors based on theme
const chartColors = computed(() => ({
  text: isDark.value ? '#ffffff' : '#374151',
  grid: isDark.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
}))

// Chart data using dynamic analytics data
const incomeData = computed(() => ({
  labels: props.analytics?.incomeHistory?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: 'Rent Income',
      data: props.analytics?.incomeHistory?.rentIncome || Array(12).fill(0),
      backgroundColor: 'rgba(54, 162, 235, 0.7)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    },
    {
      label: 'Service Charges',
      data: props.analytics?.incomeHistory?.serviceCharges || Array(12).fill(0),
      backgroundColor: 'rgba(75, 192, 192, 0.7)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
    },
  ],
}))

const occupancyTimelineData = computed(() => ({
  labels: props.analytics?.occupancyTimeline?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: 'Occupied Units',
      data: props.analytics?.occupancyTimeline?.data || Array(12).fill(0),
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.3,
      fill: true,
    },
  ],
}))

const monthlyBreakdownData = computed(() => {
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const breakdown = props.analytics?.monthlyBreakdown || { rentIncome: 0, serviceCharges: 0, total: 0 }

  return {
    labels: ['Rent Income', 'Service Charges', 'Total'],
    datasets: [
      {
        label: currentMonth,
        data: [breakdown.rentIncome, breakdown.serviceCharges, breakdown.total],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 206, 86, 0.7)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }
})

const incomeOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: chartColors.value.text,
      },
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          return `${context.dataset.label}: KES ${context.parsed.y.toLocaleString()}`
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        color: chartColors.value.text,
      },
      grid: {
        color: chartColors.value.grid,
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: any) => `KES ${value.toLocaleString()}`,
        color: chartColors.value.text,
      },
      grid: {
        color: chartColors.value.grid,
      },
    },
  },
}))

const occupancyTimelineOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: chartColors.value.text,
      },
    },
  },
  scales: {
    x: {
      ticks: {
        color: chartColors.value.text,
      },
      grid: {
        color: chartColors.value.grid,
      },
    },
    y: {
      beginAtZero: true,
      max: Math.max(props.analytics?.totalUnits || 1, ...(props.analytics?.occupancyTimeline?.data || [1])),
      ticks: {
        stepSize: 1,
        color: chartColors.value.text,
      },
      grid: {
        color: chartColors.value.grid,
      },
    },
  },
}))

const monthlyBreakdownOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: chartColors.value.text,
      },
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          return `${context.label}: KES ${context.parsed.y.toLocaleString()}`
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        color: chartColors.value.text,
      },
      grid: {
        color: chartColors.value.grid,
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: any) => `KES ${value.toLocaleString()}`,
        color: chartColors.value.text,
      },
      grid: {
        color: chartColors.value.grid,
      },
    },
  },
}))

// Methods
const formatCurrency = (amount: number) => {
  return `KES ${amount.toLocaleString()}`
}

const exportAllReports = () => {
  // TODO: Implement export functionality
  console.log('Exporting all reports...')
}

// Watch for analytics data changes
watch(() => props.analytics, (newAnalytics) => {
  if (newAnalytics?.currentYear) {
    selectedYear.value = newAnalytics.currentYear
  }
}, { immediate: true })
</script>

<style scoped>
.card-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.card-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  margin-right: 12px;
  flex-shrink: 0;
}

.card-icon.total-revenue {
  background-color: rgba(16, 185, 129, 0.2);
  color: rgba(16, 185, 129, 1);
}

.card-icon.revenue {
  background-color: rgba(54, 162, 235, 0.2);
  color: rgba(54, 162, 235, 1);
}

.card-icon.occupancy {
  background-color: rgba(75, 192, 192, 0.2);
  color: rgba(75, 192, 192, 1);
}

.card-icon.units {
  background-color: rgba(255, 206, 86, 0.2);
  color: rgba(255, 206, 86, 1);
}

.card-icon.charges {
  background-color: rgba(153, 102, 255, 0.2);
  color: rgba(153, 102, 255, 1);
}

.card-info {
  flex-grow: 1;
}

.card-title {
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0 0 4px;
  opacity: 0.8;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 2px;
}

.card-subtext {
  font-size: 0.75rem;
  margin: 0;
  opacity: 0.7;
}

.highlight {
  font-weight: 600;
}

.chart-container {
  height: 300px;
}
</style>
