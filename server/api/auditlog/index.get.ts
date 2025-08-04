import { AuditLog } from '~~/server/models/AuditLog'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }
  if (!['admin', 'developer'].includes(user.role as string)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Only developeristrators can view audit logs.',
    })
  }

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 50
  const skip = (page - 1) * limit

  const filter: any = {
    resource: { $regex: 'invoice', $options: 'i' },
  }

  // Add filters
  if (query.userId) filter.userId = query.userId
  if (query.action) filter.action = query.action
  if (query.isSuccessful !== undefined) filter.isSuccessful = query.isSuccessful === 'true'
  if (query.securityFlag) filter.securityFlags = query.securityFlag

  // Date range filter
  if (query.startDate || query.endDate) {
    filter.createdAt = {}
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate as string)
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate as string)
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('userId', 'email first_name last_name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ])

  // Get security insights
  const securityInsights = await AuditLog.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        failedRequests: { $sum: { $cond: [{ $eq: ['$isSuccessful', false] }, 1, 0] } },
        suspiciousActivities: {
          $sum: {
            $cond: [{ $gt: [{ $size: '$securityFlags' }, 0] }, 1, 0],
          },
        },
        avgDuration: { $avg: '$duration' },
      },
    },
  ])

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    insights: securityInsights[0] || {
      totalRequests: 0,
      failedRequests: 0,
      suspiciousActivities: 0,
      avgDuration: 0,
    },
  }
})
