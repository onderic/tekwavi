import mongoose from 'mongoose'
import { Invoice } from '../models/Invoice'
import { Reminder } from '../models/Reminder'

export default defineTask({
  meta: {
    name: 'generate-payment-reminders',
    description: 'Create reminders for unpaid invoices from previous month',
  },

  async run(_event: any) {
    console.log('🔄 Starting payment reminder generation task...')

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const now = new Date()
      const currentDay = now.getDate()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()

      // Only run after 1st day of month
      if (currentDay < 2) {
        console.log('📅 Task should run on or after the 2nd day of the month. Skipping...')
        return {
          result: {
            success: true,
            remindersCreated: 0,
            remindersUpdated: 0,
            skipped: { noTenant: 0, noUnit: 0 },
          },
        }
      }

      // Calculate previous month
      let previousMonth = currentMonth - 1
      let previousYear = currentYear
      if (previousMonth === 0) {
        previousMonth = 12
        previousYear = currentYear - 1
      }

      // Calculate the last day of previous month
      const lastDayOfPreviousMonth = new Date(previousYear, previousMonth, 0)

      const daysOverdue = Math.floor((now.getTime() - lastDayOfPreviousMonth.getTime()) / (1000 * 60 * 60 * 24))

      const unpaidInvoices = await Invoice.find({
        'isPaid': false,
        'status': 'issued',
        'paymentFor.month': previousMonth,
        'paymentFor.year': previousYear,
      })
        .populate('propertyId', 'propertyName')
        .populate('unitId', 'unitNumber')
        .populate('tenantId', 'firstName lastName phoneNumber email')
        .session(session)

      console.log(`🔎 Found ${unpaidInvoices.length} unpaid invoices from ${previousMonth}/${previousYear}`)
      console.log(`📅 Days since ${previousMonth}/${previousYear} ended: ${daysOverdue} days`)

      let remindersCreated = 0
      let remindersUpdated = 0
      let skippedNoTenant = 0
      let skippedNoUnit = 0
      let errors = 0

      for (const invoice of unpaidInvoices) {
        try {
          // Get unit from populated data
          const unit = invoice.unitId as any
          if (!unit || !unit.unitNumber) {
            console.warn(`⚠️ No unit found for invoice ${invoice.invoiceNumber}`)
            skippedNoUnit++
            continue
          }

          // Check if tenant exists (should be populated)
          const tenant = invoice.tenantId as any
          if (!tenant || typeof tenant !== 'object') {
            console.warn(`⚠️ No tenant found for invoice ${invoice.invoiceNumber}`)
            skippedNoTenant++
            continue
          }

          const propertyName = (invoice.propertyId as any)?.propertyName || 'Property'
          const unitNumber = unit.unitNumber

          let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
          if (daysOverdue > 60) severity = 'critical'
          else if (daysOverdue > 30) severity = 'high'
          else if (daysOverdue > 15) severity = 'medium'

          const existingReminder = await Reminder.findOne({
            invoiceId: invoice._id,
          }).session(session)

          if (existingReminder) {
            existingReminder.severity = severity
            existingReminder.daysOverdue = daysOverdue
            existingReminder.amount = invoice.amount
            existingReminder.propertyName = propertyName
            existingReminder.unitNumber = unitNumber
            existingReminder.message = `UPDATED: Reminder for rent payment for ${propertyName} - Unit ${unitNumber} for ${invoice.paymentFor?.monthName || 'Unknown'} ${invoice.paymentFor?.year || 'Unknown'}. Amount: Ksh ${invoice.amount.toLocaleString()}. This invoice is now ${daysOverdue} days overdue since ${invoice.paymentFor?.monthName} ended.`
            existingReminder.updatedAt = now

            await existingReminder.save({ session })
            remindersUpdated++
            continue
          }

          const reminder = new Reminder({
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            tenantId: tenant._id,
            tenantName: `${tenant.firstName} ${tenant.lastName}`.trim(),
            tenantPhone: tenant.phoneNumber || '',
            tenantEmail: tenant.email || '',
            propertyId: (invoice.propertyId as any)?._id || invoice.propertyId,
            propertyName: propertyName,
            unitNumber: unitNumber,
            amount: invoice.amount,
            dueDate: invoice.dueDate,
            daysOverdue: daysOverdue,
            paymentFor: invoice.paymentFor,
            severity: severity,
            status: 'pending',
            message: `Reminder for rent payment for ${propertyName} - Unit ${unitNumber} for ${invoice.paymentFor?.monthName || 'Unknown'} ${invoice.paymentFor?.year || 'Unknown'}. Amount: Ksh ${invoice.amount.toLocaleString()}. This invoice is ${daysOverdue} days overdue since ${invoice.paymentFor?.monthName} ended.`,
            createdAt: now,
            updatedAt: now,
          })

          await reminder.save({ session })
          remindersCreated++
        }
        catch (error: any) {
          console.error(`❌ Failed to process reminder for invoice ${invoice.invoiceNumber}:`, error.message)
          errors++
        }
      }

      if (unpaidInvoices.length > 0) {
        const invoiceIds = unpaidInvoices.map(invoice => invoice._id)
        await Invoice.updateMany(
          { _id: { $in: invoiceIds } },
          {
            $set: {
              reminderSent: true,
              lastReminderDate: now,
              isLate: true,
            },
          },
        ).session(session)
      }

      await session.commitTransaction()

      const monthName = new Date(previousYear, previousMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

      console.log(`✅ Reminder generation completed for ${monthName}:`)
      console.log(`   - Total unpaid invoices: ${unpaidInvoices.length}`)
      console.log(`   - Reminders created: ${remindersCreated}`)
      console.log(`   - Reminders updated: ${remindersUpdated}`)
      console.log(`   - Skipped (no tenant): ${skippedNoTenant}`)
      console.log(`   - Skipped (no unit): ${skippedNoUnit}`)
      console.log(`   - Errors: ${errors}`)

      return {
        result: {
          success: true,
          remindersCreated,
          remindersUpdated,
          skipped: {
            noTenant: skippedNoTenant,
            noUnit: skippedNoUnit,
          },
        },
      }
    }
    catch (err: any) {
      await session.abortTransaction()
      console.error('❌ Reminder generation failed:', err.message)

      return {
        result: {
          success: false,
          remindersCreated: 0,
          remindersUpdated: 0,
          skipped: {
            noTenant: 0,
            noUnit: 0,
          },
        },
      }
    }
    finally {
      session.endSession()
    }
  },
})
