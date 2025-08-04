import { Unit } from '~~/server/models/Property/Unit'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  try {
    const query = getQuery(event)
    const unitIds = query.unitIds

    if (!unitIds) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Unit IDs are required',
      })
    }

    const idsArray = Array.isArray(unitIds) ? unitIds : String(unitIds).split(',')

    if (idsArray.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'At least one unit ID must be provided',
      })
    }

    const units = await Unit.find({
      _id: { $in: idsArray },
    })
      .populate('propertyId', 'propertyName')
      .populate('ownership.ownerId', 'first_name last_name email phone')
      .lean()

    return {
      success: true,
      count: units.length,
      units: units.map(unit => ({
        _id: unit._id,
        unitNumber: unit.unitNumber,
        status: unit.status,
        type: unit.type,
        rentAmount: unit.rentAmount,
        property: unit.propertyId,
        floor: unit.floorId,
        ownership: unit.ownership,
      })),
    }
  }
  catch (error: any) {
    console.error('Error fetching units:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
