export const useCurrentProperty = () => {
  const { user } = useUserSession()

  const currentPropertyId = useState<string | null>('currentPropertyId', () => null)

  const currentProperty = computed(() => {
    if (!currentPropertyId.value || !user.value?.properties) return null
    return user.value.properties.find(property => property.id === currentPropertyId.value) || null
  })

  const setCurrentProperty = (propertyId: string | null) => {
    currentPropertyId.value = propertyId
  }

  const clearCurrentProperty = () => {
    setCurrentProperty(null)
  }

  // Initialize/validate property selection when user data changes
  const initializeProperty = (userData: any) => {
    if (!userData?.properties?.length) {
      clearCurrentProperty()
      return
    }

    const storedPropertyId = currentPropertyId.value
    
    // Check if stored property still exists in user's properties
    if (storedPropertyId) {
      const propertyExists = userData.properties.some(
        (property: any) => property.id === storedPropertyId
      )
      
      if (propertyExists) {
        // Stored property is still valid, keep it
        return
      }
    }

    // No valid stored property, select the first available property
    const firstProperty = userData.properties[0]
    if (firstProperty) {
      setCurrentProperty(firstProperty.id)
    }
  }

  // Watch for user changes and initialize property
  watch(user, (newUser) => {
    if (newUser) {
      initializeProperty(newUser)
    } else {
      clearCurrentProperty()
    }
  }, { immediate: true })

  const refreshPropertySelection = () => {
    if (user.value) {
      initializeProperty(user.value)
    }
  }

  return {
    propertyId: readonly(currentPropertyId),
    currentProperty: readonly(currentProperty),
    setCurrentProperty,
    clearCurrentProperty,
    refreshPropertySelection,
  }
}