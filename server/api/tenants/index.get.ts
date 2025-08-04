import { Tenant } from '~~/server/models/Tenants'
import type { UserRole } from '~~/shared/enums/roles'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'read', 'tenantManagement:tenant')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to view tenants.',
    })
  }

  try {
    const query = getQuery(event)
    const propertyId = query.propertyId as string

    if (!propertyId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Property ID is required',
      })
    }

    const tenants = await Tenant.find({ propertyId })
      .populate('propertyId', 'propertyName address')
      .populate('unitId', 'unitNumber floorNumber')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean()

    return {
      success: true,
      data: {
        tenants,
        total: tenants.length,
        propertyId,
      },
    }
  }
  catch (error: any) {
    console.error('Error fetching tenants:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch tenants',
    })
  }
})
