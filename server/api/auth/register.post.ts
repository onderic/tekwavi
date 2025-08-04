import type { User } from '#auth-utils'
import { User as UserModel } from '~~/server/models/User'

export default defineEventHandler(async (event) => {
  await clearUserSession(event)

  const body = await readBody(event)
  const { phone, password, role, email } = body

  try {
    const existingUser = await UserModel.findOne({ phone })

    if (existingUser) {
      return createError({
        statusCode: 400,
        statusMessage: 'User with this phone number already exists',
      })
    }

    const hashedPassword = await hashPassword(password)

    const newUser = await UserModel.create({
      email: email || '',
      password: hashedPassword,
      first_name: body.first_name || '',
      last_name: body.last_name || '',
      role: role || 'normal',
      phone,
      isActive: true,
      isVerified: false,
      lastLogin: null,
    })

    const mongoUser = newUser.toObject()

    const user: User = {
      _id: mongoUser._id.toString(),
      first_name: mongoUser.first_name || '',
      last_name: mongoUser.last_name || '',
      email: mongoUser.email,
      role: mongoUser.role,
      phone: mongoUser.phone || '',
      createdAt: mongoUser.createdAt,
      updatedAt: mongoUser.updatedAt,
      lastLogin: mongoUser.lastLogin,
      isActive: mongoUser.isActive,
      isVerified: mongoUser.isVerified,
    }

    await setUserSession(event, {
      user,
      loggedInAt: new Date(),
    })

    return await getUserSession(event)
  }
  catch (error) {
    console.error('Registration error:', error)

    return createError({
      statusCode: 500,
      statusMessage: 'An error occurred during registration',
    })
  }
})
