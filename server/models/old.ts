import { Schema, model } from 'mongoose'

// Enums
export enum FlatType {
  STUDIO = 'studio',
  ONE_BEDUNIT = '1_bedunit',
  TWO_BEDUNIT = '2_bedunit',
  THREE_BEDUNIT = '3_bedunit',
  FOUR_BEDUNIT = '4_bedunit',
  DUPLEX = 'duplex',
  MAISONETTE = 'maisonette',
  LOFT = 'loft',
  PENTHOUSE = 'penthouse',
  APARTMENT = 'apartment',
  SHARED_FLAT = 'shared_flat',
  SHOP = 'shop',
  RETAIL = 'retail',
  OFFICE = 'office',
  CO_WORKING_SPACE = 'co_working_space',
  CAFE = 'cafe',
  RESTAURANT = 'restaurant',
  GYM = 'gym',
  CLINIC = 'clinic',
  SALON = 'salon',
  SHOWUNIT = 'showunit',
  WORKSHOP = 'workshop',
  WAREHOUSE = 'warehouse',
  LIVE_WORK_UNIT = 'live_work_unit',
  STUDIO_COMMERCIAL = 'studio_commercial',
  HOTEL_UNIT = 'hotel_unit',
  SERVICE_APARTMENT = 'service_apartment',
  LOBBY = 'lobby',
  RECEPTION = 'reception',
  STORAGE = 'storage',
  MAINTENANCE_UNIT = 'maintenance_unit',
  PARKING = 'parking',
  BIKE_STORAGE = 'bike_storage',
  LAUNDRY_UNIT = 'laundry_unit',
  ELEVATOR_SHAFT = 'elevator_shaft',
  STAIRWELL = 'stairwell',
  ROOFTOP = 'rooftop',
  BASEMENT = 'basement',
  BOILER_UNIT = 'boiler_unit',
  SECURITY_UNIT = 'security_unit',
  ELECTRICAL_UNIT = 'electrical_unit',
  HOSPITAL_UNIT = 'hospital_unit',
}

export enum Furnishing {
  UNFURNISHED = 'unfurnished',
  SEMI_FURNISHED = 'semi_furnished',
  FULLY_FURNISHED = 'fully_furnished',
}

export enum FlatCategory {
  LUXURY = 'Luxury',
  BUDGET = 'Budget',
  FAMILY = 'Family',
  STUDENT = 'Student',
  CORPORATE = 'Corporate',
  VACATION = 'Vacation',
}

export enum FlatStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  UNDER_MAINTENANCE = 'under_maintenance',
}

// Unit Schema
const unitSchema = new Schema({
  unitNumber: { type: String, required: true },
  type: { type: String, enum: Object.values(FlatType) },
  furnishing: { type: String, enum: Object.values(Furnishing) },
  category: { type: String, enum: Object.values(FlatCategory) },
  status: { type: String, enum: Object.values(FlatStatus), default: FlatStatus.AVAILABLE },
  isOccupied: { type: Boolean, default: false },
  rentAmount: { type: Number },
  tenantId: { type: Schema.Types.ObjectId, ref: 'User' },
}, { _id: true })

// Floor Schema
const floorSchema = new Schema({
  floorNumber: { type: Number, required: true },
  defaultType: { type: String, enum: Object.values(FlatType) },
  defaultFurnishing: { type: String, enum: Object.values(Furnishing) },
  defaultCategory: { type: String, enum: Object.values(FlatCategory) },
  defaultRentAmount: { type: Number },
  units: [unitSchema],
}, { _id: true })

// Address Schema
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
  floors: [floorSchema],

  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  versionKey: false,
})
export const Property = model('Property', propertySchema)
