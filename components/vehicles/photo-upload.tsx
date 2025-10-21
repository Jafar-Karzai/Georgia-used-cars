'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { StorageClient } from '@/lib/storage/client'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth/context'
import { Upload, X, Star, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { optimizeImage, formatBytes, getSizeReduction } from '@/lib/utils/image-optimizer'

interface VehiclePhoto {
  id: string
  url: string
  caption?: string
  is_primary: boolean
  sort_order: number
}

interface PhotoUploadProps {
  vehicleId: string
  photos: VehiclePhoto[]
  onPhotosUpdate: () => void
}

interface FileWithProgress {
  file: File
  preview: string
  status: 'pending' | 'optimizing' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  originalSize?: number
  optimizedSize?: number
}

export function PhotoUpload({ vehicleId, photos, onPhotosUpdate }: PhotoUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [filesWithProgress, setFilesWithProgress] = useState<FileWithProgress[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { user } = useAuth()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      if (!isValidType) {
        console.warn(`Skipping ${file.name}: not an image file`)
      }
      if (!isValidSize) {
        console.warn(`Skipping ${file.name}: exceeds 10MB limit`)
      }
      return isValidType && isValidSize
    })

    if (validFiles.length === 0) {
      alert('No valid image files selected. Please select images under 10MB.')
      return
    }

    // Create file entries with progress tracking
    const newFilesWithProgress: FileWithProgress[] = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
      progress: 0,
      originalSize: file.size
    }))

    setFilesWithProgress(prev => {
      // Clean up old previews
      prev.forEach(f => URL.revokeObjectURL(f.preview))
      return newFilesWithProgress
    })
  }

  const removeFile = (index: number) => {
    setFilesWithProgress(prev => {
      const newFiles = prev.filter((_, i) => i !== index)
      // Clean up removed preview
      URL.revokeObjectURL(prev[index].preview)
      return newFiles
    })
  }

  const handleUpload = async () => {
    if (!user || filesWithProgress.length === 0) return

    setUploading(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token

      // Step 1: Optimize images
      console.log(`📸 Optimizing ${filesWithProgress.length} image(s)...`)
      const optimizedFiles = await Promise.all(
        filesWithProgress.map(async (fileItem, index) => {
          try {
            // Update status to optimizing
            setFilesWithProgress(prev =>
              prev.map((f, i) =>
                i === index ? { ...f, status: 'optimizing' as const, progress: 10 } : f
              )
            )

            const optimizedFile = await optimizeImage(fileItem.file, {
              maxWidth: 2000,
              maxHeight: 2000,
              quality: 0.85,
              outputFormat: 'jpeg'
            })

            const reduction = getSizeReduction(fileItem.file.size, optimizedFile.size)
            console.log(`✓ Optimized ${fileItem.file.name}: ${formatBytes(fileItem.file.size)} → ${formatBytes(optimizedFile.size)} (${reduction}% reduction)`)

            setFilesWithProgress(prev =>
              prev.map((f, i) =>
                i === index
                  ? {
                      ...f,
                      file: optimizedFile,
                      optimizedSize: optimizedFile.size,
                      progress: 30
                    }
                  : f
              )
            )

            return { index, optimizedFile, originalItem: fileItem }
          } catch (error: any) {
            console.error(`Failed to optimize ${fileItem.file.name}:`, error)
            setFilesWithProgress(prev =>
              prev.map((f, i) =>
                i === index
                  ? { ...f, status: 'error' as const, error: `Optimization failed: ${error.message}` }
                  : f
              )
            )
            return null
          }
        })
      )

      const validOptimizedFiles = optimizedFiles.filter(
        (f): f is { index: number; optimizedFile: File; originalItem: FileWithProgress } => f !== null
      )

      if (validOptimizedFiles.length === 0) {
        alert('Failed to optimize any images. Please try again.')
        setUploading(false)
        return
      }

      // Step 2: Upload to storage
      console.log(`☁️ Uploading ${validOptimizedFiles.length} optimized image(s) to storage...`)
      const uploadResults = await Promise.all(
        validOptimizedFiles.map(async ({ index, optimizedFile }) => {
          try {
            setFilesWithProgress(prev =>
              prev.map((f, i) =>
                i === index ? { ...f, status: 'uploading' as const, progress: 50 } : f
              )
            )

            const result = await StorageClient.uploadVehicleImage(vehicleId, optimizedFile, user.id)

            if (result.success && result.url) {
              setFilesWithProgress(prev =>
                prev.map((f, i) =>
                  i === index ? { ...f, progress: 80 } : f
                )
              )
              return { index, url: result.url, success: true }
            } else {
              setFilesWithProgress(prev =>
                prev.map((f, i) =>
                  i === index
                    ? { ...f, status: 'error' as const, error: result.error || 'Upload failed' }
                    : f
                )
              )
              return { index, success: false, error: result.error }
            }
          } catch (error: any) {
            setFilesWithProgress(prev =>
              prev.map((f, i) =>
                i === index
                  ? { ...f, status: 'error' as const, error: error.message }
                  : f
              )
            )
            return { index, success: false, error: error.message }
          }
        })
      )

      const successfulUploads = uploadResults.filter(
        (r): r is { index: number; url: string; success: true } => r.success
      )

      if (successfulUploads.length === 0) {
        alert('Failed to upload any images to storage. Please try again.')
        setUploading(false)
        return
      }

      // Step 3: Batch insert to database
      console.log(`💾 Saving ${successfulUploads.length} photo(s) to database...`)
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const photosData = successfulUploads.map((upload, idx) => ({
        url: upload.url,
        is_primary: photos.length === 0 && idx === 0,
        sort_order: photos.length + idx
      }))

      const res = await fetch(`/api/vehicles/${vehicleId}/photos`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ photos: photosData })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('❌ Batch photo insert API error:', err)
        alert(`Failed to save photos to database: ${err.error || 'Unknown error'}`)
        setUploading(false)
        return
      }

      const dbResult = await res.json()
      console.log('✅ Batch insert successful:', dbResult)

      // Mark all successful uploads as complete
      successfulUploads.forEach(({ index }) => {
        setFilesWithProgress(prev =>
          prev.map((f, i) =>
            i === index ? { ...f, status: 'success' as const, progress: 100 } : f
          )
        )
      })

      // Show success message
      const failedCount = filesWithProgress.length - successfulUploads.length
      if (failedCount > 0) {
        alert(`Successfully uploaded ${successfulUploads.length} photo(s). ${failedCount} failed.`)
      }

      // Close dialog and refresh if all succeeded
      setTimeout(() => {
        setIsOpen(false)
        setFilesWithProgress([])
        onPhotosUpdate()
      }, 1000)
    } catch (error: any) {
      console.error('Unexpected upload error:', error)
      alert(`An unexpected error occurred: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const setPrimaryPhoto = async (photoId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token

      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const res = await fetch(`/api/vehicles/${vehicleId}/photos/${photoId}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ is_primary: true })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `HTTP ${res.status}`)
      }

      onPhotosUpdate()
    } catch (error) {
      console.error('Error setting primary photo:', error)
    }
  }

  const deletePhoto = async (photoId: string, photoUrl: string) => {
    try {
      // Extract path from URL
      const urlParts = photoUrl.split('/')
      const path = urlParts.slice(-2).join('/') // Get last 2 parts (folder/filename)

      // Delete from storage
      await StorageClient.deleteFile('vehicle-images', path)

      // Delete from database via API
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token

      const headers: HeadersInit = {}
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const res = await fetch(`/api/vehicles/${vehicleId}/photos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `HTTP ${res.status}`)
      }

      onPhotosUpdate()
    } catch (error) {
      console.error('Error deleting photo:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Vehicle Photos</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Photos
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Vehicle Photos</DialogTitle>
              <DialogDescription>
                Select high-quality images of the vehicle. First image will be set as primary.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="photos">Select Photos</Label>
                <Input
                  id="photos"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept="image/*"
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPG, PNG, WebP. Max size: 10MB per image.
                </p>
              </div>

              {/* Preview selected files with progress */}
              {filesWithProgress.length > 0 && (
                <div className="space-y-2">
                  <Label>Preview ({filesWithProgress.length} selected)</Label>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filesWithProgress.map((fileItem, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex gap-2">
                          {/* Thumbnail */}
                          <div className="relative flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={fileItem.preview}
                              alt={`Preview ${index + 1}`}
                              className="w-20 h-20 object-cover rounded border"
                            />
                            {!uploading && (
                              <button
                                onClick={() => removeFile(index)}
                                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/90"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                            {index === 0 && (
                              <Badge className="absolute bottom-1 left-1 text-xs">
                                Primary
                              </Badge>
                            )}
                          </div>

                          {/* File info and progress */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                              {fileItem.status === 'success' && (
                                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                              )}
                              {fileItem.status === 'error' && (
                                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                              )}
                              {fileItem.status === 'optimizing' && (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600 flex-shrink-0" />
                              )}
                              {fileItem.status === 'uploading' && (
                                <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                              )}
                            </div>

                            {/* File size info */}
                            <div className="text-xs text-muted-foreground">
                              {fileItem.optimizedSize && fileItem.originalSize ? (
                                <>
                                  {formatBytes(fileItem.optimizedSize)}
                                  <span className="text-green-600 ml-1">
                                    (-{getSizeReduction(fileItem.originalSize, fileItem.optimizedSize)}%)
                                  </span>
                                </>
                              ) : (
                                formatBytes(fileItem.file.size)
                              )}
                            </div>

                            {/* Progress bar */}
                            {(uploading || fileItem.status === 'success') && (
                              <div className="space-y-1">
                                <Progress value={fileItem.progress} className="h-1.5" />
                                <p className="text-xs text-muted-foreground">
                                  {fileItem.status === 'pending' && 'Waiting...'}
                                  {fileItem.status === 'optimizing' && 'Optimizing image...'}
                                  {fileItem.status === 'uploading' && 'Uploading to storage...'}
                                  {fileItem.status === 'success' && 'Upload complete!'}
                                  {fileItem.status === 'error' && (
                                    <span className="text-destructive">{fileItem.error}</span>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)} disabled={uploading}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || filesWithProgress.length === 0}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    `Upload ${filesWithProgress.length} Photo${filesWithProgress.length !== 1 ? 's' : ''}`
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Photos */}
      {photos.length === 0 ? (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-2">No photos uploaded yet</p>
          <p className="text-sm text-muted-foreground">
            Upload high-quality images to showcase this vehicle
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <Image
                src={photo.url}
                alt={photo.caption || 'Vehicle photo'}
                width={128}
                height={128}
                className="w-full h-32 object-cover rounded-lg border"
                priority={false}
              />
              
              {/* Photo controls */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                {!photo.is_primary && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPrimaryPhoto(photo.id)}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Primary
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deletePhoto(photo.id, photo.url)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Primary badge */}
              {photo.is_primary && (
                <Badge className="absolute top-2 left-2 bg-primary">
                  <Star className="h-3 w-3 mr-1" />
                  Primary
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
