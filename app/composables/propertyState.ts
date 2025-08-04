export const usePropertyState = () => {
  // This will be shared between server and client
  const currentProperty = useState<any>('currentProperty', () => null)
  const properties = useState<any[]>('properties', () => [])

  const setCurrentProperty = (property: any) => {
    currentProperty.value = property

    // Persist to localStorage on client
    if (import.meta.client) {
      localStorage.setItem('currentProperty', JSON.stringify(property))
    }
  }

  const setProperties = (newProperties: any[]) => {
    properties.value = newProperties

    // Persist to localStorage on client
    if (import.meta.client) {
      localStorage.setItem('properties', JSON.stringify(newProperties))
    }
  }

  const clearCurrentProperty = () => {
    currentProperty.value = null
    if (import.meta.client) {
      localStorage.removeItem('currentProperty')
    }
  }

  const clearProperties = () => {
    properties.value = []
    if (import.meta.client) {
      localStorage.removeItem('properties')
    }
  }

  return {
    currentProperty,
    properties,
    setCurrentProperty,
    setProperties,
    clearCurrentProperty,
    clearProperties,
  }
}
