import { Schema, model } from 'mongoose'

const propertyItemSchema = new Schema({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  propertyName: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active',
  },
  amount: { type: Number, required: true, min: 0 },
}, { _id: false })

const billingInvoiceSchema = new Schema({
  developerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  developerEmail: { type: String, required: true },
  developerPhone: { type: String, required: true },
  developerName: { type: String, required: true },

  month: { type: Number, required: true, min: 1, max: 12 },
  monthName: {
    type: String,
    required: true,
    enum: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  year: { type: Number, required: true },

  properties: [propertyItemSchema],

  totalAmount: { type: Number, required: true, min: 0 },

  isPaid: { type: Boolean, default: false },
  paymentDate: { type: Date },
  paymentReference: { type: String },
  paymentMethod: { type: String, enum: ['mpesa', 'bank_transfer'], default: 'mpesa' },
  invoiceNumber: { type: String, unique: true },
  dueDate: { type: Date, required: true },

  status: {
    type: String,
    enum: ['draft', 'issued', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'issued',
  },
}, { timestamps: true })

billingInvoiceSchema.index({ developerId: 1, year: 1, month: 1 }, { unique: true })
billingInvoiceSchema.index({ isPaid: 1 })
billingInvoiceSchema.index({ status: 1 })
billingInvoiceSchema.index({ dueDate: 1 })

billingInvoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const monthStr = String(this.month).padStart(2, '0')
    const count = await (this.constructor as any).countDocuments({
      year: this.year,
      month: this.month,
    })
    this.invoiceNumber = `INV-${this.year}${monthStr}-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

// Calculate total amount from properties
billingInvoiceSchema.pre('save', function (next) {
  if (this.properties && this.properties.length > 0) {
    this.totalAmount = this.properties.reduce((sum, prop) => sum + prop.amount, 0)
  }
  next()
})

export const BillingInvoice = model('BillingInvoice', billingInvoiceSchema)
