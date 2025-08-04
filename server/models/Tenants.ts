import { Schema, model } from 'mongoose'

const tenantSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  nationalId: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
    trim: true,
  },

  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  propertyName: {
    type: String,
    default: '',
  },
  floorId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  floorNumber: {
    type: Number,
    default: 0,
  },
  unitId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  unitNumber: {
    type: String,
    required: true,
  },
  rentalType: {
    type: String,
    enum: ['monthly', 'fixed', 'owner_occupied'],
    required: true,
  },
  leaseStartDate: {
    type: Date,
    required: true,
  },
  leaseEndDate: {
    type: Date,
    required: true,
  },
  rentAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  depositAmount: {
    type: Number,
    required: true,
    min: 0,
  },

  isActive: {
    type: Boolean,
    default: true,
  },
  moveOutDate: {
    type: Date,
    default: null,
  },
  moveOutReason: {
    type: String,
    default: '',
  },

  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  versionKey: false,
})
export const Tenant = model('Tenant', tenantSchema)
