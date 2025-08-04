import mongoose from 'mongoose'
import { Unit } from '~~/server/models/Property/Unit'
import { User as UserModel } from '~~/server/models/User'
import { Notification } from '~~/server/models/Notification'
import type { UserRole } from '~~/shared/enums/roles'
import { canPerform } from '~~/server/utils/roles'

export default defineEventHandler(async (event) => {
  const { user: requestingUser } = await requireUserSession(event)

  if (!requestingUser) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!requestingUser.role || !canPerform(requestingUser.role as UserRole, 'create', 'propertyManagement:unitOwnership')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to assign unit ownership.',
    })
  }

  const session = await mongoose.startSession()

  try {
    await session.startTransaction()

    const body = await readBody(event)
    const { unitId, createNewUser, userDetails, ownership } = body

    if (!unitId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Unit ID is required',
      })
    }

    if (!ownership) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ownership details are required',
      })
    }

    const unit = await Unit.findById(unitId)
      .populate('propertyId', 'propertyName address type')
      .session(session)

    if (!unit) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Unit not found',
      })
    }

    const property = unit.propertyId as any

    if (unit.ownership?.isActive && unit.ownership?.ownerId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Unit already has an active owner',
      })
    }

    let ownerId = null
    let assignedUser = null
    let password = null
    let isNewUser = false

    if (createNewUser && userDetails) {
      const existingUser = await UserModel.findOne({
        $or: [
          { phone: userDetails.phone },
          { nationalId: userDetails.nationalId },
        ],
      }).session(session)

      if (existingUser) {
        assignedUser = existingUser
        ownerId = existingUser._id
        isNewUser = false
        if (!existingUser.ownedUnits.includes(unitId)) {
          existingUser.ownedUnits.push(unitId)
          await existingUser.save({ session })
        }

        // Send notification about new unit assignment
        await Notification.create([{
          role: 'unit_owner',
          phone: existingUser.phone,
          title: 'Additional Property Ownership Assigned',
          senderId: requestingUser._id,
          message: `You have been assigned as the owner of unit ${unit.unitNumber} at ${property?.propertyName || 'the property'}. This unit has been added to your existing portfolio.`,
          type: 'system',
          referenceId: unit._id.toString(),
          referenceModel: 'Unit',
          status: 'pending',
          metadata: {
            propertyData: {
              propertyId: property?._id || unit.propertyId,
              propertyName: property?.propertyName || 'Unknown Property',
              propertyAddress: property?.address || '',
              propertyType: property?.type || '',
              unitNumber: unit.unitNumber,
              unitId: unit._id,
            },
            ownershipData: {
              purchaseDate: ownership.purchaseDate,
              purchaseAmount: ownership.purchaseAmount,
              ownershipType: ownership.ownershipType,
              titleDeedNumber: userDetails.titleDeedNumber,
            },
          },
          isRead: false,
          isActionable: false,
        }], { session })
      }
      else {
        password = Math.floor(1000 + Math.random() * 9000).toString()
        const hashedPassword = await hashPassword(password)

        const newUser = await UserModel.create([{
          email: userDetails.email || '',
          password: hashedPassword,
          tempPassword: hashedPassword,
          tempPasswordExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          tempPasswordUsed: false,
          first_name: userDetails.first_name || '',
          last_name: userDetails.last_name || '',
          role: userDetails.role || 'unit_owner',
          phone: userDetails.phone,
          nationalId: userDetails.nationalId,
          ownedUnits: [unitId],
          isActive: true,
          isVerified: false,
          lastLogin: null,
        }], { session })

        assignedUser = newUser[0]
        ownerId = assignedUser._id
        isNewUser = true

        // Send welcome notification with credentials
        await Notification.create([{
          role: 'unit_owner',
          phone: userDetails.phone,
          title: 'Property Ownership Assigned',
          senderId: requestingUser._id,
          message: `Welcome! You have been assigned as the owner of unit ${unit.unitNumber} at ${property?.propertyName || 'the property'}. Your temporary Password is: ${password}. Please login and change it immediately.`,
          type: 'invite_property_owner',
          referenceId: unit._id.toString(),
          referenceModel: 'Unit',
          status: 'pending',
          metadata: {
            propertyData: {
              propertyId: property?._id || unit.propertyId,
              propertyName: property?.propertyName || 'Unknown Property',
              propertyAddress: property?.address || '',
              propertyType: property?.type || '',
              unitNumber: unit.unitNumber,
              unitId: unit._id,
            },
            ownershipData: {
              purchaseDate: ownership.purchaseDate,
              purchaseAmount: ownership.purchaseAmount,
              ownershipType: ownership.ownershipType,
              titleDeedNumber: userDetails.titleDeedNumber,
            },
            credentials: {
              temporaryPassword: true,
              password: password,
              loginUrl: '/auth/login',
            },
          },
          isRead: false,
          isActionable: true,
          actionUrl: '/auth/login',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }], { session })
      }
    }
    else if (ownership.ownerId) {
      // Using existing user ID - add unit to their owned units
      const existingOwner = await UserModel.findById(ownership.ownerId).session(session)

      if (existingOwner) {
        if (!existingOwner.ownedUnits.includes(unitId)) {
          existingOwner.ownedUnits.push(unitId)
          await existingOwner.save({ session })
        }
        ownerId = existingOwner._id
        assignedUser = existingOwner
      }
    }

    // Move current ownership to previousOwners if exists
    if (unit.ownership && unit.ownership.ownerId) {
      unit.previousOwners = unit.previousOwners || []
      unit.previousOwners.push({
        ...unit.ownership,
        transferDate: new Date(),
        isActive: false,
      })
    }

    // Update unit ownership
    unit.ownership = {
      ownerId: ownerId || ownership.ownerId,
      ownerName: ownership.ownerName,
      ownerPhone: ownership.ownerPhone,
      ownerEmail: ownership.ownerEmail,
      purchaseDate: ownership.purchaseDate,
      purchaseAmount: ownership.purchaseAmount,
      ownershipType: ownership.ownershipType,
      ownershipPercentage: ownership.ownershipPercentage,
      titleDeedNumber: createNewUser && userDetails ? userDetails.titleDeedNumber : ownership.titleDeedNumber,
      isActive: ownership.isActive !== undefined ? ownership.isActive : true,
    }

    await unit.save({ session })

    if (!createNewUser && ownership.ownerPhone) {
      await Notification.create([{
        role: 'unit_owner',
        phone: ownership.ownerPhone,
        title: 'Property Ownership Update',
        senderId: requestingUser._id,
        message: `You have been assigned as the owner of unit ${unit.unitNumber} at ${property?.propertyName || 'the property'}.`,
        type: 'system',
        referenceId: unit._id.toString(),
        referenceModel: 'Unit',
        status: 'pending',
        metadata: {
          propertyData: {
            propertyId: property?._id || unit.propertyId,
            propertyName: property?.propertyName || 'Unknown Property',
            propertyAddress: property?.address || '',
            propertyType: property?.type || '',
            unitNumber: unit.unitNumber,
            unitId: unit._id,
          },
          ownershipData: {
            purchaseDate: ownership.purchaseDate,
            purchaseAmount: ownership.purchaseAmount,
            ownershipType: ownership.ownershipType,
            titleDeedNumber: ownership.titleDeedNumber,
          },
        },
        isRead: false,
        isActionable: false,
      }], { session })
    }
    await session.commitTransaction()

    await unit.populate('ownership.ownerId', 'first_name last_name email phone')

    return {
      success: true,
      message: isNewUser
        ? 'Unit ownership assigned successfully'
        : 'Unit ownership assigned to existing user',
      unit: {
        _id: unit._id,
        unitNumber: unit.unitNumber,
        ownership: unit.ownership,
      },
      user: assignedUser
        ? {
            _id: assignedUser._id,
            first_name: assignedUser.first_name,
            last_name: assignedUser.last_name,
            phone: assignedUser.phone,
            email: assignedUser.email,
            nationalId: assignedUser.nationalId,
            isNewUser: isNewUser,
            totalOwnedUnits: assignedUser.ownedUnits.length,
          }
        : null,
    }
  }
  catch (error: any) {
    await session.abortTransaction()

    console.error('Error assigning unit ownership:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to assign unit ownership',
    })
  }
  finally {
    await session.endSession()
  }
})
