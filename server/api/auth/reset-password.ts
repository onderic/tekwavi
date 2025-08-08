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

  // Use aggregation to get user with populated properties data
  const [updatedDbUser] = await UserModel.aggregate([
    {
      $match: { _id: dbUser._id },
    },
    {
      $lookup: {
        from: 'properties',
        localField: 'ownedProperties',
        foreignField: '_id',
        as: 'ownedPropertiesData',
        pipeline: [
          {
            $project: {
              _id: 1,
              propertyName: 1,
              categoryName: 1,
              logo: 1,
              address: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'properties',
        localField: 'assignedProperty',
        foreignField: '_id',
        as: 'assignedPropertyData',
        pipeline: [
          {
            $project: {
              _id: 1,
              propertyName: 1,
              categoryName: 1,
              logo: 1,
              address: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'units',
        localField: 'ownedUnits',
        foreignField: '_id',
        as: 'ownedUnitsData',
        pipeline: [
          {
            $lookup: {
              from: 'properties',
              localField: 'propertyId',
              foreignField: '_id',
              as: 'property',
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    propertyName: 1,
                    categoryName: 1,
                    logo: 1,
                    address: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: '$property',
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'units',
        localField: 'rentedUnits',
        foreignField: '_id',
        as: 'rentedUnitsData',
        pipeline: [
          {
            $lookup: {
              from: 'properties',
              localField: 'propertyId',
              foreignField: '_id',
              as: 'property',
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    propertyName: 1,
                    categoryName: 1,
                    logo: 1,
                    address: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: '$property',
          },
        ],
      },
    },
  ])

  if (!updatedDbUser) {
    return createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve updated user.',
    })
  }

  let properties: any[] = []

  if (updatedDbUser.role === 'developer') {
    properties = updatedDbUser.ownedPropertiesData || []
  }
  else if (updatedDbUser.role === 'caretaker') {
    properties = updatedDbUser.assignedPropertyData || []
  }
  else if (updatedDbUser.role === 'unit_owner' || updatedDbUser.role === 'tenant') {
    const unitProperties = [
      ...(updatedDbUser.ownedUnitsData?.map((unit: any) => unit.property) || []),
      ...(updatedDbUser.rentedUnitsData?.map((unit: any) => unit.property) || []),
    ]

    const uniquePropertiesMap = new Map()
    unitProperties.forEach((prop) => {
      if (prop && prop._id) {
        uniquePropertiesMap.set(prop._id.toString(), prop)
      }
    })
    properties = Array.from(uniquePropertiesMap.values())
  }

  const formattedProperties = properties.map(property => ({
    id: property._id.toString(),
    name: property.propertyName,
    logo: property.logo || null,
    address: `${property.address.street}, ${property.address.city}, ${property.address.state} ${property.address.postalCode}`,
  }))

  const user: User = {
    _id: updatedDbUser._id.toString(),
    first_name: updatedDbUser.first_name || '',
    last_name: updatedDbUser.last_name || '',
    email: updatedDbUser.email || '',
    role: updatedDbUser.role,
    phone: updatedDbUser.phone || '',
    createdAt: updatedDbUser.createdAt,
    updatedAt: updatedDbUser.updatedAt,
    lastLogin: updatedDbUser.lastLogin,
    isActive: updatedDbUser.isActive,
    isVerified: updatedDbUser.isVerified,
    address: updatedDbUser.address,
    ownedProperties: updatedDbUser.ownedProperties || [],
    ownedUnits: updatedDbUser.ownedUnits || [],
    rentedUnits: updatedDbUser.rentedUnits || [],
    assignedProperty: updatedDbUser.assignedProperty || null,
    tempPasswordExpiry: updatedDbUser.tempPasswordExpiry || null,
    tempPasswordUsed: updatedDbUser.tempPasswordUsed || false,
    tempPasswordVerifiedAt: updatedDbUser.tempPasswordVerifiedAt || null,
    properties: formattedProperties,
  }

  await clearUserSession(event)

  await setUserSession(event, {
    user,
    loggedInAt: new Date(),
  })

  return await getUserSession(event)
})