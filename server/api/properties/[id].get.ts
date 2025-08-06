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

  if (!user.role || (user.role !== UserRole.DEVELOPER && user.role !== UserRole.ADMIN && user.role !== UserRole.CARETAKER)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to view property details.',
    })
  }

  try {
    const propertyId = event.context.params?.id

    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid property ID',
      })
    }

    if (user.role === UserRole.DEVELOPER) {
      if (!user.ownedProperties?.some(id => id.toString() === propertyId)) {
        throw createError({
          statusCode: 403,
          statusMessage: 'You do not have access to this property',
        })
      }
    }
    else if (user.role === UserRole.CARETAKER) {
      if (user.assignedProperty?.toString() !== propertyId) {
        throw createError({
          statusCode: 403,
          statusMessage: 'You do not have access to this property',
        })
      }
    }

    // Parse pagination params
    const query = getQuery(event)
    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.max(1, parseInt(query.limit as string) || 10)

    // Aggregate property and floors/units
    const propertyData = await Property.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(propertyId) } },

      // Lookup floors
      {
        $lookup: {
          from: 'floors',
          localField: '_id',
          foreignField: 'propertyId',
          as: 'floors',
        },
      },

      // Lookup units with pipeline for better performance
      {
        $lookup: {
          from: 'units',
          let: { propertyId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$propertyId', '$$propertyId'] } } },
            // Add floor info to each unit
            {
              $lookup: {
                from: 'floors',
                localField: 'floorId',
                foreignField: '_id',
                as: 'floorInfo',
              },
            },
            { $unwind: { path: '$floorInfo', preserveNullAndEmptyArrays: true } },
            {
              $group: {
                _id: '$floorId',
                floorNumber: { $first: '$floorInfo.floorNumber' },
                units: {
                  $push: {
                    _id: '$_id',
                    unitNumber: '$unitNumber',
                    type: '$type',
                    furnishing: '$furnishing',
                    category: '$category',
                    status: '$status',
                    isOccupied: '$isOccupied',
                    rentAmount: '$rentAmount',
                    tenantId: '$tenantId',
                    createdAt: '$createdAt',
                    updatedAt: '$updatedAt',
                  },
                },
              },
            },
          ],
          as: 'groupedUnits',
        },
      },

      // Merge floor data with grouped units
      {
        $addFields: {
          floors: {
            $map: {
              input: '$floors',
              as: 'floor',
              in: {
                $mergeObjects: [
                  {
                    _id: '$$floor._id',
                    floorNumber: '$$floor.floorNumber',
                    defaultType: '$$floor.defaultType',
                    defaultFurnishing: '$$floor.defaultFurnishing',
                    defaultCategory: '$$floor.defaultCategory',
                    defaultRentAmount: '$$floor.defaultRentAmount',
                    createdAt: '$$floor.createdAt',
                    updatedAt: '$$floor.updatedAt',
                  },
                  {
                    $let: {
                      vars: {
                        floorUnits: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: '$groupedUnits',
                                cond: { $eq: ['$$this._id', '$$floor._id'] },
                              },
                            },
                            0,
                          ],
                        },
                      },
                      in: {
                        units: { $ifNull: ['$$floorUnits.units', []] },
                        totalUnits: { $size: { $ifNull: ['$$floorUnits.units', []] } },
                        occupiedUnits: {
                          $size: {
                            $filter: {
                              input: { $ifNull: ['$$floorUnits.units', []] },
                              cond: { $eq: ['$$this.isOccupied', true] },
                            },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },

      // Calculate property-level stats
      {
        $addFields: {
          totalFloors: { $size: '$floors' },
          totalUnits: {
            $reduce: {
              input: '$floors',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.totalUnits'] },
            },
          },
          occupiedUnits: {
            $reduce: {
              input: '$floors',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.occupiedUnits'] },
            },
          },
        },
      },

      // Add vacancy rate
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
                            { $divide: [{ $subtract: ['$totalUnits', '$occupiedUnits'] }, '$totalUnits'] },
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

      // Sort floors
      {
        $addFields: {
          floors: {
            $sortArray: {
              input: '$floors',
              sortBy: { floorNumber: 1 },
            },
          },
        },
      },

      // Final projection
      {
        $project: {
          _id: 1,
          propertyName: 1,
          categoryName: 1,
          address: 1,
          description: 1,
          logo: 1, // ← Add logo field here
          constructionCost: 1,
          floors: 1,
          stats: {
            totalFloors: '$totalFloors',
            totalUnits: '$totalUnits',
            occupiedUnits: '$occupiedUnits',
            vacancyRate: '$vacancyRate',
          },
          createdAt: 1,
          updatedAt: 1,
          createdBy: 1,
        },
      },
    ])

    if (!propertyData.length) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Property not found',
      })
    }

    // Paginate floors array
    const property = propertyData[0]
    const totalFloors = property.floors.length
    const pages = Math.ceil(totalFloors / limit)
    const paginatedFloors = property.floors.slice((page - 1) * limit, page * limit)

    // Replace floors with paginated floors
    property.floors = paginatedFloors

    return {
      property,
      stats: property.stats,
      pagination: {
        page,
        limit,
        total: totalFloors,
        pages,
      },
    }
  }
  catch (error: any) {
    console.error('Error fetching property details:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch property details',
    })
  }
})
