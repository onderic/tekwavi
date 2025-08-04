<template>
  <div>
    <!-- Stats Cards Skeleton -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <UCard
        v-for="i in 4"
        :key="i"
      >
        <div class="card-content">
          <div class="card-icon-skeleton animate-pulse" />
          <div class="card-info flex-1">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse" />
            <div class="h-7 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse" />
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Charts Skeleton -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse" />
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
          </div>
        </template>
        <div class="chart-skeleton animate-pulse" />
      </UCard>

      <UCard>
        <template #header>
          <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse" />
        </template>
        <div class="chart-skeleton animate-pulse" />
      </UCard>
    </div>

    <!-- Monthly Breakdown Skeleton -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
        </div>
      </template>
      <div class="chart-skeleton animate-pulse" />
    </UCard>
  </div>
</template>

<style scoped>
.card-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.card-icon-skeleton {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  margin-right: 12px;
  flex-shrink: 0;
  background-color: #e5e7eb;
}

.dark .card-icon-skeleton {
  background-color: #374151;
}

.chart-skeleton {
  height: 300px;
  background-color: #f3f4f6;
  border-radius: 8px;
}

.dark .chart-skeleton {
  background-color: #1f2937;
}
</style>
