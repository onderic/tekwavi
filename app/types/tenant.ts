export interface Tenant {
  _id: string
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  nationalId: string
  unitNumber: string
  floorNumber: number
  rentAmount: number
  depositAmount: number
  rentalType: 'monthly' | 'fixed'
  leaseStartDate: string
  leaseEndDate: string
  isActive: boolean
  createdAt: string
  propertyId: {
    propertyName: string
    address: string
  }
  createdBy: {
    firstName: string
    lastName: string
  }
}

export interface TenantStats {
  totalTenants: number
  activeTenants: number
  inactiveTenants: number
  tenantsWithOverduePayments: number
  averageTenancyDuration: number
  newTenantsThisMonth: number
  tenantsLeavingThisMonth: number
}
