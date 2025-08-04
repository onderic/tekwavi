import { defineStore } from 'pinia'

export const usePropertiesStore = defineStore('properties', () => {
  const properties = ref<any[]>([])

  function setProperties(newProperties: any[]) {
    properties.value = newProperties
  }

  function clearProperties() {
    properties.value = []
  }

  return {
    properties,
    setProperties,
    clearProperties,
  }
})
