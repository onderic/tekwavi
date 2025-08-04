import mongoose from 'mongoose'
import { Expense } from '~~/server/models/Expenses'
import { purgeAnalyticsCache } from '~~/server/utils/cacheUtils'
import { UserRole } from '~~/shared/enums/roles'

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
      statusMessage: 'Access denied. You do not have permission to update expenses.',
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const expenseId = getRouterParam(event, 'id')
    const body = await readBody(event)

    const expense = await Expense.findById(expenseId).session(session)
    if (!expense) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Expense not found',
      })
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      expenseId,
      {
        title: body.title?.trim(),
        description: body.description?.trim() || null,
        amount: Number(body.amount),
        category: body.category?.trim(),
        date: body.date ? new Date(body.date) : expense.date,
        paymentMethod: body.paymentMethod?.trim() || 'cash',
        updatedAt: new Date(),
      },
      {
        new: true,
        session,
      },
    )

    await session.commitTransaction()

    await purgeAnalyticsCache(expense.propertyId.toString())

    return {
      success: true,
      message: 'Expense updated successfully',
      expense: updatedExpense,
    }
  }
  catch (error: any) {
    await session.abortTransaction()

    console.error('Error updating expense:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update expense',
      data: error,
    })
  }
  finally {
    session.endSession()
  }
})
