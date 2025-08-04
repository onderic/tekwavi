import { Schema, model } from 'mongoose'
import { FlatType, FlatCategory, Furnishing } from '~~/shared/enums/property'

const floorSchema = new Schema({
  floorNumber: { type: Number, required: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  defaultType: { type: String, enum: Object.values(FlatType) },
  defaultFurnishing: { type: String, enum: Object.values(Furnishing) },
  defaultCategory: { type: String, enum: Object.values(FlatCategory) },
  defaultRentAmount: { type: Number },
}, { timestamps: true, versionKey: false })

floorSchema.index({ propertyId: 1, floorNumber: 1 })

export const Floor = model('Floor', floorSchema)
