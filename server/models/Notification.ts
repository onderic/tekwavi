import { Schema, model } from 'mongoose'
import { UserRole } from '~~/shared/enums/roles'

const notificationSchema = new Schema({
  role: {
    type: String,
    enum: [UserRole.DEVELOPER, UserRole.CARETAKER, UserRole.TENANT, UserRole.UNIT_OWNER, UserRole.ADMIN, UserRole.NORMAL],
  },
  phone: { type: String, required: false, trim: true, lowercase: true },
  email: { type: String, required: false, trim: true, lowercase: true },
  title: { type: String },
  senderId: { type: String },
  message: { type: String },
  type: {
    type: String,
    enum: [
      'system',
      'payment',
      'message',
      'invite_property_owner',
      'invite_caretaker',
      'invite_tenant',
      'invite_unit_owner',
    ],
    default: 'system',
  },
  referenceId: { type: String },
  referenceModel: { type: String },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending',
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
    // propertyData: {
    //   propertyId: String,
    //   propertyName: String,
    //   propertyAddress: String,
    //   units: Number,
    //   propertyType: String
    // }
  },

  isRead: { type: Boolean, default: false },
  isActionable: { type: Boolean, default: false },
  actionUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  versionKey: false,
})

export const Notification = model('Notification', notificationSchema)
