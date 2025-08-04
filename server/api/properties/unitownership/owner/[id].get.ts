import { Unit } from '~~/server/models/Property/Unit'
import { Invoice } from '~~/server/models/Invoice'
import { Tenant } from '~~/server/models/Tenants'
import { ServiceFee } from '~~/server/models/ServiceFee'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  try {
    const unitId = getRouterParam(event, 'id')

    if (!unitId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Unit ID is required',
      })
    }

    const unit = await Unit.findById(unitId)
      .populate('propertyId')
      .populate('floorId', 'floorNumber floorName')
      .populate('ownership.ownerId', 'first_name last_name email phone')
      .lean()

    if (!unit) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Unit not found',
      })
    }

    // Get service fee for this unit type
    const serviceFee = await ServiceFee.findOne({
      propertyId: unit.propertyId._id,
      unitType: unit.type,
    }).lean()

    const serviceFeePerMonth = serviceFee?.monthlyFee || 0

    const currentTenant = await Tenant.findOne({
      unitId: unitId,
      isActive: true,
    }).lean()

    const paymentHistory = await Invoice.find({
      unitId: unitId,
      isPaid: true,
      status: { $in: ['paid', 'refunded'] },
      invoiceType: 'tenant_rent', // Only rent payments
    })
      .sort({ paymentDate: -1 })
      .populate('tenantId', 'firstName lastName phoneNumber email')
      .populate('recordedBy', 'first_name last_name')
      .populate('disbursement.disbursedBy', 'first_name last_name')
      .lean()

    const outstandingInvoices = await Invoice.find({
      unitId: unitId,
      isPaid: false,
      status: { $in: ['issued', 'draft'] },
    })
      .sort({ dueDate: 1 })
      .populate('tenantId', 'firstName lastName phoneNumber email')
      .lean()

    // Calculate financial summaries with disbursement info
    const totalCollected = paymentHistory.reduce((sum, invoice) => sum + (invoice.amount || 0), 0)
    const totalServiceChargesCollected = paymentHistory.reduce((sum, invoice) => sum + (invoice.totalServiceCharges || 0), 0)
    const totalOutstanding = outstandingInvoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0)

    // Calculate disbursement totals - exclude service fees for owner-occupied units
    const totalDisbursed = paymentHistory
      .filter(inv => inv.disbursement?.isDisbursed)
      .reduce((sum, invoice) => sum + (invoice.disbursement?.netDisbursedAmount || 0), 0)

    const pendingDisbursement = paymentHistory
      .filter(inv => !inv.disbursement?.isDisbursed)
      .reduce((sum, invoice) => {
        // For owner-occupied units, don't include service fees in disbursement
        if (invoice.isOwnerOccupied) {
          return sum + (invoice.rentOnlyAmount || 0)
        }
        // For regular tenants, subtract service fee from total amount
        const amount = invoice.amount || 0
        const serviceFee = serviceFeePerMonth
        return sum + (amount - serviceFee)
      }, 0)

    const totalServiceFees = paymentHistory
      .filter(inv => inv.disbursement?.isDisbursed)
      .reduce((sum, invoice) => sum + (invoice.disbursement?.serviceFeeAmount || 0), 0)
      + paymentHistory
        .filter(inv => !inv.disbursement?.isDisbursed)
        .reduce((sum, invoice) => {
          // Use the tracked service fee amount for owner-occupied units
          if (invoice.isOwnerOccupied) {
            return sum + (invoice.ownerServiceFeeAmount || 0)
          }
          // Use the fixed service fee for regular tenants
          return sum + serviceFeePerMonth
        }, 0)

    const property = unit.propertyId as any

    return {
      success: true,
      unit: {
        _id: unit._id,
        unitNumber: unit.unitNumber,
        type: unit.type,
        furnishing: unit.furnishing,
        category: unit.category,
        status: unit.status,
        isOccupied: unit.isOccupied,
        rentAmount: unit.rentAmount,
        serviceFeePerMonth,
        property: property
          ? {
              _id: property._id,
              propertyName: property.propertyName,
              address: property.address?.street || property.address,
              city: property.address?.city || property.city,
              state: property.address?.state || property.state,
              zipCode: property.address?.postalCode || property.zipCode,
              country: property.address?.country || property.country,
              propertyType: property.propertyType,
            }
          : null,

        floor: unit.floorId,

        currentTenant: currentTenant
          ? {
              _id: currentTenant._id,
              name: `${currentTenant.firstName} ${currentTenant.lastName}`,
              phoneNumber: currentTenant.phoneNumber,
              email: currentTenant.email,
              leaseStartDate: currentTenant.leaseStartDate,
              leaseEndDate: currentTenant.leaseEndDate,
              rentAmount: currentTenant.rentAmount,
              depositAmount: currentTenant.depositAmount,
            }
          : null,

        ownership: unit.ownership,
        previousOwners: unit.previousOwners,
        titleDeedNumber: unit.ownership?.titleDeedNumber || unit.titleDeedNumber,
        registrationDate: unit.registrationDate,
        ownershipNotes: unit.ownershipNotes,

        financialSummary: {
          totalCollected,
          totalServiceChargesCollected,
          totalOutstanding,
          lastPaymentDate: paymentHistory[0]?.paymentDate || null,
          totalPayments: paymentHistory.length,
          totalDisbursed,
          pendingDisbursement,
          totalServiceFees,
        },
      },

      paymentHistory: paymentHistory.map(invoice => ({
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        receiptNumber: invoice.receiptNumber,
        amount: invoice.amount,
        totalAmount: invoice.totalAmount || invoice.amount,
        paymentDate: invoice.paymentDate,
        paymentMethod: invoice.paymentMethod,
        paymentReferenceId: invoice.paymentReferenceId,
        paymentFor: invoice.paymentFor,
        tenantName: invoice.tenantName || (invoice.tenantId ? `${(invoice.tenantId as any).firstName} ${(invoice.tenantId as any).lastName}` : ''),
        recordedBy: invoice.recordedBy,
        status: invoice.status,
        // Disbursement fields
        isDisbursed: invoice.disbursement?.isDisbursed || false,
        disbursementDate: invoice.disbursement?.disbursedDate,
        disbursementMethod: invoice.disbursement?.disbursementMethod,
        disbursementReference: invoice.disbursement?.disbursementReference,
        disbursedAmount: invoice.disbursement?.disbursedAmount,
        serviceFeeAmount: invoice.disbursement?.isDisbursed
          ? invoice.disbursement?.serviceFeeAmount
          : serviceFeePerMonth,
        netDisbursedAmount: invoice.disbursement?.isDisbursed
          ? invoice.disbursement?.netDisbursedAmount
          : (invoice.amount - serviceFeePerMonth),
        disbursedBy: invoice.disbursement?.disbursedBy,
      })),

      outstandingInvoices: outstandingInvoices.map(invoice => ({
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
        isLate: invoice.isLate,
        paymentFor: invoice.paymentFor,
        tenantName: invoice.tenantName || (invoice.tenantId ? `${(invoice.tenantId as any).firstName} ${(invoice.tenantId as any).lastName}` : ''),
        status: invoice.status,
      })),
    }
  }
  catch (error: any) {
    console.error('Error fetching unit details:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch unit details',
    })
  }
})
