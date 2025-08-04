import { Schema, model } from 'mongoose'

const actionSchema = new Schema({
  type: {
    type: String,
    enum: ['sms', 'email', 'call'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
  },
  scheduledAt: {
    type: Date,
    required: true,
  },
  sentAt: {
    type: Date,
  },
  error: {
    type: String,
  },
})

const reminderSchema = new Schema({
  invoiceId: {
    type: Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
    unique: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
  },
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  tenantName: {
    type: String,
    required: true,
  },
  tenantPhone: {
    type: String,
  },
  tenantEmail: {
    type: String,
  },
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  propertyName: {
    type: String,
    required: true,
  },
  unitNumber: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  daysOverdue: {
    type: Number,
    required: true,
  },
  paymentFor: {
    month: Number,
    monthName: String,
    year: Number,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'acknowledged', 'resolved', 'cancelled'],
    default: 'pending',
  },
  message: {
    type: String,
    required: true,
  },
  actions: [actionSchema],
}, {
  timestamps: true,
})

export const Reminder = model('Reminder', reminderSchema)
