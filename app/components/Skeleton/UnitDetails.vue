<template>
  <div class="animate-pulse">
    <!-- Header Section -->
    <div class="flex flex-row items-center justify-between gap-4 mb-6">
      <div>
        <div class="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-2" />
      </div>
      <div class="flex flex-wrap gap-2">
        <div class="h-10 bg-gray-300 dark:bg-gray-700 rounded w-24" />
        <div class="h-10 bg-gray-300 dark:bg-gray-700 rounded w-24" />
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Unit Details Card -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="h-6 bg-gray-300 dark:bg-gray-700 rounded w-24" />
            <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16" />
          </div>
        </template>

        <div class="space-y-4">
          <!-- Unit info rows -->
          <div
            v-for="i in 6"
            :key="i"
            class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700"
          >
            <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20" />
            <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24" />
          </div>
        </div>
      </UCard>

      <!-- Payment Calendar Card -->
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <div class="h-6 bg-gray-300 dark:bg-gray-700 rounded w-24" />
              <div class="h-4 w-4 bg-gray-300 dark:bg-gray-700 rounded-full" />
            </div>
            <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16" />
          </div>
        </template>

        <!-- Payment calendar legend -->
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <div
            v-for="i in 5"
            :key="i"
            class="flex items-center gap-1"
          >
            <div class="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-700" />
            <div class="h-3 bg-gray-300 dark:bg-gray-700 rounded w-12" />
          </div>
        </div>

        <!-- Calendar grid -->
        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="month in 12"
            :key="month"
            class="border rounded-lg p-2 bg-gray-100 dark:bg-gray-800"
          >
            <div class="flex items-center justify-between mb-1">
              <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-8" />
              <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4" />
            </div>
            <div class="flex justify-between items-center">
              <div class="h-3 bg-gray-300 dark:bg-gray-700 rounded w-8" />
              <div class="h-3 bg-gray-300 dark:bg-gray-700 rounded w-12" />
            </div>
          </div>
        </div>
      </UCard>

      <!-- Tenant Card -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="h-6 bg-gray-300 dark:bg-gray-700 rounded w-20" />
            <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16" />
          </div>
        </template>

        <div class="space-y-4">
          <!-- Tenant avatar and info -->
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full" />
            <div class="flex-1">
              <div class="h-5 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-2" />
              <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24" />
            </div>
          </div>

          <!-- Tenant details -->
          <div class="space-y-3">
            <div
              v-for="i in 4"
              :key="i"
              class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700"
            >
              <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20" />
              <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24" />
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex gap-2 pt-4">
            <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-20" />
            <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-20" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Payment History Section -->
    <UCard class="mb-6">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32" />
          <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-24" />
        </div>
      </template>

      <div class="space-y-4">
        <!-- Payment history rows -->
        <div
          v-for="i in 5"
          :key="i"
          class="flex justify-between items-center py-3 px-4 rounded-lg bg-gray-50 dark:bg-gray-800"
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded" />
            <div>
              <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-1" />
              <div class="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24" />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20" />
            <div class="h-5 bg-gray-300 dark:bg-gray-700 rounded w-16" />
          </div>
        </div>
      </div>
    </UCard>

    <!-- Occupation History Section -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="h-6 bg-gray-300 dark:bg-gray-700 rounded w-36" />
          <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-24" />
        </div>
      </template>

      <div class="space-y-4">
        <!-- Occupation history rows -->
        <div
          v-for="i in 3"
          :key="i"
          class="flex justify-between items-center py-3 px-4 rounded-lg bg-gray-50 dark:bg-gray-800"
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full" />
            <div>
              <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-28 mb-1" />
              <div class="h-3 bg-gray-300 dark:bg-gray-700 rounded w-36" />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24" />
            <div class="h-5 bg-gray-300 dark:bg-gray-700 rounded w-16" />
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
// No script needed for skeleton component
</script>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
