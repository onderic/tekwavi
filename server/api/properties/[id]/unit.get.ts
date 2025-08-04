import mongoose from 'mongoose'
import { Unit } from '~~/server/models/Property/Unit'

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

    if (!unitId || !mongoose.Types.ObjectId.isValid(unitId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid unit ID',
      })
    }

    const unitObjectId = new mongoose.Types.ObjectId(unitId)

    const result = await Unit.aggregate([
      {
        $match: {
          _id: unitObjectId,
        },
      },

      // Lookup property to get property name
      {
        $lookup: {
          from: 'properties',
          localField: 'propertyId',
          foreignField: '_id',
          as: 'property',
        },
      },
      {
        $unwind: {
          path: '$property',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup floor to get floor number
      {
        $lookup: {
          from: 'floors',
          localField: 'floorId',
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

      // Lookup tenant data
      {
        $lookup: {
          from: 'tenants',
          let: { unitId: '$_id' },
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
        $addFields: {
          tenant: { $arrayElemAt: ['$tenant', 0] },
        },
      },

      // Lookup service fee for this unit type
      {
        $lookup: {
          from: 'servicefees',
          let: {
            propertyId: '$propertyId',
            unitType: '$type',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$propertyId', '$$propertyId'] },
                    { $eq: ['$unitType', '$$unitType'] },
                  ],
                },
              },
            },
          ],
          as: 'serviceFee',
        },
      },
      {
        $addFields: {
          serviceFee: { $arrayElemAt: ['$serviceFee', 0] },
        },
      },

      {
        $project: {
          unit: {
            _id: '$_id',
            unitNumber: '$unitNumber',
            type: '$type',
            furnishing: '$furnishing',
            category: '$category',
            status: '$status',
            isOccupied: '$isOccupied',
            rentAmount: '$rentAmount',
            tenantId: '$tenantId',
            floorId: '$floorId',
            floorNumber: '$floor.floorNumber',
            propertyId: '$propertyId',
            propertyName: '$property.propertyName',
            updatedAt: '$updatedAt',
            createdAt: '$createdAt',
          },
          ownership: '$ownership',
          tenant: {
            $cond: {
              if: { $ifNull: ['$tenant', false] },
              then: {
                _id: '$tenant._id',
                firstName: '$tenant.firstName',
                lastName: '$tenant.lastName',
                phoneNumber: '$tenant.phoneNumber',
                nationalId: '$tenant.nationalId',
                email: '$tenant.email',
                rentalType: '$tenant.rentalType',
                leaseStartDate: '$tenant.leaseStartDate',
                leaseEndDate: '$tenant.leaseEndDate',
                rentAmount: '$tenant.rentAmount',
                depositAmount: '$tenant.depositAmount',
                isActive: '$tenant.isActive',
                moveOutDate: '$tenant.moveOutDate',
                moveOutReason: '$tenant.moveOutReason',
                createdAt: '$tenant.createdAt',
                updatedAt: '$tenant.updatedAt',
              },
              else: null,
            },
          },
          serviceFee: {
            $cond: {
              if: { $ifNull: ['$serviceFee', false] },
              then: {
                _id: '$serviceFee._id',
                monthlyFee: '$serviceFee.monthlyFee',
                isConfigured: true,
                createdAt: '$serviceFee.createdAt',
                updatedAt: '$serviceFee.updatedAt',
              },
              else: {
                _id: null,
                monthlyFee: 0,
                isConfigured: false,
              },
            },
          },
        },
      },
    ])

    if (!result || result.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Unit not found',
      })
    }

    return result[0]
  }
  catch (error: any) {
    console.error('Error fetching unit details:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch unit details',
    })
  }
})
