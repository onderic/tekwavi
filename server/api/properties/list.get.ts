import mongoose from 'mongoose'
import { UserRole } from '~~/shared/enums/roles'
import { Property } from '~~/server/models/Property'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || (user.role !== UserRole.DEVELOPER && user.role !== UserRole.ADMIN)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Only developers and developers can view properties.',
    })
  }

  try {
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 50
    const skip = (page - 1) * limit

    let matchConditions: any = {}

    if (user.role === UserRole.DEVELOPER) {
      const freshUser = await mongoose.model('User').findById(user._id).lean() as { ownedProperties?: any[] }
      matchConditions = {
        _id: { $in: freshUser?.ownedProperties?.map((id: any) => new mongoose.Types.ObjectId(id)) || [] },
      }
    }

    const properties = await Property.aggregate([
      { $match: matchConditions },

      {
        $lookup: {
          from: 'floors',
          localField: '_id',
          foreignField: 'propertyId',
          as: 'floors',
        },
      },

      {
        $lookup: {
          from: 'units',
          localField: '_id',
          foreignField: 'propertyId',
          as: 'units',
        },
      },

      {
        $addFields: {
          totalFloors: { $size: '$floors' },
          totalUnits: { $size: '$units' },
          occupiedUnits: {
            $size: {
              $filter: {
                input: '$units',
                as: 'unit',
                cond: { $eq: ['$$unit.isOccupied', true] },
              },
            },
          },
        },
      },

      {
        $addFields: {
          vacancyRate: {
            $cond: {
              if: { $gt: ['$totalUnits', 0] },
              then: {
                $concat: [
                  {
                    $toString: {
                      $round: [
                        {
                          $multiply: [
                            {
                              $divide: [
                                { $subtract: ['$totalUnits', '$occupiedUnits'] },
                                '$totalUnits',
                              ],
                            },
                            100,
                          ],
                        },
                        1,
                      ],
                    },
                  },
                  '%',
                ],
              },
              else: '100.0%',
            },
          },
        },
      },

      {
        $project: {
          _id: 1,
          propertyName: 1,
          categoryName: 1,
          address: {
            street: '$address.street',
            city: '$address.city',
            state: '$address.state',
            country: '$address.country',
          },
          stats: {
            totalFloors: '$totalFloors',
            totalUnits: '$totalUnits',
            occupiedUnits: '$occupiedUnits',
            vacancyRate: '$vacancyRate',
          },
          createdAt: 1,
        },
      },

      { $sort: { createdAt: -1 } },

      // Skip for pagination
      { $skip: skip },

      // Limit results
      { $limit: limit },
    ])
    const countResult = await Property.aggregate([
      { $match: matchConditions },
      { $count: 'total' },
    ])

    const total = countResult.length > 0 ? countResult[0].total : 0

    return {
      properties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }
  catch (error: any) {
    console.error('Error fetching properties:', error)

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch properties',
    })
  }
})
