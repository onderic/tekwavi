export type PaymentMethod = 'cash' | 'mpesa' | 'bank_transfer' | 'cheque' | 'card'

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled' | 'refunded'

export type MonthName = 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun' | 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec'

export interface InvoiceListItem {
  _id: string
  invoiceNumber: string
  paymentReferenceId?: string
  phoneNumber?: string
  propertyName: string
  floorNumber: number
  unitNumber: string
  tenantName: string
  amount: number
  isPaid: boolean
  status: InvoiceStatus
  paymentMethod: PaymentMethod
  totalAmount: number
  totalServiceCharges?: number
  serviceCharges?: {
    serviceId: string
    serviceName: string
    amount: number
  }[]
  paymentDate?: string
  paymentFor: {
    monthName: MonthName
    year: number
  }
  isLate: boolean
}
