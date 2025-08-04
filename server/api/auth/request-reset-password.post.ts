import { User as UserModel } from '~~/server/models/User'

export default defineEventHandler(async (event) => {
  const { phone } = await readBody(event)

  if (!phone) {
    return createError({
      statusCode: 400,
      statusMessage: 'Phone number is required.',
    })
  }

  const user = await UserModel.findOne({ phone })

  if (!user) {
    return createError({
      statusCode: 400,
      statusMessage: 'No account found with this phone number.',
    })
  }

  const tempPassword = Math.floor(100000 + Math.random() * 900000).toString()
  console.log('Generated temporary password:', tempPassword)
  const hashedTempPassword = await hashPassword(tempPassword)
  const tempPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000)

  await UserModel.findByIdAndUpdate(user._id, {
    tempPassword: hashedTempPassword,
    tempPasswordExpiry,
    tempPasswordUsed: false,
  })

  try {
    await sendSMS(phone, `Your temporary password is: ${tempPassword}. It expires in 15 minutes.`)
  }
  catch (error) {
    console.error('SMS sending failed:', error)
  }

  return {
    message: 'Temporary password sent to your phone.',
    success: true,
  }
})

async function sendSMS(phone: string, message: string) {
  const apiKey = process.env.NUXT_PUBLIC_ADVANTA_SMS_API_KEY
  const partnerId = process.env.NUXT_PUBLIC_ADVANTA_SMS_PARTNER_ID
  const shortcode = process.env.NUXT_PUBLIC_ADVANTA_SMS_SHORTCODE

  if (!apiKey || !partnerId || !shortcode) {
    console.error('Advanta SMS credentials not configured')
    throw new Error('SMS service not configured')
  }

  try {
    const response = await $fetch('https://quicksms.advantasms.com/api/services/sendsms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        apikey: apiKey,
        partnerID: partnerId,
        message: message,
        shortcode: shortcode,
        mobile: phone,
      },
    })

    console.log('SMS sent successfully:', response)
    return response
  }
  catch (error: any) {
    console.error('Advanta SMS API error:', error)
    if (error.response) {
      console.error('Error response:', error.response._data)
    }

    throw new Error('Failed to send SMS')
  }
}
