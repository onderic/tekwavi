import { Schema, model } from 'mongoose'
import { FlatType, FlatCategory, FlatStatus, Furnishing } from '~~/shared/enums/property'

const ownershipSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  ownerName: { type: String },
  ownerPhone: { type: String },
  ownerEmail: { type: String },
  purchaseDate: { type: Date },
  purchaseAmount: { type: Number },
  ownershipType: { type: String, enum: ['individual', 'company', 'joint'], default: 'individual' },
  ownershipPercentage: { type: Number, default: 100 },
  transferDate: { type: Date },
  isActive: { type: Boolean, default: true },
  titleDeedNumber: { type: String },
}, { _id: false })

const unitSchema = new Schema({
  unitNumber: { type: String, required: true },
  floorId: { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },

  type: { type: String, enum: Object.values(FlatType) },
  furnishing: { type: String, enum: Object.values(Furnishing) },
  category: { type: String, enum: Object.values(FlatCategory) },
  status: { type: String, enum: Object.values(FlatStatus), default: FlatStatus.AVAILABLE },
  isOccupied: { type: Boolean, default: false },
  rentAmount: { type: Number },

  tenantId: { type: Schema.Types.ObjectId, ref: 'User' },

  ownership: ownershipSchema,

  previousOwners: [ownershipSchema],

  titleDeedNumber: { type: String },
  registrationDate: { type: Date },
  ownershipNotes: { type: String },
}, { timestamps: true, versionKey: false })

unitSchema.index({ propertyId: 1 })
unitSchema.index({ floorId: 1 })
unitSchema.index({ status: 1 })
unitSchema.index({ type: 1 })
unitSchema.index({ 'ownership.ownerId': 1 })
unitSchema.index({ 'ownership.ownerEmail': 1 })
unitSchema.index({ unitNumber: 1, propertyId: 1 }, { unique: true })

export const Unit = model('Unit', unitSchema)
