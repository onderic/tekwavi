import type { User } from '#auth-utils'
import { User as UserModel } from '~~/server/models/User'

export default defineEventHandler(async (event) => {
  const { phone, password } = await readBody(event)

  const dbUser = await UserModel.findOne({ phone }).select('+password')

  if (!dbUser) {
    return createError({
      statusCode: 400,
      statusMessage: 'Please check your phone number and password.',
    })
  }

  const mongoUser = JSON.parse(JSON.stringify(dbUser))

  const user = {
    ...mongoUser,
    role: mongoUser.role,
    address: mongoUser.address || undefined,
    first_name: mongoUser.first_name || null,
    last_name: mongoUser.last_name || null,
    email: mongoUser.email || '',
    phone: mongoUser.phone || undefined,
    ownedProperties: mongoUser.ownedProperties || [],
    ownedUnits: mongoUser.ownedUnits || [],
    rentedUnits: mongoUser.rentedUnits || [],
    assignedProperty: mongoUser.assignedProperty || null,
    // Include temp password fields
    tempPasswordExpiry: mongoUser.tempPasswordExpiry || null,
    tempPasswordUsed: mongoUser.tempPasswordUsed || false,
    tempPasswordVerifiedAt: mongoUser.tempPasswordVerifiedAt || null,
    isVerified: mongoUser.isVerified || false,
  } as User & { password?: string }

  const isAuthenticated = await verifyPassword(user.password!, password)

  if (!isAuthenticated) {
    return createError({
      statusCode: 400,
      statusMessage: 'Please check your phone number and password.',
    })
  }

  delete user.password

  await UserModel.findByIdAndUpdate(user._id, {
    lastLogin: new Date(),
  })

  await setUserSession(event, {
    user,
    loggedInAt: new Date(),
  })

  return await getUserSession(event)
})
