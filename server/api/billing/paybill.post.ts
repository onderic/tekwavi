import mongoose from 'mongoose'
import { BillingInvoice } from '~~/server/models/Billing/BillingInvoice'
import { MpesaTransaction } from '~~/server/models/MpesaTransaction'

interface MpesaBody {
  invoiceId: string
  phoneNumber: string
  amount: number
  account_number: string
}

export default defineEventHandler(async (event) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { user } = await requireUserSession(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Authentication required',
      })
    }

    if (user.role !== 'developer') {
      throw createError({
        statusCode: 403,
        message: 'Access denied. Only developers can make PayBill payments.',
      })
    }

    const body = await readBody<MpesaBody>(event)

    if (!body.invoiceId || !body.phoneNumber || !body.amount) {
      throw createError({
        statusCode: 400,
        message: 'Invoice ID, phone number, and amount are required.',
      })
    }

    const invoice = await BillingInvoice.findById(body.invoiceId).session(session)
    if (!invoice) {
      throw createError({
        statusCode: 404,
        message: 'Invoice not found.',
      })
    }

    if (invoice.developerId.toString() !== user._id.toString()) {
      throw createError({
        statusCode: 403,
        message: 'You can only pay your own invoices.',
      })
    }

    if (invoice.isPaid) {
      throw createError({
        statusCode: 400,
        message: 'This invoice has already been paid.',
      })
    }

    if (body.amount !== invoice.totalAmount) {
      throw createError({
        statusCode: 400,
        message: 'Payment amount must match the invoice total.',
      })
    }

    const config = useRuntimeConfig()

    const mpesaConfig = {
      shortcode: config.MPESA.SHORTCODE,
      consumerKey: config.MPESA.CONSUMER_KEY,
      consumerSecret: config.MPESA.CONSUMER_SECRET,
      passkey: config.MPESA.PASSKEY,
      transactionType: 'CustomerPayBillOnline',
      accessTokenUrl: config.MPESA.ACCESS_TOKEN_URL || 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      stkPushUrl: config.MPESA.STK_PUSH_URL || 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      callbackUrl: config.MPESA.MPESA_CALLBACK_URL || 'https://manage.amaam.io/api/mpesa/callback/',
    }

    if (!mpesaConfig.shortcode || !mpesaConfig.consumerKey
      || !mpesaConfig.consumerSecret || !mpesaConfig.passkey) {
      throw createError({
        statusCode: 400,
        message: 'Incomplete M-PESA configuration. Please check system environment variables.',
      })
    }

    function formatPhone(phone: string): string {
      if (phone.startsWith('0')) {
        return `254${phone.slice(1)}`
      }
      if (phone.startsWith('+254')) {
        return phone.substring(1)
      }
      return phone
    }

    const phone = formatPhone(body.phoneNumber)

    const tokenResponse = await fetch(mpesaConfig.accessTokenUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(
          `${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`,
        ).toString('base64'),
        'Content-Type': 'application/json',
      },
    })

    const tokenData = await tokenResponse.json() as any
    if (!tokenData.access_token) {
      console.error('No access token in response:', tokenData)
      throw createError({
        statusCode: 502,
        message: 'Failed to authenticate with M-PESA API',
      })
    }

    const generateTimestamp = () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      return `${year}${month}${day}${hours}${minutes}${seconds}`
    }

    const generatePassword = (shortcode: string, passkey: string): string => {
      const timestamp = generateTimestamp()
      return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')
    }

    const timestamp = generateTimestamp()
    const accountReference = body.account_number || `BILL-${invoice.invoiceNumber}`
    const transactionDesc = `Payment for ${invoice.monthName} ${invoice.year} billing invoice`

    const stkResponse = await fetch(mpesaConfig.stkPushUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: mpesaConfig.shortcode,
        Password: generatePassword(String(mpesaConfig.shortcode), String(mpesaConfig.passkey)),
        Timestamp: timestamp,
        TransactionType: mpesaConfig.transactionType,
        Amount: body.amount,
        PartyA: phone,
        PartyB: mpesaConfig.shortcode,
        PhoneNumber: phone,
        CallBackURL: mpesaConfig.callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc,
      }),
    })

    const stkData = await stkResponse.json() as any
    console.log('M-PESA STK response:', stkData)

    if (stkData.ResponseCode !== '0') {
      console.error('STK Push Error:', stkData)
      await session.abortTransaction()
      session.endSession()

      return {
        success: false,
        error: stkData.ResponseDescription || 'Failed to initiate STK Push',
      }
    }

    const transaction = new MpesaTransaction({
      propertyId: null,
      invoiceId: body.invoiceId,
      phoneNumber: phone,
      amount: body.amount,
      MerchantRequestID: stkData.MerchantRequestID,
      CheckoutRequestID: stkData.CheckoutRequestID,
      ResponseCode: stkData.ResponseCode,
      ResponseDescription: stkData.ResponseDescription,
      CustomerMessage: stkData.CustomerMessage,
      account_reference: accountReference,
      transaction_desc: transactionDesc,
      status: 'Pending',
      transactionType: 'billing_invoice',
      initiated_by: user._id,
      created_at: new Date(),
    })

    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return {
      success: true,
      data: {
        merchantRequestId: stkData.MerchantRequestID,
        checkoutRequestId: stkData.CheckoutRequestID,
        message: 'STK Push request sent successfully',
        customerMessage: stkData.CustomerMessage,
      },
    }
  }
  catch (error: any) {
    await session.abortTransaction()
    session.endSession()

    console.error('PayBill payment error:', error)
    return {
      success: false,
      statusCode: error.statusCode || 500,
      error: error.message || 'Failed to process PayBill payment',
    }
  }
})
