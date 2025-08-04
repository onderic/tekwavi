import mongoose from 'mongoose'
import { Maintenance } from '~~/server/models/Maintenance'
import { Property } from '~~/server/models/Property'
import { purgeAnalyticsCache } from '~~/server/utils/cacheUtils'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const requestData = await readBody(event)

    if (!requestData.propertyId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Property ID is required',
      })
    }

    const property = await Property.findById(requestData.propertyId).session(session)
    if (!property) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Property not found',
      })
    }

    const currentYear = new Date().getFullYear()
    const maintenanceCount = await Maintenance.countDocuments()
    const maintenanceNumber = `M-${currentYear}-${String(maintenanceCount + 1).padStart(4, '0')}`

    const maintenance = new Maintenance({
      maintenanceNumber,
      title: requestData.title,
      description: requestData.description,
      category: requestData.category,
      priority: requestData.priority,
      status: 'pending',
      propertyId: requestData.propertyId,
      propertyName: property.propertyName || requestData.propertyName,
      floorId: requestData.floorId || null,
      unitId: requestData.unitId || null,
      unitNumber: requestData.unitNumber || null,
      requestedBy: user._id,
      requestedByName: requestData.requestedByName || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      submittedDate: new Date(),
      notes: [{
        text: 'Maintenance request submitted',
        addedBy: user._id,
        addedByName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        date: new Date(),
      }],
    })

    const savedMaintenance = await maintenance.save({ session })

    await purgeAnalyticsCache(property._id.toString())

    await session.commitTransaction()

    return {
      success: true,
      message: 'Maintenance request submitted successfully',
      maintenance: savedMaintenance,
      maintenanceNumber,
    }
  }
  catch (error: any) {
    await session.abortTransaction()

    console.error('Error creating maintenance request:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create maintenance request',
    })
  }
  finally {
    session.endSession()
  }
})
