import { Schema, model } from 'mongoose'

const paymentSettingsSchema = new Schema({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },

  mpesa: {
    enabled: {
      type: Boolean,
      default: false,
    },
    SHORTCODE: {
      type: Number,
    },
    CONSUMER_KEY: {
      type: String,
    },
    CONSUMER_SECRET: {
      type: String,
    },
    PASSKEY: {
      type: String,
    },
    CALLBACK_URL: {
      type: String,
    },
    TRANSACTION_TYPE: {
      type: String,
      default: 'CustomerPayBillOnline',
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
})

paymentSettingsSchema.index({ propertyId: 1 }, { unique: true })

// Auto-update the updatedAt timestamp
paymentSettingsSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

export const PaymentSettings = model('PaymentSettings', paymentSettingsSchema)
