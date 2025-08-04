export default defineEventHandler(async (event) => {
  console.log('Triggewred...................')
  const { user } = await requireUserSession(event)
  const query = getQuery(event)
  const propertyId = query.propertyId as string

  const cacheStorage = useStorage('cache')

  const key = `nitro:handlers:_:analyticsdeveloper${propertyId}${user._id}`

  const hasItem = await cacheStorage.hasItem(key)
  if (hasItem) {
    await cacheStorage.removeItem(key)
  }
  console.log('Cache invalidated for:', key)

  return {
    hasItem: await cacheStorage.hasItem(key),
  }
})
