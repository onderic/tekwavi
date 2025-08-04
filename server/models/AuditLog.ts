import { Schema, model } from 'mongoose'

const auditLogSchema = new Schema({
  // User Information
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Allow null for anonymous attempts
  },
  userEmail: {
    type: String,
    required: true,
  },
  userRole: {
    type: String,
    required: true,
  },

  // Request Information
  action: {
    type: String,
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'BULK_OPERATION'],
    required: true,
  },
  resource: {
    type: String,
    required: true,
  },
  resourceId: {
    type: Schema.Types.ObjectId,
    default: null,
  },
  endpoint: {
    type: String,
    required: true,
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    required: true,
  },

  // Property Context - CRITICAL FOR TRACKING
  propertyContext: {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      default: null,
    },
    propertyName: {
      type: String,
      default: null,
    },
    floorId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    floorNumber: {
      type: String,
      default: null,
    },
    unitId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    unitNumber: {
      type: String,
      default: null,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      default: null,
    },
    tenantName: {
      type: String,
      default: null,
    },
  },

  // Invoice Specific Details
  invoiceDetails: {
    invoiceNumber: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      default: null,
    },
    paymentMethod: {
      type: String,
      default: null,
    },
    paymentFor: {
      month: Number,
      year: Number,
      monthName: String,
    },
    isPaid: {
      type: Boolean,
      default: null,
    },
    status: {
      type: String,
      default: null,
    },
  },

  // Context Information
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    required: true,
  },

  // Request/Response Details
  requestBody: {
    type: Schema.Types.Mixed,
    default: null,
  },
  requestQuery: {
    type: Schema.Types.Mixed,
    default: null,
  },
  responseStatus: {
    type: Number,
    required: true,
  },
  responseBody: {
    type: Schema.Types.Mixed,
    default: null,
  },

  // Security Information
  isSuccessful: {
    type: Boolean,
    required: true,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  securityFlags: [{
    type: String,
    enum: [
      'UNAUTHORIZED_ACCESS',
      'PERMISSION_DENIED',
      'SUSPICIOUS_ACTIVITY',
      'RATE_LIMIT_EXCEEDED',
      'INVALID_DATA',
      'BULK_OPERATION',
      'AFTER_HOURS_ACCESS',
      'CROSS_TENANT_ACCESS',
      'PRIVILEGE_ESCALATION',
      'DATA_EXPORT',
      'MPESA_PAYMENT',
      'PAYMENT_MODIFICATION',
      'CROSS_PROPERTY_ACCESS',
    ],
  }],

  // Performance Metrics
  duration: {
    type: Number, // in milliseconds
    required: true,
  },

  // Additional Context
  changes: [{
    field: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
  }],
  affectedRecords: [{
    type: Schema.Types.ObjectId,
    ref: 'Invoice',
  }],

  // Metadata
  sessionId: {
    type: String,
    default: null,
  },
  correlationId: {
    type: String,
    default: null,
  },

  // Device Information
  deviceInfo: {
    browser: {
      name: String,
      version: String,
    },
    os: {
      name: String,
      version: String,
    },
    device: {
      type: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop', 'unknown'],
        default: 'desktop',
      },
      vendor: String,
      model: String,
    },
    isMobile: {
      type: Boolean,
      default: false,
    },
    isTablet: {
      type: Boolean,
      default: false,
    },
  },

  // Location Information
  location: {
    country: String,
    countryCode: String,
    region: String,
    city: String,
    latitude: Number,
    longitude: Number,
    timezone: String,
    isp: String,
    isMobile: Boolean,
    isProxy: Boolean,
    isHosting: Boolean,
  },
}, {
  timestamps: true,
  versionKey: false,
})

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, createdAt: -1 })
auditLogSchema.index({ 'propertyContext.propertyId': 1, 'createdAt': -1 })
auditLogSchema.index({ 'propertyContext.unitId': 1, 'createdAt': -1 })
auditLogSchema.index({ 'propertyContext.tenantId': 1, 'createdAt': -1 })
auditLogSchema.index({ resource: 1, action: 1, createdAt: -1 })
auditLogSchema.index({ securityFlags: 1 })
auditLogSchema.index({ isSuccessful: 1, createdAt: -1 })
auditLogSchema.index({ ipAddress: 1 })

// Additional indexes for device and location queries
auditLogSchema.index({ 'location.country': 1 })
auditLogSchema.index({ 'location.city': 1 })
auditLogSchema.index({ 'deviceInfo.device.type': 1 })
auditLogSchema.index({ 'location.isProxy': 1 })

export const AuditLog = model('AuditLog', auditLogSchema)
