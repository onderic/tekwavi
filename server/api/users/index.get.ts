import { User } from '~~/server/models/User'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as Role, 'read', 'userManagement:user')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to fetch resource.',
    })
  }

  try {
    const query = getQuery(event)

    const filter: any = {
      role: { $ne: 'tenant' },
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true'
    }
    if (query.role) {
      filter.role = query.role
    }

    return await User.find(filter).select('-password')
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
