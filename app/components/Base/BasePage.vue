<template>
  <div>
    <BaseAppHeader
      :title="title"
      :icon="icon"
      :force-dashboard="forceDashboard"
      :loading="status"
    >
      <template
        v-if="$slots.headerTitle"
        #title
      >
        <slot name="headerTitle" />
      </template>

      <template
        v-if="$slots.titleSuffix"
        #titleSuffix
      >
        <slot name="titleSuffix" />
      </template>

      <template
        v-if="$slots.headerActions"
        #actions
      >
        <slot name="headerActions" />
      </template>
    </BaseAppHeader>

    <BasePageContent>
      <slot />
    </BasePageContent>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  forceDashboard: {
    type: Boolean,
    default: false,
  },
  status: {
    type: Boolean,
    default: false,
  },
})
</script>
