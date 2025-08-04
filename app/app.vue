<template>
  <Suspense>
    <UApp>
      <NuxtLoadingIndicator />
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UApp>
  </Suspense>
</template>

<script setup>
onMounted(() => {
  window.addEventListener('offline', () => {
    showError({ message: '⚠️ You are not connected to the internet!', statusCode: 503 })
  })
})
</script>

<style>
.layout-enter-active,
.layout-leave-active {
  transition: all 0.4s;
}
.layout-enter-from,
.layout-leave-to {
  filter: grayscale(1);
}
</style>
