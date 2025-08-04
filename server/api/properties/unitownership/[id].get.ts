import { Unit } from '~~/server/models/Property/Unit'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
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
    const unit = await Unit.findById(unitId)
      .populate('propertyId', 'propertyName address type')
      .populate('floorId', 'floorNumber name')
      .populate('ownership.ownerId', 'first_name last_name email phone nationalId')
      .lean()

    if (!unit) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Unit not found',
      })
    }

    const { propertyId, floorId, ...unitData } = unit

    return {
      unit: {
        ...unitData,
        propertyId: propertyId?._id,
        floorId: floorId?._id,
      },
      property: propertyId,
      floor: floorId,
    }
  }
  catch (error: any) {
    console.error('Error fetching unit details:', error)

    // If it's already a custom error, throw it as is
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch unit details',
    })
  }
})
