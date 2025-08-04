import { Schema, model } from 'mongoose'

const serviceFeeSchema = new Schema({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },

  unitType: {
    type: String,
    required: true,
    enum: [
      'studio', '1_bedunit', '2_bedunit', '3_bedunit', '4_bedunit',
      'duplex', 'maisonette', 'loft', 'penthouse', 'apartment',
      'shared_flat', 'shop', 'retail', 'office', 'co_working_space',
      'cafe', 'restaurant', 'gym', 'clinic', 'salon', 'showunit',
      'workshop', 'warehouse', 'live_work_unit', 'studio_commercial',
      'hotel_unit', 'service_apartment', 'lobby', 'reception',
      'storage', 'maintenance_unit', 'parking', 'bike_storage',
      'laundry_unit', 'elevator_shaft', 'stairwell', 'rooftop',
      'basement', 'boiler_unit', 'security_unit', 'electrical_unit',
      'hospital_unit',
    ],
  },

  monthlyFee: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },

  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

}, {
  timestamps: true,
})

// Create compound unique index for propertyId + unitType
serviceFeeSchema.index({ propertyId: 1, unitType: 1 }, { unique: true })

export const ServiceFee = model('ServiceFee', serviceFeeSchema)
