import mongoose from 'mongoose'
import type { UserRole } from '~~/shared/enums/roles'
import { Invoice } from '~~/server/models/Invoice'
import { Unit } from '~~/server/models/Property/Unit'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'read', 'financialManagement:invoice_view')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to view invoices.',
    })
  }

  const query = getQuery(event)
  const unitId = query.unitId as string
  const year = query.year ? parseInt(query.year as string) : new Date().getFullYear()
  const month = query.month ? parseInt(query.month as string) : undefined

  if (!unitId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unit ID is required',
    })
  }

  try {
    // Verify unit exists
    const unit = await Unit.findById(unitId)
    if (!unit) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Unit not found',
      })
    }

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1 // 1-12
    const currentYear = currentDate.getFullYear()

    // Build match stage for filtering
    const matchStage: Record<string, any> = {
      'unitId': new mongoose.Types.ObjectId(unitId),
      'paymentFor.year': year,
    }

    if (month && !isNaN(month)) {
      matchStage['paymentFor.month'] = month
    }

    const results = await Invoice.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          // Use the actual status field from the database, but fall back to computed status if not set
          finalStatus: {
            $cond: {
              if: { $ne: ['$status', null] },
              then: '$status',
              else: {
                $cond: {
                  if: '$isPaid',
                  then: 'paid',
                  else: {
                    $cond: {
                      if: {
                        $or: [
                          { $lt: ['$paymentFor.year', currentYear] },
                          {
                            $and: [
                              { $eq: ['$paymentFor.year', currentYear] },
                              { $lt: ['$paymentFor.month', currentMonth] },
                            ],
                          },
                        ],
                      },
                      then: 'overdue',
                      else: {
                        $cond: {
                          if: {
                            $and: [
                              { $eq: ['$paymentFor.year', currentYear] },
                              { $eq: ['$paymentFor.month', currentMonth] },
                            ],
                          },
                          then: 'due',
                          else: 'upcoming',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $sort: {
          'paymentFor.year': -1,
          'paymentFor.month': -1,
          'paymentDate': -1,
        },
      },
      {
        $facet: {
          invoices: [
            { $match: { $expr: { $eq: ['$finalStatus', 'paid'] } } }, // Only paid invoices in the invoices array
            {
              $project: {
                _id: 1,
                invoiceNumber: 1,
                receiptNumber: 1,
                invoiceType: 1,
                unitNumber: 1,
                tenantId: 1,
                tenantName: 1,
                amount: 1, // Base rent amount
                totalAmount: 1, // Total including service charges
                serviceCharges: 1, // Array of service charges
                totalServiceCharges: 1, // Total of all service charges
                isPaid: 1,
                paymentMethod: 1,
                paymentReferenceId: 1,
                phoneNumber: 1,
                paymentDate: 1,
                dueDate: 1,
                isLate: 1,
                paymentFor: 1, // Include full paymentFor object
                status: '$finalStatus', // Use the computed final status
                recordedBy: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          monthlyBreakdown: [
            {
              $group: {
                _id: '$paymentFor.month',
                monthName: { $first: '$paymentFor.monthName' },
                paid: { $sum: { $cond: [{ $eq: ['$finalStatus', 'paid'] }, 1, 0] } },
                unpaid: { $sum: { $cond: [{ $ne: ['$finalStatus', 'paid'] }, 1, 0] } },
                totalRentAmount: { $sum: '$amount' }, // Total rent only
                totalServiceCharges: { $sum: '$totalServiceCharges' }, // Total service charges
                totalAmount: { $sum: '$totalAmount' }, // Grand total
                averageServiceCharges: { $avg: '$totalServiceCharges' },
                invoiceCount: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          yearSummary: [
            {
              $group: {
                _id: null,
                totalInvoices: { $sum: 1 },
                paidInvoices: { $sum: { $cond: [{ $eq: ['$finalStatus', 'paid'] }, 1, 0] } },
                totalRentCollected: { $sum: '$amount' },
                totalServiceChargesCollected: { $sum: '$totalServiceCharges' },
                totalAmountCollected: { $sum: '$totalAmount' },
                paymentMethods: {
                  $push: {
                    $cond: [
                      { $ne: ['$paymentMethod', ''] },
                      '$paymentMethod',
                      null,
                    ],
                  },
                },
                latePayments: { $sum: { $cond: [{ $eq: ['$isLate', true] }, 1, 0] } },
              },
            },
            {
              $project: {
                _id: 0,
                totalInvoices: 1,
                paidInvoices: 1,
                totalRentCollected: 1,
                totalServiceChargesCollected: 1,
                totalAmountCollected: 1,
                latePayments: 1,
                paymentMethods: {
                  $reduce: {
                    input: '$paymentMethods',
                    initialValue: {
                      cash: 0,
                      mpesa: 0,
                      bank_transfer: 0,
                      cheque: 0,
                      card: 0,
                    },
                    in: {
                      cash: {
                        $cond: [
                          { $eq: ['$$this', 'cash'] },
                          { $add: ['$$value.cash', 1] },
                          '$$value.cash',
                        ],
                      },
                      mpesa: {
                        $cond: [
                          { $eq: ['$$this', 'mpesa'] },
                          { $add: ['$$value.mpesa', 1] },
                          '$$value.mpesa',
                        ],
                      },
                      bank_transfer: {
                        $cond: [
                          { $eq: ['$$this', 'bank_transfer'] },
                          { $add: ['$$value.bank_transfer', 1] },
                          '$$value.bank_transfer',
                        ],
                      },
                      cheque: {
                        $cond: [
                          { $eq: ['$$this', 'cheque'] },
                          { $add: ['$$value.cheque', 1] },
                          '$$value.cheque',
                        ],
                      },
                      card: {
                        $cond: [
                          { $eq: ['$$this', 'card'] },
                          { $add: ['$$value.card', 1] },
                          '$$value.card',
                        ],
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      },
    ])

    const result = results[0] || {
      invoices: [],
      monthlyBreakdown: [],
      yearSummary: [],
    }

    return {
      success: true,
      invoices: result.invoices,
      monthlyBreakdown: result.monthlyBreakdown,
      yearSummary: result.yearSummary[0] || {
        totalInvoices: 0,
        paidInvoices: 0,
        totalRentCollected: 0,
        totalServiceChargesCollected: 0,
        totalAmountCollected: 0,
        latePayments: 0,
        paymentMethods: {
          cash: 0,
          mpesa: 0,
          bank_transfer: 0,
          cheque: 0,
          card: 0,
        },
      },
      filterApplied: 'paid',
      year,
      month,
    }
  }
  catch (error: any) {
    console.error('Error fetching invoices:', error)

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch invoices',
    })
  }
})
