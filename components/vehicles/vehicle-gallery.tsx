'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, X, ImageIcon, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface Photo {
  id: string
  url: string
  caption?: string
  is_primary: boolean
  sort_order: number
}

interface VehicleGalleryProps {
  photos: Photo[]
  vehicleName: string
}

export function VehicleGallery({ photos, vehicleName }: VehicleGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Sort photos by primary first, then by sort_order
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })

  const currentPhoto = sortedPhotos[currentIndex]

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sortedPhotos.length)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + sortedPhotos.length) % sortedPhotos.length)
  }

  const goToImage = (index: number) => {
    setCurrentIndex(index)
  }

  if (sortedPhotos.length === 0) {
    return (
      <div className="w-full">
        {/* Empty state */}
        <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No photos available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Main Image Display */}
      <div className="relative group">
        <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
          <img
            src={currentPhoto.url}
            alt={currentPhoto.caption || `${vehicleName} - Photo ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Navigation Arrows */}
        {sortedPhotos.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              onClick={goToNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Zoom Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          onClick={() => setLightboxOpen(true)}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        {/* Photo Counter */}
        {sortedPhotos.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium">
            {currentIndex + 1} / {sortedPhotos.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {sortedPhotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortedPhotos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => goToImage(index)}
              className={cn(
                "relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all",
                currentIndex === index
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-muted-foreground/20"
              )}
            >
              <img
                src={photo.url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {photo.is_primary && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 font-medium">
                  Main
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-7xl w-full p-0 bg-black/95">
          <div className="relative w-full h-[90vh]">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Large Image */}
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={currentPhoto.url}
                alt={currentPhoto.caption || `${vehicleName} - Photo ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Navigation in Lightbox */}
            {sortedPhotos.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 shadow-lg"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 shadow-lg"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                {/* Photo Counter in Lightbox */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium">
                  {currentIndex + 1} / {sortedPhotos.length}
                </div>
              </>
            )}

            {/* Caption */}
            {currentPhoto.caption && (
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-white text-sm bg-black/60 px-4 py-2 rounded-lg inline-block">
                  {currentPhoto.caption}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
