import mongoose from 'mongoose'
import type { UserRole } from '~~/shared/enums/roles'
import { canPerform } from '~~/server/utils/roles'
import { ServiceFee } from '~~/server/models/ServiceFee'
import { Unit } from '~~/server/models/Property/Unit'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'read', 'propertyManagement:property')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to view service fees.',
    })
  }

  try {
    const query = getQuery(event)
    const { propertyId } = query

    if (!propertyId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Property ID is required',
      })
    }

    const propertyObjectId = new mongoose.Types.ObjectId(propertyId as string)

    const serviceFees = await ServiceFee.find({ propertyId })
      .populate({ path: 'propertyId', select: 'propertyName code' })
      .populate('createdBy', 'first_name last_name email')
      .sort({ unitType: 1 })
      .lean()

    // Get unit counts - use ObjectId for matching
    const unitCounts = await Unit.aggregate([
      { $match: { propertyId: propertyObjectId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ])

    // Create a map of unit counts
    const unitCountMap = unitCounts.reduce((acc: Record<string, number>, item: any) => {
      if (item._id) {
        acc[item._id] = item.count
      }
      return acc
    }, {} as Record<string, number>)

    const transformedFees = serviceFees.map((fee: any) => ({
      _id: fee._id,
      propertyId: fee.propertyId._id || fee.propertyId,
      propertyName: fee.propertyId?.propertyName || '',
      propertyCode: fee.propertyId?.code || '',
      unitType: fee.unitType,
      monthlyFee: fee.monthlyFee,
      unitCount: unitCountMap[fee.unitType] || 0,
      totalMonthlyRevenue: (unitCountMap[fee.unitType] || 0) * fee.monthlyFee,
      createdBy: fee.createdBy && typeof fee.createdBy === 'object' && 'first_name' in fee.createdBy
        ? {
            _id: fee.createdBy._id,
            name: `${fee.createdBy.first_name} ${fee.createdBy.last_name || ''}`.trim(),
            email: fee.createdBy.email,
          }
        : {
            _id: fee.createdBy,
            name: '',
            email: '',
          },
      createdAt: fee.createdAt,
      updatedAt: fee.updatedAt,
    }))

    const unitTypeLabels: Record<string, string> = {
      'studio': 'Studio',
      '1_bedunit': '1 Bedroom',
      '2_bedunit': '2 Bedroom',
      '3_bedunit': '3 Bedroom',
      '4_bedunit': '4 Bedroom',
      'duplex': 'Duplex',
      'maisonette': 'Maisonette',
      'loft': 'Loft',
      'penthouse': 'Penthouse',
      'apartment': 'Apartment',
      'shared_flat': 'Shared Flat',
      'shop': 'Shop',
      'retail': 'Retail',
      'office': 'Office',
      'co_working_space': 'Co-working Space',
      'cafe': 'Cafe',
      'restaurant': 'Restaurant',
      'gym': 'Gym',
      'clinic': 'Clinic',
      'salon': 'Salon',
      'showunit': 'Show Unit',
      'workshop': 'Workshop',
      'warehouse': 'Warehouse',
      'live_work_unit': 'Live/Work Unit',
      'studio_commercial': 'Studio (Commercial)',
      'hotel_unit': 'Hotel Unit',
      'service_apartment': 'Service Apartment',
      'lobby': 'Lobby',
      'reception': 'Reception',
      'storage': 'Storage',
      'maintenance_unit': 'Maintenance Unit',
      'parking': 'Parking',
      'bike_storage': 'Bike Storage',
      'laundry_unit': 'Laundry Unit',
      'elevator_shaft': 'Elevator Shaft',
      'stairwell': 'Stairwell',
      'rooftop': 'Rooftop',
      'basement': 'Basement',
      'boiler_unit': 'Boiler Unit',
      'security_unit': 'Security Unit',
      'electrical_unit': 'Electrical Unit',
      'hospital_unit': 'Hospital Unit',
    }

    const feesWithLabels = transformedFees.map(fee => ({
      ...fee,
      unitTypeLabel: unitTypeLabels[fee.unitType] || fee.unitType,
    }))

    // Calculate summary statistics
    const totalUnits = Object.values(unitCountMap).reduce((sum: number, count: number) => sum + count, 0)
    const totalMonthlyRevenue = feesWithLabels.reduce((sum, fee) => sum + fee.totalMonthlyRevenue, 0)
    const configuredFees = feesWithLabels.filter(fee => fee.monthlyFee > 0).length

    // Create units by type summary with labels
    const unitsByType = Object.entries(unitCountMap).map(([type, count]) => ({
      unitType: type,
      unitTypeLabel: unitTypeLabels[type] || type,
      count: count,
      percentage: totalUnits > 0 ? ((count / totalUnits) * 100).toFixed(1) : '0',
    })).sort((a, b) => b.count - a.count)

    return {
      success: true,
      data: {
        fees: feesWithLabels,
        property: {
          _id: propertyId,
          name: feesWithLabels[0]?.propertyName || '',
        },
        summary: {
          totalUnits,
          totalFeeTypes: feesWithLabels.length,
          configuredFees,
          totalMonthlyRevenue,
          unitsByType,
        },
      },
    }
  }
  catch (error: any) {
    console.error('Error fetching service fees:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch service fees',
      data: error,
    })
  }
})
