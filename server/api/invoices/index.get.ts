import mongoose from 'mongoose'
import { Invoice } from '~~/server/models/Invoice'
import type { UserRole } from '~~/shared/enums/roles'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'create', 'financialManagement:expense_create')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to create expenses.',
    })
  }

  try {
    const query = getQuery(event)

    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const skip = (page - 1) * limit

    const search = query.search as string || ''
    const status = query.status as string || ''
    const month = query.month ? parseInt(query.month as string) : null
    const year = query.year ? parseInt(query.year as string) : null
    const propertyId = query.propertyId as string

    const baseFilter: any = {
      status: { $ne: 'draft' },
    }

    if (['developer', 'admin'].includes(user.role as string)) {
      if (propertyId) {
        baseFilter.propertyId = new mongoose.Types.ObjectId(propertyId)
      }
    }

    if (search) {
      baseFilter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { tenantName: { $regex: search, $options: 'i' } },
        { unitNumber: { $regex: search, $options: 'i' } },
        { propertyName: { $regex: search, $options: 'i' } },
      ]
    }

    // Apply month/year filters to base filter if provided
    if (month !== null) {
      baseFilter['paymentFor.month'] = month
    }

    if (year !== null) {
      baseFilter['paymentFor.year'] = year
    }

    const fullFilter = { ...baseFilter }

    if (status) {
      fullFilter.status = status
    }

    // Current date information for this month stats
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    const statsResult = await Invoice.aggregate([
      {
        $facet: {
          paginationData: [
            { $match: fullFilter },
            { $count: 'total' },
          ],

          invoices: [
            { $match: fullFilter },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $addFields: {
                totalAmount: { $ifNull: ['$totalAmount', '$amount'] },
                totalServiceCharges: { $ifNull: ['$totalServiceCharges', 0] },
              },
            },
          ],

          totalIncome: [
            {
              $match: {
                ...baseFilter,
                status: 'paid',
              },
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $ifNull: ['$totalAmount', '$amount'],
                  },
                },
              },
            },
          ],

          // This month's expected revenue (total invoiced)
          thisMonthExpectedRevenue: [
            {
              $match: {
                ...baseFilter,
                'paymentFor.month': month || currentMonth,
                'paymentFor.year': year || currentYear,
              },
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $ifNull: ['$totalAmount', '$amount'],
                  },
                },
              },
            },
          ],

          // This month's income (actual paid)
          thisMonthIncome: [
            {
              $match: {
                ...baseFilter,
                'status': 'paid',
                'paymentFor.month': month || currentMonth,
                'paymentFor.year': year || currentYear,
              },
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $ifNull: ['$totalAmount', '$amount'],
                  },
                },
              },
            },
          ],

          // Outstanding amount (invoices not paid)
          outstandingAmount: [
            {
              $match: {
                ...baseFilter,
                status: { $in: ['issued', 'draft'] },
              },
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $ifNull: ['$totalAmount', '$amount'],
                  },
                },
              },
            },
          ],

          totalInvoices: [
            { $match: baseFilter },
            { $count: 'count' },
          ],
        },
      },
    ])

    const result = statsResult[0]

    const total = result.paginationData[0]?.total || 0
    const pages = Math.ceil(total / limit)

    const invoices = result.invoices || []

    const totalIncome = result.totalIncome[0]?.total || 0
    const thisMonthExpectedRevenue = result.thisMonthExpectedRevenue[0]?.total || 0
    const thisMonthIncome = result.thisMonthIncome[0]?.total || 0
    const outstandingAmount = result.outstandingAmount[0]?.total || 0
    const totalInvoicesCount = result.totalInvoices[0]?.count || 0

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
      summary: {
        totalIncome,
        thisMonthExpectedRevenue,
        thisMonthIncome,
        outstandingAmount,
        totalInvoices: totalInvoicesCount,
        collectionRate: thisMonthExpectedRevenue > 0
          ? Math.round((thisMonthIncome / thisMonthExpectedRevenue) * 100)
          : 0,
        filters: {
          month: month || currentMonth,
          year: year || currentYear,
          propertyId: propertyId || null,
        },
      },
    }
  }
  catch (error: any) {
    console.error('Error fetching invoices:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch invoices',
      data: error,
    })
  }
})
