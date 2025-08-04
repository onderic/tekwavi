import { User } from '~~/server/models/User'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  try {
    const body = await readBody(event)

    const userId = user._id

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID not found in session',
      })
    }

    const existingUser = await User.findById(userId)

    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    const updateFields = [
      'first_name', 'last_name', 'email',
      'role', 'isActive', 'phone',
      'address', 'profileImage',
    ]

    updateFields.forEach((field) => {
      if (body[field] !== undefined) {
        (existingUser as Record<string, any>)[field] = body[field]
      }
    })

    existingUser.isVerified = true

    await existingUser.save()

    const updatedUser = existingUser.toObject()
    delete (updatedUser as any).password

    await setUserSession(event, {
      user: updatedUser,
      loggedInAt: new Date(),
    })

    return {
      success: true,
      message: 'Profile completed successfully',
      user: updatedUser,
    }
  }
  catch (error) {
    console.error('Error updating user:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update user',
      data: error,
    })
  }
})
