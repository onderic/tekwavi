import { Maintenance } from '~~/server/models/Maintenance'
import { purgeAnalyticsCache } from '~~/server/utils/cacheUtils'
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

  if (!user.role || !canPerform(user.role as UserRole, 'update', 'maintenanceManagement:maintenance')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to update maintenance requests.',
    })
  }

  const maintenanceId = getRouterParam(event, 'id')
  if (!maintenanceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Maintenance ID is required',
    })
  }

  const body = await readBody(event)
  const { status, priority, cost, scheduledDate, note } = body

  try {
    const maintenance = await Maintenance.findById(maintenanceId)
    if (!maintenance) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Maintenance request not found',
      })
    }

    // Prepare update data
    const updateData: any = {}

    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (cost !== undefined) updateData.cost = cost
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate

    // Set completed date if status is completed
    if (status === 'completed') {
      updateData.completedDate = new Date()
    }

    // Add note if provided
    if (note) {
      updateData.$push = {
        notes: {
          text: note,
          addedBy: user._id,
          addedByName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
          date: new Date(),
        },
      }
    }

    const updatedMaintenance = await Maintenance.findByIdAndUpdate(
      maintenanceId,
      updateData,
      { new: true },
    )

    if (updatedMaintenance?.propertyId) {
      await purgeAnalyticsCache(updatedMaintenance.propertyId.toString())
    }

    return {
      success: true,
      maintenance: updatedMaintenance,
      message: 'Maintenance request updated successfully',
    }
  }
  catch (error: any) {
    console.error('Error updating maintenance request:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to update maintenance request',
    })
  }
})
