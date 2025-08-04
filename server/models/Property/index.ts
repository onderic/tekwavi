import { Schema, model } from 'mongoose'
import { FlatCategory } from '~~/shared/enums/property'

const addressSchema = new Schema({
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  latitude: { type: Number },
  longitude: { type: Number },
}, { _id: false })

const propertySchema = new Schema({
  propertyName: { type: String, required: true, trim: true },
  categoryName: { type: String, enum: Object.values(FlatCategory), required: true },
  address: { type: addressSchema, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', required: true },

  // Construction cost tracking
  constructionCost: {
    totalEstimatedCost: { type: Number, default: 0, min: 0 },
    actualCostIncurred: { type: Number, default: 0, min: 0 },
    isExistingProperty: { type: Boolean, default: false },
    constructionStartDate: { type: Date },
    constructionEndDate: { type: Date },
    constructionStatus: {
      type: String,
      enum: ['planning', 'in_progress', 'completed', 'on_hold'],
      default: 'completed',
    },
    currency: { type: String, default: 'KES' },
    notes: { type: String },
    lastUpdated: { type: Date, default: Date.now },
  },

  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, versionKey: false })

propertySchema.index({ propertyName: 1 })
propertySchema.index({ categoryName: 1 })
propertySchema.index({ status: 1 })

export const Property = model('Property', propertySchema)
