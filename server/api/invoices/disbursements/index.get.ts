import mongoose from 'mongoose'
import type { UserRole } from '~~/shared/enums/roles'
import { Property } from '~~/server/models/Property'
import { Invoice } from '~~/server/models/Invoice'
import { ServiceFee } from '~~/server/models/ServiceFee'
import { canPerform } from '~~/server/utils/roles'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'read', 'financialManagement:invoice_view')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to view disbursements.',
    })
  }

  const query = getQuery(event)
  const propertyId = query.propertyId as string
  const month = query.month ? parseInt(query.month as string) : undefined
  const year = query.year ? parseInt(query.year as string) : new Date().getFullYear()

  if (!propertyId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Property ID is required',
    })
  }

  try {
    const property = await Property.findById(propertyId)
    if (!property) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Property not found',
      })
    }

    if (user.role !== 'developer' && user.role !== 'admin') {
      const isOwner = Array.isArray(user.ownedProperties) && user.ownedProperties.includes(propertyId)
      const isManager = user.assignedProperty && user.assignedProperty.toString() === propertyId

      if (!isOwner && !isManager) {
        throw createError({
          statusCode: 403,
          statusMessage: 'You do not have access to this property',
        })
      }
    }

    // Get all service fees for this property
    const serviceFees = await ServiceFee.find({ propertyId }).lean()
    const serviceFeeMap = new Map(serviceFees.map(fee => [fee.unitType, fee.monthlyFee]))

    // Build invoice match conditions
    const invoiceMatch: any = {
      'propertyId': new mongoose.Types.ObjectId(propertyId),
      'paymentFor.year': year,
      'invoiceType': 'tenant_rent',
      'status': 'paid',
    }

    if (month) {
      invoiceMatch['paymentFor.month'] = month
    }

    // Aggregate pipeline to get individual invoices with all related data
    const results = await Invoice.aggregate([
      {
        $match: invoiceMatch,
      },
      // Lookup unit information
      {
        $lookup: {
          from: 'units',
          localField: 'unitId',
          foreignField: '_id',
          as: 'unit',
        },
      },
      {
        $unwind: {
          path: '$unit',
          preserveNullAndEmptyArrays: false, // Only include invoices with valid units
        },
      },
      // Only include units that have ownership
      {
        $match: {
          'unit.ownership': { $exists: true },
          'unit.ownership.ownerId': { $exists: true },
          'unit.ownership.isActive': true,
        },
      },
      // Lookup floor information
      {
        $lookup: {
          from: 'floors',
          localField: 'unit.floorId',
          foreignField: '_id',
          as: 'floor',
        },
      },
      {
        $unwind: {
          path: '$floor',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup tenant information
      {
        $lookup: {
          from: 'tenants',
          let: { unitId: '$unit._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$unitId', '$$unitId'] },
                    { $eq: ['$isActive', true] },
                  ],
                },
              },
            },
          ],
          as: 'tenant',
        },
      },
      {
        $unwind: {
          path: '$tenant',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup owner information
      {
        $lookup: {
          from: 'users',
          localField: 'unit.ownership.ownerId',
          foreignField: '_id',
          as: 'ownerInfo',
        },
      },
      {
        $unwind: {
          path: '$ownerInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Project invoice with all related data
      {
        $project: {
          _id: 1,
          invoiceNumber: 1,
          receiptNumber: 1,
          amount: 1,
          totalAmount: 1,
          serviceCharges: 1,
          totalServiceCharges: 1,
          paymentMethod: 1,
          paymentDate: 1,
          paymentFor: 1,
          paymentReferenceId: 1,
          unitId: '$unit._id',
          unitNumber: '$unit.unitNumber',
          unitType: '$unit.type',
          unitCategory: '$unit.category',
          floorNumber: '$floor.floorNumber',
          ownerDetails: {
            ownerId: '$unit.ownership.ownerId',
            ownerName: {
              $ifNull: [
                '$unit.ownership.ownerName',
                { $concat: ['$ownerInfo.first_name', ' ', '$ownerInfo.last_name'] },
              ],
            },
            ownerEmail: { $ifNull: ['$unit.ownership.ownerEmail', '$ownerInfo.email'] },
            ownerPhone: { $ifNull: ['$unit.ownership.ownerPhone', '$ownerInfo.phone'] },
            ownershipType: '$unit.ownership.ownershipType',
            ownershipPercentage: '$unit.ownership.ownershipPercentage',
            titleDeedNumber: '$unit.ownership.titleDeedNumber',
          },
          currentTenant: {
            tenantId: '$tenant._id',
            tenantName: { $concat: ['$tenant.firstName', ' ', '$tenant.lastName'] },
            tenantPhone: '$tenant.phoneNumber',
            tenantEmail: '$tenant.email',
          },
          // Access disbursement data from nested object
          isDisbursed: { $ifNull: ['$disbursement.isDisbursed', false] },
          disbursementDate: '$disbursement.disbursedDate',
          disbursementReference: '$disbursement.disbursementReference',
          disbursementMethod: '$disbursement.disbursementMethod',
          disbursedAmount: '$disbursement.disbursedAmount',
          disbursedBy: '$disbursement.disbursedBy',
          serviceFeeAmount: '$disbursement.serviceFeeAmount',
          netDisbursedAmount: '$disbursement.netDisbursedAmount',
          disbursementNotes: '$disbursement.disbursementNotes',
        },
      },
      {
        $sort: {
          'floorNumber': 1,
          'unitNumber': 1,
          'paymentFor.year': -1,
          'paymentFor.month': -1,
          'paymentDate': -1,
        },
      },
    ])

    // Add service fee calculation to each invoice
    const resultsWithServiceFee = results.map((invoice) => {
      const serviceFee = serviceFeeMap.get(invoice.unitType) || 0
      const disbursableAmount = invoice.amount - serviceFee

      return {
        ...invoice,
        serviceFeePerMonth: serviceFee,
        disbursableAmount,
        // For undisbursed invoices, calculate how much can be disbursed
        undisbursedDisbursableAmount: invoice.isDisbursed ? 0 : disbursableAmount,
      }
    })

    // Calculate statistics
    const totalInvoices = resultsWithServiceFee.length
    const totalAmountCollected = resultsWithServiceFee.reduce((sum, invoice) => sum + (invoice.totalAmount || invoice.amount), 0)
    const totalRentCollected = resultsWithServiceFee.reduce((sum, invoice) => sum + invoice.amount, 0)
    const totalServiceChargesCollected = resultsWithServiceFee.reduce((sum, invoice) => sum + (invoice.totalServiceCharges || 0), 0)

    const undisbursedInvoices = resultsWithServiceFee.filter(invoice => !invoice.isDisbursed)
    const disbursedInvoices = resultsWithServiceFee.filter(invoice => invoice.isDisbursed)

    const totalServiceFees = resultsWithServiceFee.reduce((sum, invoice) => sum + invoice.serviceFeePerMonth, 0)
    const totalDisbursableAmount = resultsWithServiceFee.reduce((sum, invoice) => sum + invoice.disbursableAmount, 0)
    const totalUndisbursedAmount = undisbursedInvoices.reduce((sum, invoice) => sum + invoice.disbursableAmount, 0)
    const totalDisbursedAmount = disbursedInvoices.reduce((sum, invoice) => sum + (invoice.netDisbursedAmount || 0), 0)

    // Get unique units from the invoices
    const uniqueUnits = new Set(resultsWithServiceFee.map(invoice => invoice.unitId.toString()))

    const summary = {
      totalUnits: uniqueUnits.size,
      totalInvoices,
      totalRentCollected,
      totalServiceChargesCollected,
      totalAmountCollected,
      totalServiceFees,
      totalDisbursableAmount,
      totalUndisbursedAmount,
      totalUndisbursedInvoices: undisbursedInvoices.length,
      totalDisbursedAmount,
    }

    return {
      success: true,
      property: {
        _id: property._id,
        propertyName: property.propertyName,
        categoryName: property.categoryName,
        address: property.address,
      },
      filters: {
        year,
        month: month || 'all',
      },
      summary,
      invoices: resultsWithServiceFee,
    }
  }
  catch (error: any) {
    console.error('Error fetching disbursement data:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch disbursement data',
    })
  }
})
