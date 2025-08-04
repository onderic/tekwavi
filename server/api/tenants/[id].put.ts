import mongoose from 'mongoose'
import type { UserRole } from '~~/shared/enums/roles'
import { Tenant } from '~~/server/models/Tenants'
import { Property } from '~~/server/models/Property'
import { Floor } from '~~/server/models/Property/Floor'
import { Unit } from '~~/server/models/Property/Unit'
import { User } from '~~/server/models/User'
import { FlatStatus } from '~~/shared/enums/property'
import { purgeAnalyticsCache } from '~~/server/utils/cacheUtils'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'update', 'tenantManagement:tenant')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to update tenant records.',
    })
  }

  const tenantId = getRouterParam(event, 'id')
  if (!tenantId || !mongoose.isValidObjectId(tenantId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid tenant ID',
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const existingTenant = await Tenant.findById(tenantId).session(session)
    if (!existingTenant) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Tenant not found',
      })
    }

    const body = await readBody(event)

    const isPhoneChanging = existingTenant.phoneNumber !== body.phoneNumber

    let updateUserPassword = false
    let newPasswordString = ''

    const isUnitChanging = existingTenant.unitId.toString() !== body.unitId.toString()
      || existingTenant.floorId.toString() !== body.floorId.toString()
      || existingTenant.propertyId.toString() !== body.propertyId.toString()

    if (isUnitChanging) {
      // Update old unit to available
      const _oldUnit = await Unit.findOneAndUpdate(
        { _id: existingTenant.unitId, propertyId: existingTenant.propertyId },
        {
          $set: {
            isOccupied: false,
            status: FlatStatus.AVAILABLE,
            tenantId: null,
          },
        },
        { session },
      )

      // Update new unit to rented
      const newUnit = await Unit.findOne({ _id: body.unitId, propertyId: body.propertyId }).session(session)
      if (!newUnit) {
        throw createError({
          statusCode: 404,
          statusMessage: 'New unit not found',
        })
      }

      if (newUnit.isOccupied && (!newUnit.tenantId || newUnit.tenantId.toString() !== tenantId)) {
        throw createError({
          statusCode: 409,
          statusMessage: 'New unit is already occupied by another tenant',
        })
      }

      newUnit.isOccupied = true
      newUnit.status = FlatStatus.RENTED
      newUnit.tenantId = existingTenant._id
      await newUnit.save({ session })

      // Get property and floor info for response
      const newProperty = await Property.findById(body.propertyId).session(session)
      if (!newProperty) {
        throw createError({
          statusCode: 404,
          statusMessage: 'New property not found',
        })
      }
      const newFloor = await Floor.findById(body.floorId).session(session)
      if (!newFloor) {
        throw createError({
          statusCode: 404,
          statusMessage: 'New floor not found',
        })
      }

      body.propertyName = newProperty.propertyName
      body.floorNumber = newFloor.floorNumber
      body.unitNumber = newUnit.unitNumber

      updateUserPassword = true
      newPasswordString = newUnit.unitNumber.toString()
    }

    const leaseStartDate = body.leaseStartDate instanceof Date
      ? body.leaseStartDate
      : new Date(body.leaseStartDate)

    const leaseEndDate = body.leaseEndDate instanceof Date
      ? body.leaseEndDate
      : new Date(body.leaseEndDate)

    const updates = {
      ...body,
      leaseStartDate,
      leaseEndDate,
      updatedBy: user._id,
      updatedAt: new Date(),
    }

    const updatedTenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { $set: updates },
      { new: true, runValidators: true, session },
    )

    if (!updatedTenant) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Failed to update tenant record',
      })
    }

    // Find and update the associated user account
    let userMessage = ''

    // Look up user by old phone number
    let tenantUser = await User.findOne({ phone: existingTenant.phoneNumber }).session(session)

    // If phone number is changing and we didn't find a user with the old phone,
    // or if we need to create a new user
    if (!tenantUser || isPhoneChanging) {
      // If phone changing, check if a user with the new phone already exists
      if (isPhoneChanging) {
        const newPhoneUser = await User.findOne({ phone: body.phoneNumber }).session(session)

        if (newPhoneUser) {
          // If new phone user exists, update that user instead
          tenantUser = newPhoneUser
          userMessage = 'Updated existing user account with new phone number.'
        }
        else if (tenantUser) {
          // Update phone number on existing user
          tenantUser.phone = body.phoneNumber
          userMessage = 'Updated phone number on existing user account.'
        }
        else {
          // Create new user if none exists
          const email = body.email || `tenant_${body.phoneNumber}@homeae.local`
          const hashedPassword = await hashPassword(newPasswordString || body.unitNumber.toString())

          tenantUser = new User({
            first_name: body.firstName || '',
            last_name: body.lastName || '',
            email: email,
            password: hashedPassword,
            role: 'tenant',
            phone: body.phoneNumber,
            isActive: true,
            isVerified: true,
            lastLogin: null,
          })

          userMessage = 'Created new user account for tenant.'
        }
      }
    }

    // Update the user if we found one
    if (tenantUser) {
      // Update user information
      tenantUser.first_name = body.firstName || tenantUser.first_name
      tenantUser.last_name = body.lastName || tenantUser.last_name

      tenantUser.isActive = true
      tenantUser.isVerified = true

      // Update password if unit changed
      if (updateUserPassword) {
        tenantUser.password = await hashPassword(newPasswordString)
        userMessage += ' Password updated to match new unit number.'
      }

      await tenantUser.save({ session })
    }

    await session.commitTransaction()

    await purgeAnalyticsCache(existingTenant.propertyId.toString())

    return {
      success: true,
      message: 'Tenant updated successfully.' + (userMessage ? ' ' + userMessage : ''),
      tenant: updatedTenant,
      userUpdated: !!tenantUser,
    }
  }
  catch (error: any) {
    await session.abortTransaction()

    console.error('Error updating tenant:', error)

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message).join(', ')
      throw createError({
        statusCode: 400,
        statusMessage: `Validation failed: ${messages}`,
      })
    }

    if (error.code === 11000) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A tenant record with this information already exists',
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update tenant record',
      data: error,
    })
  }
  finally {
    session.endSession()
  }
})
