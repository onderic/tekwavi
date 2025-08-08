import { Schema, model } from 'mongoose'
import { UserRole } from '~~/shared/enums/roles'

const userSchema = new Schema({
  first_name: { type: String, required: false },
  last_name: { type: String, required: false },
  password: { type: String, required: true, select: false },
  email: { type: String, required: false, unique: true, trim: true, lowercase: true },
  phone: { type: String, required: false, unique: true, default: null },
  nationalId: { type: String, required: false },
  address: {
    street: { type: String, required: false, default: null },
    city: { type: String, required: false, default: null },
    state: { type: String, required: false, default: null },
  },

  role: { type: String, enum: Object.values(UserRole), required: true },

  // Developer: multiple properties
  ownedProperties: [{ type: Schema.Types.ObjectId, ref: 'Property' }],

  // Unit Owner: multiple units
  ownedUnits: [{ type: Schema.Types.ObjectId, ref: 'Unit' }],

  // Tenant: multiple rented units allowed
  rentedUnits: [{ type: Schema.Types.ObjectId, ref: 'Unit' }],

  // Caretaker: manages one property only
  assignedProperty: { type: Schema.Types.ObjectId, ref: 'Property' },

  // Password reset fields
  tempPassword: {
    type: String,
    required: false,
    select: false,
  },
  tempPasswordExpiry: {
    type: Date,
    required: false,
  },
  tempPasswordUsed: {
    type: Boolean,
    required: false,
    default: false,
  },
  tempPasswordVerifiedAt: {
    type: Date,
    required: false,
  },
  passwordResetToken: {
    type: String,
    required: false,
  },
  passwordResetTokenExpiry: {
    type: Date,
    required: false,
  },
  passwordChangedAt: {
    type: Date,
    required: false,
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
}, {
  timestamps: true,
  versionKey: false,
})

export const User = model('User', userSchema)
