import { PaymentSettings } from '~~/server/models/PaymentSettings'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required',
      })
    }

    const query = getQuery(event)
    const propertyId = query.propertyId

    if (!propertyId) {
      throw createError({
        statusCode: 400,
        message: 'Property ID is required as a query parameter',
      })
    }

    const paymentSettings = await PaymentSettings.findOne({ propertyId })

    if (!paymentSettings) {
      return {
        success: true,
        message: 'No payment settings found for this property',
        data: null,
      }
    }

    return {
      success: true,
      message: 'Payment settings retrieved successfully',
      data: paymentSettings,
    }
  }
  catch (error: any) {
    console.error('Failed to retrieve payment settings:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to retrieve payment settings',
    })
  }
})
