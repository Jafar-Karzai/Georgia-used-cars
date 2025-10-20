'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { StorageClient } from '@/lib/storage/client'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth/context'
import { Upload, X, Star, Image as ImageIcon, Loader2 } from 'lucide-react'

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

export function PhotoUpload({ vehicleId, photos, onPhotosUpdate }: PhotoUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { user } = useAuth()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isValidType && isValidSize
    })

    setSelectedFiles(validFiles)

    // Create previews
    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    setPreviews(prev => {
      // Clean up old previews
      prev.forEach(url => URL.revokeObjectURL(url))
      return newPreviews
    })
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index)
      // Clean up removed preview
      URL.revokeObjectURL(prev[index])
      return newPreviews
    })
  }

  const handleUpload = async () => {
    if (!user || selectedFiles.length === 0) return

    setUploading(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token

      const uploadPromises = selectedFiles.map(async (file, index) => {
        const result = await StorageClient.uploadVehicleImage(vehicleId, file, user.id)

        if (result.success && result.url) {
          // Save to database
          console.log('🖼️ Inserting photo to database:', {
            vehicle_id: vehicleId,
            url: result.url,
            is_primary: photos.length === 0 && index === 0,
            sort_order: photos.length + index,
            uploaded_by: user.id
          })

          const headers: HeadersInit = { 'Content-Type': 'application/json' }
          if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`
          }

          const res = await fetch(`/api/vehicles/${vehicleId}/photos`, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
              url: result.url,
              is_primary: photos.length === 0 && index === 0,
              sort_order: photos.length + index,
            })
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            console.error('❌ Photo DB insert API error:', err)
            return { success: false, error: err?.error || `HTTP ${res.status}` }
          }
          console.log('✅ Photo saved to database via API')
        }
        return result
      })

      const results = await Promise.all(uploadPromises)
      const failed = results.filter(r => !r.success)
      
      if (failed.length === 0) {
        setIsOpen(false)
        setSelectedFiles([])
        setPreviews([])
        onPhotosUpdate()
      } else {
        console.error('Some uploads failed:', failed)
      }
    } catch (error) {
      console.error('Upload error:', error)
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

              {/* Preview selected files */}
              {previews.length > 0 && (
                <div className="space-y-2">
                  <Label>Preview ({selectedFiles.length} selected)</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {index === 0 && (
                          <Badge className="absolute bottom-1 left-1 text-xs">
                            Primary
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={uploading || selectedFiles.length === 0}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    `Upload ${selectedFiles.length} Photo${selectedFiles.length !== 1 ? 's' : ''}`
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
