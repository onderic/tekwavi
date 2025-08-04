<template>
  <UCard>
    <div class="flex items-center space-x-2 mb-4">
      <UIcon
        name="i-lucide-trending-up"
        class="h-6 w-6 text-green-500 dark:text-green-400"
      />
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
        Property Usage Over Time
      </h2>
    </div>

    <div class="chart-container h-64">
      <Line
        :data="chartData"
        :options="chartOptions"
      />
    </div>

    <p class="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
      Number of active properties over the last 9 months
    </p>
  </UCard>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { useDashboard } from '~/composables/useDashboard'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
)

// Get current color mode from dashboard composable
const { isDark } = useDashboard()

// Static data for demonstration
const propertyData = [2, 3, 4, 5, 6, 7, 7.5, 8, 8.2]

// Chart data configuration with reactive colors
const chartData = computed(() => ({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  datasets: [
    {
      label: 'Properties',
      data: propertyData,
      borderColor: isDark.value ? 'rgb(34, 197, 94)' : 'rgb(16, 185, 129)', // green-500 for light, green-400 for dark
      backgroundColor: isDark.value ? 'rgba(34, 197, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
      tension: 0.3,
      pointBackgroundColor: isDark.value ? 'rgb(34, 197, 94)' : 'rgb(16, 185, 129)',
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: true,
    },
  ],
}))

// Chart options with reactive colors
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: isDark.value ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      titleColor: isDark.value ? '#f3f4f6' : '#111827',
      bodyColor: isDark.value ? '#f3f4f6' : '#111827',
      bodyFont: {
        size: 12,
      },
      borderColor: isDark.value ? 'rgba(34, 197, 94, 0.5)' : 'rgba(16, 185, 129, 0.5)',
      borderWidth: 1,
      padding: 8,
      displayColors: false,
      callbacks: {
        title: (items: any[]) => {
          return items[0].label + ' 2025'
        },
        label: (context: any) => {
          return `Active Properties: ${context.parsed.y}`
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 10,
      ticks: {
        stepSize: 2,
        font: {
          size: 10,
        },
        color: isDark.value ? '#9ca3af' : '#6b7280',
        callback: function (value: any) {
          return value % 1 === 0 ? value : ''
        },
      },
      grid: {
        color: isDark.value ? 'rgba(156, 163, 175, 0.1)' : 'rgba(107, 114, 128, 0.1)',
        drawBorder: false,
      },
    },
    x: {
      ticks: {
        font: {
          size: 10,
        },
        color: isDark.value ? '#9ca3af' : '#6b7280',
      },
      grid: {
        display: false,
        drawBorder: false,
      },
    },
  },
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
}))
</script>

<style scoped>
.chart-container {
  position: relative;
}
</style>
