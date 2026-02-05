'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Car } from 'lucide-react'
import { ArrivalCountdown } from '@/components/vehicles/arrival-countdown'
import { getPublicStatusLabel } from '@/lib/utils/vehicle-status'
import type { VehicleStatus } from '@/types/database'

interface PublicVehicle {
  id: string
  year: number
  make: string
  model: string
  vin?: string
  lot_number?: string
  mileage?: number
  fuel_type?: string
  transmission?: string
  body_style?: string
  current_status: string
  sale_price?: number
  sale_currency?: string
  sale_type?: string
  sale_price_includes_vat?: boolean
  expected_arrival_date?: string
  actual_arrival_date?: string
  run_and_drive?: boolean
  primary_damage?: string
  vehicle_photos?: Array<{
    url: string
    is_primary: boolean
  }>
}

interface PublicVehicleCardProps {
  vehicle: PublicVehicle
  isUAE?: boolean | null
  isAuthenticated?: boolean
  priority?: boolean
  className?: string
}

export function PublicVehicleCard({
  vehicle,
  isUAE = null,
  isAuthenticated = false,
  priority = false,
  className = ''
}: PublicVehicleCardProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for scroll-in animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const formatPrice = (amount: number | string): { currency: string; amount: string; isContactPrice: boolean } => {
    if (typeof amount === 'string') {
      return { currency: '', amount: amount, isContactPrice: true }
    }
    const formatted = new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
    return { currency: 'AED', amount: formatted, isContactPrice: false }
  }

  // Calculate display price based on vehicle's sale type and user location
  const getDisplayPrice = (): number | string => {
    if (!vehicle.sale_price || vehicle.sale_price <= 0) return 'Contact for Price'

    const basePrice = vehicle.sale_price
    const saleType = vehicle.sale_type || 'local_and_export'
    const includesVat = vehicle.sale_price_includes_vat ?? false

    if (saleType === 'export_only') {
      return basePrice
    }

    if (saleType === 'local_only') {
      return includesVat ? basePrice : basePrice * 1.05
    }

    // For local_and_export
    if (isUAE) {
      return includesVat ? basePrice : basePrice * 1.05
    } else {
      return basePrice
    }
  }

  const primaryPhoto = vehicle.vehicle_photos?.find(p => p.is_primary) || vehicle.vehicle_photos?.[0]
  const displayPrice = getDisplayPrice()
  const priceFormatted = formatPrice(displayPrice)
  const statusLabel = getPublicStatusLabel(vehicle.current_status as VehicleStatus)
  const hasPrice = !priceFormatted.isContactPrice

  // Mask VIN for non-authenticated users (show last 6 digits only)
  const displayVin = vehicle.vin
    ? isAuthenticated
      ? vehicle.vin
      : `•••••••••••${vehicle.vin.slice(-6)}`
    : null

  // Check if vehicle is in transit (not yet arrived at yard)
  const arrivedStatuses = ['at_yard', 'under_enhancement', 'ready_for_sale', 'reserved', 'sold', 'delivered']
  const isInTransit = !arrivedStatuses.includes(vehicle.current_status)

  // Calculate ETA status for badge rendering
  const getEtaStatus = () => {
    if (!vehicle.expected_arrival_date) {
      return { type: 'pending' as const, days: null }
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expected = new Date(vehicle.expected_arrival_date)
    expected.setHours(0, 0, 0, 0)
    const days = Math.ceil((expected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (days < 0) {
      return { type: 'overdue' as const, days }
    }
    return { type: 'future' as const, days }
  }

  const etaStatus = getEtaStatus()
  // Show ETA badge for all in-transit vehicles
  const showEtaBadge = isInTransit

  // Get run/drive status color
  const getRunDriveStatus = () => {
    if (vehicle.run_and_drive === true) {
      return { label: 'Run & Drive', color: 'text-success', dot: 'bg-success' }
    }
    if (vehicle.run_and_drive === false) {
      return { label: 'Does Not Start', color: 'text-action-600', dot: 'bg-action-600' }
    }
    return null
  }

  const runDriveStatus = getRunDriveStatus()

  const vehicleTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  const detailsUrl = `/inventory/${vehicle.id}`
  const actionUrl = hasPrice ? detailsUrl : `/contact?vehicle=${vehicle.id}`

  const handleCardClick = () => {
    router.push(detailsUrl)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      router.push(detailsUrl)
    }
  }

  return (
    <div
      ref={cardRef}
      className={`
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}
        transition-all duration-500 ease-reveal
        ${className}
      `}
    >
      <article
        className="alumina-surface rounded-2xl border border-border overflow-hidden card-hover h-full cursor-pointer group"
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="article"
        aria-label={`${vehicleTitle} - ${priceFormatted.isContactPrice ? 'Contact for price' : `${priceFormatted.amount} ${priceFormatted.currency}`}`}
      >
        {/* Image Section */}
        <div className="relative h-48 md:h-56 overflow-hidden">
          {primaryPhoto?.url ? (
            <Image
              src={primaryPhoto.url}
              alt={vehicleTitle}
              fill
              priority={priority}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Car className="h-16 w-16 text-muted-foreground/30" aria-hidden="true" />
            </div>
          )}

          {/* Status Tag - Top Left */}
          {statusLabel && (
            <div
              className={`absolute top-3 left-3 status-tag ${
                isInTransit ? 'bg-precision-600' : 'bg-success'
              } text-white`}
            >
              {statusLabel}
            </div>
          )}

          {/* Run & Drive Badge - Top Right */}
          {runDriveStatus && (
            <div className="absolute top-3 right-3 frosted-panel px-2 py-1 rounded-lg">
              <span className={`text-3xs font-bold uppercase flex items-center gap-1 ${runDriveStatus.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${runDriveStatus.dot}`} aria-hidden="true" />
                {runDriveStatus.label}
              </span>
            </div>
          )}

          {/* ETA Badge - Bottom Left (In-Transit Only) */}
          {showEtaBadge && (
            <div className="absolute bottom-3 left-3 frosted-panel px-2 py-1 rounded-lg">
              {etaStatus.type === 'pending' ? (
                <span className="text-3xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" aria-hidden="true" />
                  ETA Pending
                </span>
              ) : (
                <ArrivalCountdown
                  expectedDate={vehicle.expected_arrival_date}
                  actualDate={vehicle.actual_arrival_date}
                  variant="badge"
                />
              )}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5 relative z-10">
          {/* Title */}
          <h3 className="text-base font-extrabold leading-tight mb-1 line-clamp-1">
            {vehicleTitle}
          </h3>

          {/* VIN & LOT# */}
          {(displayVin || vehicle.lot_number) && (
            <div className="mb-4">
              {displayVin && (
                <p className="text-2xs font-mono text-muted-foreground">
                  VIN: {displayVin}
                </p>
              )}
              {vehicle.lot_number && (
                <p className="text-2xs font-mono text-muted-foreground">
                  LOT #{vehicle.lot_number}
                </p>
              )}
            </div>
          )}

          {/* Specs */}
          <div className="space-y-1.5 mb-4">
            {vehicle.primary_damage && (
              <div className="flex justify-between text-xs spec-line pb-1.5">
                <span className="text-muted-foreground">Damage</span>
                <span className="font-bold text-action-600">{vehicle.primary_damage}</span>
              </div>
            )}
            {vehicle.mileage && (
              <div className="flex justify-between text-xs spec-line pb-1.5">
                <span className="text-muted-foreground">Mileage</span>
                <span className="font-bold">{vehicle.mileage.toLocaleString()} Mi</span>
              </div>
            )}
            {vehicle.transmission && (
              <div className="flex justify-between text-xs spec-line pb-1.5">
                <span className="text-muted-foreground">Trans</span>
                <span className="font-bold">{vehicle.transmission}</span>
              </div>
            )}
          </div>

          {/* Price & Action */}
          <div className="flex justify-between items-center pt-4 border-t border-border">
            <div>
              <p className="text-2xs font-bold text-muted-foreground uppercase">Price</p>
              {priceFormatted.isContactPrice ? (
                <p className="text-sm font-semibold text-foreground">Contact</p>
              ) : (
                <p className="text-2xl font-black text-primary font-mono">
                  {priceFormatted.amount} <span className="text-sm">{priceFormatted.currency}</span>
                </p>
              )}
            </div>
            <Button
              size="card"
              className={`btn-precision ${
                isInTransit
                  ? 'bg-primary hover:bg-primary/90'
                  : 'bg-action-600 hover:bg-action-700'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                router.push(actionUrl)
              }}
            >
              {isInTransit ? 'Reserve Now' : 'View Details'}
            </Button>
          </div>
        </div>
      </article>
    </div>
  )
}
