import { Service } from '~~/server/models/Service'
import { canPerform } from '~~/server/utils/roles'
import type { UserRole } from '~~/shared/enums/roles'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'read', 'propertyManagement:property')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to view services.',
    })
  }

  const serviceId = getRouterParam(event, 'id')

  if (!serviceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Service ID is required',
    })
  }

  try {
    const service = await Service.findById(serviceId)
      .populate('propertyId', 'propertyName totalUnits')
      .lean()

    if (!service) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Service not found',
      })
    }

    if (user.role !== 'admin' && user.role !== 'developer') {
      const propertyId = service.propertyId?._id?.toString() || service.propertyId?.toString()
      const isOwner = Array.isArray(user.ownedProperties) && user.ownedProperties.includes(propertyId)
      const isManager = user.assignedProperty && user.assignedProperty === propertyId

      if (!isOwner && !isManager) {
        throw createError({
          statusCode: 403,
          statusMessage: 'You do not have access to this property',
        })
      }
    }

    const result = {
      ...service,
      propertyName: typeof service.propertyId === 'object' && service.propertyId !== null && 'propertyName' in service.propertyId
        ? (service.propertyId as any).propertyName
        : 'Unknown Property',
      propertyId: typeof service.propertyId === 'object' && service.propertyId !== null && '_id' in service.propertyId
        ? (service.propertyId as any)._id
        : service.propertyId,
    }

    return {
      success: true,
      service: result,
    }
  }
  catch (error: any) {
    console.error('Error fetching service:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch service',
    })
  }
})
