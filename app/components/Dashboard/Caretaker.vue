<template>
  <div>
    <div
      v-if="isLoading"
      class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6"
    >
      <UCard
        v-for="i in 4"
        :key="i"
      >
        <USkeleton class="h-20 w-full" />
      </UCard>
    </div>

    <div
      v-else
      class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6"
    >
      <!-- Collection Rate Card -->
      <BaseMetricCard
        title="Collection Rate"
        :value="analytics.invoiceCollectionRate || 0"
        icon="i-heroicons-chart-bar-square"
        icon-color="blue"
        :subtitle="`${analytics.paidInvoices || 0} paid, ${analytics.overdueInvoices || 0} overdue`"
        value-suffix="%"
      />

      <!-- Occupancy Rate Card -->
      <BaseMetricCard
        title="Occupancy Rate"
        :value="analytics.occupancyRate || 0"
        icon="i-heroicons-home"
        icon-color="teal"
        :subtitle="`${analytics.occupiedUnits || 0} occupied, ${analytics.vacantUnits || 0} vacant`"
        value-suffix="%"
      />

      <!-- Total Units Card -->
      <BaseMetricCard
        title="Total Units"
        :value="analytics.totalUnits || 0"
        icon="i-heroicons-building-office-2"
        icon-color="yellow"
        :subtitle="`${analytics.totalOwnedUnits || 0} owned, ${analytics.totalTenants || 0} tenants`"
      />

      <!-- Maintenance Card -->
      <BaseMetricCard
        title="Maintenance"
        :value="analytics.totalMaintenanceRequests || 0"
        icon="i-heroicons-wrench-screwdriver"
        icon-color="red"
        :subtitle="maintenanceSubtitle"
        :trend="analytics.maintenanceTrend"
      />
    </div>

    <!-- Charts Section -->
    <div
      v-if="!isLoading"
      class="grid grid-cols-1 lg:grid-cols-2 gap-4"
    >
      <!-- Property Efficiency Chart -->
      <UCard class="chart-container">
        <Bar
          :height="350"
          :chart-id="'property-efficiency'"
          :data="efficiencyData"
          :options="efficiencyOptions"
        />
      </UCard>

      <!-- Occupancy Trend Chart -->
      <UCard class="chart-container">
        <Line
          :height="350"
          :chart-id="'occupancy-trend'"
          :data="occupancyTrendData"
          :options="occupancyOptions"
        />
      </UCard>

      <!-- Unit Status Distribution -->
      <UCard class="chart-container">
        <Doughnut
          :height="350"
          :chart-id="'unit-status'"
          :data="unitStatusData"
          :options="unitStatusOptions"
        />
      </UCard>

      <!-- Maintenance Issues -->
      <UCard class="chart-container">
        <Pie
          :height="350"
          :chart-id="'maintenance-issues'"
          :data="maintenanceData"
          :options="maintenanceOptions"
        />
      </UCard>
    </div>

    <!-- Loading Charts -->
    <div
      v-else
      class="grid grid-cols-1 lg:grid-cols-2 gap-4"
    >
      <UCard
        v-for="i in 4"
        :key="i"
        class="chart-container"
      >
        <USkeleton class="h-80 w-full" />
      </UCard>
    </div>
  </div>
</template>

<script lang="ts">
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
  ArcElement,
  Filler,
} from 'chart.js'
import { Bar, Line, Doughnut, Pie } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend,
)

