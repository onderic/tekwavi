import mongoose from 'mongoose'
import { Property } from '~~/server/models/Property'
import { Unit } from '~~/server/models/Property/Unit'
import { Invoice } from '~~/server/models/Invoice'
import { Expense } from '~~/server/models/Expenses'
import { Maintenance } from '~~/server/models/Maintenance'
import { Tenant } from '~~/server/models/Tenants'
import { ServiceFee } from '~~/server/models/ServiceFee'
import type { UserRole } from '~~/shared/enums/roles'
import { canPerform } from '~~/server/utils/roles'
import type { H3Event } from 'h3'
import { setResponseHeaders } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  setResponseHeaders(event, {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  })

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
      statusMessage: 'Access denied. You do not have permission to view developer analytics.',
    })
  }

  return await cachedAnalyticsHandler(event)
})

const cachedAnalyticsHandler = defineCachedEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event)
    const propertyId = query.propertyId as string
    const year = query.year ? parseInt(query.year as string) : null
    const startDate = query.startDate ? new Date(query.startDate as string) : null
    const endDate = query.endDate ? new Date(query.endDate as string) : null

    const currentDate = new Date()

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

    const units = await Unit.find({ propertyId: propertyId })
    const unitIds = units.map(unit => unit._id)

    const unitSalesQuery = await Unit.aggregate([
      {
        $match: {
          'propertyId': new mongoose.Types.ObjectId(propertyId),
          'ownership': { $exists: true },
          'ownership.isActive': { $ne: false },
          ...(startDate && endDate && { 'ownership.purchaseDate': { $gte: startDate, $lte: endDate } }),
          ...(year && {
            'ownership.purchaseDate': {
              $gte: new Date(year, 0, 1),
              $lt: new Date(year + 1, 0, 1),
            },
          }),
        },
      },
      {
        $group: {
          _id: null,
          totalSalesRevenue: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$ownership.purchaseAmount', null] }, { $gt: ['$ownership.purchaseAmount', 0] }] },
                '$ownership.purchaseAmount',
                0,
              ],
            },
          },
          unitsSold: { $sum: 1 },
          averageSalePrice: {
            $avg: {
              $cond: [
                { $and: [{ $ne: ['$ownership.purchaseAmount', null] }, { $gt: ['$ownership.purchaseAmount', 0] }] },
                '$ownership.purchaseAmount',
                null,
              ],
            },
          },
          unitsSoldByType: {
            $push: {
              type: '$type',
              purchaseAmount: { $ifNull: ['$ownership.purchaseAmount', 0] },
              purchaseDate: '$ownership.purchaseDate',
              unitNumber: '$unitNumber',
              ownerId: '$ownership.ownerId',
              ownerName: '$ownership.ownerName',
              ownershipType: '$ownership.ownershipType',
              isActive: { $ifNull: ['$ownership.isActive', true] },
            },
          },
        },
      },
    ])

    // Get maintenance costs and statistics
    const maintenanceQuery = await Maintenance.aggregate([
      {
        $match: {
          propertyId: new mongoose.Types.ObjectId(propertyId),
          status: 'completed',
          ...(startDate && endDate && { createdAt: { $gte: startDate, $lte: endDate } }),
          ...(year && {
            createdAt: {
              $gte: new Date(year, 0, 1),
              $lt: new Date(year + 1, 0, 1),
            },
          }),
        },
      },
      {
        $group: {
          _id: null,
          totalMaintenanceCost: { $sum: '$cost' },
          totalMaintenanceRequests: { $sum: 1 },
          avgMaintenanceCost: { $avg: '$cost' },
          maintenanceByCategory: {
            $push: {
              category: '$category',
              cost: '$cost',
              priority: '$priority',
            },
          },
        },
      },
    ])

    const tenantQuery = await Tenant.aggregate([
      {
        $match: {
          propertyId: new mongoose.Types.ObjectId(propertyId),
          ...(startDate && endDate && { createdAt: { $gte: startDate, $lte: endDate } }),
        },
      },
      {
        $group: {
          _id: null,
          totalTenants: { $sum: 1 },
          activeTenants: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0],
            },
          },
          averageRent: { $avg: '$rentAmount' },
          totalDeposits: { $sum: '$depositAmount' },
          totalRentPotential: { $sum: '$rentAmount' },
        },
      },
    ])

    // Get service fees breakdown
    const serviceFeeQuery = await ServiceFee.aggregate([
      {
        $match: {
          propertyId: new mongoose.Types.ObjectId(propertyId),
          ...(startDate && endDate && { createdAt: { $gte: startDate, $lte: endDate } }),
        },
      },
      {
        $group: {
          _id: null,
          totalServiceFees: { $sum: '$amount' },
          serviceFeesByType: {
            $push: {
              type: '$type',
              amount: '$amount',
              frequency: '$frequency',
            },
          },
        },
      },
    ])

    // Get unit vacancy and status statistics
    const unitStatusQuery = await Unit.aggregate([
      {
        $match: {
          propertyId: new mongoose.Types.ObjectId(propertyId),
        },
      },
      {
        $group: {
          _id: null,
          totalUnits: { $sum: 1 },
          occupiedUnits: {
            $sum: {
              $cond: [{ $eq: ['$isOccupied', true] }, 1, 0],
            },
          },
          vacantUnits: {
            $sum: {
              $cond: [{ $eq: ['$isOccupied', false] }, 1, 0],
            },
          },
          unitsByStatus: {
            $push: {
              status: '$status',
              type: '$type',
              rentAmount: '$rentAmount',
              isOccupied: '$isOccupied',
            },
          },
          totalRentPotential: { $sum: '$rentAmount' },
          averageRentPerUnit: { $avg: '$rentAmount' },
        },
      },
    ])

    // Extract query results
    const unitSalesData = unitSalesQuery[0] || {
      totalSalesRevenue: 0,
      unitsSold: 0,
      averageSalePrice: 0,
      unitsSoldByType: [],
    }
    const maintenanceData = maintenanceQuery[0] || {
      totalMaintenanceCost: 0,
      totalMaintenanceRequests: 0,
      avgMaintenanceCost: 0,
      maintenanceByCategory: [],
    }
    const tenantData = tenantQuery[0] || {
      totalTenants: 0,
      activeTenants: 0,
      averageRent: 0,
      totalDeposits: 0,
      totalRentPotential: 0,
    }
    const serviceFeeData = serviceFeeQuery[0] || {
      totalServiceFees: 0,
      serviceFeesByType: [],
    }
    const unitStatusData = unitStatusQuery[0] || {
      totalUnits: 0,
      occupiedUnits: 0,
      vacantUnits: 0,
      unitsByStatus: [],
      totalRentPotential: 0,
      averageRentPerUnit: 0,
    }

    const totalUnits = unitStatusData.totalUnits

    // Build match stage for aggregation
    const matchStage: any = {
      unitId: { $in: unitIds },
      invoiceType: 'tenant_rent',
    }

    if (year) {
      matchStage['paymentFor.year'] = year
    }

    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: startDate,
        $lte: endDate,
      }
    }

    const invoiceAggregation = await Invoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          // Paid invoices calculations
          totalRentCollected: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'paid'] },
                '$amount',
                0,
              ],
            },
          },
          totalServiceChargeCollected: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'paid'] },
                '$totalServiceCharges',
                0,
              ],
            },
          },
          // Disbursement calculations - only from disbursed invoices
          ownerDisbursements: {
            $sum: {
              $cond: [
                { $eq: ['$disbursement.isDisbursed', true] },
                '$disbursement.netDisbursedAmount',
                0,
              ],
            },
          },
          serviceFeeEarned: {
            $sum: {
              $cond: [
                { $eq: ['$disbursement.isDisbursed', true] },
                '$disbursement.serviceFeeAmount',
                0,
              ],
            },
          },
          // Outstanding calculations - only issued invoices that are due
          outstandingRent: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'issued'] },
                    { $lt: ['$dueDate', currentDate] },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },
          outstandingServiceCharges: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'issued'] },
                    { $lt: ['$dueDate', currentDate] },
                  ],
                },
                '$totalServiceCharges',
                0,
              ],
            },
          },
          // Invoice counts
          totalInvoices: { $sum: 1 },
          paidInvoices: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, 1, 0],
            },
          },
          disbursedInvoices: {
            $sum: {
              $cond: [{ $eq: ['$disbursement.isDisbursed', true] }, 1, 0],
            },
          },
          // Overdue count
          overdueCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'paid'] },
                    { $lt: ['$dueDate', currentDate] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ])

    // Extract aggregation results
    const stats = invoiceAggregation[0] || {
      totalRentCollected: 0,
      totalServiceChargeCollected: 0,
      ownerDisbursements: 0,
      serviceFeeEarned: 0,
      outstandingRent: 0,
      outstandingServiceCharges: 0,
      totalInvoices: 0,
      paidInvoices: 0,
      disbursedInvoices: 0,
      overdueCount: 0,
    }

    // Use actual values from disbursements
    const totalRentCollected = stats.totalRentCollected
    const totalServiceCharge = stats.totalServiceChargeCollected
    const ownerDisbursements = stats.ownerDisbursements
    const serviceFeeEarned = stats.serviceFeeEarned

    // Calculate service fee percentage from actual data
    const totalDisbursedAmount = ownerDisbursements + serviceFeeEarned
    const serviceFeePct = totalDisbursedAmount > 0
      ? Math.round((serviceFeeEarned / totalDisbursedAmount) * 100)
      : 10 // Default to 10% if no disbursements

    const outstandingPayments = stats.outstandingRent + stats.outstandingServiceCharges
    const collectionRate = stats.totalInvoices > 0
      ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100)
      : 0

    // Get expenses using aggregation
    const expenseMatchStage: any = {
      propertyId: new mongoose.Types.ObjectId(propertyId),
    }

    if (startDate && endDate) {
      expenseMatchStage.createdAt = {
        $gte: startDate,
        $lte: endDate,
      }
    }
    else if (year) {
      expenseMatchStage.createdAt = {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1),
      }
    }

    const expenseAggregation = await Expense.aggregate([
      { $match: expenseMatchStage },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
        },
      },
    ])

    const totalExpenses = expenseAggregation[0]?.totalExpenses || 0

    // Calculate net revenue (total collections - expenses)
    const grossRevenue = totalRentCollected + totalServiceCharge

    // Count properties with disbursements
    const disbursedPropertiesCount = stats.disbursedInvoices > 0 ? 1 : 0

    // Calculate percentage changes from previous month
    let rentCollectedChange = null
    let rentCollectedTrend = 'up' as 'up' | 'down'
    let expensesChange = null
    let expensesTrend = 'up' as 'up' | 'down'

    // Get current month and previous month dates
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    // Get current month rent collected using paymentDate
    const currentMonthInvoices = await Invoice.aggregate([
      {
        $match: {
          unitId: { $in: unitIds },
          invoiceType: 'tenant_rent',
          status: 'paid',
          paymentDate: {
            $gte: currentMonthStart,
            $lte: currentMonthEnd,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRent: { $sum: '$amount' },
        },
      },
    ])

    // Get previous month rent collected using paymentDate
    const previousMonthInvoices = await Invoice.aggregate([
      {
        $match: {
          unitId: { $in: unitIds },
          invoiceType: 'tenant_rent',
          status: 'paid',
          paymentDate: {
            $gte: previousMonthStart,
            $lte: previousMonthEnd,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRent: { $sum: '$amount' },
        },
      },
    ])

    const currentMonthRent = currentMonthInvoices[0]?.totalRent || 0
    const previousMonthRent = previousMonthInvoices[0]?.totalRent || 0

    if (previousMonthRent > 0) {
      const changePercent = ((currentMonthRent - previousMonthRent) / previousMonthRent) * 100
      rentCollectedChange = changePercent >= 0 ? `+${changePercent.toFixed(1)}` : changePercent.toFixed(1)
      rentCollectedTrend = changePercent >= 0 ? 'up' : 'down'
    }
    else if (currentMonthRent > 0) {
      rentCollectedChange = '+100.0'
      rentCollectedTrend = 'up'
    }
    else {
      rentCollectedChange = '0.0'
      rentCollectedTrend = 'up'
    }

    // Get current month expenses
    const currentMonthExpenses = await Expense.aggregate([
      {
        $match: {
          propertyId: new mongoose.Types.ObjectId(propertyId),
          createdAt: {
            $gte: currentMonthStart,
            $lte: currentMonthEnd,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ])

    // Get previous month expenses
    const previousMonthExpenses = await Expense.aggregate([
      {
        $match: {
          propertyId: new mongoose.Types.ObjectId(propertyId),
          createdAt: {
            $gte: previousMonthStart,
            $lte: previousMonthEnd,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ])

    const currentMonthExpenseTotal = currentMonthExpenses[0]?.total || 0
    const previousMonthExpenseTotal = previousMonthExpenses[0]?.total || 0

    if (previousMonthExpenseTotal > 0) {
      const changePercent = ((currentMonthExpenseTotal - previousMonthExpenseTotal) / previousMonthExpenseTotal) * 100
      expensesChange = changePercent >= 0 ? `+${changePercent.toFixed(1)}` : changePercent.toFixed(1)
      expensesTrend = changePercent >= 0 ? 'up' : 'down'
    }
    else if (currentMonthExpenseTotal > 0) {
      expensesChange = '+100.0'
      expensesTrend = 'up'
    }
    else {
      expensesChange = '0.0'
      expensesTrend = 'down'
    }

    // Get construction cost data if available
    let constructionCostData = null
    try {
      // Calculate construction cost data directly
      const constructionCost = (property as any).constructionCost || {}
      const totalEstimatedCost = constructionCost.totalEstimatedCost || 0
      const actualCostIncurred = constructionCost.actualCostIncurred || 0

      // Use totalEstimatedCost as the main construction cost
      const mainConstructionCost = totalEstimatedCost

      // Calculate net profit/loss
      const totalCosts = mainConstructionCost + totalExpenses
      const netProfit = grossRevenue - totalCosts

      // Calculate ROI if we have construction cost
      let roi = '0.0'
      if (mainConstructionCost > 0) {
        const roiValue = ((grossRevenue - totalCosts) / mainConstructionCost) * 100
        roi = roiValue.toFixed(1)
      }

      // Calculate budget variance (compare actual vs estimated)
      let budgetVariance = null
      let budgetVarianceStatus = 'on_track'
      if (totalEstimatedCost > 0) {
        const variance = ((actualCostIncurred - totalEstimatedCost) / totalEstimatedCost) * 100
        budgetVariance = variance.toFixed(1)
        budgetVarianceStatus = variance > 10 ? 'over' : variance < -10 ? 'under' : 'on_track'
      }

      constructionCostData = {
        mainConstructionCost, // This will be totalEstimatedCost
        actualCostIncurred,
        budgetVariance,
        budgetVarianceStatus,
        netProfit,
        roi,
      }
    }
    catch (error) {
      console.log('Construction cost data calculation error:', error)
    }

    // Calculate additional metrics
    const occupancyRate = totalUnits > 0
      ? Math.round((unitStatusData.occupiedUnits / totalUnits) * 100)
      : 0

    const vacancyRate = totalUnits > 0
      ? Math.round((unitStatusData.vacantUnits / totalUnits) * 100)
      : 0

    const totalPotentialRevenue = unitStatusData.totalRentPotential || 0
    const revenueEfficiency = totalPotentialRevenue > 0
      ? ((totalRentCollected / totalPotentialRevenue) * 100).toFixed(1)
      : '0.0'

    const totalMaintenanceCost = maintenanceData.totalMaintenanceCost || 0
    const totalMaintenanceRequests = maintenanceData.totalMaintenanceRequests || 0
    const avgMaintenanceCost = maintenanceData.avgMaintenanceCost || 0

    const totalDepositsCollected = tenantData.totalDeposits || 0
    const averageRentPerUnit = unitStatusData.averageRentPerUnit || 0

    const unitSalesRevenue = unitSalesData.totalSalesRevenue || 0
    const unitsSold = unitSalesData.unitsSold || 0
    const averageSalePrice = unitSalesData.averageSalePrice || 0

    const totalServiceFeesFromFees = serviceFeeData.totalServiceFees || 0

    // Calculate net profit including all revenue streams
    const totalAllRevenue = totalRentCollected + totalServiceCharge + unitSalesRevenue + totalServiceFeesFromFees + serviceFeeEarned
    const totalAllExpenses = totalExpenses + totalMaintenanceCost
    const comprehensiveNetProfit = totalAllRevenue - totalAllExpenses - ownerDisbursements // Subtract owner disbursements as they are money out

    // Calculate capital recovery metrics
    const constructionCost = (property as any).constructionCost?.totalEstimatedCost || 0 // Changed from actualCostIncurred
    // Capital recovery should be based on net profit, not just revenue
    const capitalRecovered = constructionCost > 0 ? Math.max(0, comprehensiveNetProfit) : 0
    const capitalRecoveryRate = constructionCost > 0
      ? ((capitalRecovered / constructionCost) * 100).toFixed(1)
      : '0.0'

    const remainingCapitalToRecover = constructionCost > capitalRecovered
      ? constructionCost - capitalRecovered
      : 0

    // Calculate average metrics per unit
    const avgRevenuePerUnit = totalUnits > 0 ? totalAllRevenue / totalUnits : 0
    const avgExpensePerUnit = totalUnits > 0 ? totalAllExpenses / totalUnits : 0

    // Get total owned units count (separate from sales query to avoid date filtering)
    const ownedUnitsQuery = await Unit.aggregate([
      {
        $match: {
          'propertyId': new mongoose.Types.ObjectId(propertyId),
          'ownership': { $exists: true },
          'ownership.isActive': { $ne: false },
        },
      },
      {
        $group: {
          _id: null,
          totalOwnedUnits: { $sum: 1 },
          ownedUnitsByType: {
            $push: {
              type: '$type',
              unitNumber: '$unitNumber',
              ownerId: '$ownership.ownerId',
              ownerName: '$ownership.ownerName',
              ownershipType: '$ownership.ownershipType',
              purchaseAmount: { $ifNull: ['$ownership.purchaseAmount', 0] },
              purchaseDate: '$ownership.purchaseDate',
              isActive: { $ifNull: ['$ownership.isActive', true] },
            },
          },
        },
      },
    ])

    // Extract owned units data
    const ownedUnitsData = ownedUnitsQuery[0] || {
      totalOwnedUnits: 0,
      ownedUnitsByType: [],
    }

    // Return analytics data wrapped in analytics object
    return {
      analytics: {
        // Core Financial Metrics (Cards 1-6)
        totalRentCollected,
        totalServiceCharge,
        ownerDisbursements,
        serviceFeeEarned,
        serviceFeePct,
        totalExpenses,

        // Advanced Financial Metrics (Cards 7-12)
        netRevenue: comprehensiveNetProfit,
        netRevenueMargin: totalAllRevenue > 0
          ? ((comprehensiveNetProfit / totalAllRevenue) * 100).toFixed(1)
          : '0',
        unitSalesRevenue,
        unitsSold,
        averageSalePrice,
        totalMaintenanceCost,
        totalMaintenanceRequests,

        // Property & Occupancy Metrics (Cards 13-16)
        totalUnits,
        occupancyRate,
        vacancyRate,
        averageRentPerUnit,

        // Ownership Metrics
        totalOwnedUnits: ownedUnitsData.totalOwnedUnits,
        ownedUnitsDetails: ownedUnitsData.ownedUnitsByType,
        ownershipRate: totalUnits > 0 ? Math.round((ownedUnitsData.totalOwnedUnits / totalUnits) * 100) : 0,

        // Additional Comprehensive Metrics
        totalDepositsCollected,
        revenueEfficiency,
        capitalRecoveryRate,
        remainingCapitalToRecover,
        avgRevenuePerUnit,
        avgExpensePerUnit,
        avgMaintenanceCost,
        totalPotentialRevenue,
        totalAllRevenue,
        comprehensiveNetProfit,
        disbursedProperties: disbursedPropertiesCount,
        outstandingPayments,
        overdueInvoices: stats.overdueCount,
        collectionRate,
        paidInvoices: stats.paidInvoices,
        totalInvoices: stats.totalInvoices,

        // Percentage changes
        rentCollectedChange,
        rentCollectedTrend,
        expensesChange,
        expensesTrend,

        // Construction cost data
        actualCostIncurred: constructionCostData?.actualCostIncurred || 0,
        totalEstimatedCost: constructionCostData?.mainConstructionCost || 0,
        budgetVariance: constructionCostData?.budgetVariance || null,
        budgetVarianceStatus: constructionCostData?.budgetVarianceStatus || 'on_track',
        netProfit: constructionCostData?.netProfit || comprehensiveNetProfit,
        roi: constructionCostData?.roi || '0.0',

        // Property info
        propertyName: property.propertyName,
        propertyId: property._id,

        // Date range info
        dateRange: {
          year: year || 'all',
          startDate: startDate || null,
          endDate: endDate || null,
          isHistorical: !year && !startDate && !endDate,
        },
      },
    }
  }
  catch (error: any) {
    console.error('Error fetching analytics data:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch analytics data',
    })
  }
},
{
  maxAge: 24 * 60 * 60,
  swr: true,
  name: 'analytics',
  getKey: (event: H3Event) => {
    const { propertyId, startDate, endDate, year } = getQuery(event)

    if (!propertyId) {
      return `no-cache:${Date.now()}:${Math.random()}`
    }

    const dateKey = year || `${startDate || 'null'}-${endDate || 'null'}`
    return `analytics:${propertyId}:${dateKey}`
  },
},
)
