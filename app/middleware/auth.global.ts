export default defineNuxtRouteMiddleware((to) => {
  // Skip auth for login and verification pages
  const skipPaths = ['/auth', '/profile/complete_registration']
  if (skipPaths.some(path => to.path.startsWith(path))) {
    return
  }

  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo('/auth/login', { replace: true })
  }

  // Check user verification status - only redirect if user exists and is explicitly false
  if (
    user.value
    && user.value.isVerified === false
    && to.path !== '/profile/complete_registration'
  ) {
    return navigateTo('/profile/complete_registration', { replace: true })
  }
})
