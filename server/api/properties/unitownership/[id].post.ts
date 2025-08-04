import { Unit } from '~~/server/models/Property/Unit'
import type { UserRole } from '~~/shared/enums/roles'
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

  if (!user.role || !canPerform(user.role as UserRole, 'update', 'propertyManagement:unitOwnership')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to update unit ownership.',
    })
  }

  const unitId = getRouterParam(event, 'id')

  if (!unitId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unit ID is required',
    })
  }

  try {
    const { ownership } = await readBody(event)

    if (!ownership) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ownership details are required',
      })
    }

    const unit = await Unit.findById(unitId)

    if (!unit) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Unit not found',
      })
    }

    // Check if unit has active ownership
    if (!unit.ownership || !unit.ownership.isActive) {
      throw createError({
        statusCode: 400,
        statusMessage: 'This unit has no active ownership to update',
      })
    }

    // Validate ownership fields
    const allowedFields = [
      'ownerName',
      'ownerPhone',
      'ownerEmail',
      'purchaseDate',
      'purchaseAmount',
      'ownershipType',
      'ownershipPercentage',
      'titleDeedNumber',
    ]
    const updateData: any = {}
    for (const field of allowedFields) {
      if (ownership[field] !== undefined) {
        updateData[field] = ownership[field]
      }
    }

    if (updateData.ownershipPercentage !== undefined) {
      if (updateData.ownershipPercentage < 1 || updateData.ownershipPercentage > 100) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Ownership percentage must be between 1 and 100',
        })
      }
    }

    // Validate ownership type if provided
    if (updateData.ownershipType !== undefined) {
      const validTypes = ['individual', 'company', 'joint']
      if (!validTypes.includes(updateData.ownershipType)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid ownership type. Must be individual, company, or joint',
        })
      }
    }

    // Update ownership details while preserving other fields
    unit.ownership = {
      ...unit.ownership,
      ...updateData,
      // Preserve fields that shouldn't be updated
      ownerId: unit.ownership.ownerId,
      isActive: unit.ownership.isActive,
      transferDate: unit.ownership.transferDate,
    }

    // Save the updated unit
    await unit.save()

    await purgeAnalyticsCache(unit.propertyId.toString())

    // Populate owner details for response
    await unit.populate('ownership.ownerId', 'first_name last_name email phone')

    return {
      success: true,
      message: 'Ownership details updated successfully',
      unit: {
        _id: unit._id,
        unitNumber: unit.unitNumber,
        ownership: unit.ownership,
      },
    }
  }
  catch (error: any) {
    console.error('Error updating unit ownership:', error)

    // If it's already a custom error, throw it as is
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update ownership details',
    })
  }
})
