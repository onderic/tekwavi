import mongoose from 'mongoose'
import type { Document, Model, Types } from 'mongoose'

export enum MessageType {
  RENT_PAYMENT = 'rent_payment',
  MAINTENANCE = 'maintenance',
  ANNOUNCEMENT = 'announcement',
  GENERAL = 'general',
}

export enum MessageStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
}

export interface IMessage extends Document {
  sender: Types.ObjectId
  recipient: Types.ObjectId
  type: MessageType
  subject: string
  content: string
  status: MessageStatus
  createdAt: Date
  readAt?: Date
  metadata: {
    propertyId?: Types.ObjectId
    unitId?: Types.ObjectId
    invoiceId?: Types.ObjectId
    maintenanceId?: Types.ObjectId
    paymentMonth?: string
    paymentYear?: number
    amount?: number
  }
}

const messageSchema = new mongoose.Schema<IMessage>(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(MessageType),
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.UNREAD,
    },
    readAt: {
      type: Date,
      default: null,
    },
    metadata: {
      propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
      },
      unitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit',
      },
      invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
      },
      maintenanceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Maintenance',
      },
      paymentMonth: String,
      paymentYear: Number,
      amount: Number,
    },
  },
  {
    timestamps: true,
  },
)

messageSchema.index({ recipient: 1, status: 1 })
messageSchema.index({ type: 1 })
messageSchema.index({ 'metadata.propertyId': 1 })
messageSchema.index({ 'metadata.invoiceId': 1 })

export const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema)
