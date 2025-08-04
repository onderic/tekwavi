<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
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
              Total Revenue
            </h3>
            <p class="card-value">
              KES1,138,000
            </p>
            <p class="card-change positive">
              <UIcon name="i-heroicons-arrow-trending-up" />
              8.7% from last year
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="card-content">
          <div class="card-icon occupancy">
            <UIcon
              name="i-heroicons-home"
              size="xl"
            />
          </div>
          <div class="card-info">
            <h3 class="card-title">
              Occupancy Rate
            </h3>
            <p class="card-value">
              94%
            </p>
            <p class="card-change positive">
              <UIcon name="i-heroicons-arrow-trending-up" />
              3.2% from last month
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
              248
            </p>
            <p class="card-subtext">
              <span class="highlight">234</span> occupied,
              <span class="highlight">14</span> vacant
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="card-content">
          <div class="card-icon maintenance">
            <UIcon
              name="i-heroicons-wrench-screwdriver"
              size="xl"
            />
          </div>
          <div class="card-info">
            <h3 class="card-title">
              Maintenance
            </h3>
            <p class="card-value">
              18
            </p>
            <p class="card-subtext">
              <span class="highlight">7</span> urgent,
              <span class="highlight">11</span> standard
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <UCard class="chart-container">
        <Bar
          :height="350"
          :chart-id="'monthly-revenue-expenses'"
          :data="revenueData"
          :options="revenueOptions"
        />
      </UCard>

      <UCard class="chart-container">
        <Line
          :height="350"
          :chart-id="'occupancy-trend'"
          :data="occupancyData"
          :options="occupancyOptions"
        />
      </UCard>

      <UCard class="chart-container">
        <Doughnut
          :height="350"
          :chart-id="'unit-status'"
          :data="unitStatusData"
          :options="doughnutOptions"
        />
      </UCard>

      <UCard class="chart-container">
        <Pie
          :height="350"
          :chart-id="'maintenance-issues'"
          :data="maintenanceData"
          :options="doughnutOptions"
        />
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
  setup() {
    const dashboard = useDashboard()

    return {
      isDark: dashboard.isDark,
    }
  },
  data() {
    return {
      revenueData: {
        labels: [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
        ],
        datasets: [
          {
            label: 'Monthly Revenue',
            data: [75000, 83000, 92000, 88000, 95000, 102000, 108000, 112000, 105000, 98000, 89000, 94000],
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            borderRadius: 5,
            hoverBackgroundColor: 'rgba(54, 162, 235, 0.9)',
          },
          {
            label: 'Monthly Expenses',
            data: [55000, 58000, 62000, 59000, 63000, 68000, 70000, 72000, 67000, 61000, 56000, 59000],
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            borderRadius: 5,
            hoverBackgroundColor: 'rgba(255, 99, 132, 0.9)',
          },
        ],
      },

      occupancyData: {
        labels: [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
        ],
        datasets: [
          {
            label: 'Occupancy Rate (%)',
            data: [88, 89, 91, 92, 93, 94, 95, 95, 94, 94, 93, 94],
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
      },

      unitStatusData: {
        labels: ['Occupied', 'Vacant', 'Under Maintenance'],
        datasets: [
          {
            data: [234, 8, 6],
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
      },

      maintenanceData: {
        labels: ['Plumbing', 'Electrical', 'Structural', 'Appliance', 'HVAC'],
        datasets: [
          {
            data: [7, 4, 2, 3, 2],
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
            hoverOffset: 15,
          },
        ],
      },
    }
  },
  computed: {
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
                    currency: 'USD',
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
                return '$' + value.toLocaleString()
              },
              color: this.isDark ? '#ffffff' : '#666',
            },
            title: {
              display: true,
              text: 'Amount (USD)',
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
            min: 80,
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
  },
}
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
  width: 60px;
  height: 60px;
  border-radius: 12px;
  margin-right: 16px;
  flex-shrink: 0;
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

.card-icon.maintenance {
  background-color: rgba(255, 99, 132, 0.2);
  color: rgba(255, 99, 132, 1);
}

.card-info {
  flex-grow: 1;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0 0 8px;
  opacity: 0.8;
}

.card-value {
  font-size: 1.7rem;
  font-weight: 600;
  margin: 0 0 6px;
}

.card-change {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  margin: 0;
}

.card-change.positive {
  color: #10b981;
}

.card-change.negative {
  color: #ef4444;
}

.card-subtext {
  font-size: 0.85rem;
  margin: 0;
}

.highlight {
  font-weight: 600;
}

.chart-container {
  height: 400px;
  margin-bottom: 20px;
}
</style>
