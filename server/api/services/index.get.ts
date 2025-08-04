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

  try {
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const propertyId = query.propertyId as string
    const serviceType = query.type as string
    const isActive = query.isActive as string
    const search = query.search as string
    const isMandatory = query.mandatory as string

    const filter: any = {}

    if (propertyId) {
      filter.propertyId = propertyId

      if (user.role !== 'developer' && user.role !== 'admin') {
        const isOwner = Array.isArray(user.ownedProperties) && user.ownedProperties.includes(propertyId)
        const isManager = user.assignedProperty && user.assignedProperty === propertyId

        if (!isOwner && !isManager) {
          throw createError({
            statusCode: 403,
            statusMessage: 'You do not have access to this property',
          })
        }
      }
    }

    if (serviceType && serviceType !== 'all') {
      filter.serviceType = serviceType.toUpperCase()
    }

    // Filter by active status if specified
    if (isActive && isActive !== 'all') {
      filter.isActive = isActive === 'true'
    }

    // Search filter
    if (search) {
      filter.$or = [
        { serviceName: { $regex: search, $options: 'i' } },
        { serviceProvider: { $regex: search, $options: 'i' } },
        { providerContact: { $regex: search, $options: 'i' } },
      ]
    }

    if (isMandatory && isMandatory !== 'all') {
      filter.isMandatory = isMandatory === 'true'
    }

    const skip = (page - 1) * limit

    const total = await Service.countDocuments(filter)

    // Get services with pagination
    const services = await Service.find(filter)
      .sort({ createdDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('propertyId', 'propertyName')
      .lean()

    const pages = Math.ceil(total / limit)

    const transformedServices = services.map((service: any) => ({
      ...service,
      propertyName: service.propertyId?.propertyName || 'Unknown Property',
      propertyId: service.propertyId?._id || service.propertyId,
    }))

    return {
      services: transformedServices,
      pagination: {
        total,
        pages,
        page,
        limit,
      },
    }
  }
  catch (error: any) {
    console.error('Error fetching services:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch services',
    })
  }
})
