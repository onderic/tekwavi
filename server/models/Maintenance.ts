import { Schema, model } from 'mongoose'

const maintenanceSchema = new Schema({
  maintenanceNumber: {
    type: String,
    required: true,
    unique: true,
  },

  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['plumbing', 'electrical', 'structural', 'appliance', 'heating_cooling', 'general', 'other'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    required: true,
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },

  // Location information
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  propertyName: {
    type: String,
    required: true,
  },
  floorId: {
    type: Schema.Types.ObjectId,
    ref: 'Floor',
  },
  unitId: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
  },
  unitNumber: {
    type: String,
  },

  // Request metadata
  requestedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requestedByName: {
    type: String,
    required: true,
  },
  submittedDate: {
    type: Date,
    default: Date.now,
  },

  // Assignment and scheduling
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  assignedToName: {
    type: String,
  },
  scheduledDate: {
    type: Date,
  },
  completedDate: {
    type: Date,
  },

  cost: {
    type: Number,
    min: 0,
  },

  media: [{
    url: String,
    fileType: String,
    fileName: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],

  notes: [{
    text: {
      type: String,
      required: true,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    addedByName: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  }],

  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedByName: {
    type: String,
  },
  approvalDate: {
    type: Date,
  },

  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  feedback: {
    type: String,
  },

}, {
  timestamps: true,
  versionKey: false,
})

export const Maintenance = model('Maintenance', maintenanceSchema)
