export default defineNuxtPlugin(() => {
  const { fetch: refreshSession } = useUserSession()

  // Refresh session on app start
  refreshSession()

  // Handle 401 responses globally
  $fetch.create({
    onResponseError({ response }) {
      if (response.status === 401) {
        // Redirect to login on 401
        navigateTo('/auth/login')
      }
    },
  })
})
