'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Gauge,
  Fuel,
  Cog,
  Car,
  ChevronRight,
  CheckCircle,
  Clock
} from 'lucide-react'
import { ArrivalCountdown } from '@/components/vehicles/arrival-countdown'
import { getPublicStatusLabel, getPublicStatusBadgeStyle } from '@/lib/utils/vehicle-status'
import type { VehicleStatus } from '@/types/database'

interface PublicVehicle {
  id: string
  year: number
  make: string
  model: string
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
  vehicle_photos?: Array<{
    url: string
    is_primary: boolean
  }>
}

interface PublicVehicleCardProps {
  vehicle: PublicVehicle
  isUAE?: boolean | null
  priority?: boolean
  className?: string
}

export function PublicVehicleCard({
  vehicle,
  isUAE = null,
  priority = false,
  className = ''
}: PublicVehicleCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
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

  const formatCurrency = (amount: number | string) => {
    if (typeof amount === 'string') return amount
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
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

  // Get VAT note for display
  const getVatNote = () => {
    if (!vehicle.sale_price || vehicle.sale_price <= 0) return null

    const saleType = vehicle.sale_type || 'local_and_export'

    if (saleType === 'export_only') {
      return 'VAT free'
    }

    if (saleType === 'local_only') {
      return 'Includes 5% VAT'
    }

    if (isUAE) {
      return 'Includes 5% VAT (UAE)'
    } else {
      return 'VAT free (Export)'
    }
  }

  const primaryPhoto = vehicle.vehicle_photos?.find(p => p.is_primary) || vehicle.vehicle_photos?.[0]
  const displayPrice = getDisplayPrice()
  const vatNote = getVatNote()
  const statusLabel = getPublicStatusLabel(vehicle.current_status as VehicleStatus)
  const statusStyle = getPublicStatusBadgeStyle(vehicle.current_status as VehicleStatus)

  return (
    <div
      ref={cardRef}
      className={`
        group
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}
        transition-all duration-500 ease-out
        ${className}
      `}
      style={{ transitionDelay: isVisible ? '0ms' : '0ms' }}
    >
      <Card className="overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-2xl h-full flex flex-col">
        <Link
          href={`/inventory/${vehicle.id}`}
          className="flex flex-col h-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Image Section - Bold & Dramatic */}
          <div className="relative bg-muted aspect-[4/3] overflow-hidden">
            {primaryPhoto?.url ? (
              <>
                <Image
                  src={primaryPhoto.url}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  fill
                  priority={priority}
                  className={`
                    object-cover object-center
                    transition-transform duration-500 ease-out
                    ${isHovered ? 'scale-105' : 'scale-100'}
                  `}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Gradient overlay for badge legibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none" />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Car className="h-20 w-20 text-muted-foreground/30" />
              </div>
            )}

            {/* Glassmorphism Status Badge - Top Right */}
            <div className="absolute top-3 right-3 left-3 flex flex-wrap gap-2 justify-end">
              {statusLabel && (
                <Badge
                  className={`
                    backdrop-blur-md bg-white/90 dark:bg-black/90
                    shadow-lg
                    transition-all duration-300
                    ${statusStyle}
                    ${isHovered ? 'scale-105' : 'scale-100'}
                  `}
                >
                  {statusLabel}
                </Badge>
              )}
            </div>

            {/* Hover Overlay with CTA */}
            <div
              className={`
                absolute inset-0 bg-black/40 backdrop-blur-sm
                flex items-center justify-center
                transition-opacity duration-300
                ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}
              `}
            >
              <div className="text-white text-lg font-semibold flex items-center gap-2 transform transition-transform duration-300">
                View Details
                <ChevronRight className={`h-5 w-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 flex flex-col flex-grow">
            {/* Vehicle Title Section - Fixed Height for consistency */}
            <div className="min-h-[88px] mb-4">
              {/* Vehicle Title - Bold Typography with 2-line max */}
              <h3 className="text-2xl font-bold text-foreground mb-3 line-clamp-2 leading-tight">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>

              {/* Trust Signals & Arrival - Consistent Badge Styling */}
              {(vehicle.expected_arrival_date || vehicle.run_and_drive) && (
                <div className="flex flex-wrap items-center gap-2">
                  {vehicle.expected_arrival_date && (
                    <ArrivalCountdown
                      expectedDate={vehicle.expected_arrival_date}
                      actualDate={vehicle.actual_arrival_date}
                      variant="badge"
                    />
                  )}
                  {vehicle.run_and_drive && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Run & Drive
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Specs Grid - Accessible Icons - Fixed Height */}
            <div className="grid grid-cols-2 gap-3 py-4 mb-4 border-y border-border/40 min-h-[88px]">
              {vehicle.mileage && (
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Gauge className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-muted-foreground">Mileage</span>
                    <span className="text-sm font-semibold text-foreground truncate">
                      {vehicle.mileage.toLocaleString()} mi
                    </span>
                  </div>
                </div>
              )}
              {vehicle.transmission && (
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Cog className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-muted-foreground">Trans.</span>
                    <span className="text-sm font-semibold text-foreground truncate">
                      {vehicle.transmission}
                    </span>
                  </div>
                </div>
              )}
              {vehicle.fuel_type && (
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Fuel className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-muted-foreground">Fuel</span>
                    <span className="text-sm font-semibold text-foreground truncate">
                      {vehicle.fuel_type}
                    </span>
                  </div>
                </div>
              )}
              {vehicle.body_style && (
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Car className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-muted-foreground">Body</span>
                    <span className="text-sm font-semibold text-foreground truncate">
                      {vehicle.body_style}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Price Section - Clear & Prominent */}
            <div className="pt-4 border-t border-border/40">
              <div className="flex items-end justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">
                    {vehicle.sale_price && vehicle.sale_price > 0 ? 'Sale Price' : 'Pricing'}
                  </p>
                  <p className="text-3xl font-bold text-primary mb-1 truncate">
                    {formatCurrency(displayPrice)}
                  </p>
                  {vatNote && (
                    <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {vatNote}
                    </p>
                  )}
                </div>
                <div className={`
                  ml-4 flex-shrink-0 w-10 h-10 rounded-full
                  bg-primary/10 flex items-center justify-center
                  transition-all duration-300
                  ${isHovered ? 'bg-primary scale-110' : ''}
                `}>
                  <ChevronRight
                    className={`h-5 w-5 transition-all duration-300 ${
                      isHovered ? 'text-white translate-x-0.5' : 'text-primary'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </Link>
      </Card>
    </div>
  )
}
