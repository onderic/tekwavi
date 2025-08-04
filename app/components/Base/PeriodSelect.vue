<script setup lang="ts">
import { eachDayOfInterval } from 'date-fns'
import type { Period } from '~/types/dateRange'

const { dateRange, selectedPeriod, setPeriod } = useDateRange()

const model = computed({
  get: () => selectedPeriod.value,
  set: (value: Period) => setPeriod(value),
})

const days = computed(() => eachDayOfInterval(dateRange.value))

const periods = computed<Period[]>(() => {
  if (days.value.length <= 8) {
    return [
      'daily',
    ]
  }

  if (days.value.length <= 31) {
    return [
      'daily',
      'weekly',
    ]
  }

  return [
    'weekly',
    'monthly',
  ]
})

// Ensure the model value is always a valid period
watch(periods, () => {
  if (!periods.value.includes(model.value)) {
    // Default to 'weekly' if available, otherwise take the first available period
    if (periods.value.includes('weekly')) {
      setPeriod('weekly')
    }
    else {
      setPeriod(periods.value[0]!)
    }
  }
}, { immediate: true })
</script>

<template>
  <USelect
    v-model="model"
    :items="periods"
    variant="ghost"
    class="data-[state=open]:bg-elevated"
    :ui="{ value: 'capitalize', itemLabel: 'capitalize', trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
  />
</template>
