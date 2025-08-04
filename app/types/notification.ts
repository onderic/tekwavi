interface Notification {
  _id: string
  email: string
  title: string
  senderId?: string
  phone?: string
  role?: 'admin' | 'developer' | 'caretaker' | 'tenant'
  message: string
  type: 'system' | 'payment' | 'message' | 'invite_property_owner' | 'invite_caretaker' | 'invite_tenant'
  referenceId?: string
  referenceModel?: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  metadata?: {
    propertyData?: {
      propertyId?: string
      propertyName?: string
    }
    [key: string]: any
  }
  isRead: boolean
  isActionable: boolean
  actionUrl?: string
  createdAt: string
  expiresAt?: string
  updatedAt: string
}

export type { Notification }
