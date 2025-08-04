import { Unit } from '~~/server/models/Property/Unit'
import { Property } from '~~/server/models/Property'
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

  if (!user.role || !canPerform(user.role as UserRole, 'read', 'propertyManagement:unitOwnership')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to view unit ownership.',
    })
  }

  try {
    const query = getQuery(event)
    const {
      page = '1',
      limit = '10',
      search = '',
      propertyId = '',
      ownershipType = '',
      status = '',
    } = query

    if (!propertyId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Property ID is required',
      })
    }

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const filter: any = {
      propertyId: propertyId,
    }

    if (status && status !== 'all') {
      if (status === 'owned') {
        filter['ownership.ownerId'] = { $exists: true }
        filter['ownership.isActive'] = true
      }
      else if (status === 'available') {
        filter.$or = [
          { 'ownership.ownerId': { $exists: false } },
          { 'ownership.isActive': false },
        ]
      }
    }
    if (ownershipType && ownershipType !== 'all') {
      filter['ownership.ownershipType'] = ownershipType
    }

    if (search) {
      const searchRegex = new RegExp(search as string, 'i')
      filter.$or = [
        { unitNumber: searchRegex },
        { 'ownership.ownerName': searchRegex },
        { 'ownership.ownerEmail': searchRegex },
        { 'ownership.ownerPhone': searchRegex },
        { titleDeedNumber: searchRegex },
      ]
    }

    const total = await Unit.countDocuments(filter)

    const units = await Unit.find(filter)
      .populate('ownership.ownerId', 'first_name last_name email phone')
      .sort({ unitNumber: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean()

    const property = await Property.findById(propertyId)
      .select('propertyName')
      .lean()

    if (!property) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Property not found',
      })
    }

    const owners = units.map((unit) => {
      const owner = unit.ownership?.ownerId as any
      const hasOwnership = unit.ownership?.ownerId && unit.ownership?.isActive

      return {
        _id: unit._id,
        unitId: unit._id,
        unitNumber: unit.unitNumber,
        hasOwnership,
        ownerId: unit.ownership?.ownerId || '',
        ownerName: hasOwnership ? (unit.ownership?.ownerName || `${owner?.first_name || ''} ${owner?.last_name || ''}`.trim() || 'Unknown') : '',
        ownerPhone: hasOwnership ? (unit.ownership?.ownerPhone || owner?.phone || '') : '',
        ownerEmail: hasOwnership ? (unit.ownership?.ownerEmail || owner?.email || '') : '',
        purchaseDate: unit.ownership?.purchaseDate,
        purchaseAmount: unit.ownership?.purchaseAmount || 0,
        ownershipType: unit.ownership?.ownershipType || 'individual',
        ownershipPercentage: unit.ownership?.ownershipPercentage || 100,
        isActive: unit.ownership?.isActive || false,
        titleDeedNumber: unit.titleDeedNumber,
        registrationDate: unit.registrationDate,
        ownershipNotes: unit.ownershipNotes,
        status: unit.status,
        type: unit.type,
        category: unit.category,
      }
    })

    return {
      property: {
        _id: property._id,
        name: property.propertyName || 'Unknown Property',
      },
      owners,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    }
  }
  catch (error: any) {
    console.error('Error fetching unit ownership:', error)

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch unit ownership data',
    })
  }
})
