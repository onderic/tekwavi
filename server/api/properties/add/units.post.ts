import mongoose from 'mongoose'
import type { UserRole } from '~~/shared/enums/roles'
import { canPerform } from '~~/server/utils/roles'
import { Unit } from '~~/server/models/Property/Unit'
import { Floor } from '~~/server/models/Property/Floor'
import { ServiceFee } from '~~/server/models/ServiceFee'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'create', 'propertyManagement:unit')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to create units.',
    })
  }

  const session = await mongoose.startSession()

  try {
    const body = await readBody(event)

    const units = Array.isArray(body.units) ? body.units : [body]

    if (!body.floorId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing floorId',
      })
    }

    // Start transaction after initial validation
    session.startTransaction()

    const floor = await Floor.findById(body.floorId).populate('propertyId').session(session)
    if (!floor) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Floor not found',
      })
    }

    const property = floor.propertyId as any

    const createdUnits = []
    const uniqueUnitTypes = new Set<string>()

    // Validate all units before saving any
    for (const unitData of units) {
      const unitType = unitData.flatType || unitData.type

      const unit = new Unit({
        ...unitData,
        flatType: unitType,
        floorId: body.floorId,
        propertyId: property._id,
      })

      try {
        await unit.validate()
      }
      catch (validationError: any) {
        throw createError({
          statusCode: 400,
          statusMessage: `Validation error for unit ${unitData.unitNumber || 'unknown'}: ${validationError.message}`,
        })
      }
    }

    // Check for duplicate unit numbers within the same floor
    const existingUnits = await Unit.find({
      floorId: body.floorId,
      unitNumber: { $in: units.map((u: any) => u.unitNumber) },
    }).session(session)

    if (existingUnits.length > 0) {
      const duplicateNumbers = existingUnits.map(u => u.unitNumber).join(', ')
      throw createError({
        statusCode: 409,
        statusMessage: `Units with numbers ${duplicateNumbers} already exist on this floor`,
      })
    }

    // Save all units
    for (const unitData of units) {
      const unitType = unitData.flatType || unitData.type

      const unit = new Unit({
        ...unitData,
        flatType: unitType,
        floorId: body.floorId,
        propertyId: property._id,
      })

      const savedUnit = await unit.save({ session })
      createdUnits.push(savedUnit)

      if (unitType) {
        uniqueUnitTypes.add(unitType)
      }
    }

    // Handle service fees
    const serviceFeeResults = []
    for (const unitType of uniqueUnitTypes) {
      try {
        const existingServiceFee = await ServiceFee.findOne({
          propertyId: property._id,
          unitType: unitType,
        }).session(session)

        if (!existingServiceFee) {
          const serviceFee = new ServiceFee({
            propertyId: property._id,
            unitType: unitType,
            monthlyFee: 0,
            createdBy: user._id,
          })

          await serviceFee.save({ session })
          serviceFeeResults.push({ unitType, created: true })
        }
        else {
          serviceFeeResults.push({ unitType, created: false, exists: true })
        }
      }
      catch (error: any) {
        console.error(`Error creating service fee for ${unitType}:`, error)
        // Don't fail the whole transaction for service fee errors
        serviceFeeResults.push({ unitType, created: false, error: error.message })
      }
    }

    const newServiceFees = serviceFeeResults.filter(result => result.created).length

    // Commit the transaction
    await session.commitTransaction()

    // Return response after successful commit
    return {
      success: true,
      message: `${createdUnits.length} unit(s) created successfully`,
      units: createdUnits,
      serviceFees: {
        created: newServiceFees,
        total: uniqueUnitTypes.size,
        details: serviceFeeResults,
      },
    }
  }
  catch (error: any) {
    // Only abort if the transaction is still active
    if (session.inTransaction()) {
      try {
        await session.abortTransaction()
      }
      catch (abortError) {
        console.error('Error aborting transaction:', abortError)
      }
    }

    console.error('Error creating unit(s):', error)

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
        statusMessage: 'A unit with this number already exists on this floor',
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create unit(s)',
    })
  }
  finally {
    // Always end the session
    try {
      await session.endSession()
    }
    catch (endError) {
      console.error('Error ending session:', endError)
    }
  }
})
