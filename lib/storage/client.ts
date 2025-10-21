import { supabase } from '@/lib/supabase/client'

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export class StorageClient {
  // Upload vehicle image
  static async uploadVehicleImage(
    vehicleId: string,
    file: File,
    userId: string
  ): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop()
      // Generate unique filename using timestamp + random string to prevent collisions
      // when uploading multiple files in parallel
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      const fileName = `${vehicleId}/${uniqueId}.${fileExt}`
      const filePath = `vehicles/${fileName}`

      const { data, error } = await supabase.storage
        .from('vehicle-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Storage upload error:', error.message)
        return { success: false, error: error.message }
      }

      // Only get public URL if upload succeeded
      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(filePath)

      return {
        success: true,
        url: publicUrl,
        path: filePath
      }
    } catch (error: any) {
      console.error('Unexpected upload error:', error)
      return { success: false, error: error.message }
    }
  }

  // Upload vehicle document
  static async uploadVehicleDocument(
    vehicleId: string,
    file: File,
    documentType: string
  ): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop()
      // Generate unique filename to prevent collisions
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      const fileName = `${documentType}_${uniqueId}.${fileExt}`
      const filePath = `vehicles/${vehicleId}/${fileName}`

      const { data, error } = await supabase.storage
        .from('vehicle-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Document upload error:', error.message)
        return { success: false, error: error.message }
      }

      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-documents')
        .getPublicUrl(filePath)

      return {
        success: true,
        url: publicUrl,
        path: filePath
      }
    } catch (error: any) {
      console.error('Unexpected document upload error:', error)
      return { success: false, error: error.message }
    }
  }

  // Upload expense receipt
  static async uploadReceipt(
    expenseId: string,
    file: File
  ): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop()
      // Generate unique filename to prevent collisions
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      const fileName = `receipt_${uniqueId}.${fileExt}`
      const filePath = `expenses/${expenseId}/${fileName}`

      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Receipt upload error:', error.message)
        return { success: false, error: error.message }
      }

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath)

      return {
        success: true,
        url: publicUrl,
        path: filePath
      }
    } catch (error: any) {
      console.error('Unexpected receipt upload error:', error)
      return { success: false, error: error.message }
    }
  }

  // Delete file
  static async deleteFile(bucket: string, path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

      return !error
    } catch (error) {
      console.error('Delete file error:', error)
      return false
    }
  }

  // Get signed URL for private files
  static async getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn)

      if (error) {
        console.error('Get signed URL error:', error)
        return null
      }

      return data.signedUrl
    } catch (error) {
      console.error('Get signed URL error:', error)
      return null
    }
  }

  // List files in a folder
  static async listFiles(bucket: string, folder: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder)

      if (error) {
        console.error('List files error:', error)
        return []
      }

      return data
    } catch (error) {
      console.error('List files error:', error)
      return []
    }
  }
}