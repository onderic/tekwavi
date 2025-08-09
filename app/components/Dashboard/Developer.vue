<template>
  <div>
    <template v-if="isLoading">
      <SkeletonAdminDashboard />
    </template>
    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mb-6">
        <!-- Rent Collected -->
        <BaseMetricCard
          title="Rent Collected"
          :value="totalRentCollected"
          icon="i-lucide-wallet"
          icon-color="blue"
          :subtitle="rentCollectedChange ? `${rentCollectedChange}% from last month` : undefined"
          :trend="rentCollectedTrend"
          currency
        />

        <!-- Unit Sales Revenue -->
        <BaseMetricCard
          title="Unit Sales Revenue"
          :value="unitSalesRevenue"
          icon="i-lucide-home"
          icon-color="emerald"
          :subtitle="`${unitsSold} units sold`"
          currency
        />

        <!-- Rent Paid to Owners -->
        <BaseMetricCard
          title="Rent Paid to Owners"
          :value="ownerDisbursements"
          icon="i-lucide-banknote"
          icon-color="purple"
          subtitle="Total disbursed"
          currency
        />

        <!-- Service Charges -->
        <BaseMetricCard
          title="Service Charges"
          :value="totalServiceCharge"
          icon="i-lucide-briefcase"
          icon-color="teal"
          :subtitle="`From ${totalUnits} units`"
          currency
        />

        <!-- Commission -->
        <BaseMetricCard
          title="Commission"
          :value="serviceFeeEarned"
          icon="i-lucide-calculator"
          icon-color="green"
          :subtitle="`${serviceFeePct}% of rent collected`"
          currency
        />

        <!-- Operating Expenses -->
        <BaseMetricCard
          title="Operating Expenses"
          :value="totalExpenses"
          icon="i-lucide-receipt"
          :icon-color="expensesTrend === 'up' ? 'red' : 'green'"
          :subtitle="expensesChange ? `${expensesChange}% from last month` : undefined"
          :trend="expensesTrend"
          currency
        />

        <!-- Maintenance Costs -->
        <BaseMetricCard
          title="Maintenance Costs"
          :value="totalMaintenanceCost"
          icon="i-lucide-wrench"
          icon-color="orange"
          :subtitle="`${totalMaintenanceRequests} requests`"
          currency
        />

        <!-- Net Profit -->
        <BaseMetricCard
          title="Net Profit"
          :value="netRevenue"
          :icon="netRevenue >= 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
          :icon-color="netRevenue >= 0 ? 'emerald' : 'red'"
          :subtitle="`${Math.abs(parseFloat(netRevenueMargin))}% margin`"
          :trend="netRevenue >= 0 ? 'up' : 'down'"
          currency
        />

        <!-- Construction Cost -->
        <BaseMetricCard
          title="Construction Cost"
          :value="constructionCost"
          icon="i-lucide-hammer"
          icon-color="amber"
          :subtitle="budgetVariance ? `${budgetVariance}% vs budget` : undefined"
          currency
        />

        <!-- Capital Recovery -->
        <BaseMetricCard
          title="Capital Recovery"
          :value="capitalRecoveryRate"
          icon="i-lucide-piggy-bank"
          icon-color="purple"
          :subtitle="`KES${remainingCapitalToRecover.toLocaleString()} remaining`"
          value-suffix="%"
        />

        <!-- Total Units -->
        <BaseMetricCard
          title="Total Units"
          :value="totalUnits"
          icon="i-lucide-building"
          icon-color="slate"
          :subtitle="`${unitsSold} sold`"
        />

        <!-- Occupancy Rate -->
        <BaseMetricCard
          title="Occupancy Rate"
          :value="occupancyRate"
          icon="i-lucide-users"
          icon-color="indigo"
          :subtitle="`${occupiedUnits} occupied`"
          value-suffix="%"
        />

        <!-- Vacant Units -->
        <BaseMetricCard
          title="Vacant Units"
          :value="vacancyRate"
          icon="i-lucide-home-x"
          icon-color="yellow"
          :subtitle="`${vacantUnits} vacant`"
          value-suffix="%"
        />

        <!-- Collection Rate -->
        <BaseMetricCard
          title="Collection Rate"
          :value="collectionRate"
          icon="i-lucide-check-circle-2"
          icon-color="lime"
          :subtitle="`${paidInvoices} of ${totalInvoices} paid`"
          value-suffix="%"
        />

        <!-- Outstanding Payments -->
        <BaseMetricCard
          title="Outstanding"
          :value="outstandingPayments"
          icon="i-lucide-alert-octagon"
          icon-color="rose"
          :subtitle="`${overdueInvoices} overdue invoices`"
          currency
        />

        <!-- Revenue Efficiency -->
        <BaseMetricCard
          title="Revenue Efficiency"
          :value="revenueEfficiency"
          icon="i-lucide-activity"
          icon-color="violet"
          subtitle="of potential revenue"
          value-suffix="%"
        />
      </div>

      <!-- Charts section remains the same -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UCard class="h-96 lg:h-[28rem] mb-5">
          <Bar
            :height="350"
            :chart-id="'monthly-revenue-expenses'"
            :data="revenueChartData"
            :options="revenueOptions"
          />
        </UCard>

        <UCard class="h-96 lg:h-[28rem] mb-5">
          <Line
            :height="350"
            :chart-id="'occupancy-trend'"
            :data="occupancyData"
            :options="occupancyOptions"
          />
        </UCard>

        <UCard class="h-96 lg:h-[28rem] mb-5">
          <Doughnut
            :height="350"
            :chart-id="'unit-status'"
            :data="unitStatusData"
            :options="doughnutOptions"
          />
        </UCard>

        <UCard class="h-96 lg:h-[28rem] mb-5">
          <Pie
            :height="350"
            :chart-id="'maintenance-issues'"
            :data="maintenanceData"
            :options="maintenanceChartOptions"
          />
        </UCard>
      </div>

      <div>
        <UCard class="h-96 lg:h-[28rem] mb-5">
          <Bar
            :height="350"
            :chart-id="'construction-roi'"
            :data="constructionROIData"
            :options="constructionROIOptions"
          />
        </UCard>
      </div>
    </template>
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

