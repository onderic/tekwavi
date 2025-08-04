import { Schema, model } from 'mongoose'

const serviceSchema = new Schema({
  serviceId: {
    type: String,
    required: true,
    unique: true,
  },

  serviceName: {
    type: String,
    required: true,
  },
  serviceType: {
    type: String,
    required: true,
    uppercase: true,
  },
  // Cost information
  monthlyCost: {
    type: Number,
    required: true,
    min: 0,
  },
  costPerUnit: {
    type: Number,
    required: true,
    min: 0,
  },

  // Service provider information
  serviceProvider: {
    type: String,
    required: true,
  },
  providerContact: {
    type: String,
    required: true,
  },
  contractDetails: {
    type: String,
  },

  // Property association
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  propertyName: {
    type: String,
    required: true,
  },

  // Service status and configuration
  isActive: {
    type: Boolean,
    default: true,
  },
  isMandatory: {
    type: Boolean,
    default: false,
  },

  // Additional information
  notes: {
    type: String,
  },

  // Tracking information
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdByName: {
    type: String,
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },

  // Update tracking
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  lastModifiedByName: {
    type: String,
  },
  lastModifiedDate: {
    type: Date,
  },

  // Service history (optional - for tracking changes)
  history: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'activated', 'deactivated', 'cost_changed'],
    },
    description: String,
    previousValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    modifiedByName: String,
    date: {
      type: Date,
      default: Date.now,
    },
  }],

  // Billing cycle information
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'semi-annually', 'annually'],
    default: 'monthly',
  },
  nextBillingDate: {
    type: Date,
  },

  affectedUnits: [{
    unitId: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
    },
    unitNumber: String,
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  }],

}, {
  timestamps: true,
  versionKey: false,
})

serviceSchema.index({ propertyId: 1, isActive: 1 })
serviceSchema.index({ serviceType: 1, isActive: 1 })
serviceSchema.index({ serviceProvider: 1 })

// Pre-save hook to generate serviceId
serviceSchema.pre('save', async function (next) {
  if (this.isNew && !this.serviceId) {
    const count = await Service.countDocuments()
    this.serviceId = `SRV-${String(count + 1).padStart(6, '0')}`
  }
  next()
})

// Pre-update hook to track modifications
serviceSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any
  if (update.$set) {
    update.$set.lastModifiedDate = new Date()
  }
  next()
})

export const Service = model('Service', serviceSchema)
