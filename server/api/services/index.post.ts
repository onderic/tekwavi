import mongoose from 'mongoose'
import { Service } from '~~/server/models/Service'
import { Property } from '~~/server/models/Property'
import { Expense } from '~~/server/models/Expenses'
import { canPerform } from '~~/server/utils/roles'
import type { UserRole } from '~~/shared/enums/roles'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'create', 'propertyManagement:property')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to create services.',
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const body = await readBody(event)

    const property = await Property.findById(body.propertyId).session(session)
    if (!property) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Property not found',
      })
    }

    const existingService = await Service.findOne({
      propertyId: property._id,
      serviceName: body.serviceName,
      serviceType: body.serviceType.toUpperCase(),
      isActive: true,
    }).session(session)

    if (existingService) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A similar active service already exists for this property',
      })
    }

    const serviceCount = await Service.countDocuments().session(session)
    const serviceId = `SRV-${String(serviceCount + 1).padStart(6, '0')}`

    const nextBillingDate = new Date()
    switch (body.billingCycle || 'monthly') {
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

    const service = new Service({
      serviceId,
      serviceName: body.serviceName,
      serviceType: body.serviceType.toUpperCase(),
      monthlyCost: body.monthlyCost || 0,
      costPerUnit: body.costPerUnit || 0,
      serviceProvider: body.serviceProvider,
      providerContact: body.providerContact,
      contractDetails: body.contractDetails || null,
      propertyId: property._id,
      propertyName: property.propertyName,
      isActive: body.isActive !== false,
      isMandatory: body.isMandatory || false,
      notes: body.notes || null,
      createdBy: user._id,
      createdByName: `${user.first_name} ${user.last_name || ''}`.trim(),
      createdDate: new Date(),
      billingCycle: body.billingCycle || 'monthly',
      nextBillingDate,
      history: [{
        action: 'created',
        description: `Service created by ${user.first_name} ${user.last_name || ''}`.trim(),
        modifiedBy: user._id,
        modifiedByName: `${user.first_name} ${user.last_name || ''}`.trim(),
        date: new Date(),
      }],
    })

    const savedService = await service.save({ session })

    if (savedService.isActive && savedService.monthlyCost && savedService.monthlyCost > 0) {
      const currentDate = new Date()
      const expenseDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

      const expense = new Expense({
        title: `${savedService.serviceName} - ${expenseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        description: `Monthly service charge for ${savedService.serviceName} provided by ${savedService.serviceProvider}`,
        amount: savedService.monthlyCost,
        category: 'services',
        date: expenseDate,
        propertyId: savedService.propertyId,
        propertyName: savedService.propertyName,
        paymentMethod: 'bank_transfer',
        isServiceExpense: true,
        serviceId: savedService._id,
        serviceName: savedService.serviceName,
        createdBy: user._id,
      })

      await expense.save({ session })
    }

    await session.commitTransaction()

    return {
      success: true,
      message: 'Service added successfully',
      service: savedService,
    }
  }
  catch (error: any) {
    await session.abortTransaction()

    console.error('Error creating service:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create service',
      data: error,
    })
  }
  finally {
    session.endSession()
  }
})