export default {
  name: 'CaretakerDashboard',
  components: {
    Bar,
    // eslint-disable-next-line vue/no-reserved-component-names
    Line,
    Doughnut,
    Pie,
  },
  props: {
    analytics: {
      type: Object,
      default: () => ({}),
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const dashboard = useDashboard()

    return {
      isDark: dashboard.isDark,
    }
  },
  computed: {
    maintenanceSubtitle() {
      const urgent = this.analytics.urgentRequests || 0
      const pending = this.analytics.pendingRequests || 0
      const change = this.analytics.maintenanceChange

      let subtitle = `${urgent} urgent, ${pending} pending`
      if (change) {
        subtitle += ` • ${change}% from last month`
      }
      return subtitle
    },

    // Property Efficiency Data
    efficiencyData() {
      return {
        labels: ['Occupancy Rate', 'Collection Rate', 'Maintenance Completion', 'Overall Score'],
        datasets: [
          {
            label: 'Performance %',
            data: [
              this.analytics.occupancyRate || 0,
              this.analytics.invoiceCollectionRate || 0,
              this.analytics.maintenanceCompletionRate || 0,
              this.analytics.propertyEfficiencyScore || 0,
            ],
            backgroundColor: [
              'rgba(75, 192, 192, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(153, 102, 255, 0.7)',
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
            borderRadius: 5,
          },
        ],
      }
    },

    // Occupancy Trend Data (mock monthly data based on current rate)
    occupancyTrendData() {
      const currentRate = this.analytics.occupancyRate || 0
      const baselineData = Array.from({ length: 12 }, (_) => {
        const variance = Math.random() * 10 - 5 // ±5% variance
        return Math.max(0, Math.min(100, currentRate + variance))
      })

      return {
        labels: [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ],
        datasets: [
          {
            label: 'Occupancy Rate (%)',
            data: baselineData,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(75, 192, 192, 1)',
            pointBorderColor: '#fff',
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: true,
            tension: 0.3,
          },
        ],
      }
    },

    // Unit Status Data
    unitStatusData() {
      return {
        labels: ['Occupied', 'Vacant', 'Owned Units'],
        datasets: [
          {
            data: [
              this.analytics.occupiedUnits || 0,
              this.analytics.vacantUnits || 0,
              this.analytics.totalOwnedUnits || 0,
            ],
            backgroundColor: [
              'rgba(75, 192, 192, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(153, 102, 255, 0.8)',
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
            hoverOffset: 15,
          },
        ],
      }
    },

    // Maintenance Data by Category
    maintenanceData() {
      const maintenanceByCategory = this.analytics.maintenanceByCategory || []
      const categoryStats: Record<string, number> = {}

      // Process maintenance data by category
      maintenanceByCategory.forEach((item: any) => {
        const category = item.category || 'Other'
        categoryStats[category] = (categoryStats[category] || 0) + 1
      })

      const labels = Object.keys(categoryStats)
      const data = Object.values(categoryStats).map(val => Number(val))

      return {
        labels: labels.length > 0 ? labels : ['No Data'],
        datasets: [
          {
            data: data.length > 0 ? data : [1],
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)',
              'rgba(255, 159, 64, 0.8)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
            hoverOffset: 15,
          },
        ],
      }
    },

    // Chart Options
    efficiencyOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                return `${context.label}: ${context.parsed.y}%`
              },
            },
          },
          title: {
            display: true,
            text: 'Property Performance Metrics',
            font: {
              size: 18,
            },
            color: this.isDark ? '#ffffff' : '#666',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value: any) => value + '%',
              color: this.isDark ? '#ffffff' : '#666',
            },
            title: {
              display: true,
              text: 'Performance (%)',
              color: this.isDark ? '#ffffff' : '#666',
            },
            grid: {
              color: this.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            },
          },
          x: {
            ticks: {
              color: this.isDark ? '#ffffff' : '#666',
            },
            grid: {
              color: this.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            },
          },
        },
      }
    },

    occupancyOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top' as const,
            labels: {
              color: this.isDark ? '#ffffff' : '#666',
            },
          },
          tooltip: {
            callbacks: {
              label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`,
            },
          },
          title: {
            display: true,
            text: 'Monthly Occupancy Trend',
            font: {
              size: 18,
            },
            color: this.isDark ? '#ffffff' : '#666',
          },
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: {
              callback: (value: any) => value + '%',
              color: this.isDark ? '#ffffff' : '#666',
            },
            title: {
              display: true,
              text: 'Occupancy Rate',
              color: this.isDark ? '#ffffff' : '#666',
            },
            grid: {
              color: this.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            },
          },
          x: {
            ticks: {
              color: this.isDark ? '#ffffff' : '#666',
            },
            grid: {
              color: this.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            },
          },
        },
      }
    },

    unitStatusOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right' as const,
            labels: {
              color: this.isDark ? '#ffffff' : '#666',
            },
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || ''
                const value = context.raw || 0
                const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0)
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0
                return `${label}: ${value} (${percentage}%)`
              },
            },
          },
          title: {
            display: true,
            text: 'Unit Status Distribution',
            font: {
              size: 18,
            },
            color: this.isDark ? '#ffffff' : '#666',
          },
        },
        cutout: '60%',
      }
    },

    maintenanceOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right' as const,
            labels: {
              color: this.isDark ? '#ffffff' : '#666',
            },
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || ''
                const value = context.raw || 0
                return `${label}: ${value} requests`
              },
            },
          },
          title: {
            display: true,
            text: 'Maintenance by Category',
            font: {
              size: 18,
            },
            color: this.isDark ? '#ffffff' : '#666',
          },
        },
      }
    },
  },
}
</script>

<style scoped>
.chart-container {
  height: 400px;
  margin-bottom: 20px;
}
</style>