interface AnalyticsData {
  // Core Financial Metrics
  totalRentCollected?: number
  totalServiceCharge?: number
  ownerDisbursements?: number
  serviceFeeEarned?: number
  serviceFeePct?: number
  totalExpenses?: number

  // Advanced Financial Metrics
  netRevenue?: number
  netRevenueMargin?: string
  unitSalesRevenue?: number
  unitsSold?: number
  averageSalePrice?: number
  totalMaintenanceCost?: number
  totalMaintenanceRequests?: number

  // Property & Occupancy Metrics
  totalUnits?: number
  occupancyRate?: number
  vacancyRate?: number
  averageRentPerUnit?: number

  // Additional Comprehensive Metrics
  totalDepositsCollected?: number
  revenueEfficiency?: string
  capitalRecoveryRate?: string
  remainingCapitalToRecover?: number
  avgRevenuePerUnit?: number
  avgExpensePerUnit?: number
  avgMaintenanceCost?: number
  totalPotentialRevenue?: number
  totalAllRevenue?: number
  comprehensiveNetProfit?: number

  // Legacy metrics
  disbursedProperties?: number
  outstandingPayments?: number
  overdueInvoices?: number
  collectionRate?: number
  paidInvoices?: number
  totalInvoices?: number
  propertyName?: string
  propertyId?: string
  rentCollectedChange?: string
  rentCollectedTrend?: 'up' | 'down'
  expensesChange?: string
  expensesTrend?: 'up' | 'down'

  // Construction cost properties
  totalEstimatedCost?: number
  actualCostIncurred?: number
  budgetVariance?: string
  budgetVarianceStatus?: 'over' | 'under' | 'on_track'
  netProfit?: number
  roi?: string
}

