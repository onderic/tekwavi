import mongoose from 'mongoose'
import { UserRole } from '~~/shared/enums/roles'
import { canPerform } from '~~/server/utils/roles'
import { Property } from '~~/server/models/Property'
import { Floor } from '~~/server/models/Property/Floor'
import { Unit } from '~~/server/models/Property/Unit'
import { User } from '~~/server/models/User'
import { BillingInvoice } from '~~/server/models/Billing/BillingInvoice'
import { purgeAnalyticsCache } from '~~/server/utils/cacheUtils'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const propertyId = event.context.params?.id

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'delete', 'propertyManagement:property')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to delete properties.',
    })
  }

  if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid property ID',
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const property = await Property.findById(propertyId).session(session)

    if (!property) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Property not found',
      })
    }

    const deletedInvoices = await BillingInvoice.deleteMany({ propertyId }, { session })
    console.log(`Deleted ${deletedInvoices.deletedCount} billing invoices for property`)

    // Delete floors and units
    const floors = await Floor.find({ propertyId }, null, { session })
    const floorIds = floors.map(f => f._id)

    const deletedUnits = await Unit.deleteMany({ floorId: { $in: floorIds } }, { session })
    console.log(`Deleted ${deletedUnits.deletedCount} units`)

    const deletedFloors = await Floor.deleteMany({ propertyId }, { session })
    console.log(`Deleted ${deletedFloors.deletedCount} floors`)

    // Delete the property itself
    const deletedProperty = await Property.findByIdAndDelete(propertyId, { session })

    if (!deletedProperty) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Property not found',
      })
    }

    // If the user is a developer, remove property from their owned properties list
    if (user.role === UserRole.DEVELOPER) {
      await User.findByIdAndUpdate(
        user._id,
        { $pull: { ownedProperties: propertyId } },
        { session },
      )
    }

    await session.commitTransaction()

    await purgeAnalyticsCache(propertyId)

    return {
      success: true,
      message: 'Property and all related data deleted successfully',
      deletedData: {
        property: deletedProperty.propertyName,
        floors: deletedFloors.deletedCount,
        units: deletedUnits.deletedCount,
        invoices: deletedInvoices.deletedCount,
      },
    }
  }
  catch (error: any) {
    await session.abortTransaction()
    console.error('Error deleting property:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to delete property',
    })
  }
  finally {
    await session.endSession()
  }
})
