export interface ServiceCharge {
  serviceId: string
  serviceName: string
  amount: number
}

export interface PaymentFor {
  month: number
  monthName: 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun' | 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec'
  year: number
}

export interface DisbursementInvoice {
  _id: string
  invoiceNumber: string
  receiptNumber?: string
  amount: number
  totalAmount: number
  serviceCharges?: ServiceCharge[]
  totalServiceCharges?: number
  paymentMethod?: 'cash' | 'mpesa' | 'bank_transfer' | 'cheque' | 'card'
  paymentDate: string | Date
  paymentFor: PaymentFor
  paymentReferenceId?: string
  // Unit information
  unitId: string
  unitNumber: string
  unitType?: string
  unitCategory?: string
  floorNumber?: number
  // Owner and tenant information
  ownerDetails: OwnerDetails
  currentTenant?: TenantInfo
  // Disbursement information
  isDisbursed?: boolean
  disbursementDate?: string | Date
  disbursementReference?: string
  disbursementMethod?: string
  disbursedAmount?: number
  disbursedBy?: string
  serviceFeeAmount?: number
  netDisbursedAmount?: number
  disbursementNotes?: string
  // Calculated fields
  serviceFeePerMonth?: number
  disbursableAmount?: number
  undisbursedDisbursableAmount?: number
}

export interface OwnerDetails {
  ownerId: string
  ownerName: string
  ownerEmail?: string
  ownerPhone?: string
  ownershipType?: string
  ownershipPercentage?: number
  titleDeedNumber?: string
}

export interface TenantInfo {
  tenantId: string
  tenantName: string
  tenantPhone?: string
  tenantEmail?: string
}

export interface DisbursementUnitGroup {
  _id: string
  unitNumber: string
  unitType?: string
  unitCategory?: string
  floorNumber?: number
  ownerDetails: OwnerDetails
  currentTenant?: TenantInfo
  invoices: DisbursementInvoice[]
  totalRentCollected: number
  totalServiceChargesCollected: number
  totalAmountCollected: number
  invoiceCount: number
  undisbursedAmount: number
  undisbursedCount: number
  totalServiceFees?: number
  serviceFeePerMonth?: number
  disbursableAmount?: number
  undisbursedDisbursableAmount?: number
  totalServiceFee?: number

}

export interface DisbursementProperty {
  _id: string
  propertyName: string
  categoryName?: string
  address?: string
}

export interface DisbursementSummary {
  totalUnits: number
  totalInvoices: number
  totalRentCollected: number
  totalServiceChargesCollected: number
  totalAmountCollected: number
  totalServiceFees: number
  totalDisbursableAmount: number
  totalUndisbursedAmount: number
  totalUndisbursedInvoices: number
  totalDisbursedAmount: number
}

export interface DisbursementFilters {
  year: number
  month: number | 'all'
}

export interface DisbursementResponse {
  success: boolean
  property: DisbursementProperty
  filters: DisbursementFilters
  summary: DisbursementSummary
  invoices: DisbursementInvoice[]
}
