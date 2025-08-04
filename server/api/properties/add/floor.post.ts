import mongoose from 'mongoose'
import type { UserRole } from '~~/shared/enums/roles'
import { canPerform } from '~~/server/utils/roles'
import { Floor } from '~~/server/models/Property/Floor'
import { Property } from '~~/server/models/Property'
import { Unit } from '~~/server/models/Property/Unit'
import { purgeAnalyticsCache } from '~~/server/utils/cacheUtils'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'create', 'propertyManagement:floor')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to create floors.',
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  let transactionCommitted = false

  try {
    const body = await readBody(event)
    const { propertyId, floorNumber, units } = body

    const property = await Property.findById(propertyId).session(session)
    if (!property) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Property not found',
      })
    }

    if (user.role === 'developer') {
      if (!user.ownedProperties?.some(id => id.toString() === propertyId)) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Access denied. You do not have access to this property.',
        })
      }
    }
    else if (user.role === 'caretaker') {
      if (user.assignedProperty?.toString() !== propertyId) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Access denied. You do not have access to this property.',
        })
      }
    }

    const floor = new Floor({
      floorNumber,
      propertyId,
    })

    try {
      await floor.validate()
    }
    catch (validationError: any) {
      throw createError({
        statusCode: 400,
        statusMessage: `Validation error: ${validationError.message}`,
      })
    }

    const savedFloor = await floor.save({ session })

    let createdUnits = []
    if (units && Array.isArray(units) && units.length > 0) {
      const unitsToCreate = units.map(unit => ({
        ...unit,
        floorId: savedFloor._id,
        propertyId,
      }))

      createdUnits = await Unit.insertMany(unitsToCreate, { session })

      await Property.findByIdAndUpdate(
        propertyId,
        {
          $push: { floors: savedFloor._id },
          $inc: { totalUnits: createdUnits.length },
        },
        { session },
      )
    }
    else {
      await Property.findByIdAndUpdate(
        propertyId,
        { $push: { floors: savedFloor._id } },
        { session },
      )
    }

    await session.commitTransaction()
    transactionCommitted = true

    const propertyInfo = await Property.findById(propertyId).select('propertyName')

    const floorUnits = await Unit.find({ floorId: savedFloor._id })

    await purgeAnalyticsCache(propertyId)

    return {
      success: true,
      message: `Floor ${floorNumber} created successfully with ${createdUnits.length} units`,
      floor: {
        _id: savedFloor._id,
        floorNumber: savedFloor.floorNumber,
        propertyId: {
          _id: savedFloor.propertyId,
          propertyName: propertyInfo?.propertyName,
        },
        units: floorUnits,
        defaultType: savedFloor.defaultType,
        defaultFurnishing: savedFloor.defaultFurnishing,
        defaultCategory: savedFloor.defaultCategory,
        defaultRentAmount: savedFloor.defaultRentAmount,
        createdAt: savedFloor.createdAt,
        updatedAt: savedFloor.updatedAt,
      },
      unitsCreated: createdUnits.length,
    }
  }
  catch (error: any) {
    if (!transactionCommitted) {
      await session.abortTransaction()
    }

    console.error('Error creating floor:', error)

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

    if (error.code === 11000) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A floor with this number already exists in this property',
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create floor',
    })
  }
  finally {
    session.endSession()
  }
})
