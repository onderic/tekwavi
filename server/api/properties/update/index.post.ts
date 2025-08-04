import { isValidObjectId, Types } from 'mongoose'
import { Property } from '~~/server/models/Property'
import type { UserRole } from '~~/shared/enums/roles'
import { canPerform } from '~~/server/utils/roles'

export default defineEventHandler(async (event) => {
  console.log('Updating property...')
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  const body = await readBody(event)
  const { propertyId, propertyData } = body

  if (!propertyId || !isValidObjectId(propertyId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid property ID',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'update', 'propertyManagement:property')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied',
    })
  }

  try {
    const property = await Property.findById(propertyId)

    if (!property) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Property not found',
      })
    }

    Object.assign(property, propertyData, {
      updatedAt: new Date(),
      updatedBy: new Types.ObjectId(user._id),
    })

    const updatedProperty = await property.save()

    return {
      success: true,
      message: 'Property updated successfully',
      property: updatedProperty,
    }
  }
  catch (error: any) {
    console.error('Error updating property:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update property',
    })
  }
})
