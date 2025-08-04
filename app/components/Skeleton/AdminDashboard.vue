<template>
  <div>
    <!-- Card Grid - 8 cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Skeleton Cards -->
      <UCard
        v-for="i in 16"
        :key="`card-${i}`"
      >
        <div class="flex items-center h-full">
          <div class="w-14 h-14 lg:w-16 lg:h-16 rounded-xl mr-4 bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
          <div class="flex-grow">
            <div class="h-3 lg:h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
            <div class="h-6 lg:h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-1.5 animate-pulse" />
            <div class="h-3 lg:h-3.5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Chart Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Chart Skeleton 1 -->
      <UCard class="h-96 lg:h-[28rem] mb-5">
        <div class="p-4 h-full">
          <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6 animate-pulse" />
          <div class="flex items-center justify-center h-[300px]">
            <div class="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </UCard>

      <!-- Chart Skeleton 2 -->
      <UCard class="h-96 lg:h-[28rem] mb-5">
        <div class="p-4 h-full">
          <div class="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse" />
          <div class="flex items-center justify-center h-[300px]">
            <div class="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </UCard>

      <!-- Chart Skeleton 3 -->
      <UCard class="h-96 lg:h-[28rem] mb-5">
        <div class="p-4 h-full">
          <div class="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse" />
          <div class="flex items-center justify-center h-[300px]">
            <div class="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </UCard>

      <!-- Chart Skeleton 4 -->
      <UCard class="h-96 lg:h-[28rem] mb-5">
        <div class="p-4 h-full">
          <div class="h-5 w-56 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse" />
          <div class="flex items-center justify-center h-[300px]">
            <div class="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
// No setup needed for skeleton loader
</script>
