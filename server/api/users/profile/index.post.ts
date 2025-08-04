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
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        first_name: body.first_name,
        last_name: body.last_name,
        address: {
          street: body.street,
          city: body.city,
          state: body.state,
        },
        updatedAt: new Date(),
      },
      {
        new: true,
        select: '-password',
      },
    )

    if (!updatedUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    await setUserSession(event, {
      user: updatedUser,
      loggedInAt: new Date(),
    })

    return {
      success: true,
      message: 'Profile updated successfully',
    }
  }
  catch (error: any) {
    console.error('Error updating user profile:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update profile',
    })
  }
})
