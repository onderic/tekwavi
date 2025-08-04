export interface UserType {
  _id: string
  first_name: string
  last_name: string
  email?: string
  phone: string
  password?: string
  role: 'admin' | 'developer' | 'caretaker' | 'tenant' | 'normal'

  properties?: {
    propertyId: string
    name: string
    role: 'developer' | 'manager' | 'caretaker' | 'tenant' | 'normal'
    associatedAt?: Date
  }[]
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
  }
  createdAt?: Date
  updatedAt?: Date
  lastLogin?: Date
  isActive?: boolean
  isVerified?: boolean
}
