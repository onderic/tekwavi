export interface BillingDetails {
  billingId: string
  propertyId: string
  propertyName: string
  fixedMonthlyRate: number
  yearlyBilling: YearlyBilling[]
  createdAt: string | Date
}

export interface YearlyBilling {
  year: number
  totalBilled: number
  totalPaid: number
  monthlyInvoices: MonthlyInvoice[]
}

export interface MonthlyInvoice {
  month: number
  monthName: string
  isPaid: boolean
  amount: number
  paymentDate?: string | Date
  paymentReference?: string
  invoiceNumber?: string
  invoiceId?: string
  dueDate?: string | Date
  status?: 'draft' | 'issued' | 'paid' | 'cancelled' | 'refunded'
}
