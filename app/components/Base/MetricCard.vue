<template>
  <UCard>
    <div class="flex items-center h-full">
      <div
        class="flex justify-center items-center w-14 h-14 lg:w-16 lg:h-16 rounded-xl mr-4 flex-shrink-0"
        :class="iconBgClass"
      >
        <UIcon
          :name="icon"
          class="w-6 h-6 lg:w-8 lg:h-8"
        />
      </div>
      <div class="flex-grow">
        <h3 class="text-sm lg:text-base font-medium opacity-80 mb-2">
          {{ title }}
        </h3>
        <p class="text-xl lg:text-2xl font-semibold mb-1.5">
          {{ formattedValue }}
        </p>
        <p
          v-if="subtitle || trend"
          class="flex items-center text-xs lg:text-sm"
          :class="subtitleClass"
        >
          <UIcon
            v-if="trendIcon"
            :name="trendIcon"
            class="w-4 h-4 mr-1"
          />
          {{ subtitle }}
        </p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  title: string
  value: string | number
  icon: string
  iconColor?: string
  subtitle?: string
  trend?: 'up' | 'down' | null
  valuePrefix?: string
  valueSuffix?: string
  currency?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: 'blue',
  trend: null,
  valuePrefix: '',
  valueSuffix: '',
  currency: false,
})

const iconBgClass = computed(() => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-500',
    emerald: 'bg-emerald-500/20 text-emerald-500',
    purple: 'bg-purple-500/20 text-purple-500',
    teal: 'bg-teal-500/20 text-teal-500',
    green: 'bg-green-500/20 text-green-500',
    red: 'bg-red-500/20 text-red-500',
    orange: 'bg-orange-500/20 text-orange-500',
    amber: 'bg-amber-500/20 text-amber-500',
    slate: 'bg-slate-500/20 text-slate-500',
    indigo: 'bg-indigo-500/20 text-indigo-500',
    yellow: 'bg-yellow-500/20 text-yellow-500',
    lime: 'bg-lime-500/20 text-lime-500',
    rose: 'bg-rose-500/20 text-rose-500',
    violet: 'bg-violet-500/20 text-violet-500',
  }
  return colorMap[props.iconColor] || colorMap.blue
})

const formattedValue = computed(() => {
  let formatted = String(props.value)

  if (props.currency && typeof props.value === 'number') {
    formatted = `KES${props.value.toLocaleString()}`
  }
  else if (typeof props.value === 'number' && !props.valueSuffix.includes('%')) {
    formatted = props.value.toLocaleString()
  }

  return `${props.valuePrefix}${formatted}${props.valueSuffix}`
})

const trendIcon = computed(() => {
  if (!props.trend) return null
  return props.trend === 'up' ? 'i-lucide-trending-up' : 'i-lucide-trending-down'
})

const subtitleClass = computed(() => {
  if (!props.trend) return 'text-gray-500'
  return props.trend === 'up' ? 'text-green-500' : 'text-red-500'
})
</script>
