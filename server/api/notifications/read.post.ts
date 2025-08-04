import { isValidObjectId } from 'mongoose'
import { Notification } from '~~/server/models/Notification'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  try {
    const body = await readBody(event)
    const { notificationId } = body

    if (!notificationId || !isValidObjectId(notificationId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid notification ID is required',
      })
    }

    const notification = await Notification.findById(notificationId)

    if (!notification) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Notification not found',
      })
    }

    // Only allow the recipient or a admin to mark a notification as read
    if (notification.email !== user.email && user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to update this notification',
      })
    }

    // Update the notification
    notification.isRead = true
    notification.updatedAt = new Date()

    await notification.save()

    return {
      success: true,
      message: 'Notification marked as read',
      notification,
    }
  }
  catch (error: any) {
    console.error('Error marking notification as read:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to mark notification as read',
      data: error,
    })
  }
})
