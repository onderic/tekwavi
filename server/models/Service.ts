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
    required: false,
    uppercase: true,
  },
  // Cost information
  monthlyCost: {
    type: Number,
    required: false,
    min: 0,
  },
  costPerUnit: {
    type: Number,
    required: false,
    min: 0,
  },

  // Service provider information
  serviceProvider: {
    type: String,
    required: false,
  },
  providerContact: {
    type: String,
    required: false,
  },
  contractDetails: {
    type: String,
  },

  // Property association
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: false,
  },
  propertyName: {
    type: String,
    required: false,
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
    required: false,
  },
  createdByName: {
    type: String,
    required: false,
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

export const Service = model('Service', serviceSchema)
