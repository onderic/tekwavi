export enum FlatStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  UNDER_MAINTENANCE = 'under_maintenance',
}

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
  COMMERCIAL = 'Commercial',
  RESIDENTIAL = 'Residential',
}
export interface Address {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  latitude?: number
  longitude?: number
}

export interface Unit {
  _id?: string
  unitId?: string
  unitNumber: string
  type?: FlatType
  furnishing?: Furnishing
  category?: FlatCategory
  status: FlatStatus
  isOccupied: boolean
  rentAmount?: number
  tenantId?: string
  tenantName?: string
  notes?: string
  contractStartDate?: Date
  contractEndDate?: Date
}

export interface Floor {
  _id?: string
  floorId: string
  floorNumber: number
  defaultType?: FlatType
  defaultFurnishing?: Furnishing
  defaultCategory?: FlatCategory
  defaultRentAmount?: number
  units: Unit[]
}

interface PropertyStats {
  totalFloors?: number
  totalUnits?: number
  occupiedUnits?: number
  vacancyRate?: string
}

// property Interface
export interface Property {
  _id?: string
  propertyName: string
  categoryName: FlatCategory
  address: Address
  floors: Floor[]
  stats?: PropertyStats
  createdAt: Date
  updatedAt: Date
}

export interface FloorState {
  floorNumber: number
  defaultType?: FlatType
  defaultFurnishing?: Furnishing
  defaultCategory?: FlatCategory
  defaultRentAmount?: number
  units: UnitState[]
}

export interface UnitState {
  unitNumber: string
  type?: FlatType
  furnishing?: Furnishing
  status: FlatStatus
  category?: FlatCategory
  rentAmount?: number
  isOccupied?: boolean
}
