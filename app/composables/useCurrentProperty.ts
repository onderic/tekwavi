import { UserRole } from '~~/shared/enums/roles'
import { usePropertyStore } from '~/stores/usePropertyStore'

export const useCurrentProperty = () => {
  const { user } = useUserSession()
  const propertyStore = usePropertyStore()

  const userRole = computed(() => user.value?.role)

  const propertyId = computed(() => {
    if (userRole.value === UserRole.ADMIN && propertyStore.currentProperty?._id) {
      return propertyStore.currentProperty._id
    }

    if (userRole.value === UserRole.DEVELOPER) {
      if (propertyStore.currentProperty?._id) {
        return propertyStore.currentProperty._id
      }
      return user.value?.ownedProperties?.[0] || ''
    }

    if (userRole.value === UserRole.CARETAKER) {
      return user.value?.assignedProperty || ''
    }

    return ''
  })

  // Expose propertyChanged so you can watch it in your components
  const propertyChanged = propertyStore.propertyChanged

  return {
    propertyId: readonly(propertyId),
    userRole: readonly(userRole),
    propertyChanged: propertyChanged,
  }
}
