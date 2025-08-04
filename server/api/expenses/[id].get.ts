import mongoose from 'mongoose'
import { Expense } from '~~/server/models/Expenses'
import { Property } from '~~/server/models/Property'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  // if (!user.role || !canPerform(user.role as UserRole, 'read', 'ExpenseManagement:expense')) {
  //   throw createError({
  //     statusCode: 403,
  //     statusMessage: 'Access denied. You do not have permission to view expenses.',
  //   })
  // }

  try {
    const propertyId = event.context.params?.id

    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid property ID is required',
      })
    }

    const property = await Property.findById(propertyId)
    if (!property) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Property not found',
      })
    }

    const query = getQuery(event)

    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 10, 50)
    const skip = (page - 1) * limit

    const searchQuery = query.search as string
    const category = query.category as string
    const dateFilter = query.dateFilter as string
    const startDate = query.startDate as string
    const endDate = query.endDate as string

    const filter: any = { propertyId }

    if (searchQuery) {
      filter.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { expenseNumber: { $regex: searchQuery, $options: 'i' } },
      ]
    }

    if (category) {
      filter.category = category
    }

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }
    else if (dateFilter) {
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth()

      switch (dateFilter) {
        case 'this_month':
          filter.date = {
            $gte: new Date(currentYear, currentMonth, 1),
            $lte: new Date(currentYear, currentMonth + 1, 0),
          }
          break
        case 'last_month':
          filter.date = {
            $gte: new Date(currentYear, currentMonth - 1, 1),
            $lte: new Date(currentYear, currentMonth, 0),
          }
          break
        case 'this_quarter': {
          const quarter = Math.floor(currentMonth / 3)
          filter.date = {
            $gte: new Date(currentYear, quarter * 3, 1),
            $lte: new Date(currentYear, (quarter + 1) * 3, 0),
          }
          break
        }
        case 'this_year':
          filter.date = {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31),
          }
          break
      }
    }

    const total = await Expense.countDocuments(filter)

    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'first_name last_name email')
      .lean()

    return {
      expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }
  catch (error: any) {
    console.error('Error fetching expenses:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch expenses',
    })
  }
})
