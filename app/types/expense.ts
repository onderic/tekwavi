interface Expense {
  _id: string
  title: string
  description?: string
  amount: number
  category: 'maintenance' | 'utilities' | 'repairs' | 'supplies' | 'salary' | 'other'
  date: string
  propertyId: string
  propertyName: string
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'mobile_money' | 'credit_card' | 'other'
  expenseNumber?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type { Expense }
