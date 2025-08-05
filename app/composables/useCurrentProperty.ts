export const useCurrentProperty = () => {
  const { user } = useUserSession()

  // Global reactive property ID that can be updated from anywhere
  const currentPropertyId = useState<string | null>('currentPropertyId', () => null)

  // Get current property data from user's properties
  const currentProperty = computed(() => {
    if (!currentPropertyId.value || !user.value?.properties) return null
    return user.value.properties.find(property => property.id === currentPropertyId.value) || null
  })

  // Set the current property
  const setCurrentProperty = (propertyId: string | null) => {
    currentPropertyId.value = propertyId
  }

  // Initialize with first property if none selected
  watch(user, (newUser) => {
    if (newUser?.properties?.length && !currentPropertyId.value) {
      const firstProperty = newUser.properties[0]
      if (firstProperty) {
        currentPropertyId.value = firstProperty.id
      }
    }
  }, { immediate: true })

  return {
    propertyId: readonly(currentPropertyId),
    currentProperty: readonly(currentProperty),
    setCurrentProperty,
  }
}
