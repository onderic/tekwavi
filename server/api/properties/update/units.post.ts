import mongoose from 'mongoose'
import { Unit } from '~~/server/models/Property/Unit'
import { Floor } from '~~/server/models/Property/Floor'
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

  if (!user.role || !canPerform(user.role as UserRole, 'update', 'propertyManagement:property')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to update units.',
    })
  }

  const body = await readBody(event)

  // Handle both single unit update and multiple units update
  const isSingleUpdate = body.unitId && body.unitData
  const isMultipleUpdate = body.unitsToUpdate || body.unitsToDelete

  if (!isSingleUpdate && !isMultipleUpdate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request format',
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // Single unit update
    if (isSingleUpdate) {
      const { unitId, unitData } = body

      const unit = await Unit.findById(unitId).session(session)
      if (!unit) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Unit not found',
        })
      }

      // Check permissions
      const propertyId = unit.propertyId.toString()
      if (user.role === UserRole.DEVELOPER) {
        if (!user.ownedProperties?.some(id => id.toString() === propertyId)) {
          throw createError({
            statusCode: 403,
            statusMessage: 'Access denied. You do not have access to this property.',
          })
        }
      }
      else if (user.role === UserRole.CARETAKER) {
        if (user.assignedProperty?.toString() !== propertyId) {
          throw createError({
            statusCode: 403,
            statusMessage: 'Access denied. You do not have access to this property.',
          })
        }
      }

      // Update unit
      Object.assign(unit, {
        unitNumber: unitData.unitNumber,
        type: unitData.type,
        furnishing: unitData.furnishing,
        category: unitData.category,
        status: unitData.status,
        rentAmount: unitData.rentAmount,
        isOccupied: unitData.isOccupied ?? unit.isOccupied,
      })

      await unit.save({ session })
      await session.commitTransaction()

      await purgeAnalyticsCache(propertyId)

      return {
        success: true,
        message: 'Unit updated successfully',
        unit: await Unit.findById(unitId)
          .populate('floorId', 'floorNumber')
          .populate('propertyId', 'propertyName'),
      }
    }

    // Multiple units update
    if (isMultipleUpdate) {
      const { propertyId, floorId, unitsToUpdate, unitsToDelete } = body

      // Verify floor exists and user has access
      const floor = await Floor.findById(floorId).session(session)
      if (!floor) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Floor not found',
        })
      }

      // Check permissions
      if (user.role === UserRole.DEVELOPER) {
        if (!user.ownedProperties?.some(id => id.toString() === propertyId)) {
          throw createError({
            statusCode: 403,
            statusMessage: 'Access denied. You do not have access to this property.',
          })
        }
      }
      else if (user.role === UserRole.CARETAKER) {
        if (user.assignedProperty?.toString() !== propertyId) {
          throw createError({
            statusCode: 403,
            statusMessage: 'Access denied. You do not have access to this property.',
          })
        }
      }

      const results = {
        updated: 0,
        deleted: 0,
      }

      // Update units
      if (unitsToUpdate && Array.isArray(unitsToUpdate)) {
        for (const unitData of unitsToUpdate) {
          const unit = await Unit.findById(unitData._id).session(session)
          if (!unit) continue

          Object.assign(unit, {
            unitNumber: unitData.unitNumber,
            type: unitData.type,
            furnishing: unitData.furnishing,
            category: unitData.category,
            status: unitData.status,
            rentAmount: unitData.rentAmount,
            isOccupied: unitData.isOccupied ?? unit.isOccupied,
          })

          await unit.save({ session })
          results.updated++
        }
      }

      // Delete units (only unoccupied)
      if (unitsToDelete && Array.isArray(unitsToDelete)) {
        const deleteResult = await Unit.deleteMany({
          _id: { $in: unitsToDelete },
          floorId: floorId,
          isOccupied: false,
        }).session(session)

        results.deleted = deleteResult.deletedCount

        // Update floor's units array
        await Floor.findByIdAndUpdate(
          floorId,
          { $pull: { units: { $in: unitsToDelete } } },
          { session },
        )
      }

      await session.commitTransaction()

      // Purge analytics cache for the property since unit updates/deletions affect analytics
      await purgeAnalyticsCache(propertyId.toString())

      return {
        success: true,
        message: `Updated ${results.updated} units, deleted ${results.deleted} units`,
        results,
      }
    }
  }
  catch (error: any) {
    await session.abortTransaction()

    console.error('Unit update error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update units',
    })
  }
  finally {
    session.endSession()
  }
})
