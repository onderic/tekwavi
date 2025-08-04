import mongoose from 'mongoose'
import { Unit } from '../models/Property/Unit'
import { Invoice } from '../models/Invoice'
import { Tenant } from '../models/Tenants'
import { Service } from '../models/Service'
import { ServiceFee } from '../models/ServiceFee'

export default defineTask({
  meta: {
    name: 'generate-monthly-invoices',
    description: 'Generate monthly invoices for all occupied units without invoices',
  },

  async run(_event: any) {
    console.log('🔄 Starting monthly invoice generation task...')

    const session = await mongoose.startSession()
    session.startTransaction()

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-12
    const currentMonthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][currentMonth - 1]
    const dueDate = new Date(currentYear, currentMonth - 1, 5)

    try {
      const existingInvoices = await Invoice.find({
        'paymentFor.year': currentYear,
        'paymentFor.month': currentMonth,
        'invoiceType': 'tenant_rent',
      }, { unitId: 1 }).session(session)

      // Filter out any invoices with null/undefined unitId and convert to strings
      const unitsWithInvoices = existingInvoices
        .filter(inv => inv.unitId != null)
        .map(inv => inv.unitId.toString())

      // Fetch all occupied units that don't have invoices yet
      const unitsQuery = unitsWithInvoices.length > 0
        ? { _id: { $nin: unitsWithInvoices }, isOccupied: true }
        : { isOccupied: true }

      const units = await Unit.find(unitsQuery).populate('propertyId').session(session)

      console.log(`🔎 Found ${units.length} occupied units without invoices for ${currentMonthName} ${currentYear}`)

      let invoicesCreated = 0
      let errors = 0
      let skippedNoTenant = 0
      let skippedNoProperty = 0
      let skippedNotRented = 0
      let skippedFixedLease = 0

      for (const unit of units) {
        try {
          // Skip if unit is not rented
          if (unit.status !== 'rented') {
            skippedNotRented++
            continue
          }

          // Get tenant info
          const tenant = await Tenant.findOne({
            unitId: unit._id,
            isActive: true,
          }).session(session)

          if (!tenant) {
            console.log(`⚠️ No active tenant found for unit ${unit.unitNumber}`)
            skippedNoTenant++
            continue
          }

          // Skip invoice creation for fixed-term tenants during their lease period
          if (tenant.rentalType === 'fixed') {
            const leaseStartDate = new Date(tenant.leaseStartDate)
            const leaseEndDate = new Date(tenant.leaseEndDate)

            // Check if current month falls within lease period
            const currentMonthDate = new Date(currentYear, currentMonth - 1, 1)

            if (currentMonthDate >= leaseStartDate && currentMonthDate <= leaseEndDate) {
              console.log(`⏭️ Skipping invoice for unit ${unit.unitNumber} - month falls within fixed lease period`)
              skippedFixedLease++
              continue
            }
          }

          const property = unit.propertyId as any
          if (!property || !property.propertyName) {
            console.log(`⚠️ Property not found for unit ${unit.unitNumber}`)
            skippedNoProperty++
            continue
          }

          // Fetch mandatory active services for the property
          const mandatoryServices = await Service.find({
            propertyId: property._id,
            isActive: true,
            isMandatory: true,
          }).session(session)

          // Get unit-type service fee
          const serviceFee = await ServiceFee.findOne({
            propertyId: property._id,
            unitType: unit.type,
          }).session(session)

          // Prepare service charges array (exclude unit-type service charges)
          const serviceCharges = mandatoryServices
            .filter(service => !service._id.toString().startsWith('unit-type-'))
            .map(service => ({
              serviceId: service._id,
              serviceName: service.serviceName,
              amount: service.costPerUnit,
            }))

          // Calculate total service charges
          const totalServiceCharges = serviceCharges.reduce((sum, charge) => sum + charge.amount, 0)

          // Calculate amounts based on tenant type
          const serviceFeeAmount = serviceFee?.monthlyFee || 0
          let rentAmount = 0

          if (tenant.rentalType === 'owner_occupied') {
            // For owner-occupied units, the amount is only the service fee
            rentAmount = serviceFeeAmount
          }
          else {
            // For regular tenants, use rent amount plus service fee (if applicable)
            rentAmount = (tenant.rentAmount || unit.rentAmount || 0) + serviceFeeAmount
          }

          // Calculate total amount (rent + service charges)
          const totalAmount = rentAmount + totalServiceCharges

          // Generate invoice number with timestamp for uniqueness
          const propertyPrefix = property.propertyName.substring(0, 3).toUpperCase()
          const year = currentYear.toString().substring(2)
          const month = currentMonth.toString().padStart(2, '0')

          const invoiceCount = await Invoice.countDocuments({
            'propertyId': property._id,
            'paymentFor.year': currentYear,
            'paymentFor.month': currentMonth,
            'invoiceType': 'tenant_rent',
          }).session(session)

          const sequence = (invoiceCount + 1).toString().padStart(3, '0')
          const timestamp = Date.now().toString().slice(-4)
          const invoiceNumber = `${propertyPrefix}-${year}${month}-${sequence}-${timestamp}`
          const receiptNumber = `R${invoiceNumber}`

          await Invoice.create([{
            invoiceNumber,
            receiptNumber,
            invoiceType: 'tenant_rent',
            propertyId: property._id,
            unitId: unit._id,
            unitNumber: unit.unitNumber,
            tenantId: tenant._id,
            tenantName: `${tenant.firstName} ${tenant.lastName}`,
            amount: rentAmount,
            serviceCharges: serviceCharges,
            totalServiceCharges: totalServiceCharges,
            totalAmount: totalAmount,
            paymentMethod: '',
            paymentReferenceId: '',
            phoneNumber: tenant.phoneNumber || '',
            isPaid: false,
            paymentDate: null,
            dueDate: dueDate,
            isLate: false,
            status: 'issued',
            paymentFor: {
              month: currentMonth,
              monthName: currentMonthName,
              year: currentYear,
            },
            recordedBy: null,
            // Owner-occupied unit tracking
            isOwnerOccupied: tenant.rentalType === 'owner_occupied',
            ownerServiceFeeAmount: tenant.rentalType === 'owner_occupied' ? serviceFeeAmount : 0,
            rentOnlyAmount: tenant.rentalType === 'owner_occupied' ? 0 : (tenant.rentAmount || unit.rentAmount || 0),
          }], { session })

          console.log(`✅ Created invoice ${invoiceNumber} for unit ${unit.unitNumber} (Amount: ${rentAmount}, Services: ${totalServiceCharges})`)
          invoicesCreated++
        }
        catch (unitError: any) {
          console.error(`❌ Error creating invoice for unit ${unit.unitNumber}:`, unitError.message)
          errors++
        }
      }

      await session.commitTransaction()

      console.log(`✅ Invoice generation completed for ${currentMonthName} ${currentYear}:`)
      console.log(`   - Total units processed: ${units.length}`)
      console.log(`   - Invoices created: ${invoicesCreated}`)
      console.log(`   - Errors: ${errors}`)
      console.log(`   - Skipped (not rented): ${skippedNotRented}`)
      console.log(`   - Skipped (no tenant): ${skippedNoTenant}`)
      console.log(`   - Skipped (no property): ${skippedNoProperty}`)
      console.log(`   - Skipped (fixed lease): ${skippedFixedLease}`)
      console.log(`   - Skipped (fixed lease): ${skippedFixedLease}`)

      return {
        result: {
          success: true,
          month: `${currentMonthName} ${currentYear}`,
          invoicesCreated,
          errors,
          unitsProcessed: units.length,
          skipped: {
            notRented: skippedNotRented,
            noTenant: skippedNoTenant,
            noProperty: skippedNoProperty,
            fixedLease: skippedFixedLease,
          },
        },
      }
    }
    catch (err: any) {
      await session.abortTransaction()
      console.error('❌ Invoice generation failed:', err.message)
      console.error('Stack trace:', err.stack)

      return {
        result: {
          success: false,
          month: `${currentMonthName ?? ''} ${currentYear ?? ''}`,
          invoicesCreated: 0,
          errors: 1,
          unitsProcessed: 0,
          skipped: {
            notRented: 0,
            noTenant: 0,
            noProperty: 0,
            fixedLease: 0,
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
