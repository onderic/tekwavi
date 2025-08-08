import mongoose from 'mongoose'
import { UserRole } from '~~/shared/enums/roles'
import { canPerform } from '~~/server/utils/roles'
import { Property } from '~~/server/models/Property'
import { Floor } from '~~/server/models/Property/Floor'
import { Unit } from '~~/server/models/Property/Unit'
import { User } from '~~/server/models/User'
import { BillingInvoice } from '~~/server/models/Billing/BillingInvoice'
import { Notification } from '~~/server/models/Notification'
import { AuditLog } from '~~/server/models/AuditLog'
import { Expense } from '~~/server/models/Expenses'
import { Invoice } from '~~/server/models/Invoice'
import { Maintenance } from '~~/server/models/Maintenance'
import { Message } from '~~/server/models/Messaging'
import { MpesaTransaction } from '~~/server/models/MpesaTransaction'
import { PaymentSettings } from '~~/server/models/PaymentSettings'
import { Reminder } from '~~/server/models/Reminder'
import { Service } from '~~/server/models/Service'
import { ServiceFee } from '~~/server/models/ServiceFee'
import { Tenant } from '~~/server/models/Tenants'
import { purgeAnalyticsCache } from '~~/server/utils/cacheUtils'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const propertyId = event.context.params?.id

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'delete', 'propertyManagement:property')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to delete properties.',
    })
  }

  if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid property ID',
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const property = await Property.findById(propertyId).session(session)

    if (!property) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Property not found',
      })
    }

    // Initialize deletion counters
    let deletionSummary = {
      property: property.propertyName,
      floors: 0,
      units: 0,
      invoices: 0,
      billingInvoices: 0,
      notifications: 0,
      auditLogs: 0,
      expenses: 0,
      maintenance: 0,
      messages: 0,
      mpesaTransactions: 0,
      paymentSettings: 0,
      reminders: 0,
      services: 0,
      serviceFees: 0,
      tenants: 0,
      deletedUsers: 0,
      updatedUsers: 0,
    }

    // 1. Delete AuditLogs related to this property
    const deletedAuditLogs = await AuditLog.deleteMany({
      'propertyContext.propertyId': propertyId
    }, { session })
    deletionSummary.auditLogs = deletedAuditLogs.deletedCount
    console.log(`Deleted ${deletedAuditLogs.deletedCount} audit logs for property`)

    // 2. Delete Expenses for this property
    const deletedExpenses = await Expense.deleteMany({ propertyId }, { session })
    deletionSummary.expenses = deletedExpenses.deletedCount
    console.log(`Deleted ${deletedExpenses.deletedCount} expenses for property`)

    // 3. Delete Invoices for this property
    const deletedInvoices = await Invoice.deleteMany({ propertyId }, { session })
    deletionSummary.invoices = deletedInvoices.deletedCount
    console.log(`Deleted ${deletedInvoices.deletedCount} invoices for property`)

    // 4. Delete Maintenance requests for this property
    const deletedMaintenance = await Maintenance.deleteMany({ propertyId }, { session })
    deletionSummary.maintenance = deletedMaintenance.deletedCount
    console.log(`Deleted ${deletedMaintenance.deletedCount} maintenance requests for property`)

    // 5. Delete Messages related to this property
    const deletedMessages = await Message.deleteMany({
      'metadata.propertyId': propertyId
    }, { session })
    deletionSummary.messages = deletedMessages.deletedCount
    console.log(`Deleted ${deletedMessages.deletedCount} messages for property`)

    // 6. Delete MpesaTransactions for this property
    const deletedMpesaTransactions = await MpesaTransaction.deleteMany({ propertyId }, { session })
    deletionSummary.mpesaTransactions = deletedMpesaTransactions.deletedCount
    console.log(`Deleted ${deletedMpesaTransactions.deletedCount} mpesa transactions for property`)

    // 7. Delete PaymentSettings for this property
    const deletedPaymentSettings = await PaymentSettings.deleteMany({ propertyId }, { session })
    deletionSummary.paymentSettings = deletedPaymentSettings.deletedCount
    console.log(`Deleted ${deletedPaymentSettings.deletedCount} payment settings for property`)

    // 8. Delete Reminders for this property
    const deletedReminders = await Reminder.deleteMany({ propertyId }, { session })
    deletionSummary.reminders = deletedReminders.deletedCount
    console.log(`Deleted ${deletedReminders.deletedCount} reminders for property`)

    // 9. Delete Services for this property
    const deletedServices = await Service.deleteMany({ propertyId }, { session })
    deletionSummary.services = deletedServices.deletedCount
    console.log(`Deleted ${deletedServices.deletedCount} services for property`)

    // 10. Delete ServiceFees for this property
    const deletedServiceFees = await ServiceFee.deleteMany({ propertyId }, { session })
    deletionSummary.serviceFees = deletedServiceFees.deletedCount
    console.log(`Deleted ${deletedServiceFees.deletedCount} service fees for property`)

    // 11. Delete Tenants for this property
    const deletedTenants = await Tenant.deleteMany({ propertyId }, { session })
    deletionSummary.tenants = deletedTenants.deletedCount
    console.log(`Deleted ${deletedTenants.deletedCount} tenant records for property`)

    // 12. Remove property from BillingInvoices (update arrays)
    const updatedBillingInvoices = await BillingInvoice.updateMany(
      { 'properties.propertyId': propertyId },
      { $pull: { properties: { propertyId: propertyId } } },
      { session }
    )
    console.log(`Updated ${updatedBillingInvoices.modifiedCount} billing invoices to remove property`)

    // 13. Delete billing invoices that now have no properties
    const deletedEmptyBillingInvoices = await BillingInvoice.deleteMany({
      $or: [
        { properties: { $size: 0 } },
        { properties: { $exists: false } }
      ]
    }, { session })
    deletionSummary.billingInvoices = deletedEmptyBillingInvoices.deletedCount
    console.log(`Deleted ${deletedEmptyBillingInvoices.deletedCount} empty billing invoices`)

    // 14. Delete notifications related to this property
    const deletedNotifications = await Notification.deleteMany({
      $or: [
        { referenceId: propertyId },
        { 'metadata.propertyData.propertyId': propertyId },
        { 'metadata.propertyId': propertyId }
      ]
    }, { session })
    deletionSummary.notifications = deletedNotifications.deletedCount
    console.log(`Deleted ${deletedNotifications.deletedCount} notifications for property`)

    // Get all units in this property for later user cleanup
    const floors = await Floor.find({ propertyId }, null, { session })
    const floorIds = floors.map(f => f._id)
    const units = await Unit.find({ floorId: { $in: floorIds } }, null, { session })
    const unitIds = units.map(u => u._id)

    // Delete floors and units
    const deletedUnits = await Unit.deleteMany({ floorId: { $in: floorIds } }, { session })
    deletionSummary.units = deletedUnits.deletedCount
    console.log(`Deleted ${deletedUnits.deletedCount} units`)

    const deletedFloors = await Floor.deleteMany({ propertyId }, { session })
    deletionSummary.floors = deletedFloors.deletedCount
    console.log(`Deleted ${deletedFloors.deletedCount} floors`)

    // Collect users to be deleted for notification cleanup
    const usersToDelete = []

    // Handle user cleanup
    let deletedUsersCount = 0
    let updatedUsersCount = 0

    // 1. Delete caretakers assigned to this property
    const caretakersToDelete = await User.find({
      role: UserRole.CARETAKER,
      assignedProperty: propertyId
    }, null, { session })
    
    if (caretakersToDelete.length > 0) {
      usersToDelete.push(...caretakersToDelete.map(c => ({ email: c.email, phone: c.phone })))
      const deletedCaretakers = await User.deleteMany({
        _id: { $in: caretakersToDelete.map(c => c._id) }
      }, { session })
      deletedUsersCount += deletedCaretakers.deletedCount
      console.log(`Deleted ${deletedCaretakers.deletedCount} caretakers`)
    }

    // 2. Handle unit owners
    if (unitIds.length > 0) {
      // Find owners who only own units in this property
      const ownersToDelete = await User.find({
        role: UserRole.UNIT_OWNER,
        ownedUnits: { $in: unitIds },
        $expr: {
          $lte: [
            { $size: { $setDifference: ['$ownedUnits', unitIds] } },
            0
          ]
        }
      }, null, { session })

      // Delete owners who only own units in this property
      if (ownersToDelete.length > 0) {
        usersToDelete.push(...ownersToDelete.map(o => ({ email: o.email, phone: o.phone })))
        const deletedOwners = await User.deleteMany({
          _id: { $in: ownersToDelete.map(o => o._id) }
        }, { session })
        deletedUsersCount += deletedOwners.deletedCount
        console.log(`Deleted ${deletedOwners.deletedCount} unit owners`)
      }

      // Update owners who own units in other properties too
      const updatedOwners = await User.updateMany({
        role: UserRole.UNIT_OWNER,
        ownedUnits: { $in: unitIds }
      }, {
        $pull: { ownedUnits: { $in: unitIds } }
      }, { session })
      updatedUsersCount += updatedOwners.modifiedCount
      console.log(`Updated ${updatedOwners.modifiedCount} unit owners`)

      // 3. Handle tenants
      // Find tenants who only rent units in this property
      const tenantsToDelete = await User.find({
        role: UserRole.TENANT,
        rentedUnits: { $in: unitIds },
        $expr: {
          $lte: [
            { $size: { $setDifference: ['$rentedUnits', unitIds] } },
            0
          ]
        }
      }, null, { session })

      // Delete tenants who only rent units in this property
      if (tenantsToDelete.length > 0) {
        usersToDelete.push(...tenantsToDelete.map(t => ({ email: t.email, phone: t.phone })))
        const deletedTenants = await User.deleteMany({
          _id: { $in: tenantsToDelete.map(t => t._id) }
        }, { session })
        deletedUsersCount += deletedTenants.deletedCount
        console.log(`Deleted ${deletedTenants.deletedCount} tenants`)
      }

      // Update tenants who rent units in other properties too
      const updatedTenants = await User.updateMany({
        role: UserRole.TENANT,
        rentedUnits: { $in: unitIds }
      }, {
        $pull: { rentedUnits: { $in: unitIds } }
      }, { session })
      updatedUsersCount += updatedTenants.modifiedCount
      console.log(`Updated ${updatedTenants.modifiedCount} tenants`)
    }

    // Delete notifications for users that were deleted
    let deletedUserNotifications = { deletedCount: 0 }
    if (usersToDelete.length > 0) {
      const emails = usersToDelete.map(u => u.email).filter(Boolean)
      const phones = usersToDelete.map(u => u.phone).filter(Boolean)
      
      deletedUserNotifications = await Notification.deleteMany({
        $or: [
          { email: { $in: emails } },
          { phone: { $in: phones } }
        ]
      }, { session })
      console.log(`Deleted ${deletedUserNotifications.deletedCount} notifications for deleted users`)
    }

    // Update deletion summary
    deletionSummary.deletedUsers = deletedUsersCount
    deletionSummary.updatedUsers = updatedUsersCount
    deletionSummary.notifications += deletedUserNotifications.deletedCount

    // Delete the property itself
    const deletedProperty = await Property.findByIdAndDelete(propertyId, { session })

    if (!deletedProperty) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Property not found',
      })
    }

    // If the user is a developer, remove property from their owned properties list
    if (user.role === UserRole.DEVELOPER) {
      await User.findByIdAndUpdate(
        user._id,
        { $pull: { ownedProperties: propertyId } },
        { session },
      )
    }

    await session.commitTransaction()

    await purgeAnalyticsCache(propertyId)

    return {
      success: true,
      message: 'Property and all related data deleted successfully',
      deletedData: deletionSummary,
    }
  }
  catch (error: any) {
    await session.abortTransaction()
    console.error('Error deleting property:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to delete property',
    })
  }
  finally {
    await session.endSession()
  }
})