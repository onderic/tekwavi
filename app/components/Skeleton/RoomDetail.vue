<template>
  <UCard>
    <!-- Header and buttons section skeleton -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
      </div>
      <div class="flex flex-wrap gap-2">
        <div class="h-9 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
        <div class="h-9 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
      </div>
    </div>

    <!-- Unit and Tenant Details -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Unit Details Card Skeleton -->
      <UCard class="lg:col-span-1">
        <template #header>
          <div class="flex justify-between items-center">
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
            <div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          </div>
        </template>

        <div class="grid grid-cols-1 gap-2">
          <!-- Unit properties skeleton -->
          <div
            v-for="i in 6"
            :key="i"
          >
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1 animate-pulse" />
            <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
          </div>
        </div>
      </UCard>

      <!-- Payment Calendar Card Skeleton -->
      <UCard class="lg:col-span-1">
        <template #header>
          <div class="flex justify-between items-center">
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
          </div>
        </template>

        <!-- Calendar legend skeleton -->
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <div
            v-for="i in 4"
            :key="i"
            class="flex items-center gap-1"
          >
            <div class="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse" />
          </div>
        </div>

        <!-- Month grid skeleton -->
        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="i in 12"
            :key="i"
            class="border rounded-lg p-2 bg-gray-100 dark:bg-gray-800 animate-pulse"
          >
            <div class="flex items-center justify-between mb-1">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8" />
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-6" />
            </div>
            <div class="flex justify-between items-center">
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10" />
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-14" />
            </div>
          </div>
        </div>
      </UCard>

      <!-- Tenant Card Skeleton -->
      <UCard class="lg:col-span-1">
        <template #header>
          <div class="flex justify-between items-center">
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
            <div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          </div>
        </template>

        <!-- Tenant profile skeleton -->
        <div class="flex flex-col items-center mb-4">
          <div class="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full mb-2 animate-pulse" />
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse" />
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse" />
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1 animate-pulse" />
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
        </div>

        <!-- Tenant details grid skeleton -->
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="i in 4"
            :key="i"
          >
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1 animate-pulse" />
            <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Payment History Skeleton -->
    <UCard class="mb-8">
      <template #header>
        <div class="flex justify-between items-center">
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse" />
        </div>
      </template>

      <!-- Table skeleton -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th
                v-for="i in 7"
                :key="i"
                class="pb-2"
              >
                <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="i in 4"
              :key="i"
            >
              <td
                v-for="j in 7"
                :key="j"
                class="py-3"
              >
                <div
                  class="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  :class="j === 5 ? 'w-20' : 'w-28'"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Occupation History Skeleton -->
    <UCard>
      <template #header>
        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
      </template>

      <!-- Table skeleton -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th
                v-for="i in 5"
                :key="i"
                class="pb-2"
              >
                <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="i in 3"
              :key="i"
            >
              <td
                v-for="j in 5"
                :key="j"
                class="py-3"
              >
                <div
                  v-if="j === 1"
                  class="flex items-center gap-2"
                >
                  <div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
                </div>
                <div
                  v-else
                  class="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  :class="j === 3 ? 'w-16' : 'w-24'"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </UCard>
</template>

<script setup>

</script>
