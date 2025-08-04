import mongoose from 'mongoose'
import { MpesaTransaction } from '~~/server/models/MpesaTransaction'
import { Invoice } from '~~/server/models/Invoice'
import { BillingInvoice } from '~~/server/models/Billing/BillingInvoice'
import { createPaymentNotifications } from '~~/server/utils/notication'

interface CallbackItem {
  Name: string
  Value: number | string
}

interface MpesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata?: {
        Item: CallbackItem[]
      }
    }
  }
}

export default defineEventHandler(async (event) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const body = await readBody<MpesaCallback>(event)
    console.log('M-PESA callback received:', body)

    const {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = body.Body.stkCallback

    const metadata = CallbackMetadata?.Item.reduce((acc, item) => {
      acc[item.Name] = item.Value
      return acc
    }, {} as Record<string, number | string>) || {}

    const transaction = await MpesaTransaction.findOne({
      CheckoutRequestID,
    }).session(session)

    if (!transaction) {
      throw createError({
        statusCode: 404,
        message: `No transaction found with CheckoutRequestID: ${CheckoutRequestID}`,
      })
    }
    if (transaction.ResultCode !== undefined && transaction.ResultCode !== null) {
      await session.abortTransaction()
      console.log(`Transaction ${CheckoutRequestID} already processed with ResultCode: ${transaction.ResultCode}`)

      return {
        success: false,
        message: 'Transaction already processed',
        CheckoutRequestID,
        existingResultCode: transaction.ResultCode,
      }
    }

    transaction.ResultCode = ResultCode
    transaction.ResultDesc = ResultDesc
    transaction.Amount = metadata.Amount as number
    transaction.MpesaReceiptNumber = metadata.MpesaReceiptNumber as string
    transaction.TransactionDate = metadata.TransactionDate as number
    transaction.CallbackPhoneNumber = metadata.PhoneNumber as number
    transaction.status = ResultCode === 0 ? 'Completed' : 'Failed'

    await transaction.save({ session })

    if (ResultCode === 0 && transaction.invoiceId) {
      // Check if this is a billing invoice transaction
      if (transaction.transactionType === 'billing_invoice') {
        const billingInvoice = await BillingInvoice.findById(transaction.invoiceId).session(session)

        if (billingInvoice) {
          billingInvoice.isPaid = true
          billingInvoice.status = 'paid'
          billingInvoice.paymentDate = new Date()
          billingInvoice.paymentReference = metadata.MpesaReceiptNumber as string

          await billingInvoice.save({ session })

          console.log(`Billing invoice ${billingInvoice.invoiceNumber} marked as paid via M-PESA`)
        }
        else {
          console.warn(`Billing invoice not found for transaction ${transaction._id}`)
        }
      }
      else {
        // Handle regular tenant invoice payments
        const invoice = await Invoice.findById(transaction.invoiceId).session(session)

        if (invoice) {
          invoice.isPaid = true
          invoice.status = 'paid'
          invoice.paymentDate = new Date()
          invoice.paymentReferenceId = metadata.MpesaReceiptNumber as string
          invoice.receiptNumber = `R${invoice.invoiceNumber}`

          await invoice.save({ session })

          await createPaymentNotifications({
            invoiceId: invoice._id.toString(),
            invoiceNumber: invoice.invoiceNumber,
            receiptNumber: invoice.receiptNumber,
            amount: invoice.amount,
            paymentMethod: 'mpesa',
            mpesaReceiptNumber: metadata.MpesaReceiptNumber as string,
            tenantId: invoice.tenantId.toString(),
            tenantName: invoice.tenantName,
            propertyId: invoice.propertyId.toString(),
            unitNumber: invoice.unitNumber,
            paymentFor: invoice.paymentFor ?? { month: new Date().getMonth() + 1, year: new Date().getFullYear(), monthName: new Date().toLocaleString('en-US', { month: 'short' }) },
            paymentDate: invoice.paymentDate,
          }, session)
        }
        else {
          console.warn(`Invoice not found for transaction ${transaction._id}`)
        }
      }
    }

    await session.commitTransaction()

    return {
      success: true,
      message: 'M-PESA callback processed successfully',
    }
  }
  catch (error: any) {
    await session.abortTransaction()
    console.error('M-PESA callback error:', error)

    return {
      success: false,
      error: 'Failed to process callback',
      details: error.message || String(error),
      statusCode: error.statusCode || 500,
    }
  }
  finally {
    session.endSession()
  }
})
