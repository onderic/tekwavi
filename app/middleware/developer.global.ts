export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetch, loggedIn } = useUserSession()

  if (!loggedIn.value) {
    return
  }

  try {
    await fetch()
  }
  catch (error) {
    console.error('Failed to fetch user data:', error)
  }

  if (user.value?.role !== 'developer') {
    return
  }

  const hasProperties = user.value?.ownedProperties && user.value.ownedProperties.length > 0

  const allowedPaths = [
    '/properties/listing',
    '/auth',
    '/profile',
  ]

  const isAllowedPath = allowedPaths.some(path => to.path.startsWith(path))

  if (!hasProperties && !isAllowedPath) {
    return navigateTo('/properties/listing')
  }
})
