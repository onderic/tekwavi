import { User as UserModel } from '~~/server/models/User'

export default defineEventHandler(async (event) => {
  const { phone, tempPassword } = await readBody(event)

  if (!phone || !tempPassword) {
    return createError({
      statusCode: 400,
      statusMessage: 'Phone number and temporary password are required.',
    })
  }

  const user = await UserModel.findOne({ phone }).select('+tempPassword +tempPasswordExpiry +tempPasswordUsed')

  if (!user) {
    return createError({
      statusCode: 400,
      statusMessage: 'No account found with this phone number.',
    })
  }

  if (!user.tempPassword) {
    return createError({
      statusCode: 400,
      statusMessage: 'No temporary password found. Please request a new one.',
    })
  }

  if (user.tempPasswordExpiry && user.tempPasswordExpiry < new Date()) {
    return createError({
      statusCode: 400,
      statusMessage: 'Temporary password has expired. Please request a new one.',
    })
  }
  if (user.tempPasswordUsed) {
    return createError({
      statusCode: 400,
      statusMessage: 'Temporary password has already been used. Please request a new one.',
    })
  }

  const isValidTempPassword = await verifyPassword(user.tempPassword, tempPassword)

  if (!isValidTempPassword) {
    return createError({
      statusCode: 400,
      statusMessage: 'Invalid temporary password.',
    })
  }
  await UserModel.findByIdAndUpdate(user._id, {
    tempPasswordUsed: true,
    tempPasswordVerifiedAt: new Date(),
  })

  const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await UserModel.findByIdAndUpdate(user._id, {
    passwordResetToken: resetToken,
    passwordResetTokenExpiry: resetTokenExpiry,
  })

  await setUserSession(event, {
    resetToken,
    userId: user._id.toString(),
    phone: user.phone,
    resetStep: 'temp-password-verified',
    expiresAt: resetTokenExpiry,
  })

  return {
    message: 'Temporary password verified successfully.',
    success: true,
  }
})
