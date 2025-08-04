import type mongoose from 'mongoose'
import { Notification } from '~~/server/models/Notification'
import { Tenant } from '~~/server/models/Tenants'

interface PaymentNotificationData {
  invoiceId: string
  invoiceNumber: string
  receiptNumber?: string
  amount: number
  paymentMethod: string
  mpesaReceiptNumber?: string
  tenantId: string
  tenantName: string
  propertyId: string
  unitNumber: string
  paymentFor: {
    month: number
    year: number
    monthName: string
  }
  paymentDate: Date
}

export async function createPaymentNotifications(
  paymentData: PaymentNotificationData,
  session?: mongoose.ClientSession,
) {
  try {
    console.log(`Creating payment notifications for invoice ${paymentData.invoiceNumber}`)

    const tenant = await Tenant.findById(paymentData.tenantId).session(session || null)
    if (!tenant) {
      console.warn(`Tenant not found for invoice ${paymentData.invoiceId}`)
      return
    }

    const baseMetadata = {
      invoiceId: paymentData.invoiceId,
      invoiceNumber: paymentData.invoiceNumber,
      receiptNumber: paymentData.receiptNumber,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      mpesaReceiptNumber: paymentData.mpesaReceiptNumber,
      tenantName: paymentData.tenantName,
      unitNumber: paymentData.unitNumber,
      paymentFor: paymentData.paymentFor,
      paymentDate: paymentData.paymentDate,
    }

    const notifications = []

    if (tenant.phoneNumber) {
      const tenantNotification = new Notification({
        role: 'tenant',
        phone: tenant.phoneNumber,
        title: 'Payment Confirmed',
        message: generateTenantMessage(paymentData),
        senderId: 'system',
        type: 'payment',
        referenceId: paymentData.invoiceId,
        referenceModel: 'Invoice',
        status: 'accepted',
        isRead: false,
        isActionable: false,
        metadata: baseMetadata,
      })

      notifications.push(tenantNotification)
    }
    else {
      console.warn(`Tenant ${paymentData.tenantId} has no phone number for notification`)
    }

    const developerNotification = new Notification({
      propertyId: paymentData.propertyId,
      title: 'Payment Received',
      message: generateAdminMessage(paymentData),
      senderId: 'system',
      type: 'payment',
      referenceId: paymentData.invoiceId,
      referenceModel: 'Invoice',
      status: 'accepted',
      isRead: false,
      isActionable: true,
      actionUrl: `//properties/${paymentData.propertyId}/invoices/${paymentData.invoiceId}`,
      metadata: {
        ...baseMetadata,
        propertyId: paymentData.propertyId,
        targetRoles: ['developer', 'caretaker'],
      },
    })

    notifications.push(developerNotification)

    if (session) {
      await Promise.all(notifications.map(notification => notification.save({ session })))
    }
    else {
      await Promise.all(notifications.map(notification => notification.save()))
    }

    console.log(`Created ${notifications.length} payment notifications for invoice ${paymentData.invoiceNumber}`)

    return {
      success: true,
      notificationsCreated: notifications.length,
    }
  }
  catch (error: any) {
    console.error('Error creating payment notifications:', error)
    return {
      success: false,
      error: error.message || 'Failed to create notifications',
    }
  }
}

function generateTenantMessage(data: PaymentNotificationData): string {
  const receiptInfo = data.mpesaReceiptNumber ? ` Receipt: ${data.mpesaReceiptNumber}` : ''
  return `Your rent payment of KES ${data.amount.toLocaleString()} for ${data.paymentFor.monthName} ${data.paymentFor.year} has been confirmed.${receiptInfo}`
}

function generateAdminMessage(data: PaymentNotificationData): string {
  const receiptInfo = data.mpesaReceiptNumber ? ` Receipt: ${data.mpesaReceiptNumber}` : ''
  return `Rent payment of KES ${data.amount.toLocaleString()} received from ${data.tenantName} for ${data.propertyName} - Unit ${data.unitNumber} (${data.paymentFor.monthName} ${data.paymentFor.year}).${receiptInfo}`
}
