import mongoose from 'mongoose'
import type { UserRole } from '~~/shared/enums/roles'
import { ServiceFee } from '~~/server/models/ServiceFee'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'update', 'propertyManagement:property')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to update service fees.',
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const body = await readBody(event)
    const { propertyId, fees } = body

    const updatedFees = []
    const errors = []

    // Update each fee
    for (const feeUpdate of fees) {
      try {
        const serviceFee = await ServiceFee.findOneAndUpdate(
          {
            _id: feeUpdate._id,
            propertyId: propertyId,
          },
          {
            monthlyFee: feeUpdate.monthlyFee,
            updatedAt: new Date(),
          },
          {
            new: true,
            session,
          },
        )

        if (serviceFee) {
          updatedFees.push({
            _id: serviceFee._id,
            unitType: serviceFee.unitType,
            monthlyFee: serviceFee.monthlyFee,
          })
        }
        else {
          errors.push(`Fee ${feeUpdate._id} not found or doesn't belong to this property`)
        }
      }
      catch (error: any) {
        errors.push(`Error updating fee ${feeUpdate._id}: ${error.message}`)
      }
    }

    if (updatedFees.length === 0 && errors.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: errors.join(', '),
      })
    }

    await session.commitTransaction()

    return {
      success: true,
      message: `${updatedFees.length} service fee(s) updated successfully`,
      data: {
        updated: updatedFees.length,
        fees: updatedFees,
        errors: errors.length > 0 ? errors : undefined,
      },
      updatedBy: {
        _id: user._id,
        name: `${user.first_name} ${user.last_name || ''}`.trim(),
        timestamp: new Date().toISOString(),
      },
    }
  }
  catch (error: any) {
    await session.abortTransaction()

    console.error('Error updating service fees:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update service fees',
      data: error,
    })
  }
  finally {
    session.endSession()
  }
})
