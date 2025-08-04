import mongoose from 'mongoose'
import { Property } from '../models/Property'
import { BillingAccount } from '../models/Billing/Account'
import { BillingInvoice } from '../models/Billing/BillingInvoice'
import { User } from '../models/User'
import { BillingRate } from '../models/System/BillingRate'

export default defineTask({
  meta: {
    name: 'developer-yearly-invoice',
    description: 'Generate consolidated monthly billing invoices for all developers with properties',
  },

  async run(_event: any) {
    console.log('🔄 Starting yearly consolidated billing generation for developers...')

    const session = await mongoose.startSession()
    session.startTransaction()

    let transactionCommitted = false

    try {
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      console.log(`📅 Current date: Month ${currentMonth}, Year ${currentYear}`)

      if (currentMonth !== 1 && !_event?.force) {
        console.log(`⏭️ Skipping task - current month is ${currentMonth}, not January. Use force=true to override.`)
        return {
          result: {
            success: true,
            message: 'Task skipped - not January',
            skipped: true,
          } as any,
        }
      }

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

      // Get current billing rate
      const billingRate = await BillingRate.findOne({ isActive: true }).session(session)
      const defaultMonthlyRate = billingRate?.monthlyRate || 5000
      console.log(`💰 Current billing rate: ${defaultMonthlyRate} ${billingRate?.currency || 'KES'}`)

      const validDeveloperIds = _event?.developerIds || []
      const hasValidDeveloperFilter = validDeveloperIds.length > 0

      // Get all developers with properties
      const developersQuery: Record<string, any> = {
        role: 'developer',
        ownedProperties: { $exists: true, $not: { $size: 0 } },
      }

      // Add filter for specific developer IDs if provided
      if (hasValidDeveloperFilter) {
        developersQuery._id = { $in: validDeveloperIds.map((id: string) => new mongoose.Types.ObjectId(id)) }
      }

      const developers = await User.find(developersQuery).session(session)

      console.log(`👨‍💻 Found ${developers.length} developers with properties`)

      let accountsCreated = 0
      let accountsUpdated = 0
      let invoicesCreated = 0
      let errors = 0

      // Track processed developers by ID
      const processedDevelopers = new Set()

      // Also track by email to avoid processing developers with same email
      const processedEmails = new Set()

      for (const developer of developers) {
        try {
          const developerId = developer._id.toString()
          const developerEmail = developer.email

          // Log the developer ID for debugging
          console.log(`   🔑 Developer ID: ${developerId}`)
          console.log(`   📧 Developer email: ${developerEmail}`)

          // Skip if we've already processed this developer ID or email
          if (processedDevelopers.has(developerId)) {
            console.log(`   ⚠️ Skipping duplicate developer ID ${developerId}`)
            continue
          }

          if (processedEmails.has(developerEmail)) {
            console.log(`   ⚠️ Skipping duplicate developer email ${developerEmail}`)
            continue
          }

          processedDevelopers.add(developerId)
          processedEmails.add(developerEmail)

          console.log(`\n👤 Processing developer ${developer.first_name} ${developer.last_name}...`)

          // Get developer's properties
          const developerProperties = await Property.find({
            _id: { $in: developer.ownedProperties },
            status: 'active',
          }).session(session)

          console.log(`   🏢 Developer has ${developerProperties.length} active properties`)

          if (developerProperties.length === 0) {
            console.log(`   ⚠️ Skipping developer - no active properties found`)
            continue
          }

          // Find or create billing account for this developer
          let billingAccount = await BillingAccount.findOne({
            developerId: developer._id,
          }).session(session)

          if (!billingAccount) {
            // Create new billing account
            billingAccount = new BillingAccount({
              developerId: developer._id,
              developerName: `${developer.first_name} ${developer.last_name}`,
              developerEmail: developer.email,
              developerPhone: developer.phone,
              fixedMonthlyRate: defaultMonthlyRate,
            })
            await billingAccount.save({ session })
            accountsCreated++
            console.log(`   📝 Created new billing account for developer ID ${developerId}`)
          }
          else {
            // Update account with latest rate if needed
            if (billingAccount.fixedMonthlyRate !== defaultMonthlyRate) {
              billingAccount.fixedMonthlyRate = defaultMonthlyRate
              await billingAccount.save({ session })
            }
            accountsUpdated++
            console.log(`   📝 Found existing billing account for developer ID ${developerId}`)
          }

          // Check if invoices already exist for this year
          const existingInvoiceCount = await BillingInvoice.countDocuments({
            developerId: developer._id,
            year: currentYear,
          }).session(session)

          if (existingInvoiceCount > 0 && !_event?.force) {
            console.log(`   ⚠️ Billing invoices already exist for ${currentYear}. Use force=true to regenerate.`)
            continue
          }

          // If force=true, delete existing invoices for the current year
          if (_event?.force && existingInvoiceCount > 0) {
            await BillingInvoice.deleteMany({
              developerId: developer._id,
              year: currentYear,
            }).session(session)
            console.log(`   🗑️ Deleted ${existingInvoiceCount} existing invoices for ${currentYear}`)
          }

          // Build properties array for consolidated invoices
          const propertyItems = developerProperties.map(property => ({
            propertyId: property._id,
            propertyName: property.propertyName,
            status: 'active',
            amount: billingAccount.fixedMonthlyRate,
          }))

          // Calculate total amount per invoice
          const totalAmountPerInvoice = propertyItems.reduce((sum, prop) => sum + prop.amount, 0)

          // Create consolidated monthly invoices
          const invoiceBatch = []

          for (let month = 1; month <= 12; month++) {
            const dueDate = new Date(currentYear, month - 1, 5)

            // Get developer initials for invoice number
            const firstInitial = developer.first_name?.[0]?.toUpperCase() || 'X'
            const lastInitial = developer.last_name?.[0]?.toUpperCase() || 'X'

            // Generate invoice number with developer initials
            const invoiceNumber = `INV-${firstInitial}${lastInitial}-${developerId.slice(-4).toUpperCase()}-${currentYear}${month.toString().padStart(2, '0')}`

            invoiceBatch.push({
              developerId: developer._id,
              developerName: `${developer.first_name} ${developer.last_name}`,
              developerEmail: developer.email,
              developerPhone: developer.phone,
              month,
              monthName: monthNames[month - 1],
              year: currentYear,
              properties: propertyItems,
              totalAmount: totalAmountPerInvoice,
              isPaid: false,
              BillinginvoiceNumber: invoiceNumber,
              dueDate,
              status: 'issued',
            })

            invoicesCreated++
          }

          // Bulk insert all invoices at once for better performance
          if (invoiceBatch.length > 0) {
            await BillingInvoice.insertMany(invoiceBatch, { session })
          }

          console.log(`   ✅ Generated ${invoiceBatch.length} consolidated invoices for ${developerProperties.length} properties for ${currentYear}`)
          console.log(`   💰 Monthly rate per property: ${billingAccount.fixedMonthlyRate}`)
        }
        catch (developerError: any) {
          console.error(`❌ Failed to process developer ID ${developer._id}: ${developerError.message}`)
          errors++
        }
      }

      await session.commitTransaction()
      transactionCommitted = true

      console.log(`\n✅ Yearly billing generation completed for ${currentYear}:`)
      console.log(`   - Developers with properties: ${developers.length}`)
      console.log(`   - Billing accounts created: ${accountsCreated}`)
      console.log(`   - Billing accounts updated: ${accountsUpdated}`)
      console.log(`   - Billing invoices created: ${invoicesCreated}`)
      console.log(`   - Errors: ${errors}`)

      return {
        result: {
          success: true,
          message: `Successfully generated billing records for ${currentYear}`,
          year: currentYear,
          accountsCreated,
          accountsUpdated,
          invoicesCreated,
          errors,
        } as any,
      }
    }
    catch (err: any) {
      if (!transactionCommitted) {
        await session.abortTransaction()
      }
      console.error('❌ Yearly billing generation failed:', err.message)

      return {
        result: {
          success: false,
          error: err.message,
        } as any,
      }
    }
    finally {
      session.endSession()
    }
  },
})
