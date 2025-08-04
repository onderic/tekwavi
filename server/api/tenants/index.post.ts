import mongoose from 'mongoose'
import { Tenant } from '~~/server/models/Tenants'
import { Unit } from '~~/server/models/Property/Unit'
import { User } from '~~/server/models/User'
import { FlatStatus } from '~~/shared/enums/property'
import { UserRole } from '~~/shared/enums/roles'
import { canPerform } from '~~/server/utils/roles'
import { purgeAnalyticsCache } from '~~/server/utils/cacheUtils'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'create', 'tenantManagement:tenant')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to create tenant records.',
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const body = await readBody(event)

    const unit = await Unit.findById(body.unitId)
      .populate<{ propertyId: { _id: mongoose.Types.ObjectId, propertyName: string } }>('propertyId', 'propertyName')
      .populate<{ floorId: { _id: mongoose.Types.ObjectId, floorNumber: string } }>('floorId', 'floorNumber')
      .session(session)

    if (!unit) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Unit not found',
      })
    }

    if (unit.isOccupied) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Unit is already occupied by another tenant',
      })
    }

    if (body.rentalType === 'owner_occupied') {
      if (!unit.ownership || !unit.ownership.ownerId) {
        throw createError({
          statusCode: 400,
          statusMessage: `Unit ${unit.unitNumber} does not have an active owner. Please go to Revenue > Unit Sales to assign an owner before setting as owner-occupied.`,
        })
      }

      if (unit.ownership.ownerPhone !== body.phoneNumber) {
        throw createError({
          statusCode: 400,
          statusMessage: 'The phone number provided does not match the unit owner\'s phone number.',
        })
      }

      body.rentAmount = 0
      body.depositAmount = 0
    }

    let isAdditionalUnit = false
    let existingUnits: string[] = []

    // Only check for existing tenants if not owner-occupied
    if (body.rentalType !== 'owner_occupied') {
      const existingTenants = await Tenant.find({
        phoneNumber: body.phoneNumber,
        propertyId: unit.propertyId,
        isActive: true,
      }).session(session)

      if (existingTenants.length > 0) {
        isAdditionalUnit = true
        existingUnits = existingTenants.map(t => t.unitNumber)
      }
    }

    const leaseStartDate = body.leaseStartDate instanceof Date
      ? body.leaseStartDate
      : new Date(body.leaseStartDate)

    const leaseEndDate = body.leaseEndDate
      ? (body.leaseEndDate instanceof Date ? body.leaseEndDate : new Date(body.leaseEndDate))
      : null

    const tenant = new Tenant({
      ...body,
      propertyId: unit.propertyId._id,
      propertyName: unit.propertyId.propertyName,
      floorId: unit.floorId._id,
      floorNumber: unit.floorId.floorNumber,
      unitId: unit._id,
      unitNumber: unit.unitNumber,
      leaseStartDate,
      leaseEndDate,
      isActive: true,
      createdBy: user._id,
      isAdditionalUnit,
      rentAmount: body.rentalType === 'owner_occupied' ? 0 : body.rentAmount,
      depositAmount: body.rentalType === 'owner_occupied' ? 0 : body.depositAmount,
    })

    const validationError = tenant.validateSync()
    if (validationError) {
      throw createError({
        statusCode: 400,
        statusMessage: `Validation error: ${validationError.message}`,
      })
    }

    const savedTenant = await tenant.save({ session })

    unit.isOccupied = true
    unit.status = body.rentalType === 'owner_occupied' ? FlatStatus.OWNER_OCCUPIED : FlatStatus.RENTED
    unit.tenantId = savedTenant._id
    await unit.save({ session })

    let userCreated = false
    let userMessage = ''
    let userWarning = ''
    let passwordChanged = false
    const unitPassword = unit.unitNumber.toString()

    // Only handle user creation/update for tenants (monthly/fixed rental types)
    if (body.rentalType !== 'owner_occupied') {
      const hashedUnitPassword = await hashPassword(unitPassword)
      const existingUser = await User.findOne({ phone: body.phoneNumber }).session(session)

      if (!existingUser) {
        // Create new user only if phone number doesn't exist
        const email = body.email || `tenant_${body.phoneNumber}@homeae.local`

        const newUser = new User({
          first_name: body.firstName || '',
          last_name: body.lastName || '',
          email: email,
          password: hashedUnitPassword,
          role: UserRole.TENANT,
          phone: body.phoneNumber,
          nationalId: body.nationalId || null,
          address: body.address || {
            street: null,
            city: null,
            state: null,
          },
          isActive: true,
          isVerified: true,
          lastLogin: null,
          rentedUnits: [unit._id],
          ownedProperties: [],
          ownedUnits: [],
          assignedProperty: null,
        })

        await newUser.save({ session })
        userCreated = true
        passwordChanged = true
        userMessage = `User account created with phone: ${body.phoneNumber}. They can log in using unit number ${unitPassword} as password.`
      }
      else {
        // User exists - just update their information and add unit
        if (existingUser.first_name && existingUser.last_name) {
          const nameMatches
            = (existingUser.first_name.toLowerCase() === body.firstName.toLowerCase())
              && (existingUser.last_name.toLowerCase() === body.lastName.toLowerCase())

          if (!nameMatches) {
            userWarning = `WARNING: The user with phone ${body.phoneNumber} exists but with a different name (${existingUser.first_name} ${existingUser.last_name}). Make sure this is the correct tenant.`
          }
        }

        // Activate user if needed
        if (!existingUser.isActive || !existingUser.isVerified) {
          existingUser.isActive = true
          existingUser.isVerified = true
        }

        // Add unit to rentedUnits if not already present
        if (!existingUser.rentedUnits) existingUser.rentedUnits = []
        if (!existingUser.rentedUnits.some((id: any) => id.toString() === unit._id.toString())) {
          existingUser.rentedUnits.push(unit._id)
        }

        // Update role if necessary - only if current role is not a privileged role
        if (existingUser.role === UserRole.NORMAL) {
          existingUser.role = UserRole.TENANT
        }

        // Update password with new unit number
        existingUser.password = hashedUnitPassword
        existingUser.passwordChangedAt = new Date()
        passwordChanged = true

        // Update other fields only if they don't exist
        if (body.nationalId && !existingUser.nationalId) {
          existingUser.nationalId = body.nationalId
        }

        if (body.address && (!existingUser.address || !existingUser.address.street)) {
          existingUser.address = body.address
        }

        await existingUser.save({ session })

        // Get all unit numbers for this user
        const allUnits = await Unit.find({
          _id: { $in: existingUser.rentedUnits },
        }).select('unitNumber').lean()
        const allUnitNumbers = allUnits.map(u => u.unitNumber)

        if (isAdditionalUnit) {
          userMessage = `Additional unit (${unit.unitNumber}) added to existing tenant in ${unit.propertyId.propertyName}. `
            + `Tenant now has units: ${[...existingUnits, unit.unitNumber].join(', ')}. `
            + `User can log in using any of their unit numbers as password: ${allUnitNumbers.join(', ')}`
        }
        else {
          userMessage = `Unit added to existing user account. `
            + `User can log in using any of their unit numbers as password: ${allUnitNumbers.join(', ')}`
        }

        if (userWarning) {
          userMessage = `${userWarning} ${userMessage}`
        }
      }
    }
    else {
      // For owner-occupied, just provide a simple message
      userMessage = `Unit ${unit.unitNumber} has been marked as owner-occupied. No rent will be charged, only service fees.`
    }

    await session.commitTransaction()

    await purgeAnalyticsCache(unit.propertyId._id.toString())

    return {
      success: true,
      message: 'Tenant added successfully. ' + userMessage,
      tenant: savedTenant,
      userCreated,
      passwordChanged,
      unitPassword: body.rentalType !== 'owner_occupied' ? unitPassword : null,
      hasWarning: !!userWarning,
      isAdditionalUnit,
      existingUnits: isAdditionalUnit ? [...existingUnits, unit.unitNumber] : [unit.unitNumber],
      isOwnerOccupied: body.rentalType === 'owner_occupied',
    }
  }
  catch (error: any) {
    await session.abortTransaction()

    console.error('Error creating tenant or user account:', error)

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message).join(', ')
      throw createError({
        statusCode: 400,
        statusMessage: `Validation failed: ${messages}`,
      })
    }

    if (error.code === 11000) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A tenant record with this information already exists',
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create tenant record',
      data: error,
    })
  }
  finally {
    session.endSession()
  }
})
