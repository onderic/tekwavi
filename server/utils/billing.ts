import type { ClientSession } from 'mongoose'
import { Types } from 'mongoose'
import { BillingAccount } from '../models/Billing/Account'
import { BillingInvoice } from '../models/Billing/BillingInvoice'
import { User } from '../models/User'
import { BillingRate } from '../models/System/BillingRate'
import { Property } from '../models/Property'

export async function createOrUpdateDeveloperBilling(
  developerId: string,
  propertyId: string,
  propertyName: string,
  session?: ClientSession,
) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const currentDay = now.getDate()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

  // Determine starting month
  let startMonth = currentMonth
  if (currentDay >= 16) {
    startMonth = currentMonth + 1
    if (startMonth > 12) {
      console.log('Property added after Dec 15th, no invoices needed for current year')
      return {
        developerId,
        propertyId,
        propertyName,
        year: currentYear,
        message: 'No invoices generated - property added after December 15th',
      }
    }
  }

  // Get current billing rate
  const billingRate = await BillingRate.findOne({ isActive: true }).session(session || null)
  const defaultMonthlyRate = billingRate?.monthlyRate || 5000

  // Find or create billing account
  let billingAccount = await BillingAccount.findOne({ developerId }).session(session || null)

  if (!billingAccount) {
    const developer = await User.findById(developerId)
      .where({ role: 'developer' })
      .session(session || null)
      .exec()

    if (!developer) {
      throw new Error('Developer not found or user is not a developer')
    }

    billingAccount = new BillingAccount({
      developerId,
      developerName: `${developer.first_name} ${developer.last_name}`,
      developerEmail: developer.email,
      developerPhone: developer.phone,
      fixedMonthlyRate: defaultMonthlyRate,
    })

    await billingAccount.save({ session: session || null })
  }

  const invoicesUpdated = []

  // Process each month from startMonth to December
  for (let month = startMonth; month <= 12; month++) {
    // Check if invoice exists for this developer and month
    let invoice = await BillingInvoice.findOne({
      developerId,
      year: currentYear,
      month,
    }).session(session || null)

    if (!invoice) {
      // Get developer info
      const developer = await User.findById(developerId)
        .select('first_name last_name email phone ownedProperties')
        .session(session || null)
        .exec()

      // Get all properties owned by this developer
      const properties = await Property.find({
        _id: { $in: developer?.ownedProperties || [] },
        status: 'active',
      })
        .select('propertyName')
        .session(session || null)
        .exec()

      // Build properties array for invoice
      const propertyItems = properties.map(prop => ({
        propertyId: prop._id,
        propertyName: prop.propertyName,
        status: 'active',
        amount: billingAccount.fixedMonthlyRate,
      }))

      // Add the new property if not already in the list
      const existingPropertyIds = propertyItems.map(p => p.propertyId.toString())
      if (!existingPropertyIds.includes(propertyId)) {
        propertyItems.push({
          propertyId: new Types.ObjectId(propertyId),
          propertyName,
          status: 'active',
          amount: billingAccount.fixedMonthlyRate,
        })
      }

      // Calculate total amount
      const totalAmount = propertyItems.reduce((sum, prop) => sum + prop.amount, 0)

      // Calculate due date (5th of each month)
      const dueDate = new Date(currentYear, month - 1, 5)
      const today = new Date()
      if (dueDate < today) {
        dueDate.setDate(today.getDate() + 5)
      }

      // Create new consolidated invoice
      invoice = new BillingInvoice({
        developerId,
        developerEmail: developer?.email || '',
        developerPhone: developer?.phone || '',
        developerName: `${developer?.first_name || ''} ${developer?.last_name || ''}`.trim(),
        month,
        monthName: monthNames[month - 1],
        year: currentYear,
        properties: propertyItems,
        totalAmount,
        isPaid: false,
        dueDate,
        status: 'issued',
      })

      await invoice.save({ session: session || null })
      invoicesUpdated.push(invoice)
    }
    else {
      // Update existing invoice to include new property
      const propertyExists = invoice.properties.some(
        prop => prop.propertyId.toString() === propertyId,
      )

      if (!propertyExists) {
        invoice.properties.push({
          propertyId: new Types.ObjectId(propertyId),
          propertyName,
          status: 'active',
          amount: billingAccount.fixedMonthlyRate,
        })

        // Recalculate total amount
        invoice.totalAmount = invoice.properties.reduce((sum, prop) => sum + prop.amount, 0)

        await invoice.save({ session: session || null })
        invoicesUpdated.push(invoice)
      }
    }
  }

  console.log(`Updated/Created ${invoicesUpdated.length} consolidated invoices for developer ${developerId}`)

  return {
    accountId: billingAccount?._id,
    developerId,
    year: currentYear,
    propertyId,
    propertyName,
    monthlyRate: billingAccount?.fixedMonthlyRate,
    currencyCode: billingRate?.currency || 'KES',
    startMonth,
    invoicesUpdated: invoicesUpdated.length,
  }
}

// Helper function to regenerate all invoices for a developer
export async function regenerateDeveloperInvoices(
  developerId: string,
  year: number,
  session?: ClientSession,
) {
  // Get developer and their properties
  const developer = await User.findById(developerId)
    .select('first_name last_name email phone ownedProperties')
    .populate('ownedProperties', 'propertyName status')
    .session(session || null)
    .exec()

  if (!developer) {
    throw new Error('Developer not found')
  }

  // Type assertion for populated properties
  const populatedDeveloper = developer as any
  const activeProperties = populatedDeveloper.ownedProperties?.filter(
    (prop: { status: string, propertyName: string, _id: any }) => prop.status === 'active',
  ) || []

  if (activeProperties.length === 0) {
    console.log('No active properties found for developer')
    return
  }

  // Process each property
  for (const property of activeProperties) {
    await createOrUpdateDeveloperBilling(
      developerId,
      property._id.toString(),
      property.propertyName,
      session,
    )
  }
}
