export interface Maintenance {
  _id: string
  title: string
  description: string
  propertyId: string
  propertyName: string
  floorId: string
  unitId: string
  unitNumber: string
  status: MaintenanceStatus
  priority: MaintenancePriority
  category: MaintenanceCategory
  assignedTo?: string
  assignedToName?: string
  cost?: number
  requestedBy?: string
  requestedByName?: string
  submittedDate: string
  scheduledDate?: string
  completedDate?: string
  notes?: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
  maintenanceNumber: string
  addedByName?: string
}

export enum MaintenanceStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum MaintenancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum MaintenanceCategory {
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  STRUCTURAL = 'structural',
  APPLIANCE = 'appliance',
  HEATING_COOLING = 'heating_cooling',
  GENERAL = 'general',
  OTHER = 'other',
}
