import { Schema, model } from 'mongoose'

const expenseSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: false, default: null },
  amount: { type: Number, required: true, min: 0 },
  category: {
    type: String,
    enum: ['maintenance', 'utilities', 'repairs', 'supplies', 'salary', 'services', 'other'],
    required: true,
  },
  date: { type: Date, required: true, default: Date.now },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  propertyName: { type: String, required: true },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'check', 'mobile_money', 'credit_card', 'other'],
    default: 'cash',
  },
  expenseNumber: { type: String, required: false },

  // Add service tracking
  isServiceExpense: { type: Boolean, default: false },
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
  serviceName: { type: String },

  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date },
  updatedAt: { type: Date },
}, {
  timestamps: true,
  versionKey: false,
})

expenseSchema.index({ propertyId: 1, date: -1 })
expenseSchema.index({ category: 1 })
expenseSchema.index({ createdAt: -1 })
expenseSchema.index({ serviceId: 1 })

// Pre-save hook to generate expense number
expenseSchema.pre('save', async function (next) {
  if (this.isNew && !this.expenseNumber) {
    const count = await Expense.countDocuments()
    this.expenseNumber = `EXP-${String(count + 1).padStart(6, '0')}`
  }
  next()
})

export const Expense = model('Expense', expenseSchema)
