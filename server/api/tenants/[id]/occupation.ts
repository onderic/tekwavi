import mongoose from 'mongoose'
import { Tenant } from '~~/server/models/Tenants'
import { Unit } from '~~/server/models/Property/Unit'
import { UserRole } from '~~/shared/enums/roles'
import { canPerform } from '~~/server/utils/roles'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'read', 'tenantManagement:tenant')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to access tenant records.',
    })
  }

  const unitId = getRouterParam(event, 'id')
  if (!unitId || !mongoose.isValidObjectId(unitId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid unit ID',
    })
  }

  try {
    const unit = await Unit.findById(unitId)
      .populate('propertyId', 'propertyName')
      .populate('floorId', 'floorNumber')

    if (!unit) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Unit not found',
      })
    }

    if (user.role === UserRole.DEVELOPER) {
      const hasAccess = user.ownedProperties?.some(
        (propId: any) => propId.toString() === unit.propertyId._id.toString(),
      )
      if (!hasAccess) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Access denied. You do not have access to this property.',
        })
      }
    }
    else if (user.role === UserRole.CARETAKER) {
      if (user.assignedProperty?.toString() !== unit.propertyId._id.toString()) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Access denied. You do not have access to this property.',
        })
      }
    }
    else if (user.role === UserRole.TENANT) {
      const hasAccess = user.rentedUnits?.some(
        (rentedUnitId: any) => rentedUnitId.toString() === unitId,
      )
      if (!hasAccess) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Access denied. You can only view your own units.',
        })
      }
    }

    const tenants = await Tenant.find({ unitId })
      .sort({
        isActive: -1,
        moveOutDate: -1,
        leaseStartDate: -1,
      })
      .select({
        _id: 1,
        firstName: 1,
        lastName: 1,
        phoneNumber: 1,
        email: 1,
        nationalId: 1,
        leaseStartDate: 1,
        leaseEndDate: 1,
        moveOutDate: 1,
        moveOutReason: 1,
        rentAmount: 1,
        depositAmount: 1,
        isActive: 1,
        unitNumber: 1,
        propertyName: 1,
        floorNumber: 1,
        createdAt: 1,
        updatedAt: 1,
      })

    const currentTenant = tenants.find(t => t.isActive)

    return {
      success: true,
      unit: {
        _id: unit._id,
        unitNumber: unit.unitNumber,
        propertyName: (unit.propertyId as any)?.propertyName,
        floorNumber: (unit.floorId as any)?.floorNumber,
        isOccupied: unit.isOccupied,
        status: unit.status,
      },
      currentTenant: currentTenant || null,
      occupants: tenants,
      total: tenants.length,
      history: {
        current: tenants.filter(t => t.isActive).length,
        past: tenants.filter(t => !t.isActive).length,
      },
    }
  }
  catch (error: any) {
    console.error('Error fetching unit occupation history:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch unit occupation history',
      data: error,
    })
  }
})
