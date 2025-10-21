/**
 * Image optimization utilities for client-side image processing
 * Resizes and compresses images before upload to reduce file size and improve performance
 */

export interface OptimizeOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  outputFormat?: 'jpeg' | 'webp' | 'png'
}

/**
 * Optimize an image file by resizing and compressing
 * @param file - The original image file
 * @param options - Optimization options
 * @returns Promise<File> - The optimized image file
 */
export async function optimizeImage(
  file: File,
  options: OptimizeOptions = {}
): Promise<File> {
  const {
    maxWidth = 2000,
    maxHeight = 2000,
    quality = 0.85,
    outputFormat = 'jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Failed to read image file'))
    }

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height

          if (width > height) {
            width = Math.min(width, maxWidth)
            height = width / aspectRatio
          } else {
            height = Math.min(height, maxHeight)
            width = height * aspectRatio
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Use better image smoothing
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Draw image
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob from canvas'))
              return
            }

            // Create new file from blob
            const fileExt = outputFormat === 'jpeg' ? 'jpg' : outputFormat
            const fileName = file.name.replace(/\.[^/.]+$/, `.${fileExt}`)
            const optimizedFile = new File([blob], fileName, {
              type: `image/${outputFormat}`,
              lastModified: Date.now()
            })

            resolve(optimizedFile)
          },
          `image/${outputFormat}`,
          quality
        )
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Get the size reduction percentage
 */
export function getSizeReduction(originalSize: number, optimizedSize: number): number {
  return Math.round(((originalSize - optimizedSize) / originalSize) * 100)
}

/**
 * Format bytes to human readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
