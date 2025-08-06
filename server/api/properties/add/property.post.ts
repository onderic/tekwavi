import mongoose from 'mongoose'
import type { User } from '#auth-utils'
import { UserRole } from '~~/shared/enums/roles'
import { canPerform } from '~~/server/utils/roles'
import { Property } from '~~/server/models/Property'
import { Floor } from '~~/server/models/Property/Floor'
import { User as UserModel } from '~~/server/models/User'
import { createOrUpdateDeveloperBilling } from '~~/server/utils/billing'
import { purgeAnalyticsCache } from '~~/server/utils/cacheUtils'
import { handleLogoUpload } from '~~/server/utils/fileUpload'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'create', 'propertyManagement:property')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to create properties.',
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const contentType = getHeader(event, 'content-type') || ''
    let propertyData
    let logoUrl = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await readMultipartFormData(event)

      if (!formData) {
        throw createError({
          statusCode: 400,
          statusMessage: 'No form data provided',
        })
      }

      const uploadResult = await handleLogoUpload(formData)
      propertyData = uploadResult.data
      logoUrl = uploadResult.logoUrl
    }
    else {
      propertyData = await readBody(event)
    }

    if (!propertyData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Property data is required',
      })
    }

    const { floorCount, ...restPropertyData } = propertyData

    if (floorCount === undefined || floorCount === null || floorCount < 0 || floorCount > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Floor count must be between 0 and 100',
      })
    }

    const property = new Property({
      ...restPropertyData,
      logo: logoUrl,
      createdBy: user._id,
    })

    await property.validate()
    const savedProperty = await property.save({ session })

    const floors = []
    if (floorCount === 0) {
      floors.push({
        floorNumber: 0,
        propertyId: savedProperty._id,
      })
    }
    else {
      for (let i = 0; i < floorCount; i++) {
        floors.push({
          floorNumber: i,
          propertyId: savedProperty._id,
        })
      }
    }

    const savedFloors = await Floor.insertMany(floors, { session })

    let billingResult = null
    if (user.role === UserRole.DEVELOPER) {
      await UserModel.findByIdAndUpdate(
        user._id,
        { $addToSet: { ownedProperties: savedProperty._id } },
        { session },
      )

      billingResult = await createOrUpdateDeveloperBilling(
        user._id.toString(),
        savedProperty._id.toString(),
        savedProperty.propertyName,
        session,
      )
    }

    await session.commitTransaction()

    const currentSession = await getUserSession(event)

    const newProperty = {
      id: savedProperty._id.toString(),
      name: savedProperty.propertyName,
      logo: savedProperty.logo || null,
      address: `${savedProperty.address.street}, ${savedProperty.address.city}, ${savedProperty.address.state} ${savedProperty.address.postalCode}`,
    }

    const updatedUser: User = {
      ...user,
      properties: [...(user.properties || []), newProperty],
      ownedProperties: [...(user.ownedProperties || []), savedProperty._id.toString()],
    }

    await replaceUserSession(event, {
      user: updatedUser,
      loggedInAt: currentSession.loggedInAt,
    })

    await purgeAnalyticsCache(savedProperty._id.toString())

    return {
      success: true,
      message: `Property created successfully with ${floorCount} floors${billingResult ? ` and consolidated billing updated for ${billingResult.year}` : ''}`,
      property: {
        _id: savedProperty._id,
        propertyName: savedProperty.propertyName,
        categoryName: savedProperty.categoryName,
        address: savedProperty.address,
        logo: savedProperty.logo,
        floors: savedFloors.map(floor => ({
          _id: floor._id,
          floorNumber: floor.floorNumber,
          propertyId: floor.propertyId,
          units: [],
        })),
        stats: {
          totalFloors: floorCount,
          totalUnits: 0,
          occupiedUnits: 0,
          vacantUnits: 0,
          occupancyRate: '0%',
          vacancyRate: '100%',
        },
        createdAt: savedProperty.createdAt,
        updatedAt: savedProperty.updatedAt,
      },
    }
  }
  catch (error: any) {
    await session.abortTransaction()

    if (error.statusCode) {
      throw error
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message).join(', ')
      throw createError({
        statusCode: 400,
        statusMessage: `Validation failed: ${messages}`,
      })
    }

    if (error.code === 11000) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A property with this name already exists',
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create property',
    })
  }
  finally {
    await session.endSession()
  }
})
