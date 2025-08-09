  import mongoose from 'mongoose'
  import { Property } from '~~/server/models/Property'
  import { Unit } from '~~/server/models/Property/Unit'
  import { Invoice } from '~~/server/models/Invoice'
  import { Maintenance } from '~~/server/models/Maintenance'
  import { Tenant } from '~~/server/models/Tenants'
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

    if (!user.role || !canPerform(user.role as UserRole, 'read', 'propertyManagement:Caretaker')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied. You do not have permission to view caretaker analytics.',
      })
    }

    try {
      const query = getQuery(event)
      const propertyId = query.propertyId as string || user.assignedProperty
      const year = query.year ? parseInt(query.year as string) : null
      const startDate = query.startDate ? new Date(query.startDate as string) : null
      const endDate = query.endDate ? new Date(query.endDate as string) : null

      if (!propertyId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Property ID is required',
        })
      }

      // Verify caretaker has access to this property
      if (user.role === 'caretaker' && user.assignedProperty !== propertyId) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Access denied. You can only view analytics for your assigned property.',
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

      // Get unit status and occupancy statistics
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
            unitsByType: {
              $push: {
                type: '$type',
                status: '$status',
                isOccupied: '$isOccupied',
                unitNumber: '$unitNumber',
              },
            },
            unitsByStatus: {
              $addToSet: '$status',
            },
          },
        },
      ])

      // Get maintenance statistics
      const maintenanceQuery = await Maintenance.aggregate([
        {
          $match: {
            propertyId: new mongoose.Types.ObjectId(propertyId),
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
            totalMaintenanceRequests: { $sum: 1 },
            completedRequests: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
              },
            },
            pendingRequests: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
              },
            },
            inProgressRequests: {
              $sum: {
                $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0],
              },
            },
            urgentRequests: {
              $sum: {
                $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0],
              },
            },
            maintenanceByCategory: {
              $push: {
                category: '$category',
                status: '$status',
                priority: '$priority',
                createdAt: '$createdAt',
              },
            },
            maintenanceByPriority: {
              $push: {
                priority: '$priority',
                status: '$status',
              },
            },
          },
        },
      ])

      // Get tenant statistics
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
            inactiveTenants: {
              $sum: {
                $cond: [{ $eq: ['$isActive', false] }, 1, 0],
              },
            },
            tenantsByStatus: {
              $push: {
                isActive: '$isActive',
                createdAt: '$createdAt',
              },
            },
          },
        },
      ])

      // Get invoice statistics (non-financial data only)
      const currentDate = new Date()
      const invoiceQuery = await Invoice.aggregate([
        {
          $match: {
            unitId: { $in: unitIds },
            invoiceType: 'tenant_rent',
            ...(year && { 'paymentFor.year': year }),
            ...(startDate && endDate && { createdAt: { $gte: startDate, $lte: endDate } }),
          },
        },
        {
          $group: {
            _id: null,
            totalInvoices: { $sum: 1 },
            paidInvoices: {
              $sum: {
                $cond: [{ $eq: ['$status', 'paid'] }, 1, 0],
              },
            },
            pendingInvoices: {
              $sum: {
                $cond: [{ $eq: ['$status', 'issued'] }, 1, 0],
              },
            },
            overdueInvoices: {
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
            invoicesByStatus: {
              $push: {
                status: '$status',
                dueDate: '$dueDate',
                paymentDate: '$paymentDate',
              },
            },
          },
        },
      ])

      // Get ownership statistics (unit sales data without amounts)
      const ownershipQuery = await Unit.aggregate([
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
            totalOwnedUnits: { $sum: 1 },
            ownedUnitsByType: {
              $push: {
                type: '$type',
                unitNumber: '$unitNumber',
                ownerName: '$ownership.ownerName',
                ownershipType: '$ownership.ownershipType',
                purchaseDate: '$ownership.purchaseDate',
                isActive: { $ifNull: ['$ownership.isActive', true] },
              },
            },
          },
        },
      ])

      // Extract query results
      const unitStatusData = unitStatusQuery[0] || {
        totalUnits: 0,
        occupiedUnits: 0,
        vacantUnits: 0,
        unitsByType: [],
        unitsByStatus: [],
      }

      const maintenanceData = maintenanceQuery[0] || {
        totalMaintenanceRequests: 0,
        completedRequests: 0,
        pendingRequests: 0,
        inProgressRequests: 0,
        urgentRequests: 0,
        maintenanceByCategory: [],
        maintenanceByPriority: [],
      }

      const tenantData = tenantQuery[0] || {
        totalTenants: 0,
        activeTenants: 0,
        inactiveTenants: 0,
        tenantsByStatus: [],
      }

      const invoiceData = invoiceQuery[0] || {
        totalInvoices: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        invoicesByStatus: [],
      }

      const ownershipData = ownershipQuery[0] || {
        totalOwnedUnits: 0,
        ownedUnitsByType: [],
      }

      // Calculate rates and percentages
      const totalUnits = unitStatusData.totalUnits
      const occupancyRate = totalUnits > 0
        ? Math.round((unitStatusData.occupiedUnits / totalUnits) * 100)
        : 0

      const vacancyRate = totalUnits > 0
        ? Math.round((unitStatusData.vacantUnits / totalUnits) * 100)
        : 0

      const maintenanceCompletionRate = maintenanceData.totalMaintenanceRequests > 0
        ? Math.round((maintenanceData.completedRequests / maintenanceData.totalMaintenanceRequests) * 100)
        : 0

      const invoiceCollectionRate = invoiceData.totalInvoices > 0
        ? Math.round((invoiceData.paidInvoices / invoiceData.totalInvoices) * 100)
        : 0

      const ownershipRate = totalUnits > 0
        ? Math.round((ownershipData.totalOwnedUnits / totalUnits) * 100)
        : 0

      const tenantRetentionRate = tenantData.totalTenants > 0
        ? Math.round((tenantData.activeTenants / tenantData.totalTenants) * 100)
        : 0

      // Calculate trend data for current vs previous month
      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

      // Get previous month maintenance requests
      const previousMonthMaintenance = await Maintenance.aggregate([
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
            total: { $sum: 1 },
          },
        },
      ])

      // Get current month maintenance requests
      const currentMonthMaintenance = await Maintenance.aggregate([
        {
          $match: {
            propertyId: new mongoose.Types.ObjectId(propertyId),
            createdAt: { $gte: currentMonthStart },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
          },
        },
      ])

      const currentMonthMaintenanceTotal = currentMonthMaintenance[0]?.total || 0
      const previousMonthMaintenanceTotal = previousMonthMaintenance[0]?.total || 0

      let maintenanceChange = null
      let maintenanceTrend = 'up' as 'up' | 'down'

      if (previousMonthMaintenanceTotal > 0) {
        const changePercent = ((currentMonthMaintenanceTotal - previousMonthMaintenanceTotal) / previousMonthMaintenanceTotal) * 100
        maintenanceChange = changePercent >= 0 ? `+${changePercent.toFixed(1)}` : changePercent.toFixed(1)
        maintenanceTrend = changePercent >= 0 ? 'up' : 'down'
      } else if (currentMonthMaintenanceTotal > 0) {
        maintenanceChange = '+100.0'
        maintenanceTrend = 'up'
      } else {
        maintenanceChange = '0.0'
        maintenanceTrend = 'down'
      }

      // Return caretaker analytics data
      return {
        analytics: {
          // Property Overview
          propertyName: property.propertyName,
          propertyId: property._id,

          // Unit Statistics
          totalUnits,
          occupiedUnits: unitStatusData.occupiedUnits,
          vacantUnits: unitStatusData.vacantUnits,
          occupancyRate,
          vacancyRate,
          unitsByType: unitStatusData.unitsByType,

          // Tenant Statistics
          totalTenants: tenantData.totalTenants,
          activeTenants: tenantData.activeTenants,
          inactiveTenants: tenantData.inactiveTenants,
          tenantRetentionRate,

          // Maintenance Statistics
          totalMaintenanceRequests: maintenanceData.totalMaintenanceRequests,
          completedRequests: maintenanceData.completedRequests,
          pendingRequests: maintenanceData.pendingRequests,
          inProgressRequests: maintenanceData.inProgressRequests,
          urgentRequests: maintenanceData.urgentRequests,
          maintenanceCompletionRate,
          maintenanceByCategory: maintenanceData.maintenanceByCategory,
          maintenanceChange,
          maintenanceTrend,

          // Invoice/Payment Statistics (counts only, no amounts)
          totalInvoices: invoiceData.totalInvoices,
          paidInvoices: invoiceData.paidInvoices,
          pendingInvoices: invoiceData.pendingInvoices,
          overdueInvoices: invoiceData.overdueInvoices,
          invoiceCollectionRate,

          // Owners               hip Statistics
          totalOwnedUnits: ownershipData.totalOwnedUnits,
          ownershipRate,
          ownedUnitsDetails: ownershipData.ownedUnitsByType,

          // Performance Metrics
          propertyEfficiencyScore: Math.round((occupancyRate + maintenanceCompletionRate + invoiceCollectionRate) / 3),

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
      console.error('Error fetching caretaker analytics data:', error)

      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.message || 'Failed to fetch caretaker analytics data',
      })
    }
  })