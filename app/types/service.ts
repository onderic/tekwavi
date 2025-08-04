export interface Service {
  _id?: string
  serviceId?: string
  propertyId: string
  propertyName?: string
  serviceName: string
  serviceType: string
  monthlyCost: number
  costPerUnit: number
  serviceProvider: string
  providerContact: string
  contractDetails?: string
  notes?: string
  isActive: boolean
  isMandatory: boolean
  billingCycle: 'monthly' | 'quarterly' | 'semi-annually' | 'annually'
  nextBillingDate?: string
  totalUnits?: number
  createdBy: string
  createdByName: string
  createdDate: string
  lastModifiedBy?: string
  lastModifiedByName?: string
  lastModifiedDate?: string
  history?: ServiceHistory[]
  affectedUnits?: AffectedUnit[]
}

export interface ServiceHistory {
  action: 'created' | 'updated' | 'activated' | 'deactivated' | 'cost_changed'
  description?: string
  previousValue?: any
  newValue?: any
  modifiedBy: string
  modifiedByName: string
  date: string
}

export interface AffectedUnit {
  unitId: string
  unitNumber: string
  startDate: string
  endDate?: string
  isActive: boolean
}

export const SERVICE_TYPES = {
  INTERNET: 'INTERNET',
  SECURITY: 'SECURITY',
  CLEANING: 'CLEANING',
  LANDSCAPING: 'LANDSCAPING',
  UTILITIES: 'UTILITIES',
  PARKING: 'PARKING',
  AMENITIES: 'AMENITIES',
  OTHER: 'OTHER',
} as const

export type ServiceTypeValues = typeof SERVICE_TYPES[keyof typeof SERVICE_TYPES]
