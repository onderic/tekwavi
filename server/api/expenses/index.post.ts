import mongoose from 'mongoose'
import { Expense } from '~~/server/models/Expenses'
import { Property } from '~~/server/models/Property'
import { UserRole } from '~~/shared/enums/roles'
import { purgeAnalyticsCache } from '~~/server/utils/cacheUtils'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || (user.role !== UserRole.DEVELOPER && user.role !== UserRole.ADMIN && user.role !== UserRole.CARETAKER)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to create expenses.',
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const body = await readBody(event)

    const property = await Property.findById(body.propertyId).session(session)
    if (!property) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Property not found',
      })
    }

    // Authorization check
    if (user.role !== UserRole.ADMIN) {
      const isOwner = Array.isArray(user.ownedProperties) && user.ownedProperties.includes(body.propertyId)
      const isAssigned = user.assignedProperty && (
        user.assignedProperty === body.propertyId
        || user.assignedProperty === body.propertyId
        || user.assignedProperty.toString() === body.propertyId
      )

      if (!isOwner && !isAssigned) {
        throw createError({
          statusCode: 403,
          statusMessage: 'You do not have access to this property',
        })
      }
    }

    const today = new Date()
    const year = today.getFullYear().toString().substring(2)
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const propertyPrefix = property.propertyName.substring(0, 3).toUpperCase()

    const expenseCount = await Expense.countDocuments({
      propertyId: property._id,
      createdAt: {
        $gte: new Date(today.getFullYear(), today.getMonth(), 1),
        $lt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
      },
    }).session(session)

    const sequence = (expenseCount + 1).toString().padStart(3, '0')
    const expenseNumber = `EXP-${propertyPrefix}-${year}${month}-${sequence}`

    const expense = new Expense({
      title: body.title.trim(),
      description: body.description?.trim() || null,
      amount: Number(body.amount),
      category: body.category.trim(),
      date: body.date ? new Date(body.date) : today,
      propertyId: property._id,
      propertyName: property.propertyName,
      createdBy: user._id,
      expenseNumber,
      paymentMethod: body.paymentMethod?.trim() || 'cash',
    })

    const savedExpense = await expense.save({ session })

    await session.commitTransaction()

    await purgeAnalyticsCache(property._id.toString())

    return {
      success: true,
      message: 'Expense recorded successfully',
      expense: savedExpense,
    }
  }
  catch (error: any) {
    await session.abortTransaction()

    console.error('Error recording expense:', error)

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

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to record expense',
      data: error,
    })
  }
  finally {
    session.endSession()
  }
})
