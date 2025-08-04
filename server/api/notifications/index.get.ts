import { Notification } from '~~/server/models/Notification'

export default defineEventHandler(async (event) => {
  try {
    // Check if user session exists first
    const session = await getUserSession(event)

    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required',
      })
    }

    const { user } = session

    const query = getQuery(event)
    const filterType = query.type as string
    const filterStatus = query.status as string
    const email = query.email as string
    const phone = query.phone as string

    // Start with base filter for personal notifications
    const baseConditions: any[] = []

    if (email) {
      baseConditions.push({ email })
    }
    else if (user.email) {
      baseConditions.push({ email: user.email })
    }

    if (phone) {
      baseConditions.push({ phone })
    }
    else if (user.phone) {
      baseConditions.push({ phone: user.phone })
    }

    let filter: any = {}

    if (baseConditions.length > 0) {
      filter = { $or: baseConditions }
    }
    else {
      // Fallback to role-based filtering only if no personal identifiers
      switch (user.role) {
        case 'tenant':
          filter = {}
          break

        case 'unit_owner':
          filter = { role: 'unit_owner' }
          break

        case 'developer':
          // Developers can see notifications they created
          filter = { senderId: user._id }
          break

        case 'caretaker':
          // Caretakers see property-specific notifications if needed
          filter = {}
          break

        case 'admin':
          // Admins see all notifications
          filter = {}
          break

        default:
          throw createError({
            statusCode: 403,
            statusMessage: 'Invalid user role',
          })
      }
    }

    // Apply additional filters
    if (filterType) {
      filter.type = filterType
    }
    if (filterStatus) {
      filter.status = filterStatus
    }

    const notifications = await Notification.find(filter)
      .populate('senderId', 'first_name last_name')
      .sort({ createdAt: -1 })
      .lean()

    return notifications || []
  }
  catch (error: any) {
    console.error('Error fetching notifications:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch notifications',
    })
  }
})
