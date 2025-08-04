import mongoose from 'mongoose'
import type { UserRole } from '~~/shared/enums/roles'
import { canPerform } from '~~/server/utils/roles'
import { Property } from '~~/server/models/Property'
import { Unit } from '~~/server/models/Property/Unit'
import { Floor } from '~~/server/models/Property/Floor'
import { Tenant } from '~~/server/models/Tenants'

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
      statusMessage: 'Access denied. You do not have permission to view units.',
    })
  }

  try {
    const propertyId = event.context.params?.id
    const query = getQuery(event)

    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const search = query.search as string || ''
    const status = query.status as string || 'all'
    const floorId = query.floorId as string || ''

    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid property ID',
      })
    }

    const property = await Property.findById(propertyId).select('propertyName').lean()
    if (!property) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Property not found',
      })
    }

    // Build match conditions for units
    const matchConditions: any = {
      propertyId: new mongoose.Types.ObjectId(propertyId),
    }

    // Add floor filter if specified
    if (floorId && mongoose.Types.ObjectId.isValid(floorId)) {
      matchConditions.floorId = new mongoose.Types.ObjectId(floorId)
    }

    // Add status filter
    if (status !== 'all') {
      matchConditions.isOccupied = status === 'occupied'
    }

    // Build search conditions
    const searchConditions: any[] = []
    if (search) {
      searchConditions.push(
        { unitNumber: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      )
    }

    const finalMatch = search
      ? { $and: [matchConditions, { $or: searchConditions }] }
      : matchConditions

    const total = await Unit.countDocuments(finalMatch)

    const units = await Unit.find(finalMatch)
      .populate({
        path: 'floorId',
        select: '_id floorNumber',
        model: 'Floor',
      })
      .sort({ 'floorId.floorNumber': 1, 'unitNumber': 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const unitIds = units.map(unit => unit._id)
    const activeTenants = await Tenant.find({
      unitId: { $in: unitIds },
      isActive: true,
    })
      .select('unitId firstName lastName email phoneNumber')
      .lean()

    const tenantMap = new Map()
    activeTenants.forEach((tenant: any) => {
      tenantMap.set(tenant.unitId.toString(), {
        _id: tenant._id,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email,
        phone: tenant.phoneNumber,
        fullName: `${tenant.firstName} ${tenant.lastName}`.trim(),
      })
    })

    const enhancedUnits = units.map((unit: any) => {
      const tenant = tenantMap.get(unit._id.toString())

      return {
        _id: unit._id,
        unitNumber: unit.unitNumber,
        type: unit.type,
        furnishing: unit.furnishing,
        category: unit.category,
        status: unit.status,
        isOccupied: unit.isOccupied,
        rentAmount: unit.rentAmount,
        tenantId: tenant?._id || null,
        tenantName: tenant?.fullName || null,
        tenantEmail: tenant?.email || null,
        tenantPhone: tenant?.phone || null,
        floorId: unit.floorId._id,
        floorNumber: unit.floorId.floorNumber,
        createdAt: unit.createdAt,
        updatedAt: unit.updatedAt,
      }
    })

    // Get all floors for this property (for filter dropdown)
    const floors = await Floor.find({ propertyId })
      .select('_id floorNumber')
      .sort({ floorNumber: 1 })
      .lean()

    return {
      property: {
        _id: propertyId,
        propertyName: property.propertyName,
      },
      units: enhancedUnits,
      floors: floors.map(f => ({
        _id: f._id,
        floorNumber: f.floorNumber,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }
  catch (error: any) {
    console.error('Error fetching units:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch units',
    })
  }
})
