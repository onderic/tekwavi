import mongoose from 'mongoose'
import { Service } from '~~/server/models/Service'
import { Expense } from '~~/server/models/Expenses'
import { canPerform } from '~~/server/utils/roles'
import type { UserRole } from '~~/shared/enums/roles'
import { purgeAnalyticsCache } from '~~/server/utils/cacheUtils'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'update', 'propertyManagement:service_update')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to update services.',
    })
  }

  const serviceId = getRouterParam(event, 'id')

  if (!serviceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Service ID is required',
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const body = await readBody(event)

    const existingService = await Service.findById(serviceId).session(session)

    if (!existingService) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Service not found',
      })
    }

    // Check property access for non-admin users
    if (user.role !== 'admin') {
      const isOwner = Array.isArray(user.ownedProperties) && user.ownedProperties.includes(existingService.propertyId.toString())
      const isManager = user.assignedProperty && user.assignedProperty === existingService.propertyId.toString()

      if (!isOwner && !isManager) {
        throw createError({
          statusCode: 403,
          statusMessage: 'You do not have access to this property',
        })
      }
    }

    // Track changes for history
    const changes: any = {}
    const historyEntries: any[] = []

    // Check for cost changes
    if (body.monthlyCost !== undefined && body.monthlyCost !== existingService.monthlyCost) {
      changes.monthlyCost = body.monthlyCost
      historyEntries.push({
        action: 'cost_changed',
        description: `Monthly cost changed from Ksh ${existingService.monthlyCost} to Ksh ${body.monthlyCost}`,
        previousValue: existingService.monthlyCost,
        newValue: body.monthlyCost,
        modifiedBy: user._id,
        modifiedByName: `${user.first_name} ${user.last_name || ''}`.trim(),
        date: new Date(),
      })
    }

    if (body.costPerUnit !== undefined && body.costPerUnit !== existingService.costPerUnit) {
      changes.costPerUnit = body.costPerUnit
      historyEntries.push({
        action: 'cost_changed',
        description: `Cost per unit changed from Ksh ${existingService.costPerUnit} to Ksh ${body.costPerUnit}`,
        previousValue: existingService.costPerUnit,
        newValue: body.costPerUnit,
        modifiedBy: user._id,
        modifiedByName: `${user.first_name} ${user.last_name || ''}`.trim(),
        date: new Date(),
      })
    }

    // Check for status changes
    if (body.isActive !== undefined && body.isActive !== existingService.isActive) {
      changes.isActive = body.isActive
      historyEntries.push({
        action: body.isActive ? 'activated' : 'deactivated',
        description: `Service ${body.isActive ? 'activated' : 'deactivated'}`,
        previousValue: existingService.isActive,
        newValue: body.isActive,
        modifiedBy: user._id,
        modifiedByName: `${user.first_name} ${user.last_name || ''}`.trim(),
        date: new Date(),
      })
    }

    // Update other fields
    const updateFields = [
      'serviceName',
      'serviceType',
      'serviceProvider',
      'providerContact',
      'contractDetails',
      'notes',
      'isMandatory',
      'billingCycle',
    ] as const

    type _UpdateField = typeof updateFields[number]

    updateFields.forEach((field) => {
      if (body[field] !== undefined && body[field] !== (existingService as any)[field]) {
        changes[field] = field === 'serviceType' ? body[field].toUpperCase() : body[field]
      }
    })

    // If there are changes, add a general update entry
    if (Object.keys(changes).length > 0 && historyEntries.length === 0) {
      historyEntries.push({
        action: 'updated',
        description: 'Service details updated',
        modifiedBy: user._id,
        modifiedByName: `${user.first_name} ${user.last_name || ''}`.trim(),
        date: new Date(),
      })
    }

    // Calculate next billing date if billing cycle changed
    if (changes.billingCycle) {
      const nextBillingDate = new Date()
      switch (changes.billingCycle) {
        case 'monthly':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
          break
        case 'quarterly':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 3)
          break
        case 'semi-annually':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 6)
          break
        case 'annually':
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
          break
      }
      changes.nextBillingDate = nextBillingDate
    }

    // Update the service
    const updatedService = await Service.findByIdAndUpdate(
      serviceId,
      {
        $set: {
          ...changes,
          lastModifiedBy: user._id,
          lastModifiedByName: `${user.first_name} ${user.last_name || ''}`.trim(),
          lastModifiedDate: new Date(),
        },
        $push: {
          history: { $each: historyEntries },
        },
      },
      {
        new: true,
        session,
      },
    )

    if (!updatedService) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update service',
      })
    }

    // Handle expense creation/update
    const currentDate = new Date()
    const expenseDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1) // First day of current month
    const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1) // First day of next month

    // Check if service is active and has a monthly cost
    if (updatedService.isActive && updatedService.monthlyCost > 0) {
      // Look for existing expense for this service in the current month
      const existingExpense = await Expense.findOne({
        serviceId: updatedService._id,
        date: {
          $gte: expenseDate,
          $lt: nextMonthDate,
        },
      }).session(session)

      if (existingExpense) {
        // Update existing expense if amount changed
        if (existingExpense.amount !== updatedService.monthlyCost
          || existingExpense.serviceName !== updatedService.serviceName) {
          existingExpense.amount = updatedService.monthlyCost
          existingExpense.title = `${updatedService.serviceName} - ${expenseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          existingExpense.serviceName = updatedService.serviceName
          existingExpense.description = `Monthly service charge for ${updatedService.serviceName} provided by ${updatedService.serviceProvider}`
          await existingExpense.save({ session })
        }
      }
      else {
        // Create new expense
        const expense = new Expense({
          title: `${updatedService.serviceName} - ${expenseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          description: `Monthly service charge for ${updatedService.serviceName} provided by ${updatedService.serviceProvider}`,
          amount: updatedService.monthlyCost,
          category: 'services',
          date: expenseDate,
          propertyId: updatedService.propertyId,
          propertyName: updatedService.propertyName,
          paymentMethod: 'bank_transfer',
          isServiceExpense: true,
          serviceId: updatedService._id,
          serviceName: updatedService.serviceName,
          createdBy: user._id,
        })

        await expense.save({ session })
      }
    }
    else if (!updatedService.isActive || updatedService.monthlyCost === 0) {
      // If service is deactivated or has no cost, remove future expenses
      // Only remove expenses from current month onwards
      await Expense.deleteMany({
        serviceId: updatedService._id,
        date: { $gte: expenseDate },
      }).session(session)
    }

    await session.commitTransaction()

    await purgeAnalyticsCache(updatedService.propertyId.toString())

    return {
      success: true,
      message: 'Service updated successfully',
      service: updatedService,
    }
  }
  catch (error: any) {
    await session.abortTransaction()

    console.error('Error updating service:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update service',
      data: error,
    })
  }
  finally {
    session.endSession()
  }
})
