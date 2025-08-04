import type { ObjectId } from 'bson'

export type MpesaRequest = {
  _id: ObjectId
  propertyId: string
  invoice_id: string
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage?: string
  amount: number
  phoneNumber: string
  ResultCode?: number
  ResultDesc?: string
  Amount?: number
  MpesaReceiptNumber?: string
  TransactionDate?: number
  CallbackPhoneNumber?: number
  status: string
  initiated_by: string
  created_at: Date
}
