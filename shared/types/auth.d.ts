import type { UserRole } from '../shared/enums/roles'

declare module '#auth-utils' {
  interface User {
    _id: string
    first_name: string | null
    last_name: string | null
    email: string
    role: UserRole
    phone: string | null
    nationalId?: string | null
    address?: {
      street?: string | null
      city?: string | null
      state?: string | null
    }

    ownedProperties?: string[]
    ownedUnits?: string[]
    rentedUnits?: string[]
    assignedProperty?: string | null

    properties?: {
      id: string
      name: string
      address: string
      logo?: string | null
    }[]

    // Password reset fields
    tempPasswordExpiry?: Date | null
    tempPasswordUsed?: boolean
    tempPasswordVerifiedAt?: Date | null
    passwordResetToken?: string | null
    passwordResetTokenExpiry?: Date | null
    passwordChangedAt?: Date | null

    createdAt: Date
    updatedAt: Date
    lastLogin: Date | null
    isActive: boolean
    isVerified: boolean
  }

  interface UserSession {
    loggedInAt: Date
  }

  // the secure session data is only available on the server side
  interface SecureSessionData {
    email: string
    role: UserRole
  }
}

export {}
