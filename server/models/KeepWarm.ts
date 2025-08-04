import { Schema, model } from 'mongoose'

const keepWarmSchema = new Schema({
  taskName: {
    type: String,
    required: true,
    default: 'keep-warm-ping',
  },

  executionTime: {
    type: Date,
    required: true,
    default: Date.now,
  },

  status: {
    type: String,
    enum: ['success', 'failed'],
    required: true,
  },

  responseTime: {
    type: Number, // in milliseconds
    required: false,
  },

  message: {
    type: String,
    required: false,
  },

  error: {
    type: String,
    required: false,
  },

  serverUptime: {
    type: Number, // in seconds
    required: false,
  },

}, {
  timestamps: true,
  versionKey: false,
})

export const KeepWarm = model('KeepWarm', keepWarmSchema)
