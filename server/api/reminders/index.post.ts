import mongoose from 'mongoose'
import { Property } from '~~/server/models/Property'
import { Invoice } from '~~/server/models/Invoice'
import { Tenant } from '~~/server/models/Tenants'
import { Reminder } from '~~/server/models/Reminder'

export default defineEventHandler(async (event) => {
  // Secure this endpoint with an API key
  const query = getQuery(event)
  const apiKey = query.apiKey || ''

  // Verify API key (store this in your .env file)
  const validApiKey = useRuntimeConfig().CRON_API_KEY

  if (apiKey !== validApiKey) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid API key',
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // Get current date info
    const now = new Date()
    const currentMonth = now.getMonth() + 1 // 1-12
    const currentYear = now.getFullYear()

    // Find all occupied units with tenants
    const occupiedUnits = await Property.aggregate([
      // Unwind arrays to get each unit
      { $unwind: '$floors' },
      { $unwind: '$floors.units' },
      // Only get occupied units
      { $match: { 'floors.units.isOccupied': true, 'floors.units.tenantId': { $exists: true, $ne: null } } },
      // Project only the fields we need
      { $project: {
        _id: 0, // Exclude _id field
        propertyId: '$_id',
        propertyName: '$propertyName',
        floorId: '$floors._id',
        floorNumber: '$floors.floorNumber',
        unitId: '$floors.units._id',
        unitNumber: '$floors.units.unitNumber',
        tenantId: '$floors.units.tenantId',
        rentAmount: '$floors.units.rentAmount',
      },
      },
    ]).session(session)

    console.log(`Found ${occupiedUnits.length} occupied units to check`)

    // Track stats
    const stats = {
      unitsChecked: occupiedUnits.length,
      remindersCreated: 0,
      skipped: 0,
      errors: 0,
    }

    // For each unit, check if rent has been paid for the current month
    for (const unit of occupiedUnits) {
      try {
        // Find tenant
        const tenant = await Tenant.findById(unit.tenantId).session(session)
        if (!tenant || !tenant.isActive) {
          stats.skipped++
          continue
        }

        // Check if there's an invoice for the current month
        const invoice = await Invoice.findOne({
          'tenantId': unit.tenantId,
          'paymentFor.month': currentMonth,
          'paymentFor.year': currentYear,
        }).session(session)

        // If there's an invoice, the tenant has paid - skip
        if (invoice) {
          stats.skipped++
          continue
        }

        // Check if a reminder for this month already exists
        const existingReminder = await Reminder.findOne({
          tenantId: unit.tenantId,
          unitId: unit.unitId,
          dueMonth: currentMonth,
          dueYear: currentYear,
          reminderType: 'rent_overdue',
        }).session(session)

        // If reminder exists, skip
        if (existingReminder) {
          stats.skipped++
          continue
        }

        // Create a new reminder for unpaid rent
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
        ]

        const reminder = new Reminder({
          tenantId: tenant._id,
          tenantName: `${tenant.firstName} ${tenant.lastName}`,
          tenantPhone: tenant.phoneNumber,
          tenantEmail: tenant.email || null,
          propertyId: unit.propertyId,
          propertyName: unit.propertyName,
          unitId: unit.unitId,
          unitNumber: unit.unitNumber,
          floorId: unit.floorId,
          floorNumber: unit.floorNumber,
          reminderType: 'rent_overdue',
          reminderStatus: 'pending',
          amount: unit.rentAmount,
          dueMonth: currentMonth,
          dueYear: currentYear,
          dueDate: new Date(currentYear, currentMonth - 1, 1), // 1st of current month
          scheduledDate: now, // Send immediately
          createdAt: now,
          messagesSent: 0,
          notes: `Overdue rent for ${monthNames[currentMonth - 1]} ${currentYear}`,
        })

        await reminder.save({ session })
        stats.remindersCreated++
      }
      catch (error) {
        console.error(`Error processing unit ${unit.unitNumber}:`, error)
        stats.errors++
      }
    }

    await session.commitTransaction()

    return {
      success: true,
      message: 'Unpaid rent check completed',
      stats,
    }
  }
  catch (error: any) {
    await session.abortTransaction()
    console.error('Error checking unpaid rent:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check for unpaid rent',
      data: error.message,
    })
  }
  finally {
    session.endSession()
  }
})
