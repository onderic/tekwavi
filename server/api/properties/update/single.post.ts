import { Unit } from '~~/server/models/Property/Unit'
import type { UserRole } from '~~/shared/enums/roles'
import { canPerform } from '~~/server/utils/roles'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'update', 'propertyManagement:property')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to update units.',
    })
  }

  const body = await readBody(event)
  const { unitId, ...updateData } = body

  if (!unitId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unit ID is required',
    })
  }

  try {
    // Find the unit
    const unit = await Unit.findById(unitId)

    if (!unit) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Unit not found',
      })
    }

    // Check permissions based on user role
    const propertyId = unit.propertyId.toString()

    if (user.role === 'DEVELOPER') {
      if (!user.ownedProperties?.some((id: string) => id.toString() === propertyId)) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Access denied. You do not have access to this property.',
        })
      }
    }
    else if (user.role === 'CARETAKER') {
      if (user.assignedProperty?.toString() !== propertyId) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Access denied. You do not have access to this property.',
        })
      }
    }

    // Prevent certain changes if unit is occupied
    if (unit.isOccupied && unit.tenantId) {
      // Don't allow changing unit number or status when occupied
      delete updateData.unitNumber
      delete updateData.status
    }

    // Update unit fields
    const allowedFields = [
      'unitNumber',
      'type',
      'furnishing',
      'category',
      'status',
      'rentAmount',
      'isOccupied',
    ]

    const filteredUpdateData: any = {}
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field]
      }
    }

    // Update the unit
    const updatedUnit = await Unit.findByIdAndUpdate(
      unitId,
      filteredUpdateData,
      {
        new: true,
        runValidators: true,
      },
    )
      .populate('floorId', 'floorNumber name')
      .populate('propertyId', 'name address')

    return {
      success: true,
      message: 'Unit updated successfully',
      unit: updatedUnit,
    }
  }
  catch (error: any) {
    console.error('Unit update error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update unit',
    })
  }
})
