import { Schema, model } from 'mongoose'

const mpesaTransactionSchema = new Schema({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: false, // Made optional for billing invoices
    index: true,
  },
  invoiceId: {
    type: String,
    required: true,
    index: true,
  },
  transactionType: {
    type: String,
    enum: ['tenant_payment', 'billing_invoice'],
    default: 'tenant_payment',
    index: true,
  },
  MerchantRequestID: {
    type: String,
    required: true,
    index: true,
  },
  CheckoutRequestID: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  ResponseCode: {
    type: String,
    required: true,
  },
  ResponseDescription: {
    type: String,
  },
  CustomerMessage: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    index: true,
  },
  ResultCode: {
    type: Number,
  },
  ResultDesc: {
    type: String,
  },
  Amount: {
    type: Number,
  },
  MpesaReceiptNumber: {
    type: String,
  },
  TransactionDate: {
    type: Number,
  },
  CallbackPhoneNumber: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Cancelled', 'Expired'],
    default: 'Pending',
    index: true,
  },
  initiated_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Made optional for billing invoices
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
})

mpesaTransactionSchema.index({ propertyId: 1, status: 1 })
mpesaTransactionSchema.index({ created_at: -1 })

export const MpesaTransaction = model('MpesaTransaction', mpesaTransactionSchema)
