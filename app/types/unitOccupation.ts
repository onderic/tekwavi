import type { User } from '#auth-utils'

export interface UnitOccupationHistory {
  _id?: string
  propertyId: string
  floorId: string
  unitId: string
  unitNumber: string
  tenantId: string
  tenantName: string
  moveInDate: Date | string
  moveOutDate?: Date | string
  leaseStartDate: Date | string
  leaseEndDate: Date | string
  isActive: boolean
  leaseAmount: number
  deposit: number
  depositRefunded?: boolean
  depositRefundDate?: Date | string
  depositRefundAmount?: number
  notes?: string
  createdAt?: Date | string
  updatedAt?: Date | string
  createdBy?: string | User
}

export interface Invoice {
  _id?: string
  invoiceNumber: string
  receiptNumber?: string
  invoiceType: 'tenant_rent' | 'owner_proceeds'
  propertyId: string
  unitId: string
  unitNumber: string
  serviceCharges?: Array<{
    serviceId: string
    serviceName: string
    amount: number
  }>
  totalServiceCharges?: number
  tenantId: string
  tenantName?: string
  amount: number
  totalAmount: number
  paymentMethod?: 'cash' | 'mpesa' | 'bank_transfer' | 'cheque' | 'card' | ''
  paymentReferenceId?: string
  phoneNumber?: string
  isPaid: boolean
  paymentDate?: Date | string
  dueDate: Date | string
  isLate: boolean
  paymentFor: {
    month: number
    monthName: 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun' | 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec'
    year: number
  }
  recordedBy?: string
  status: 'draft' | 'issued' | 'paid' | 'cancelled' | 'refunded'
  createdAt?: Date | string
  updatedAt?: Date | string
}
export interface RentPaymentStats {
  totalPaid: number
  totalUnpaid: number
  totalOverdue: number
  paidPercentage: number
  unpaidPercentage: number
  overduePercentage: number
}

export interface OccupationStats {
  totalOccupied: number
  totalVacant: number
  occupancyRate: number
  averageStayDuration: number
  averageLeaseAmount: number
}

export type PaymentStatus = 'paid' | 'unpaid' | 'overdue' | 'partial'
export type OccupationStatus = 'active' | 'ended' | 'upcoming'
