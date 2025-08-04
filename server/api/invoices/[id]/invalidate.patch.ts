import mongoose from 'mongoose'
import { Invoice } from '~~/server/models/Invoice'
import { hasHigherOrEqualPrivilege, UserRole } from '~~/server/config/role'
import { purgeAnalyticsCache } from '~~/server/utils/cacheUtils'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!hasHigherOrEqualPrivilege(user.role as UserRole, UserRole.ADMIN)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Only developers can invalidate invoices.',
    })
  }

  try {
    const invoiceId = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid invoice ID',
      })
    }

    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Invoice not found',
      })
    }

    if (!user.ownedProperties || !user.ownedProperties.includes(invoice.propertyId.toString())) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied. You can only invalidate invoices from your own properties.',
      })
    }

    if (invoice.status !== 'paid') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only paid invoices can be invalidated',
      })
    }

    if (body.status !== 'cancelled') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid status. Only "cancelled" is allowed for invalidation.',
      })
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      {
        status: 'cancelled',
        updatedAt: new Date(),
        cancelledBy: user._id,
        cancelledAt: new Date(),
      },
      { new: true, runValidators: true },
    )

    if (!updatedInvoice) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update invoice',
      })
    }

    await purgeAnalyticsCache(invoice.propertyId.toString())

    return {
      success: true,
      message: 'Invoice successfully invalidated',
      invoice: {
        _id: updatedInvoice._id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        status: updatedInvoice.status,
        cancelledAt: updatedInvoice.cancelledAt,
        cancelledBy: updatedInvoice.cancelledBy,
      },
    }
  }
  catch (error) {
    console.error('Error invalidating invoice:', error)

    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while invalidating invoice',
    })
  }
})
