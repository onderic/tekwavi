import mongoose from 'mongoose'
import { Tenant } from '~~/server/models/Tenants'
import { Unit } from '~~/server/models/Property/Unit'
import { User } from '~~/server/models/User'
import { FlatStatus } from '~~/shared/enums/property'
import { UserRole } from '~~/shared/enums/roles'
import { canPerform } from '~~/server/utils/roles'
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
      statusMessage: 'Access denied. You do not have permission to end tenancies.',
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
    const tenant = await Tenant.findById(tenantId).session(session)
    if (!tenant) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Tenant not found',
      })
    }

    if (!tenant.isActive) {
      throw createError({
        statusCode: 400,
        statusMessage: 'This tenancy has already ended',
      })
    }

    const body = await readBody(event)
    const { moveOutReason, moveOutDate = new Date(), deactivateUser = false } = body

    const formattedMoveOutDate = moveOutDate instanceof Date
      ? moveOutDate
      : new Date(moveOutDate)

    tenant.isActive = false
    tenant.moveOutDate = formattedMoveOutDate
    tenant.moveOutReason = moveOutReason || 'Tenancy ended'
    tenant.updatedBy = new mongoose.Types.ObjectId(user._id)
    await tenant.save({ session })

    const unit = await Unit.findByIdAndUpdate(
      tenant.unitId,
      {
        $set: {
          isOccupied: false,
          status: FlatStatus.AVAILABLE,
          tenantId: null,
        },
      },
      { new: true, session },
    )

    if (!unit) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Unit not found',
      })
    }

    let userMessage = 'No associated user account found.'
    let userUpdated = false

    const tenantUser = await User.findOne({ phone: tenant.phoneNumber }).session(session)

    if (tenantUser) {
      if (Array.isArray(tenantUser.rentedUnits)) {
        const originalCount = tenantUser.rentedUnits.length
        tenantUser.rentedUnits = tenantUser.rentedUnits.filter(
          (id: any) => id.toString() !== tenant.unitId.toString(),
        )

        if (originalCount > tenantUser.rentedUnits.length) {
          userMessage = `Unit ${unit.unitNumber} removed from user's rented units.`
        }
      }
      const hasRemainingUnits = tenantUser.rentedUnits && tenantUser.rentedUnits.length > 0

      // If user has no more rented units and deactivateUser is true, deactivate the user
      if (!hasRemainingUnits && deactivateUser) {
        tenantUser.isActive = false
        userMessage += ' User account deactivated as this was their only unit.'
      }

      // If user is a TENANT and has no more rented units, change role to NORMAL
      if (tenantUser.role === UserRole.TENANT && !hasRemainingUnits) {
        // Only change role if user doesn't have other role-specific associations
        const hasOwnedProperties = tenantUser.ownedProperties && tenantUser.ownedProperties.length > 0
        const hasOwnedUnits = tenantUser.ownedUnits && tenantUser.ownedUnits.length > 0
        const hasAssignedProperty = tenantUser.assignedProperty

        if (!hasOwnedProperties && !hasOwnedUnits && !hasAssignedProperty) {
          tenantUser.role = UserRole.NORMAL
          userMessage += ' Role changed from tenant to normal user.'
        }
      }

      await tenantUser.save({ session })
      userUpdated = true
    }

    await session.commitTransaction()
    const remainingUnits = tenantUser?.rentedUnits?.length || 0

    await purgeAnalyticsCache(unit.propertyId.toString())

    return {
      success: true,
      message: 'Tenancy ended successfully. ' + userMessage,
      tenant: {
        _id: tenant._id,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        moveOutDate: tenant.moveOutDate,
        moveOutReason: tenant.moveOutReason,
      },
      unit: {
        _id: unit._id,
        unitNumber: unit.unitNumber,
        status: unit.status,
        isOccupied: unit.isOccupied,
      },
      userUpdated,
      remainingUnits,
    }
  }
  catch (error: any) {
    await session.abortTransaction()

    console.error('Error ending tenancy:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to end tenancy',
      data: error,
    })
  }
  finally {
    session.endSession()
  }
})