export default {
  name: 'DashboardDeveloper',
  components: {
    Bar,
    // eslint-disable-next-line vue/no-reserved-component-names
    Line,
    Doughnut,
    Pie,
  },
  props: {
    isLoading: {
      type: Boolean,
      default: false,
    },
    analytics: {
      type: Object as () => AnalyticsData,
      default: () => ({}),
    },
  },
  setup() {
    const dashboard = useDashboard()

    return {
      isDark: dashboard.isDark,
    }
  },
  computed: {
    // Core Financial Metrics
    totalRentCollected() {
      return this.analytics?.totalRentCollected || 0
    },

    totalServiceCharge() {
      return this.analytics?.totalServiceCharge || 0
    },

    ownerDisbursements() {
      return this.analytics?.ownerDisbursements || 0
    },

    serviceFeeEarned() {
      return this.analytics?.serviceFeeEarned || 0
    },

    serviceFeePct() {
      return this.analytics?.serviceFeePct || 10
    },

    totalExpenses() {
      return this.analytics?.totalExpenses || 0
    },

    netRevenue() {
      return this.analytics?.netRevenue || 0
    },

    netRevenueMargin() {
      return this.analytics?.netRevenueMargin || '0'
    },

    unitSalesRevenue() {
      return this.analytics?.unitSalesRevenue || 0
    },

    unitsSold() {
      return this.analytics?.unitsSold || 0
    },

    averageSalePrice() {
      return this.analytics?.averageSalePrice || 0
    },

    totalMaintenanceCost() {
      return this.analytics?.totalMaintenanceCost || 0
    },

    totalMaintenanceRequests() {
      return this.analytics?.totalMaintenanceRequests || 0
    },

    // Property & Occupancy Metrics
    totalUnits() {
      return this.analytics?.totalUnits || 0
    },

    occupancyRate() {
      return this.analytics?.occupancyRate || 0
    },

    vacancyRate() {
      return this.analytics?.vacancyRate || 0
    },

    // Additional Comprehensive Metrics
    totalDepositsCollected() {
      return this.analytics?.totalDepositsCollected || 0
    },

    revenueEfficiency() {
      return this.analytics?.revenueEfficiency || '0.0'
    },

    capitalRecoveryRate() {
      return this.analytics?.capitalRecoveryRate || '0.0'
    },

    remainingCapitalToRecover() {
      return this.analytics?.remainingCapitalToRecover || 0
    },

    // Calculated metrics for display
    occupiedUnits() {
      return Math.round((this.totalUnits * this.occupancyRate) / 100)
    },

    vacantUnits() {
      return Math.round((this.totalUnits * this.vacancyRate) / 100)
    },

    // Legacy metrics for backward compatibility
    disbursedProperties() {
      return this.analytics?.disbursedProperties || 0
    },

    outstandingPayments() {
      return this.analytics?.outstandingPayments || 0
    },

    overdueInvoices() {
      return this.analytics?.overdueInvoices || 0
    },

    collectionRate() {
      return this.analytics?.collectionRate || 0
    },

    paidInvoices() {
      return this.analytics?.paidInvoices || 0
    },

    totalInvoices() {
      return this.analytics?.totalInvoices || 0
    },

    // Percentage change computed properties
    rentCollectedChange() {
      return this.analytics?.rentCollectedChange || null
    },

    rentCollectedTrend() {
      return this.analytics?.rentCollectedTrend || 'up'
    },

    expensesChange() {
      return this.analytics?.expensesChange || null
    },

    expensesTrend() {
      return this.analytics?.expensesTrend || 'up'
    },

    // Construction cost computed properties
    constructionCost() {
      return this.analytics?.totalEstimatedCost || 0
    },

    budgetVariance() {
      return this.analytics?.budgetVariance || null
    },

    budgetVarianceStatus() {
      return this.analytics?.budgetVarianceStatus || 'on_track'
    },

    netProfit() {
      return this.analytics?.netProfit || 0
    },

    roi() {
      return this.analytics?.roi || '0.0'
    },

    // Chart Data - Still using static data for now
    revenueChartData() {
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Gross Revenue',
            data: [48000, 52000, 55000, 53000, 58000, 60000, 62000, 65000, 63000, 68000, 70000, 72000],
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            borderRadius: 5,
            hoverBackgroundColor: 'rgba(54, 162, 235, 0.9)',
          },
          {
            label: 'Total Expenses',
            data: [32000, 35000, 38000, 34000, 36000, 37000, 40000, 38000, 37000, 39000, 41000, 43000],
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            borderRadius: 5,
            hoverBackgroundColor: 'rgba(255, 99, 132, 0.9)',
          },
        ],
      }
    },

    occupancyData() {
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Occupancy Rate (%)',
            data: [78, 80, 82, 85, 88, 90, 92, 91, 93, 95, 94, 96],
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

    unitStatusData() {
      return {
        labels: ['Occupied', 'Vacant', 'Under Maintenance'],
        datasets: [
          {
            data: [85, 12, 3],
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

    maintenanceData() {
      return {
        labels: ['Plumbing', 'Electrical', 'Structural', 'Appliance', 'Heating/Cooling', 'General', 'Other'],
        datasets: [
          {
            data: [25, 18, 8, 15, 12, 16, 6],
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(255, 99, 132, 0.8)',
            ],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(34, 197, 94, 1)',
              'rgba(255, 99, 132, 1)',
            ],
            borderWidth: 1,
            hoverOffset: 15,
          },
        ],
      }
    },

    constructionROIData() {
      return {
        labels: ['Construction Cost', 'Revenue Generated', 'Operational Expenses', 'Net Profit'],
        datasets: [
          {
            label: 'Financial Breakdown',
            data: [
              this.constructionCost,
              this.totalRentCollected + this.totalServiceCharge,
              this.totalExpenses,
              this.netProfit,
            ],
            backgroundColor: [
              'rgba(245, 158, 11, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              this.netProfit >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(220, 38, 38, 0.8)',
            ],
            borderColor: [
              'rgba(245, 158, 11, 1)',
              'rgba(34, 197, 94, 1)',
              'rgba(239, 68, 68, 1)',
              this.netProfit >= 0 ? 'rgba(16, 185, 129, 1)' : 'rgba(220, 38, 38, 1)',
            ],
            borderWidth: 1,
            borderRadius: 5,
            hoverBackgroundColor: [
              'rgba(245, 158, 11, 0.9)',
              'rgba(34, 197, 94, 0.9)',
              'rgba(239, 68, 68, 0.9)',
              this.netProfit >= 0 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(220, 38, 38, 0.9)',
            ],
          },
        ],
      }
    },

    revenueOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top' as const,
            labels: {
              font: {
                size: 14,
              },
              color: this.isDark ? '#ffffff' : '#666',
            },
          },
          tooltip: {
            mode: 'index' as const,
            intersect: false,
            callbacks: {
              label: function (context: any) {
                let label = context.dataset.label || ''
                if (label) {
                  label += ': '
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'KES',
                  }).format(context.parsed.y)
                }
                return label
              },
            },
          },
          title: {
            display: true,
            text: 'Monthly Revenue & Expenses',
            font: {
              size: 18,
            },
            color: this.isDark ? '#ffffff' : '#666',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value: any) {
                return 'KES ' + value.toLocaleString()
              },
              color: this.isDark ? '#ffffff' : '#666',
            },
            title: {
              display: true,
              text: 'Amount (KES)',
              font: {
                size: 14,
                weight: 'bold' as const,
              },
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
            title: {
              display: true,
              text: 'Month',
              font: {
                size: 14,
                weight: 'bold' as const,
              },
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
              font: {
                size: 14,
              },
              color: this.isDark ? '#ffffff' : '#666',
            },
          },
          tooltip: {
            mode: 'index' as const,
            intersect: false,
            callbacks: {
              label: function (context: any) {
                let label = context.dataset.label || ''
                if (label) {
                  label += ': '
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y + '%'
                }
                return label
              },
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
              callback: function (value: any) {
                return value + '%'
              },
              color: this.isDark ? '#ffffff' : '#666',
            },
            title: {
              display: true,
              text: 'Occupancy Rate',
              font: {
                size: 14,
                weight: 'bold' as const,
              },
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
            title: {
              display: true,
              text: 'Month',
              font: {
                size: 14,
                weight: 'bold' as const,
              },
              color: this.isDark ? '#ffffff' : '#666',
            },
            grid: {
              color: this.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            },
          },
        },
      }
    },

    doughnutOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right' as const,
            labels: {
              font: {
                size: 14,
              },
              color: this.isDark ? '#ffffff' : '#666',
            },
          },
          tooltip: {
            callbacks: {
              label: function (context: any) {
                const label = context.label || ''
                const value = context.raw || 0
                const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0)
                const percentage = Math.round((value / total) * 100)
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

    maintenanceChartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right' as const,
            labels: {
              font: {
                size: 14,
              },
              color: this.isDark ? '#ffffff' : '#666',
            },
          },
          tooltip: {
            callbacks: {
              label: function (context: any) {
                const label = context.label || ''
                const value = context.raw || 0
                const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0)
                const percentage = Math.round((value / total) * 100)
                return `${label}: ${value} (${percentage}%)`
              },
            },
          },
          title: {
            display: true,
            text: 'Maintenance Issues by Category',
            font: {
              size: 18,
            },
            color: this.isDark ? '#ffffff' : '#666',
          },
        },
        cutout: '60%',
      }
    },

    constructionROIOptions() {
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
            mode: 'index' as const,
            intersect: false,
            callbacks: {
              label: function (context: any) {
                const label = context.dataset.label || ''
                const value = context.raw || 0
                return `${label}: KES ${value.toLocaleString()}`
              },
            },
          },
          title: {
            display: true,
            text: 'Construction ROI Analysis',
            font: {
              size: 18,
            },
            color: this.isDark ? '#ffffff' : '#666',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: this.isDark ? '#ffffff' : '#666',
              callback: function (value: any) {
                return 'KES ' + value.toLocaleString()
              },
            },
            title: {
              display: true,
              text: 'Amount (KES)',
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
  },
}
</script>

<style scoped>
</style>
