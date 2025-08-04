import { defineStore } from 'pinia'

export const usePropertyStore = defineStore('property', () => {
  const currentProperty = ref<any | null>(null)
  const propertyChanged = ref(0)

  if (import.meta.client) {
    const storedProperty = localStorage.getItem('currentProperty')
    if (storedProperty) {
      try {
        currentProperty.value = JSON.parse(storedProperty)
      }
      catch (error) {
        console.error('Failed to parse stored property:', error)
      }
    }
  }

  async function setCurrentProperty(property: any) {
    const { fetch } = useUserSession()
    await fetch()

    currentProperty.value = property
    propertyChanged.value++

    if (import.meta.client) {
      try {
        localStorage.setItem('currentProperty', JSON.stringify(property))
      }
      catch (error) {
        console.error('Failed to store property:', error)
      }
    }
  }

  function clearCurrentProperty() {
    currentProperty.value = null
    propertyChanged.value++

    if (import.meta.client) {
      localStorage.removeItem('currentProperty')
    }
  }

  return {
    currentProperty,
    propertyChanged,
    setCurrentProperty,
    clearCurrentProperty,
  }
})
