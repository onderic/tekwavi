import mongoose from 'mongoose'
import { BillingRate } from '~~/server/models/System/BillingRate'
import { BillingAccount } from '~~/server/models/Billing/Account'
import { BillingInvoice } from '~~/server/models/Billing/BillingInvoice'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Only admin can update billing rates.',
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const body = await readBody(event)

    const currency = body.currency || 'KES'
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    // Deactivate current active rates
    await BillingRate.updateMany(
      { isActive: true },
      { isActive: false },
      { session },
    )

    // Create new active rate
    const newRate = new BillingRate({
      monthlyRate: body.monthlyRate,
      currency,
      effectiveFrom: currentDate,
      isActive: true,
    })

    await newRate.save({ session })

    // Update all billing accounts with new rate
    const billingAccountsResult = await BillingAccount.updateMany(
      {},
      { fixedMonthlyRate: body.monthlyRate },
      { session },
    )

    const updatedAccounts = billingAccountsResult.modifiedCount

    // Update all unpaid invoices for current and future months
    const invoicesUpdateResult = await BillingInvoice.updateMany(
      {
        year: currentYear,
        month: { $gte: currentMonth },
        isPaid: false,
        status: { $nin: ['paid', 'cancelled'] },
      },
      { amount: body.monthlyRate },
      { session },
    )

    const updatedInvoices = invoicesUpdateResult.modifiedCount

    await session.commitTransaction()

    return {
      success: true,
      message: `Billing rate updated successfully to ${body.monthlyRate} ${currency}`,
      rate: {
        id: newRate._id,
        monthlyRate: newRate.monthlyRate,
        currency: newRate.currency,
        effectiveFrom: newRate.effectiveFrom,
      },
      updatedStats: {
        accounts: updatedAccounts,
        invoices: updatedInvoices,
      },
    }
  }
  catch (error: any) {
    await session.abortTransaction()

    if (error.statusCode) {
      throw error
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message).join(', ')
      throw createError({
        statusCode: 400,
        statusMessage: `Validation failed: ${messages}`,
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update billing rate',
    })
  }
  finally {
    await session.endSession()
  }
})
