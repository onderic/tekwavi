import type { Range, Period } from '~/types/dateRange'

// Global state for date range and period
const dateRange = ref<Range>({
  start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), // First day of previous month
  end: new Date(new Date().getFullYear(), new Date().getMonth(), 0), // Last day of previous month
})

const selectedPeriod = ref<Period>('weekly')

export const useDateRange = () => {
  const setDateRange = (range: Range) => {
    dateRange.value = { ...range }
  }

  const setPeriod = (period: Period) => {
    selectedPeriod.value = period
  }

  return {
    dateRange: readonly(dateRange),
    selectedPeriod: readonly(selectedPeriod),
    setDateRange,
    setPeriod,
  }
}
