import { isValidObjectId } from 'mongoose'
import { User } from '~~/server/models/User'
import type { UserRole } from '~~/shared/enums/roles'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'read', 'userManagement:own_profile')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to fetch user data.',
    })
  }

  try {
    const userId = event.context.params?.id

    if (!userId || !isValidObjectId(userId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid user ID format',
      })
    }

    const foundUser = await User.findById(userId).select('-password')

    if (!foundUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }
    return foundUser
  }
  catch (error: any) {
    console.error('Error fetching user:', error)
    if (error.name === 'CastError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid user ID format',
      })
    }
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve user',
      data: error,
    })
  }
})
