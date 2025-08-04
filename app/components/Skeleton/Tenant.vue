<template>
  <div class="space-y-6">
    <!-- Skeleton for each property -->
    <div
      v-for="i in 2"
      :key="i"
      class="space-y-4"
    >
      <!-- Property header skeleton -->
      <div class="flex items-center gap-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <USkeleton class="h-6 w-6" />
        <USkeleton class="h-6 w-32" />
        <USkeleton class="h-5 w-16 rounded-full" />
      </div>

      <!-- Units grid skeleton -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Unit card skeleton -->
        <UCard
          v-for="j in 2"
          :key="j"
        >
          <template #header>
            <!-- Unit header skeleton -->
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <USkeleton class="h-4 w-4" />
                <USkeleton class="h-5 w-20" />
              </div>
              <USkeleton class="h-4 w-16" />
            </div>
          </template>

          <div class="space-y-4">
            <!-- Calendar header skeleton -->
            <div class="flex justify-between items-center">
              <USkeleton class="h-4 w-32" />
              <USkeleton class="h-7 w-20" />
            </div>

            <!-- Legend skeleton -->
            <div class="flex flex-wrap gap-2">
              <div
                v-for="k in 4"
                :key="k"
                class="flex items-center gap-1"
              >
                <USkeleton class="h-2 w-2 rounded-full" />
                <USkeleton class="h-3 w-12" />
              </div>
            </div>

            <!-- Calendar grid skeleton -->
            <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <div
                v-for="k in 12"
                :key="k"
                class="border rounded-lg p-2"
              >
                <div class="flex justify-between items-center mb-1">
                  <USkeleton class="h-3 w-8" />
                  <USkeleton class="h-4 w-4 rounded" />
                </div>
                <div class="flex justify-between items-center">
                  <USkeleton class="h-3 w-10" />
                  <USkeleton class="h-3 w-6" />
                </div>
              </div>
            </div>

            <!-- Summary skeleton -->
            <div class="flex justify-between items-center pt-2">
              <USkeleton class="h-3 w-20" />
              <USkeleton class="h-3 w-16" />
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No logic needed for skeleton component
</script>
