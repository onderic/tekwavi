export default defineNuxtPlugin(() => {
  const propertyStore = usePropertyStore()
  const propertiesStore = usePropertiesStore()

  // Hydrate stores from localStorage on client
  if (import.meta.client) {
    // Hydrate properties store
    const storedProperties = localStorage.getItem('properties-store')
    if (storedProperties) {
      try {
        const data = JSON.parse(storedProperties)
        if (data.properties && Array.isArray(data.properties)) {
          propertiesStore.setProperties(data.properties)
        }
      }
      catch (error) {
        console.error('Failed to hydrate properties store:', error)
      }
    }

    // Hydrate property store
    const storedProperty = localStorage.getItem('property-store')
    if (storedProperty) {
      try {
        const data = JSON.parse(storedProperty)
        if (data.currentProperty) {
          propertyStore.currentProperty = data.currentProperty
        }
      }
      catch (error) {
        console.error('Failed to hydrate property store:', error)
      }
    }

    // Watch for changes and persist
    watch(() => propertiesStore.properties, (newProperties) => {
      localStorage.setItem('properties-store', JSON.stringify({ properties: newProperties }))
    }, { deep: true })

    watch(() => propertyStore.currentProperty, (newProperty) => {
      localStorage.setItem('property-store', JSON.stringify({ currentProperty: newProperty }))
    }, { deep: true })
  }
})
