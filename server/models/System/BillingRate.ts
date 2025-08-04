import { Schema, model } from 'mongoose'

const billingRateSchema = new Schema({
  monthlyRate: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  effectiveFrom: {
    type: Date,
    default: Date.now,
  },
  currency: {
    type: String,
    default: 'KES',
  },
}, {
  timestamps: true,
  versionKey: false,
})

export const BillingRate = model('BillingRate', billingRateSchema)
