'use client'

import { useState, useEffect } from 'react'
import { PublicVehicleCard } from '@/components/vehicles/public-vehicle-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Car, Clock } from 'lucide-react'

interface VehiclePhoto {
  id: string
  url: string
  is_primary: boolean
  sort_order?: number
}

interface VehicleData {
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
  vehicle_photos?: VehiclePhoto[]
}

interface VehicleGridClientProps {
  /** Vehicles to display */
  vehicles: VehicleData[]
  /** Whether user is in UAE (for VAT display) - defaults to false for SSR */
  isUAE?: boolean | null
  /** Whether user is authenticated (for VIN display) */
  isAuthenticated?: boolean
  /** Type of section for empty state messaging */
  sectionType: 'arrived' | 'arriving'
  /** CSS class name */
  className?: string
}

/**
 * Client component that renders vehicle cards with intersection observer animations.
 * Receives vehicle data from the server and handles client-side interactivity.
 */
export function VehicleGridClient({
  vehicles,
  isUAE = null,
  isAuthenticated = false,
  sectionType,
  className = ''
}: VehicleGridClientProps) {
  // Client-side hydration state
  const [isHydrated, setIsHydrated] = useState(false)
  const [clientIsUAE, setClientIsUAE] = useState<boolean | null>(isUAE)
  const [clientIsAuthenticated, setClientIsAuthenticated] = useState(isAuthenticated)

  // Hydrate client state
  useEffect(() => {
    setIsHydrated(true)

    // Check authentication status from localStorage
    const mockAuth = localStorage.getItem('mockAuth')
    setClientIsAuthenticated(mockAuth === 'true')

    // Optional: detect location client-side for more accurate UAE detection
    // This is non-blocking and updates the UI after hydration
    detectLocation()
  }, [])

  const detectLocation = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch('https://ipapi.co/json/', { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) throw new Error(`API returned ${response.status}`)

      const data = await response.json()
      setClientIsUAE(data.country_code === 'AE')
    } catch {
      // Keep default (non-UAE) on failure - silent fallback
      setClientIsUAE(false)
    }
  }

  // Empty state
  if (vehicles.length === 0) {
    const EmptyIcon = sectionType === 'arrived' ? Car : Clock
    const emptyTitle = sectionType === 'arrived'
      ? 'No vehicles in stock at the moment'
      : 'No vehicles arriving soon'
    const emptySubtitle = sectionType === 'arrived'
      ? 'Check back soon for new arrivals'
      : 'Check our current inventory'

    return (
      <div className={`col-span-3 text-center py-12 ${className}`}>
        <EmptyIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-xl text-muted-foreground">{emptyTitle}</p>
        <p className="text-muted-foreground">{emptySubtitle}</p>
      </div>
    )
  }

  return (
    <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 ${className}`}>
      {vehicles.map((vehicle, index) => (
        <PublicVehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          isUAE={isHydrated ? clientIsUAE : isUAE}
          isAuthenticated={isHydrated ? clientIsAuthenticated : isAuthenticated}
          priority={index === 0 && sectionType === 'arrived'}
        />
      ))}
    </div>
  )
}

/**
 * Loading skeleton component for vehicle grid
 * Used in Suspense fallback
 */
export function VehicleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="alumina-surface rounded-2xl border border-border overflow-hidden">
          <Skeleton className="h-56 w-full" />
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
