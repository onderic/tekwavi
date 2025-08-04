<template>
  <div class="min-h-screen relative bg-gray-50 dark:bg-gray-900">
    <div
      class="transition-all duration-300 min-h-screen"
      :class="{
        'md:ml-60': true,
      }"
    >
      <slot />
    </div>

    <BaseAppSidebar />

    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
      @click="closeSidebar"
    />
  </div>
</template>

<script setup lang="ts">
const { isSidebarOpen, closeSidebar } = useDashboard()
</script>
