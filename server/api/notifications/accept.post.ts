import mongoose from 'mongoose'
import { Notification } from '~~/server/models/Notification'
import { User } from '~~/server/models/User'
import { UserRole } from '~~/shared/enums/roles'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const body = await readBody(event)

    if (!body.notificationId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Notification ID is required',
      })
    }

    const notification = await Notification.findById(body.notificationId).session(session)

    if (!notification) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Invitation not found',
      })
    }

    const canAccept = (notification.email === user.email)
      || (notification.phone === user.phone)
      || (user.role === UserRole.ADMIN)

    if (!canAccept) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to accept this invitation',
      })
    }

    if (notification.status !== 'pending') {
      throw createError({
        statusCode: 400,
        statusMessage: `This invitation has already been ${notification.status}`,
      })
    }

    const expiryDate = new Date(notification.createdAt)
    expiryDate.setDate(expiryDate.getDate() + 7)

    if (new Date() > expiryDate) {
      notification.status = 'expired'
      await notification.save({ session })
      await session.commitTransaction()

      throw createError({
        statusCode: 400,
        statusMessage: 'This invitation has expired',
      })
    }

    const updateUser = await User.findOne({
      $or: [
        { email: notification.email },
        { phone: notification.phone },
      ],
    }).session(session)

    if (!updateUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    const validRoles = [UserRole.DEVELOPER, UserRole.CARETAKER, UserRole.TENANT, UserRole.UNIT_OWNER]
    if (notification.role && validRoles.includes(notification.role as UserRole)) {
      if (updateUser.role !== UserRole.ADMIN) {
        updateUser.role = notification.role as UserRole
      }
    }

    const metadata = notification.metadata

    if (notification.type === 'invite_property_owner') {
      updateUser.role = UserRole.DEVELOPER
    }
    else if (notification.type === 'invite_caretaker' && metadata?.propertyData) {
      // Caretaker accepting property management
      const propertyId = metadata.propertyData.propertyId || metadata.propertyData.id
      if (propertyId) {
        updateUser.assignedProperty = propertyId
        updateUser.role = UserRole.CARETAKER
      }
    }
    else if (notification.type === 'invite_tenant' && metadata?.unitData) {
      // Tenant accepting unit rental
      const unitId = metadata.unitData.unitId || metadata.unitData.id
      if (unitId && !updateUser.rentedUnits.includes(unitId)) {
        updateUser.rentedUnits.push(unitId)
        updateUser.role = UserRole.TENANT
      }
    }
    else if (notification.type === 'invite_unit_owner' && metadata?.unitData) {
      // Unit owner accepting unit ownership
      const unitId = metadata.unitData.unitId || metadata.unitData.id
      if (unitId && !updateUser.ownedUnits.includes(unitId)) {
        updateUser.ownedUnits.push(unitId)
        updateUser.role = UserRole.UNIT_OWNER
      }
    }

    // Update notification status
    notification.status = 'accepted'
    notification.isRead = true
    notification.updatedAt = new Date()

    await notification.save({ session })
    await updateUser.save({ session })

    await session.commitTransaction()

    const updatedUser = await User.findById(user._id)
      .select('-password')

    if (updatedUser) {
      await setUserSession(event, {
        user: updatedUser,
        loggedInAt: user.lastLogin || new Date(),
      })
    }

    return {
      success: true,
      message: 'Invitation accepted successfully',
      notification: {
        _id: notification._id,
        status: notification.status,
        type: notification.type,
      },
      user: {
        role: updatedUser?.role,
        ownedProperties: updatedUser?.ownedProperties,
        ownedUnits: updatedUser?.ownedUnits,
        rentedUnits: updatedUser?.rentedUnits,
        assignedProperty: updatedUser?.assignedProperty,
      },
    }
  }
  catch (error: any) {
    await session.abortTransaction()

    if (error.statusCode) {
      throw error
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message).join(', ')
      throw createError({
        statusCode: 400,
        statusMessage: `Validation failed: ${messages}`,
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to accept invitation',
    })
  }
  finally {
    await session.endSession()
  }
})
