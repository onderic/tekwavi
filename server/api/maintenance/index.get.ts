import { Maintenance } from '~~/server/models/Maintenance'

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

    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const skip = (page - 1) * limit

    const filter: any = {}

    // If user is tenant, only show their own requests
    if (user.role === 'tenant') {
      filter.requestedBy = user._id
    }
    else if (user.role === 'developer') {
      filter.propertyId = { $exists: true, $ne: null }

      // If a specific propertyId is requested, filter to that property
      if (query.propertyId) {
        filter.propertyId = query.propertyId
      }
    }
    else {
      // For other roles (property managers, etc.)
      if (query.propertyId) {
        filter.propertyId = query.propertyId
      }
    }

    if (query.unitId) {
      filter.unitId = query.unitId
    }

    if (query.status && query.status !== 'all') {
      filter.status = query.status
    }

    // Priority filter
    if (query.priority && query.priority !== 'all') {
      filter.priority = query.priority
    }

    // Category filter
    if (query.category && query.category !== 'all') {
      filter.category = query.category
    }

    // Date range filter
    if (query.startDate && query.endDate) {
      filter.submittedDate = {
        $gte: new Date(query.startDate as string),
        $lte: new Date(query.endDate as string),
      }
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { maintenanceNumber: { $regex: query.search, $options: 'i' } },
        { propertyName: { $regex: query.search, $options: 'i' } },
        { unitNumber: { $regex: query.search, $options: 'i' } },
      ]
    }

    const maintenanceRequests = await Maintenance.find(filter)
      .sort({ submittedDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Maintenance.countDocuments(filter)

    return {
      maintenance: maintenanceRequests,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    }
  }
  catch (error: any) {
    console.error('Error fetching maintenance requests:', error)

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch maintenance requests',
    })
  }
})
