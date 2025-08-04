import type { User } from '#auth-utils'
import { User as UserModel } from '~~/server/models/User'

export default defineEventHandler(async (event) => {
  const { newPassword } = await readBody(event)

  if (!newPassword) {
    return createError({
      statusCode: 400,
      statusMessage: 'New password is required.',
    })
  }

  if (newPassword.length < 8) {
    return createError({
      statusCode: 400,
      statusMessage: 'Password must be at least 8 characters long.',
    })
  }

  const session = await getUserSession(event)

  if (!session || !session.resetToken || !session.userId || session.resetStep !== 'temp-password-verified') {
    return createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired reset session. Please start the reset process again.',
    })
  }

  // Check if reset session has expired
  if (session.expiresAt && new Date(session.expiresAt as string | number | Date) < new Date()) {
    return createError({
      statusCode: 401,
      statusMessage: 'Reset session has expired. Please start the reset process again.',
    })
  }

  const dbUser = await UserModel.findById(session.userId).select('+passwordResetToken +passwordResetTokenExpiry')

  if (!dbUser) {
    return createError({
      statusCode: 400,
      statusMessage: 'User not found.',
    })
  }

  if (!dbUser.passwordResetToken || dbUser.passwordResetToken !== session.resetToken) {
    return createError({
      statusCode: 401,
      statusMessage: 'Invalid reset token.',
    })
  }

  if (dbUser.passwordResetTokenExpiry && dbUser.passwordResetTokenExpiry < new Date()) {
    return createError({
      statusCode: 401,
      statusMessage: 'Reset token has expired. Please start the reset process again.',
    })
  }

  const hashedNewPassword = await hashPassword(newPassword)

  await UserModel.findByIdAndUpdate(dbUser._id, {
    password: hashedNewPassword,
    tempPassword: undefined,
    tempPasswordExpiry: undefined,
    tempPasswordUsed: undefined,
    tempPasswordVerifiedAt: undefined,
    passwordResetToken: undefined,
    passwordResetTokenExpiry: undefined,
    passwordChangedAt: new Date(),
    lastLogin: new Date(),
  })

  const updatedDbUser = await UserModel.findById(dbUser._id).select('+password')

  if (!updatedDbUser) {
    return createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve updated user.',
    })
  }

  const mongoUser = JSON.parse(JSON.stringify(updatedDbUser))

  interface Unit {
    unitId: string
    unitNumber: string
    floorId: string
    floorNumber: number
    associatedAt: Date
    isPrimary: boolean
    tenantId: string
    password?: string
    _id?: string
  }

  interface Property {
    propertyId: string
    name: string
    role: 'developer' | 'caretaker' | 'tenant' | 'normal'
    associatedAt?: Date
    units?: Unit[]
    _id?: string
  }

  const user = {
    ...mongoUser,
    properties: (mongoUser.properties || []) as Property[],
    address: mongoUser.address || undefined,
    first_name: mongoUser.first_name || null,
    last_name: mongoUser.last_name || null,
    email: mongoUser.email || '',
    phone: mongoUser.phone || undefined,
  } as User & { password?: string, properties: Property[] }

  delete user.password

  // Clear any existing session and create new user session
  await clearUserSession(event)

  await setUserSession(event, {
    user,
    loggedInAt: new Date(),
  })

  return await getUserSession(event)
})
