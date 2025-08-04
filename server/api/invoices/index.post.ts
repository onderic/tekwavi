import mongoose from 'mongoose'
import { Tenant } from '~~/server/models/Tenants'
import { Invoice } from '~~/server/models/Invoice'
import { Property } from '~~/server/models/Property'
import { Unit } from '~~/server/models/Property/Unit'
import { createPaymentNotifications } from '~~/server/utils/notication'
import { canPerform } from '~~/server/utils/roles'
import type { UserRole } from '~~/shared/enums/roles'
import { purgeAnalyticsCache } from '~~/server/utils/cacheUtils'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'create', 'financialManagement:invoice_create')) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied. You do not have permission to create invoices.' })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const body = await readBody(event)
    const isTenantUser = user.role === 'tenant'
    const isMpesaPayment = body.paymentMethod === 'mpesa'

    if (isTenantUser && !isMpesaPayment) {
      throw createError({ statusCode: 403, statusMessage: 'Tenant users can only make payments through M-PESA. Please use M-PESA as your payment method.' })
    }

    if (isMpesaPayment && !body.phoneNumber) {
      throw createError({ statusCode: 400, statusMessage: 'Phone number is required for M-PESA payments.' })
    }

    const tenant = await Tenant.findById(body.tenantId).session(session)
    if (!tenant) throw createError({ statusCode: 404, statusMessage: 'Tenant not found' })

    const unit = await Unit.findById(body.unitId).session(session)
    if (!unit) throw createError({ statusCode: 404, statusMessage: 'Unit not found' })

    const property = await Property.findById(unit.propertyId).session(session)
    if (!property) throw createError({ statusCode: 404, statusMessage: 'Property not found' })

    const paymentDate = body.paymentDate ? new Date(body.paymentDate) : new Date()

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthName = body.paymentFor.month === 0 ? 'Fixed Lease' : monthNames[body.paymentFor.month - 1]

    // For fixed-term leases, allow creation of a single invoice for the entire lease period
    if (tenant.rentalType === 'fixed' && body.paymentFor.month === 0) {
      // This is a fixed lease payment - allow it
      // No need to check for lease period restrictions
    }
    else if (tenant.rentalType === 'fixed') {
      // This is a regular monthly payment for a fixed tenant
      const leaseStartDate = new Date(tenant.leaseStartDate)
      const leaseEndDate = new Date(tenant.leaseEndDate)

      const paymentMonth = body.paymentFor.month
      const paymentYear = body.paymentFor.year

      // Check if payment month/year falls within lease period
      const paymentDate = new Date(paymentYear, paymentMonth - 1, 1)

      if (paymentDate >= leaseStartDate && paymentDate <= leaseEndDate) {
        throw createError({
          statusCode: 400,
          statusMessage: `Cannot create invoice for ${monthName} ${paymentYear}. This month falls within the fixed lease period (${leaseStartDate.toLocaleDateString()} to ${leaseEndDate.toLocaleDateString()}). Fixed-term tenants do not pay monthly rent during their lease period.`,
        })
      }
    }

    // Check if invoice already exists for this unit and month/year
    const existingInvoice = await Invoice.findOne({
      'propertyId': unit.propertyId,
      'unitId': unit._id,
      'paymentFor.month': body.paymentFor.month,
      'paymentFor.year': body.paymentFor.year,
    }).session(session)

    const lastDayOfMonth = new Date(body.paymentFor.year, body.paymentFor.month, 0).getDate()
    const dueDate = new Date(body.paymentFor.year, body.paymentFor.month - 1, lastDayOfMonth)
    const gracePeriodEnd = new Date(body.paymentFor.year, body.paymentFor.month, 5)
    const isLate = paymentDate > gracePeriodEnd

    // Calculate amounts
    const originalAmount = body.amount ?? unit.rentAmount ?? 0

    // The frontend sends the total amount (rent + amenities + service fee for regular tenants)
    // For owner-occupied units, it sends only the service fee
    let rentAmount = originalAmount

    if (tenant.rentalType === 'owner_occupied') {
      // For owner-occupied units, the frontend sends only the service fee amount
      rentAmount = originalAmount
    }
    else {
      // For regular tenants, the frontend already includes everything in the amount
      // Don't add service fee again to avoid double counting
      rentAmount = originalAmount
    }

    // Handle regular service charges (existing amenities services)
    // Note: Service charges are already included in the frontend amount calculation
    // We only process them here for editing by developers/caretakers
    const canEditServiceCharges = user.role === 'developer' || user.role === 'caretaker'
    let serviceCharges = []
    let totalServiceCharges = 0

    if (canEditServiceCharges && body.serviceCharges && body.serviceCharges.length > 0) {
      // Filter out unit-type service charges from the service charges array
      // since we're now adding them to rent amount
      serviceCharges = body.serviceCharges.filter((charge: any) =>
        !charge.serviceId.toString().startsWith('unit-type-'),
      )
      totalServiceCharges = serviceCharges.reduce((sum: number, charge: any) => sum + (charge.amount || 0), 0)
    }
    else {
      // For regular users, service charges are already included in the frontend amount
      // Don't add them separately to avoid double counting
      serviceCharges = []
      totalServiceCharges = 0
    }

    let savedInvoice
    let message

    if (existingInvoice) {
      if (isTenantUser) {
        const userUnitIds = user.rentedUnits || []
        const hasAccessToInvoiceUnit = userUnitIds.some((userUnitId: any) =>
          new mongoose.Types.ObjectId(userUnitId).equals(unit._id),
        )
        if (!hasAccessToInvoiceUnit) {
          throw createError({ statusCode: 403, statusMessage: 'You can only update payment records for your assigned units.' })
        }
      }

      // Update existing invoice
      existingInvoice.isPaid = !isMpesaPayment
      existingInvoice.status = isMpesaPayment ? 'draft' : 'paid'
      existingInvoice.paymentDate = isMpesaPayment ? null : paymentDate
      existingInvoice.paymentMethod = body.paymentMethod
      existingInvoice.paymentReferenceId = body.paymentReferenceId
      existingInvoice.phoneNumber = body.phoneNumber
      existingInvoice.isLate = isLate
      existingInvoice.recordedBy = new mongoose.Types.ObjectId(user._id)
      existingInvoice.tenantName = `${tenant.firstName} ${tenant.lastName}`
      existingInvoice.tenantId = tenant._id
      existingInvoice.unitNumber = unit.unitNumber
      existingInvoice.amount = rentAmount
      existingInvoice.totalServiceCharges = totalServiceCharges
      existingInvoice.serviceCharges = serviceCharges
      existingInvoice.totalAmount = rentAmount + totalServiceCharges
      // Owner-occupied unit tracking
      existingInvoice.isOwnerOccupied = tenant.rentalType === 'owner_occupied'
      existingInvoice.ownerServiceFeeAmount = tenant.rentalType === 'owner_occupied' ? originalAmount : 0
      existingInvoice.rentOnlyAmount = tenant.rentalType === 'owner_occupied' ? 0 : originalAmount

      savedInvoice = await existingInvoice.save({ session })
      message = isMpesaPayment
        ? 'Invoice updated and awaiting M-PESA payment confirmation'
        : 'Invoice updated and marked as paid'
    }
    else {
      const propertyPrefix = property.propertyName.substring(0, 3).toUpperCase()
      const year = body.paymentFor.year.toString().substring(2)
      const month = body.paymentFor.month.toString().padStart(2, '0')
      const invoiceCount = await Invoice.countDocuments({
        'propertyId': unit.propertyId,
        'paymentFor.year': body.paymentFor.year,
        'paymentFor.month': body.paymentFor.month,
      }).session(session)

      const sequence = (invoiceCount + 1).toString().padStart(3, '0')
      const timestamp = Date.now().toString().slice(-4)
      const invoiceNumber = `${propertyPrefix}-${year}${month}-${sequence}-${timestamp}`

      const invoice = new Invoice({
        invoiceNumber,
        receiptNumber: invoiceNumber,
        invoiceType: 'tenant_rent',
        propertyId: unit.propertyId,
        unitId: unit._id,
        unitNumber: unit.unitNumber,
        tenantId: tenant._id,
        tenantName: `${tenant.firstName} ${tenant.lastName}`,
        amount: rentAmount,
        totalServiceCharges,
        serviceCharges,
        totalAmount: rentAmount + totalServiceCharges, // Recalculate total based on final service charges
        paymentMethod: body.paymentMethod,
        paymentReferenceId: body.paymentReferenceId,
        phoneNumber: body.phoneNumber,
        isPaid: !isMpesaPayment,
        paymentDate: isMpesaPayment ? null : paymentDate,
        dueDate,
        isLate,
        paymentFor: {
          month: body.paymentFor.month,
          monthName,
          year: body.paymentFor.year,
        },
        recordedBy: new mongoose.Types.ObjectId(user._id),
        status: isMpesaPayment ? 'draft' : 'paid',
        // Owner-occupied unit tracking
        isOwnerOccupied: tenant.rentalType === 'owner_occupied',
        ownerServiceFeeAmount: tenant.rentalType === 'owner_occupied' ? originalAmount : 0,
        rentOnlyAmount: tenant.rentalType === 'owner_occupied' ? 0 : originalAmount,
      })

      const validationError = invoice.validateSync()
      if (validationError) {
        throw createError({ statusCode: 400, statusMessage: `Validation error: ${validationError.message}` })
      }

      savedInvoice = await invoice.save({ session })

      message = isMpesaPayment
        ? 'Draft payment record created, awaiting M-PESA confirmation'
        : 'New payment record created successfully'
    }

    if (!isMpesaPayment && savedInvoice.isPaid) {
      try {
        await createPaymentNotifications({
          invoiceId: savedInvoice._id.toString(),
          invoiceNumber: savedInvoice.invoiceNumber,
          receiptNumber: String(savedInvoice.receiptNumber),
          amount: savedInvoice.totalAmount || savedInvoice.amount, // Use totalAmount if available
          paymentMethod: savedInvoice.paymentMethod,
          tenantId: savedInvoice.tenantId.toString(),
          tenantName: savedInvoice.tenantName,
          propertyId: savedInvoice.propertyId.toString(),
          unitNumber: savedInvoice.unitNumber,
          paymentFor: {
            month: savedInvoice.paymentFor?.month || 0,
            year: savedInvoice.paymentFor?.year || 0,
            monthName: savedInvoice.paymentFor?.monthName || '',
          },
          paymentDate: savedInvoice.paymentDate || new Date(),
        }, session)
      }
      catch (notificationError) {
        console.error('Failed to create payment notifications:', notificationError)
      }
    }

    await session.commitTransaction()

    await purgeAnalyticsCache(unit.propertyId.toString())

    return {
      success: true,
      message,
      invoice: savedInvoice,
      wasExisting: !!existingInvoice,
      isPending: isMpesaPayment,
    }
  }
  catch (error: any) {
    await session.abortTransaction()
    console.error('Error recording payment:', error)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message).join(', ')
      throw createError({
        statusCode: 400,
        statusMessage: `Validation failed: ${messages}`,
      })
    }

    if (error.code === 11000) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A payment record with this information already exists',
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to record payment',
      data: error,
    })
  }
  finally {
    session.endSession()
  }
})
