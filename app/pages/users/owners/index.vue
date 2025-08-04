<template>
  <div>
    <h1>Property Owners</h1>
    <nuxt-data-table :data="owners" />
  </div>
</template>

<script setup>
const { data: owners } = await useFetch('/api/users')
</script>
