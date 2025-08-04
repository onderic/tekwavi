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

    const body = await readBody(event)

    if (!body.propertyId) {
      throw createError({
        statusCode: 400,
        message: 'Property ID is required',
      })
    }

    // First get existing settings to access the current mpesa object
    const existingSettings = await PaymentSettings.findOne({ propertyId: body.propertyId })

    const paymentSettings = await PaymentSettings.findOneAndUpdate(
      { propertyId: body.propertyId },
      {
        $set: {
          mpesa: {
            ...(existingSettings?.mpesa || {}),
            ...body.mpesa,
            enabled: !!body.mpesa?.CONSUMER_KEY && !!body.mpesa?.CONSUMER_SECRET && !!body.mpesa?.PASSKEY,
          },
          updatedBy: user._id,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdBy: user._id,
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
      },
    )
    return {
      success: true,
      message: 'Payment settings saved successfully',
      data: paymentSettings,
    }
  }
  catch (error: any) {
    console.error('Failed to save payment settings:', error)

    if (error.code === 11000) {
      throw createError({
        statusCode: 409,
        message: 'Payment settings already exist for this property',
      })
    }

    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to save payment settings',
    })
  }
})
