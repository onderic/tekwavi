/**
 * Utility function to purge analytics cache for a specific property
 * This should be called whenever data that affects analytics is modified
 */
export async function purgeAnalyticsCache(propertyId: string) {
  if (!propertyId) {
    return { removed: [] }
  }

  try {
    const cache = useStorage('cache')
    const allKeys = await cache.getKeys()

    const normalizeKey = (key: string) => key.replace(/[:\-.]/g, '').toLowerCase()
    const normalizedPropertyId = normalizeKey(propertyId)

    const analyticsKeys = allKeys.filter((k) => {
      const normalizedKey = normalizeKey(k)
      return (
        normalizedKey.includes('analytics')
        && normalizedKey.includes(normalizedPropertyId)
      )
    })

    if (analyticsKeys.length > 0) {
      await Promise.all(analyticsKeys.map(k => cache.removeItem(k)))
      console.log(`✅ Purged ${analyticsKeys.length} analytics cache entries for property ${propertyId}`)
    }

    return { removed: analyticsKeys }
  }
  catch (error) {
    console.error('❌ Error purging analytics cache:', error)
    return { removed: [], error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Utility function to extract propertyId from various sources
 */
export function extractPropertyId(data: any): string | null {
  // Try different ways to extract propertyId
  if (data.propertyId) return data.propertyId.toString()
  if (data.property) return data.property.toString()
  if (data.unitId && data.unit?.propertyId) return data.unit.propertyId.toString()

  return null
}