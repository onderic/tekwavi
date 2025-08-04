import { Schema, model } from 'mongoose'

const billingAccountSchema = new Schema({
  developerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  developerName: { type: String, required: true },
  developerEmail: { type: String, required: true },
  fixedMonthlyRate: { type: Number, default: 5000, min: 0 },
}, { timestamps: true })

export const BillingAccount = model('BillingAccount', billingAccountSchema)
