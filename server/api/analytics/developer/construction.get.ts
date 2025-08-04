import mongoose from 'mongoose'
import { Property } from '~~/server/models/Property'
import { Invoice } from '~~/server/models/Invoice'
import { Expense } from '~~/server/models/Expenses'
import type { UserRole } from '~~/shared/enums/roles'
import { canPerform } from '~~/server/utils/roles'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'read', 'propertyManagement:Developer')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to view construction analytics.',
    })
  }

  try {
    const query = getQuery(event)
    const propertyId = query.propertyId as string

    if (!propertyId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Property ID is required',
      })
    }

    const property = await Property.findById(propertyId)
    if (!property) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Property not found',
      })
    }

    // Get construction cost data
    const constructionCost = property.constructionCost || {} as any
    const totalEstimatedCost = constructionCost.totalEstimatedCost || 0
    const actualCostIncurred = constructionCost.actualCostIncurred || 0
    const isExistingProperty = constructionCost.isExistingProperty || false

    // Calculate total revenue from paid invoices
    const revenueAggregation = await Invoice.aggregate([
      {
        $match: {
          propertyId: new mongoose.Types.ObjectId(propertyId),
          status: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalServiceCharges: { $sum: '$totalServiceCharges' },
          totalInvoices: { $sum: 1 },
        },
      },
    ])

    const revenueStats = revenueAggregation[0] || {
      totalRevenue: 0,
      totalServiceCharges: 0,
      totalInvoices: 0,
    }

    const totalRevenue = revenueStats.totalRevenue + revenueStats.totalServiceCharges

    // Calculate total disbursements to unit owners
    const disbursementAggregation = await Invoice.aggregate([
      {
        $match: {
          'propertyId': new mongoose.Types.ObjectId(propertyId),
          'disbursement.isDisbursed': true,
        },
      },
      {
        $group: {
          _id: null,
          totalDisbursed: { $sum: '$disbursement.netDisbursedAmount' },
          totalServiceFees: { $sum: '$disbursement.serviceFeeAmount' },
          disbursedInvoices: { $sum: 1 },
        },
      },
    ])

    const disbursementStats = disbursementAggregation[0] || {
      totalDisbursed: 0,
      totalServiceFees: 0,
      disbursedInvoices: 0,
    }

    // Calculate pending disbursements (paid but not disbursed)
    const pendingDisbursementAggregation = await Invoice.aggregate([
      {
        $match: {
          'propertyId': new mongoose.Types.ObjectId(propertyId),
          'status': 'paid',
          'disbursement.isDisbursed': false,
        },
      },
      {
        $group: {
          _id: null,
          pendingDisbursements: { $sum: '$amount' },
          pendingServiceCharges: { $sum: '$totalServiceCharges' },
          pendingInvoices: { $sum: 1 },
        },
      },
    ])

    const pendingStats = pendingDisbursementAggregation[0] || {
      pendingDisbursements: 0,
      pendingServiceCharges: 0,
      pendingInvoices: 0,
    }

    // Calculate total operational expenses
    const expenseAggregation = await Expense.aggregate([
      {
        $match: {
          propertyId: new mongoose.Types.ObjectId(propertyId),
        },
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          expenseCount: { $sum: 1 },
        },
      },
    ])

    const expenseStats = expenseAggregation[0] || {
      totalExpenses: 0,
      expenseCount: 0,
    }

    // Calculate net profit/loss
    const totalCosts = actualCostIncurred + expenseStats.totalExpenses
    const netProfit = totalRevenue - totalCosts - disbursementStats.totalDisbursed
    const grossProfit = totalRevenue - totalCosts

    // Calculate ROI if we have construction cost
    let roi = 0
    let roiPercentage = '0.0'
    if (actualCostIncurred > 0) {
      roi = ((totalRevenue - totalCosts) / actualCostIncurred) * 100
      roiPercentage = roi.toFixed(1)
    }

    // Calculate payback period (months)
    let paybackMonths = 0
    if (totalRevenue > 0) {
      const monthlyAverage = totalRevenue / Math.max(1, revenueStats.totalInvoices / 12) // Rough estimate
      if (monthlyAverage > 0) {
        paybackMonths = Math.ceil(actualCostIncurred / monthlyAverage)
      }
    }

    // Calculate construction cost vs budget variance
    const budgetVariance = totalEstimatedCost > 0
      ? ((actualCostIncurred - totalEstimatedCost) / totalEstimatedCost) * 100
      : 0

    const budgetVarianceStatus = budgetVariance > 10 ? 'over' : budgetVariance < -10 ? 'under' : 'on_track'

    return {
      analytics: {
        // Construction costs
        totalEstimatedCost,
        actualCostIncurred,
        budgetVariance: budgetVariance.toFixed(1),
        budgetVarianceStatus,
        isExistingProperty,
        constructionStatus: constructionCost.constructionStatus || 'completed',
        constructionStartDate: constructionCost.constructionStartDate || null,
        constructionEndDate: constructionCost.constructionEndDate || null,

        // Revenue metrics
        totalRevenue,
        grossRevenue: revenueStats.totalRevenue,
        totalServiceCharges: revenueStats.totalServiceCharges,
        totalInvoices: revenueStats.totalInvoices,

        // Disbursements
        totalDisbursed: disbursementStats.totalDisbursed,
        totalServiceFees: disbursementStats.totalServiceFees,
        disbursedInvoices: disbursementStats.disbursedInvoices,

        // Pending disbursements
        pendingDisbursements: pendingStats.pendingDisbursements,
        pendingServiceCharges: pendingStats.pendingServiceCharges,
        pendingInvoices: pendingStats.pendingInvoices,

        // Expenses
        totalOperationalExpenses: expenseStats.totalExpenses,
        expenseCount: expenseStats.expenseCount,

        // Profitability
        netProfit,
        grossProfit,
        roi: roiPercentage,
        paybackMonths,

        // Property info
        propertyName: property.propertyName,
        propertyId: property._id,
        currency: constructionCost.currency || 'KES',
        lastUpdated: constructionCost.lastUpdated || property.updatedAt,
      },
    }
  }
  catch (error: any) {
    console.error('Error fetching construction analytics:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch construction analytics',
    })
  }
})
