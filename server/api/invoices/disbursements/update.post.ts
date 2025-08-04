import { Invoice } from '~~/server/models/Invoice'
import { ServiceFee } from '~~/server/models/ServiceFee'
import { purgeAnalyticsCache } from '~~/server/utils/cacheUtils'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  const body = await readBody(event)

  try {
    const invoice = await Invoice.findOne({
      _id: body.invoiceId,
    }).populate('unitId')

    if (!invoice) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Invoice not found or already disbursed',
      })
    }

    const unit = invoice.unitId as any
    if (!unit) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Unit not found',
      })
    }

    const serviceFee = await ServiceFee.findOne({
      propertyId: invoice.propertyId,
      unitType: unit.type,
    })

    const serviceFeeAmount = serviceFee?.monthlyFee || 0
    const netDisbursedAmount = invoice.amount - serviceFeeAmount

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      body.invoiceId,
      {
        $set: {
          'disbursement.isDisbursed': true,
          'disbursement.disbursedAmount': invoice.amount,
          'disbursement.disbursedBy': (user._id) as any,
          'disbursement.disbursedDate': new Date(body.paymentDate),
          'disbursement.disbursementMethod': body.paymentMethod,
          'disbursement.disbursementReference': body.referenceNumber || '',
          'disbursement.disbursementNotes': body.notes || '',
          'disbursement.serviceFeeAmount': serviceFeeAmount,
          'disbursement.netDisbursedAmount': netDisbursedAmount,
        },
      },
      { new: true },
    )
      .populate('unitId', 'unitNumber')
      .populate('disbursement.disbursedBy', 'first_name last_name phone')
      .lean()

    if (!updatedInvoice) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to update invoice',
      })
    }

    await purgeAnalyticsCache(invoice.propertyId.toString())

    return {
      success: true,
      message: 'Successfully disbursed invoice',
      invoice: updatedInvoice,
      disbursement: {
        totalDisbursed: invoice.amount,
        serviceFee: serviceFeeAmount,
        netAmount: netDisbursedAmount,
        method: body.paymentMethod,
        date: body.paymentDate,
        reference: body.referenceNumber || null,
      },
    }
  }
  catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to process disbursement',
    })
  }
})
