export default defineNuxtPlugin(() => {
  const { clear } = useUserSession()
  const router = useRouter()

  // Flag to prevent multiple redirects
  let isHandlingExpiry = false

  // Session-related endpoints that should be checked for session format
  const sessionEndpoints = [
    '/api/auth/session',
    '/api/auth/me',
    '/api/user/session',
    '/api/session',
  ]

  // Override the global $fetch to intercept all API calls
  globalThis.$fetch = $fetch.create({
    onResponse({ request, response }) {
      // Only check session format for session-related endpoints
      const url = typeof request === 'string' ? request : request.toString()
      const isSessionEndpoint = sessionEndpoints.some(endpoint => url.includes(endpoint))

      if (isSessionEndpoint && response._data && typeof response._data === 'object') {
        // Expired session: has 'id' but no 'user' property and no 'loggedInAt'
        if (response._data.id && !response._data.user && !response._data.loggedInAt) {
          console.log('Expired session detected from:', url)
          handleSessionExpiry()
          return
        }
      }
    },

    onResponseError({ response, request }) {
      // Handle 401 Unauthorized responses from any endpoint
      if (response.status === 401) {
        const url = typeof request === 'string' ? request : request.toString()
        console.log('401 Unauthorized from:', url)
        handleSessionExpiry()
      }
    },
  })

  async function handleSessionExpiry() {
    if (isHandlingExpiry) return
    isHandlingExpiry = true

    console.log('Session expired detected, clearing session and redirecting...')

    try {
      // Clear session immediately
      await clear()

      // Also clear the property store
      const propertyStore = usePropertyStore()
      propertyStore.clearCurrentProperty()

      // Immediate redirect to prevent flash
      const currentPath = router.currentRoute.value.path
      if (!currentPath.startsWith('/auth')) {
        // Use navigateTo with replace to avoid flash
        await navigateTo('/auth/login', { replace: true })
      }
    }
    finally {
      // Reset flag after a delay
      setTimeout(() => {
        isHandlingExpiry = false
      }, 500)
    }
  }
})
