import { User } from '~~/server/models/User'
import { Property } from '~~/server/models/Property'
import type { UserRole } from '~~/shared/enums/roles'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'read', 'userManagement:user')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to fetch resource.',
    })
  }

  try {
    const query = getQuery(event)

    let filter: any = {
      role: { $ne: 'tenant' },
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true'
    }
    if (query.role) {
      filter.role = query.role
    }

    // If user is a developer, modify filter to get caretakers of their properties
    if (user.role === 'developer') {
      // Get all properties owned by this developer
      const developerProperties = await Property.find({ 
        createdBy: user._id,
        status: 'active'
      }).select('_id propertyName')

      const propertyIds = developerProperties.map(p => p._id)

      // Update filter to get caretakers assigned to developer's properties
      filter = {
        role: 'caretaker',
        assignedProperty: { $in: propertyIds },
        ...filter
      }

      // Get users with populated property information
      const users = await User.find(filter)
        .select('-password')
        .populate({
          path: 'assignedProperty',
          select: 'propertyName categoryName address status',
          model: 'Property'
        })
        .lean()

      // Transform the response to include property name at root level
      const transformedUsers = users.map((user: any) => ({
        ...user,
        propertyName: user.assignedProperty?.propertyName || null,
        property: user.assignedProperty
      }))

      return transformedUsers
    }

    // For non-developers, return regular filtered users
    return await User.find(filter)
      .select('-password')
      .populate({
        path: 'assignedProperty',
        select: 'propertyName categoryName address status',
        model: 'Property'
      })
  }
  catch (error) {
    console.error('Error fetching users:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve users',
      data: error,
    })
  }
})