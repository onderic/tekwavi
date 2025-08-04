<template>
  <div class="relative">
    <div
      v-if="!chartLoaded"
      class="flex items-center justify-center h-96"
    >
      <div class="text-center">
        <UIcon
          name="i-lucide-loader-2"
          class="w-8 h-8 animate-spin mx-auto mb-2"
        />
        <p class="text-sm text-gray-500">
          Loading chart...
        </p>
      </div>
    </div>

    <component
      :is="chartComponent"
      v-if="chartLoaded"
      v-bind="$attrs"
      :data="data"
      :options="options"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  type: 'Bar' | 'Line' | 'Doughnut' | 'Pie'
  data: any
  options: any
}

const props = defineProps<Props>()
const chartLoaded = ref(false)
const chartComponent = ref<any>(null)

onMounted(async () => {
  try {
    // Dynamic import for Chart.js components
    const chartJsModule = await import('chart.js')
    const { Chart: ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler } = chartJsModule

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

    // Dynamic import for vue-chartjs
    const vueChartjs = await import('vue-chartjs')
    chartComponent.value = vueChartjs[props.type]
    chartLoaded.value = true
  }
  catch (error) {
    console.error('Failed to load chart component:', error)
  }
})
</script>
