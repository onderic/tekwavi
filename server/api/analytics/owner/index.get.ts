import mongoose from 'mongoose'
import { Unit } from '~~/server/models/Property/Unit'
import { Invoice } from '~~/server/models/Invoice'
import { Tenant } from '~~/server/models/Tenants'
import { ServiceFee } from '~~/server/models/ServiceFee'
import { FlatStatus } from '~/types/property'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  try {
    const query = getQuery(event)
    let unitIds: string[] = []

    if (query.unitIds) {
      unitIds = String(query.unitIds).split(',').filter(Boolean)
    }
    else if (user.ownedUnits && user.ownedUnits.length > 0) {
      unitIds = user.ownedUnits
    }

    if (!unitIds.length) {
      // Return empty analytics if no units owned
      return {
        success: true,
        data: {
          totalRevenue: 0,
          totalUnits: 0,
          occupiedUnits: 0,
          vacantUnits: 0,
          monthlyIncome: 0,
          serviceCharges: 0,
          serviceChargesCollected: 0,
          currentYear: new Date().getFullYear(),
          incomeHistory: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            rentIncome: Array(12).fill(0),
            serviceCharges: Array(12).fill(0),
          },
          occupancyTimeline: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            data: Array(12).fill(0),
          },
          monthlyBreakdown: {
            rentIncome: 0,
            serviceCharges: 0,
            total: 0,
          },
        },
      }
    }

    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const unitObjectIds = unitIds.map(id => new mongoose.Types.ObjectId(id))

    const units = await Unit.find({ _id: { $in: unitObjectIds } })
      .populate('propertyId', 'propertyName')
      .lean()

    const totalUnits = units.length
    const occupiedUnits = units.filter(unit => unit.status === FlatStatus.RENTED || unit.isOccupied).length
    const vacantUnits = totalUnits - occupiedUnits

    // Get service fees for all units
    const serviceFees = await ServiceFee.find({
      propertyId: { $in: units.map(unit => unit.propertyId._id) },
    }).lean()

    // Create a map of property + unitType to service fee
    const serviceFeeMap = new Map()
    serviceFees.forEach((fee) => {
      const key = `${fee.propertyId}_${fee.unitType}`
      serviceFeeMap.set(key, fee.monthlyFee || 0)
    })

    const totalRevenueResult = await Invoice.aggregate([
      {
        $match: {
          unitId: { $in: unitObjectIds },
          isPaid: true,
          status: 'paid',
          invoiceType: 'tenant_rent',
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
        },
      },
    ])
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalAmount : 0

    const currentMonthIncomeResult = await Invoice.aggregate([
      {
        $match: {
          'unitId': { $in: unitObjectIds },
          'paymentFor.year': currentYear,
          'paymentFor.month': currentMonth,
          'isPaid': true,
          'status': 'paid',
          'invoiceType': 'tenant_rent',
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
        },
      },
    ])
    const monthlyIncome = currentMonthIncomeResult.length > 0 ? currentMonthIncomeResult[0].totalAmount : 0

    const rentIncomeData = Array(12).fill(0)

    const allIncomeByMonth = await Invoice.aggregate([
      {
        $match: {
          'unitId': { $in: unitObjectIds },
          'paymentFor.year': currentYear,
          'isPaid': true,
          'status': 'paid',
          'invoiceType': 'tenant_rent',
        },
      },
      {
        $group: {
          _id: '$paymentFor.month',
          totalAmount: { $sum: '$amount' },
        },
      },
    ])

    allIncomeByMonth.forEach((item) => {
      const monthIndex = item._id - 1
      if (monthIndex >= 0 && monthIndex < 12) {
        rentIncomeData[monthIndex] = item.totalAmount
      }
    })

    // Calculate real service charges collected by month
    const serviceChargeData = Array(12).fill(0)
    const serviceChargesCollectedByMonth = await Invoice.aggregate([
      {
        $match: {
          'unitId': { $in: unitObjectIds },
          'paymentFor.year': currentYear,
          'isPaid': true,
          'status': 'paid',
          'invoiceType': 'tenant_rent',
        },
      },
      {
        $group: {
          _id: '$paymentFor.month',
          totalServiceCharges: { $sum: '$totalServiceCharges' },
        },
      },
    ])

    serviceChargesCollectedByMonth.forEach((item) => {
      const monthIndex = item._id - 1
      if (monthIndex >= 0 && monthIndex < 12) {
        serviceChargeData[monthIndex] = item.totalServiceCharges || 0
      }
    })

    // If no service charges data from invoices, calculate based on occupied units and service fees
    const hasServiceChargeData = serviceChargeData.some(amount => amount > 0)
    if (!hasServiceChargeData) {
      for (let month = 0; month < 12; month++) {
        let monthlyServiceCharges = 0
        units.forEach((unit) => {
          const key = `${unit.propertyId._id}_${unit.type}`
          const serviceFeePerMonth = serviceFeeMap.get(key) || 0
          if (unit.status === FlatStatus.RENTED || unit.isOccupied) {
            monthlyServiceCharges += serviceFeePerMonth
          }
        })
        serviceChargeData[month] = monthlyServiceCharges
      }
    }

    const occupancyData = Array(12).fill(0)

    // Simplified approach - check if tenant was active in each month
    const activeTenants = await Tenant.find({
      unitId: { $in: unitObjectIds },
      $or: [
        {
          leaseStartDate: { $lte: new Date(currentYear, 11, 31) },
          leaseEndDate: { $gte: new Date(currentYear, 0, 1) },
        },
      ],
    }).lean()

    const monthlyOccupancy: { [key: number]: Set<string> } = {}
    for (let i = 1; i <= 12; i++) {
      monthlyOccupancy[i] = new Set()
    }

    activeTenants.forEach((tenant) => {
      const leaseStart = new Date(tenant.leaseStartDate)
      const leaseEnd = new Date(tenant.leaseEndDate)

      // For each month in the current year, check if tenant was active
      for (let month = 1; month <= 12; month++) {
        const monthStart = new Date(currentYear, month - 1, 1)
        const monthEnd = new Date(currentYear, month, 0) // Last day of the month

        // Check if lease period overlaps with this month
        if (leaseStart <= monthEnd && leaseEnd >= monthStart) {
          monthlyOccupancy[month].add(tenant.unitId.toString())
        }
      }
    })

    // Convert to array
    for (let i = 1; i <= 12; i++) {
      occupancyData[i - 1] = monthlyOccupancy[i].size
    }

    const currentMonthServiceCharges = serviceChargeData[currentMonth - 1]

    const currentMonthServiceChargesResult = await Invoice.aggregate([
      {
        $match: {
          'unitId': { $in: unitObjectIds },
          'paymentFor.year': currentYear,
          'paymentFor.month': currentMonth,
          'isPaid': true,
          'status': 'paid',
          'invoiceType': 'tenant_rent',
        },
      },
      {
        $group: {
          _id: null,
          totalServiceCharges: { $sum: '$totalServiceCharges' },
        },
      },
    ])

    const serviceChargesCollected = currentMonthServiceChargesResult.length > 0
      ? currentMonthServiceChargesResult[0].totalServiceCharges || 0
      : 0

    const monthlyBreakdown = {
      rentIncome: rentIncomeData[currentMonth - 1],
      serviceCharges: currentMonthServiceCharges,
      total: rentIncomeData[currentMonth - 1] + currentMonthServiceCharges,
    }

    return {
      analytics: {
        totalRevenue,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        monthlyIncome,
        serviceCharges: currentMonthServiceCharges,
        serviceChargesCollected,
        currentYear,
        incomeHistory: {
          labels: monthLabels,
          rentIncome: rentIncomeData,
          serviceCharges: serviceChargeData,
        },
        occupancyTimeline: {
          labels: monthLabels,
          data: occupancyData,
        },
        monthlyBreakdown,
      },
    }
  }
  catch (error: any) {
    console.error('Error fetching owner analytics:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch analytics data',
    })
  }
})
