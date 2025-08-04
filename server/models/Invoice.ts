import { Schema, model } from 'mongoose'

const invoiceSchema = new Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: false,
  },
  receiptNumber: {
    type: String,
  },

  invoiceType: {
    type: String,
    enum: ['tenant_rent', 'owner_proceeds'],
    required: true,
  },

  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  unitId: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
  },
  unitNumber: {
    type: String,
    required: true,
  },

  serviceCharges: [{
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
    },
    serviceName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  }],
  totalServiceCharges: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Tenant information
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  tenantName: {
    type: String,
    default: '',
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mpesa', 'bank_transfer', 'cheque', 'card', ''],
    default: '',
  },
  paymentReferenceId: {
    type: String,
    default: '',
  },
  phoneNumber: {
    type: String,
    default: '',
  },

  isPaid: {
    type: Boolean,
    default: false,
  },
  paymentDate: {
    type: Date,
    required: false,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  isLate: {
    type: Boolean,
    default: false,
  },

  paymentFor: {
    month: {
      type: Number,
      required: true,
      min: 0, // Allow 0 for fixed lease payments
      max: 12,
    },
    monthName: {
      type: String,
      required: true,
      enum: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Fixed Lease'],
    },
    year: {
      type: Number,
      required: true,
    },
  },
  disbursement: {
    isDisbursed: {
      type: Boolean,
      default: false,
    },
    disbursedAmount: {
      type: Number,
      min: 0,
    },
    disbursedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    disbursedDate: {
      type: Date,
    },
    disbursementMethod: {
      type: String,
      enum: ['bank_transfer', 'cash', 'cheque', 'mobile_money'],
    },
    disbursementReference: {
      type: String,
    },
    serviceFeeAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    netDisbursedAmount: {
      type: Number,
      min: 0,
    },
  },
  recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['draft', 'issued', 'paid', 'cancelled', 'refunded'],
    default: 'issued',
  },

  // Owner-occupied unit markers
  isOwnerOccupied: {
    type: Boolean,
    default: false,
  },
  ownerServiceFeeAmount: {
    type: Number,
    min: 0,
    default: 0,
  },
  rentOnlyAmount: {
    type: Number,
    min: 0,
    default: 0,
  },

  // Cancellation tracking
  cancelledBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  cancelledAt: {
    type: Date,
  },

}, {
  timestamps: true,
  versionKey: false,
})

export const Invoice = model('Invoice', invoiceSchema)
