import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

interface UploadOptions {
  maxSize?: number // in bytes
  allowedTypes?: string[]
  uploadDir?: string
}

interface UploadResult {
  url: string
  filename: string
  originalName: string
  size: number
  type: string
}

export async function saveUploadedFile(
  fileData: Buffer,
  filename: string,
  type: string,
  options: UploadOptions = {},
): Promise<UploadResult> {
  const {
    maxSize = 1 * 1024 * 1024, // 1MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'],
    uploadDir = 'uploads',
  } = options

  // Validate file type
  if (!allowedTypes.includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    })
  }

  // Validate file size
  if (fileData.length > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
    throw createError({
      statusCode: 400,
      statusMessage: `File too large. Maximum size is ${maxSizeMB}MB.`,
    })
  }

  // Generate unique filename
  const fileExtension = filename.split('.').pop()?.toLowerCase()
  const uniqueFilename = `${randomUUID()}.${fileExtension}`

  // Use Nitro's server/public directory convention
  const fullUploadDir = join(process.cwd(), 'server', 'public', uploadDir)

  // Ensure directory exists
  await mkdir(fullUploadDir, { recursive: true })

  // Save file
  const filePath = join(fullUploadDir, uniqueFilename)
  await writeFile(filePath, fileData)

  // Create URL for frontend access (files in server/public are served from root)
  const url = `/${uploadDir}/${uniqueFilename}`

  return {
    url,
    filename: uniqueFilename,
    originalName: filename,
    size: fileData.length,
    type,
  }
}

export async function processFormDataUpload(
  formData: any[],
  fileFieldName: string = 'logo',
  options: UploadOptions = {},
): Promise<{ data: any, fileResult: UploadResult | null }> {
  let data = null
  let fileResult = null

  for (const field of formData) {
    if (field.name === 'propertyData') {
      data = JSON.parse(field.data.toString())
    }
    else if (field.name === fileFieldName && field.filename) {
      fileResult = await saveUploadedFile(
        field.data,
        field.filename,
        field.type || '',
        options,
      )
    }
  }

  return { data, fileResult }
}

// Logo-specific utility
export async function handleLogoUpload(formData: any[]): Promise<{ data: any, logoUrl: string | null }> {
  const { data, fileResult } = await processFormDataUpload(formData, 'logo', {
    maxSize: 1 * 1024 * 1024, // 1MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'],
    uploadDir: 'uploads/property-logos',
  })

  return {
    data,
    logoUrl: fileResult?.url || null,
  }
}

export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    if (fileUrl && (fileUrl.startsWith('/uploads/') || fileUrl.startsWith('uploads/'))) {
      // Normalize the URL and use server/public directory
      const normalizedUrl = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl
      const filePath = join(process.cwd(), 'server', 'public', normalizedUrl)
      await unlink(filePath)
      console.log(`Deleted file: ${fileUrl}`)
    }
  }
  catch (error) {
    // Log error but don't throw - file might already be deleted or not exist
    console.warn(`Failed to delete file ${fileUrl}:`, error)
  }
}

export async function replaceLogo(
  formData: any[],
  existingLogoUrl?: string | null,
): Promise<{ data: any, logoUrl: string | null }> {
  // Delete existing logo if it exists
  if (existingLogoUrl) {
    await deleteFile(existingLogoUrl)
  }

  // Handle new logo upload
  return await handleLogoUpload(formData)
}
