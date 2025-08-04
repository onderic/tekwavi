import type { UserRole } from '~~/shared/enums/roles'
import { Notification } from '~~/server/models/Notification'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const config = useRuntimeConfig()
  const { sendMail } = useNodeMailer()

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'create', 'NotificationManagement:notification')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to create notifications.',
    })
  }

  try {
    const body = await readBody(event)

    const notification = new Notification({
      email: body.email,
      senderId: user._id,
      ...body,
    })

    await notification.save()

    let emailSent = false
    if (body.email) {
      const appName = config.public.APP_NAME || 'Amaam'
      const appUrl = config.public.APP_URL
      const inviteLink = `${appUrl}/auth/register`
      const role = body.role || 'user'
      const title = body.title || `You're invited to join ${appName}`
      const message = body.message || `You have been invited to join ${appName} as a ${role}.`

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f5f7;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05); overflow: hidden;">
                  <!-- Header with gradient -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">${appName}</h1>
                      <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; font-weight: 400;">Welcome to our community</p>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <!-- Greeting -->
                      <h2 style="margin: 0 0 24px 0; color: #1a202c; font-size: 24px; font-weight: 600; text-align: center;">
                        🎉 ${title}
                      </h2>
                      
                      <!-- Message -->
                      <p style="margin: 0 0 24px 0; color: #4a5568; font-size: 16px; line-height: 1.6; text-align: center;">
                        ${message}
                      </p>
                      
                      <!-- Info Card -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                        <tr>
                          <td style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="padding-bottom: 12px;">
                                  <span style="color: #718096; font-size: 14px; font-weight: 500;">Application</span><br>
                                  <span style="color: #2d3748; font-size: 16px; font-weight: 600;">${appName}</span>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <span style="color: #718096; font-size: 14px; font-weight: 500;">Your Role</span><br>
                                  <span style="color: #2d3748; font-size: 16px; font-weight: 600; text-transform: capitalize;">${role}</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- CTA Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                        <tr>
                          <td align="center">
                            <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                              Accept Invitation →
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Alternative link -->
                      <div style="margin: 24px 0; padding: 20px; background-color: #fef5e7; border-radius: 8px; border-left: 4px solid #f39c12;">
                        <p style="margin: 0 0 8px 0; color: #8b6914; font-size: 14px; font-weight: 600;">
                          Can't click the button?
                        </p>
                        <p style="margin: 0; color: #8b6914; font-size: 14px; word-break: break-all;">
                          Copy this link: <a href="${inviteLink}" style="color: #667eea; text-decoration: underline;">${inviteLink}</a>
                        </p>
                      </div>
                      
                      <!-- Expiration notice -->
                      <p style="margin: 24px 0 0 0; text-align: center; color: #a0aec0; font-size: 14px;">
                        ⏰ This invitation expires in 7 days
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f7fafc; padding: 32px 40px; text-align: center;">
                      <p style="margin: 0 0 8px 0; color: #a0aec0; font-size: 13px;">
                        This is an automated message from ${appName}
                      </p>
                      <p style="margin: 0 0 8px 0; color: #a0aec0; font-size: 13px;">
                        If you didn't request this invitation, please ignore this email.
                      </p>
                      <p style="margin: 16px 0 0 0; color: #cbd5e0; font-size: 12px;">
                        © ${new Date().getFullYear()} ${appName}. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `

      try {
        await sendMail({
          to: body.email,
          subject: `${title} - ${appName}`,
          html: htmlContent,
        })
        console.log(`Invitation email sent to ${body.email}`)
        emailSent = true
      }
      catch (emailError) {
        console.error('Failed to send invitation email:', emailError)
      }
    }

    return {
      success: true,
      notification,
      emailSent,
    }
  }
  catch (error: any) {
    console.error('Error creating notification:', error)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message).join(', ')
      throw createError({
        statusCode: 400,
        statusMessage: `Validation failed: ${messages}`,
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create notification',
      data: error,
    })
  }
})
