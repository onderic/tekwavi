import mongoose from 'mongoose'
import { PaymentSettings } from '~~/server/models/PaymentSettings'
import { MpesaTransaction } from '~~/server/models/MpesaTransaction'

interface MpesaBody {
  propertyId: string
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

    const body = await readBody<MpesaBody>(event)

    const paymentSettings = await PaymentSettings.findOne({ propertyId: body.propertyId }).session(session)

    if (!paymentSettings || !paymentSettings.mpesa || !paymentSettings.mpesa.enabled) {
      throw createError({
        statusCode: 400,
        message: 'M-PESA is not configured for this property',
      })
    }

    const config = useRuntimeConfig()

    const mpesaConfig = {
      shortcode: paymentSettings.mpesa.SHORTCODE,
      consumerKey: paymentSettings.mpesa.CONSUMER_KEY,
      consumerSecret: paymentSettings.mpesa.CONSUMER_SECRET,
      passkey: paymentSettings.mpesa.PASSKEY,
      transactionType: paymentSettings.mpesa.TRANSACTION_TYPE || 'CustomerPayBillOnline',
      accessTokenUrl: config.MPESA_ACCESS_TOKEN_URL || 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      stkPushUrl: config.MPESA_STK_PUSH_URL || 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      callbackUrl: config.MPESA_CALLBACK_URL || 'https://black-coast-06202c000.2.azurestaticapps.net/api/mpesa/callback/',
    }

    if (!mpesaConfig.shortcode || !mpesaConfig.consumerKey
      || !mpesaConfig.consumerSecret || !mpesaConfig.passkey) {
      throw createError({
        statusCode: 400,
        message: 'Incomplete M-PESA configuration for this property',
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

    const tokenResponse = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(
          `${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`,
        ).toString('base64'),
        'Content-Type': 'application/json',
      },
    })

    const tokenData = await tokenResponse.json()
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
    const accountReference = body.account_number || `INV-${body.invoiceId}`
    const transactionDesc = `Payment for invoice ${body.invoiceId}`

    const stkResponse = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
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

    const stkData = await stkResponse.json()
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
      propertyId: body.propertyId,
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

    console.error('Mpesa STK Push Error:', error)
    return {
      success: false,
      statusCode: error.statusCode || 500,
      error: error.message || 'Failed to process Mpesa payment',
    }
  }
})
