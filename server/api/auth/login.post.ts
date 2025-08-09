import type { User } from '#auth-utils'
import { User as UserModel } from '~~/server/models/User'

export default defineEventHandler(async (event) => {
  const { phone, password } = await readBody(event)

  const [dbUser] = await UserModel.aggregate([
    {
      $match: { phone },
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
              status: 1,
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
              status: 1,
              createdBy: 1, // Include property owner info
            },
          },
        ],
      },
    },
    // ...existing unit lookups...
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

  if (!dbUser) {
    console.log('❌ User not found')
    throw createError({
      statusCode: 400,
      statusMessage: 'Please check your phone number and password.',
    })
  }

  const isAuthenticated = await verifyPassword(dbUser.password, password)

  if (!isAuthenticated) {
    console.log('❌ Password verification failed')
    throw createError({
      statusCode: 400,
      statusMessage: 'Please check your phone number and password.',
    })
  }

  // Extract properties based on user role
  let properties: any[] = []

  if (dbUser.role === 'developer') {
    properties = dbUser.ownedPropertiesData || []
  }
  else if (dbUser.role === 'caretaker') {
    properties = dbUser.assignedPropertyData || []
  }
  else if (dbUser.role === 'unit_owner' || dbUser.role === 'tenant') {
    const unitProperties = [
      ...(dbUser.ownedUnitsData?.map((unit: any) => unit.property) || []),
      ...(dbUser.rentedUnitsData?.map((unit: any) => unit.property) || []),
    ]

    const uniquePropertiesMap = new Map()
    unitProperties.forEach((prop) => {
      if (prop && prop._id) {
        uniquePropertiesMap.set(prop._id.toString(), prop)
      }
    })
    properties = Array.from(uniquePropertiesMap.values())
  }

  // Format properties
  const formattedProperties = properties.map(property => ({
    id: property._id.toString(),
    name: property.propertyName,
    logo: property.logo || null,
    address: `${property.address.street}, ${property.address.city}, ${property.address.state} ${property.address.postalCode}`,
  }))
  
  const user: User = {
    _id: dbUser._id.toString(),
    first_name: dbUser.first_name || '',
    last_name: dbUser.last_name || '',
    email: dbUser.email || '',
    role: dbUser.role,
    phone: dbUser.phone || '',
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
    lastLogin: dbUser.lastLogin,
    isActive: dbUser.isActive,
    isVerified: dbUser.isVerified,
    address: dbUser.address,
    ownedProperties: dbUser.ownedProperties || [],
    ownedUnits: dbUser.ownedUnits || [],
    rentedUnits: dbUser.rentedUnits || [],
    assignedProperty: dbUser.assignedProperty || null,
    tempPasswordExpiry: dbUser.tempPasswordExpiry || null,
    tempPasswordUsed: dbUser.tempPasswordUsed || false,
    tempPasswordVerifiedAt: dbUser.tempPasswordVerifiedAt || null,
    properties: formattedProperties,
  }

  await UserModel.findByIdAndUpdate(user._id, {
    lastLogin: new Date(),
  })

  await setUserSession(event, {
    user,
    loggedInAt: new Date(),
  })

  return await getUserSession(event)
})