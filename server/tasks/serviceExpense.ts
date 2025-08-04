import mongoose from 'mongoose'
import { Service } from '../models/Service'
import { Expense } from '../models/Expenses'

export default defineTask({
  meta: {
    name: 'generate-monthly-service-expenses',
    description: 'Generate monthly expenses for all active services',
  },

  async run(_event: any) {
    console.log('🔄 Starting monthly service expense generation task...')

    const session = await mongoose.startSession()
    session.startTransaction()

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    const expenseDate = new Date(currentYear, currentMonth, 1)
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1)
    const monthName = expenseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    try {
      const existingExpenses = await Expense.find({
        isServiceExpense: true,
        date: {
          $gte: expenseDate,
          $lt: nextMonthDate,
        },
      }, { serviceId: 1 }).session(session)

      const servicesWithExpenses = existingExpenses
        .filter(exp => exp.serviceId != null)
        .map(exp => exp.serviceId!.toString())

      const servicesQuery = {
        isActive: true,
        monthlyCost: { $gt: 0 },
        ...(servicesWithExpenses.length > 0 && { _id: { $nin: servicesWithExpenses } }),
      }

      const services = await Service.find(servicesQuery).session(session)

      console.log(`🔎 Found ${services.length} active services without expenses for ${monthName}`)

      let expensesCreated = 0
      let expensesUpdated = 0
      let errors = 0
      let skippedInactive = 0
      let skippedNoCost = 0

      // Update existing expenses if needed
      const servicesWithExpensesToUpdate = await Service.find({
        _id: { $in: servicesWithExpenses },
        isActive: true,
        monthlyCost: { $gt: 0 },
      }).session(session)

      for (const service of servicesWithExpensesToUpdate) {
        try {
          const existingExpense = await Expense.findOne({
            serviceId: service._id,
            isServiceExpense: true,
            date: {
              $gte: expenseDate,
              $lt: nextMonthDate,
            },
          }).session(session)

          if (existingExpense
            && (existingExpense.amount !== service.monthlyCost
              || existingExpense.serviceName !== service.serviceName)) {
            existingExpense.amount = service.monthlyCost
            existingExpense.title = `${service.serviceName} - ${monthName}`
            existingExpense.serviceName = service.serviceName
            existingExpense.description = `Monthly service charge for ${service.serviceName} provided by ${service.serviceProvider}`

            await existingExpense.save({ session })
            expensesUpdated++
          }
        }
        catch (error: any) {
          console.error(`❌ Error updating expense for service ${service.serviceName}:`, error.message)
          errors++
        }
      }

      // Create new expenses
      for (const service of services) {
        try {
          if (!service.isActive) {
            skippedInactive++
            continue
          }

          if (service.monthlyCost <= 0) {
            skippedNoCost++
            continue
          }

          await Expense.create([{
            title: `${service.serviceName} - ${monthName}`,
            description: `Monthly service charge for ${service.serviceName} provided by ${service.serviceProvider}`,
            amount: service.monthlyCost,
            category: 'services',
            date: expenseDate,
            propertyId: service.propertyId,
            propertyName: service.propertyName,
            paymentMethod: 'bank_transfer',
            isServiceExpense: true,
            serviceId: service._id,
            serviceName: service.serviceName,
            createdBy: service.createdBy,
          }], { session })

          service.nextBillingDate = nextMonthDate
          await service.save({ session })

          expensesCreated++
        }
        catch (error: any) {
          console.error(`❌ Error creating expense for service ${service.serviceName}:`, error.message)
          errors++
        }
      }

      // Clean up deactivated services
      const deactivatedServices = await Service.find({
        isActive: false,
        _id: { $in: servicesWithExpenses },
      }).session(session)

      let expensesDeleted = 0
      for (const service of deactivatedServices) {
        try {
          const result = await Expense.deleteMany({
            serviceId: service._id,
            isServiceExpense: true,
            date: {
              $gte: expenseDate,
              $lt: nextMonthDate,
            },
          }).session(session)

          if (result.deletedCount > 0) {
            expensesDeleted += result.deletedCount
          }
        }
        catch (error: any) {
          console.error(`❌ Error deleting expense for deactivated service ${service.serviceName}:`, error.message)
          errors++
        }
      }

      await session.commitTransaction()

      console.log(`✅ Service expense generation completed for ${monthName}:`)
      console.log(`   - Total services processed: ${services.length + servicesWithExpensesToUpdate.length}`)
      console.log(`   - Expenses created: ${expensesCreated}`)
      console.log(`   - Expenses updated: ${expensesUpdated}`)
      console.log(`   - Expenses deleted: ${expensesDeleted}`)
      console.log(`   - Errors: ${errors}`)
      console.log(`   - Skipped (inactive): ${skippedInactive}`)
      console.log(`   - Skipped (no cost): ${skippedNoCost}`)

      return {
        result: {
          success: true,
          month: monthName,
          expensesCreated,
          expensesUpdated,
          expensesDeleted,
          errors,
          servicesProcessed: services.length + servicesWithExpensesToUpdate.length,
          skipped: {
            inactive: skippedInactive,
            noCost: skippedNoCost,
          },
        },
      }
    }
    catch (err: any) {
      await session.abortTransaction()
      console.error('❌ Service expense generation failed:', err.message)

      return {
        result: {
          success: false,
          month: monthName ?? '',
          expensesCreated: 0,
          expensesUpdated: 0,
          expensesDeleted: 0,
          errors: 1,
          servicesProcessed: 0,
          skipped: {
            inactive: 0,
            noCost: 0,
          },
          error: err.message,
        },
      }
    }
    finally {
      session.endSession()
    }
  },
})
