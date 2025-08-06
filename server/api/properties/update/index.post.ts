import { isValidObjectId, Types } from 'mongoose'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { Property } from '~~/server/models/Property'
import type { UserRole } from '~~/shared/enums/roles'
import { canPerform } from '~~/server/utils/roles'
import { handleLogoUpload } from '~~/server/utils/fileUpload'
import { purgeAnalyticsCache } from '~~/server/utils/cacheUtils'

async function deleteExistingLogo(logoUrl: string) {
  try {
    if (logoUrl && logoUrl.startsWith('/uploads/')) {
      // Extract file path from URL
      const filePath = join(process.cwd(), 'public', logoUrl)
      await unlink(filePath)
      console.log(`Deleted existing logo: ${logoUrl}`)
    }
  }
  catch (error) {
    // Log error but don't throw - file might already be deleted or not exist
    console.warn(`Failed to delete existing logo ${logoUrl}:`, error)
  }
}

export default defineEventHandler(async (event) => {
  console.log('Updating property...')
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  if (!user.role || !canPerform(user.role as UserRole, 'update', 'propertyManagement:property')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to update properties.',
    })
  }

  try {
    // Check if request is multipart (has file upload)
    const contentType = getHeader(event, 'content-type') || ''
    let propertyData
    let propertyId
    let logoUrl = null

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await readMultipartFormData(event)

      if (!formData) {
        throw createError({
          statusCode: 400,
          statusMessage: 'No form data provided',
        })
      }

      // Process form data to extract propertyId and other data
      for (const field of formData) {
        if (field.name === 'propertyId') {
          propertyId = field.data.toString()
        }
        else if (field.name === 'propertyData') {
          propertyData = JSON.parse(field.data.toString())
        }
      }

      // Use utility function to handle logo upload
      const uploadResult = await handleLogoUpload(formData)
      if (uploadResult.logoUrl) {
        logoUrl = uploadResult.logoUrl
      }
    }
    else {
      // Handle regular JSON body (no file upload)
      const body = await readBody(event)
      propertyId = body.propertyId
      propertyData = body.propertyData
    }

    if (!propertyId || !isValidObjectId(propertyId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid property ID',
      })
    }

    if (!propertyData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Property data is required',
      })
    }

    // Find existing property
    const existingProperty = await Property.findById(propertyId)

    if (!existingProperty) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Property not found',
      })
    }

    // Check if user owns this property (for developers) or has admin access
    if (user.role === 'DEVELOPER' && existingProperty.createdBy.toString() !== user._id.toString()) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied. You can only update your own properties.',
      })
    }

    // If new logo is uploaded, delete the existing one
    if (logoUrl && existingProperty.logo) {
      await deleteExistingLogo(existingProperty.logo)
    }

    // Prepare update data
    const updateData = {
      ...propertyData,
      updatedAt: new Date(),
      updatedBy: new Types.ObjectId(user._id),
    }

    // Add logo URL if new one was uploaded
    if (logoUrl) {
      updateData.logo = logoUrl
    }

    // Update the property
    Object.assign(existingProperty, updateData)
    const updatedProperty = await existingProperty.save()

    // Purge analytics cache
    await purgeAnalyticsCache(updatedProperty._id.toString())

    return {
      success: true,
      message: 'Property updated successfully',
      property: {
        _id: updatedProperty._id,
        propertyName: updatedProperty.propertyName,
        categoryName: updatedProperty.categoryName,
        address: updatedProperty.address,
        logo: updatedProperty.logo,
        constructionCost: updatedProperty.constructionCost,
        status: updatedProperty.status,
        createdAt: updatedProperty.createdAt,
        updatedAt: updatedProperty.updatedAt,
      },
    }
  }
  catch (error: any) {
    console.error('Error updating property:', error)

    if (error.statusCode) {
      throw error
    }

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
        statusMessage: 'A property with this name already exists',
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update property',
    })
  }
})
