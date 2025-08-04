import { User as UserModel } from '~~/server/models/User'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  const body = await readBody(event)
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Current password and new password are required',
    })
  }

  try {
    const existingUser = await UserModel.findById(user._id).select('+password')

    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }
    const isCurrentPasswordValid = await verifyPassword(existingUser.password, currentPassword)

    if (!isCurrentPasswordValid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Current password is incorrect',
      })
    }

    const isSamePassword = await verifyPassword(existingUser.password, newPassword)

    if (isSamePassword) {
      throw createError({
        statusCode: 400,
        statusMessage: 'New password must be different from current password',
      })
    }

    const hashedNewPassword = await hashPassword(newPassword)

    await UserModel.findByIdAndUpdate(
      user._id,
      {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    )

    return {
      success: true,
      message: 'Password updated successfully',
    }
  }
  catch (error: any) {
    console.error('Password change error:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred while changing password',
    })
  }
})
