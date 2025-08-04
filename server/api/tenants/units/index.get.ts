import { User } from '~~/server/models/User'
import { Unit } from '~~/server/models/Property/Unit'
import { Invoice } from '~~/server/models/Invoice'
import { Tenant } from '~~/server/models/Tenants'

export default defineEventHandler(async (event: any) => {
  console.log('Fetching rented units for user')
  const { user } = await requireUserSession(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const query = getQuery(event)
  const year = query.year ? parseInt(query.year as string) : new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  try {
    const userData = await User.findById(user._id).select('rentedUnits phone')

    if (!userData?.rentedUnits || userData.rentedUnits.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    const units = await Unit.find({
      _id: { $in: userData.rentedUnits },
    })
      .populate<{
        propertyId: { _id: any, propertyName: string }
        floorId: { _id: any, floorNumber: number }
      }>('propertyId', 'propertyName')
      .populate('floorId', 'floorNumber')
      .lean()

    const unitIds = units.map((unit: any) => unit._id)

    const tenantRecords = await Tenant.find({
      phoneNumber: userData.phone,
      unitId: { $in: unitIds },
      isActive: true,
    }).lean()

    const tenantsByUnit = new Map()
    tenantRecords.forEach((tenant: any) => {
      tenantsByUnit.set(tenant.unitId.toString(), tenant)
    })

    const tenantIds = tenantRecords.map((t: any) => t._id.toString())

    const invoices = await Invoice.find({
      'unitId': { $in: unitIds },
      'tenantId': { $in: tenantIds },
      'paymentFor.year': year,
    }).lean()

    const invoicesByUnit = new Map()
    invoices.forEach((invoice: any) => {
      const unitId = invoice.unitId.toString()
      if (!invoicesByUnit.has(unitId)) {
        invoicesByUnit.set(unitId, [])
      }
      invoicesByUnit.get(unitId).push(invoice)
    })

    const propertiesMap = new Map()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    units.forEach((unit: any, index: number) => {
      const propertyId = unit.propertyId._id.toString()
      const propertyName = unit.propertyId.propertyName
      const floorId = unit.floorId._id.toString()
      const floorNumber = unit.floorId.floorNumber
      const unitId = unit._id.toString()

      // Get tenant record for this unit
      const tenantRecord = tenantsByUnit.get(unitId)
      const tenantId = tenantRecord?._id?.toString() || ''
      const tenantName = tenantRecord ? `${tenantRecord.firstName} ${tenantRecord.lastName}` : ''
      const leaseStartDate = tenantRecord?.leaseStartDate ? new Date(tenantRecord.leaseStartDate) : null
      const leaseEndDate = tenantRecord?.leaseEndDate ? new Date(tenantRecord.leaseEndDate) : null
      const rentAmount = tenantRecord?.rentAmount || unit.rentAmount || 0

      if (!propertiesMap.has(propertyId)) {
        propertiesMap.set(propertyId, {
          propertyId,
          name: propertyName,
          role: 'tenant',
          associatedAt: unit.createdAt || new Date(),
          units: [],
        })
      }

      const property = propertiesMap.get(propertyId)

      const unitInvoices = invoicesByUnit.get(unitId) || []

      const invoicesByMonth = new Map()
      unitInvoices.forEach((invoice: any) => {
        invoicesByMonth.set(invoice.paymentFor.month, invoice)
      })

      // Generate calendar data for all 12 months
      const monthsData = []
      for (let month = 1; month <= 12; month++) {
        const invoice = invoicesByMonth.get(month)

        let status = 'future'
        let hasInvoice = false
        let isBeforeLease = false

        // Check if month is before lease start
        if (leaseStartDate) {
          const monthDate = new Date(year, month - 1, 1)
          const leaseStartMonthYear = new Date(leaseStartDate.getFullYear(), leaseStartDate.getMonth(), 1)

          if (monthDate < leaseStartMonthYear) {
            isBeforeLease = true
            status = 'before-lease'
          }
        }

        // Remove the lease end date check - we don't use it anymore
        // Only check invoice status if not before lease
        if (!isBeforeLease) {
          if (invoice) {
            hasInvoice = true
            if (invoice.status === 'paid' || invoice.isPaid) {
              status = 'paid'
            }
            else if (invoice.status === 'cancelled') {
              status = 'cancelled'
            }
            else if (year < currentYear || (year === currentYear && month < currentMonth)) {
              status = 'overdue'
            }
            else if (year === currentYear && month === currentMonth) {
              status = 'due'
            }
            else {
              status = 'future'
            }
          }
          else {
            if (year < currentYear || (year === currentYear && month < currentMonth)) {
              status = 'overdue'
            }
            else if (year === currentYear && month === currentMonth) {
              status = 'due'
            }
            else {
              status = 'future'
            }
          }
        }

        monthsData.push({
          month,
          monthName: monthNames[month - 1],
          year,
          status,
          hasInvoice,
          invoice: invoice || null,
          amount: invoice?.amount || rentAmount,
          isPaid: invoice?.isPaid || false,
          isBeforeLease,
          isAfterLease: false,
        })
      }

      property.units.push({
        unitId,
        unitNumber: unit.unitNumber,
        floorId,
        floorNumber,
        associatedAt: unit.createdAt || new Date(),
        isPrimary: index === 0,
        tenantId,
        tenantName,
        _id: unitId,
        rentAmount,
        leaseStartDate,
        leaseEndDate,
        monthsData,
        paidCount: monthsData.filter(m => m.status === 'paid').length,
        overdueCount: monthsData.filter(m => m.status === 'overdue').length,
        dueCount: monthsData.filter(m => m.status === 'due').length,
        noInvoiceCount: monthsData.filter(m => m.status === 'no-invoice').length,
      })
    })

    const formattedData = Array.from(propertiesMap.values()).map(property => ({
      ...property,
      units: property.units.sort((a: any, b: any) => b.isPrimary - a.isPrimary),
    }))

    return {
      success: true,
      data: formattedData,
      year,
      currentMonth,
      currentYear,
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch rented units',
    })
  }
})
