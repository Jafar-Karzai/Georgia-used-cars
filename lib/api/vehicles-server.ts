/**
 * Server-side vehicle fetching for Server Components
 * Used by pages that need to fetch vehicle data at build/request time for SEO
 */

import { VehicleService } from '@/lib/services/vehicles'
import { getStatusesForGroup } from '@/lib/utils/vehicle-status'
import type { VehicleStatus } from '@/types/database'

export interface PublicVehicleData {
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
    id: string
    url: string
    is_primary: boolean
    sort_order?: number
  }>
}

interface FetchVehiclesResult {
  arrivedVehicles: PublicVehicleData[]
  arrivingSoonVehicles: PublicVehicleData[]
}

/**
 * Fetches public vehicles for the homepage, split into arrived and arriving soon sections
 * This runs on the server and returns data that can be rendered in HTML for SEO
 */
export async function fetchHomepageVehicles(): Promise<FetchVehiclesResult> {
  try {
    // Use the VehicleService directly on the server
    const response = await VehicleService.getPublic({}, 1, 20)

    if (!response.success || !response.data) {
      console.error('Failed to fetch vehicles:', response.error)
      return { arrivedVehicles: [], arrivingSoonVehicles: [] }
    }

    // Get status groups - matches inventory page logic exactly
    const arrivedStatuses = getStatusesForGroup('arrived')
    const arrivingSoonStatuses = getStatusesForGroup('arriving_soon')

    // Normalize vehicle data to consistent snake_case format
    const normalizedVehicles = response.data.map(normalizeVehicleData)

    // Split vehicles into sections based on current_status (not dates)
    const arrived = normalizedVehicles.filter((v) =>
      arrivedStatuses.includes(v.current_status as VehicleStatus)
    ).slice(0, 6)

    const arriving = normalizedVehicles.filter((v) =>
      arrivingSoonStatuses.includes(v.current_status as VehicleStatus)
    ).slice(0, 6)

    return {
      arrivedVehicles: arrived,
      arrivingSoonVehicles: arriving
    }
  } catch (error) {
    console.error('Error fetching homepage vehicles:', error)
    return { arrivedVehicles: [], arrivingSoonVehicles: [] }
  }
}

/**
 * Normalizes vehicle data from Prisma camelCase to snake_case for frontend consistency
 */
function normalizeVehicleData(vehicle: Record<string, unknown>): PublicVehicleData {
  // Handle both camelCase (Prisma) and snake_case (Supabase fallback) formats
  return {
    id: vehicle.id as string,
    year: vehicle.year as number,
    make: vehicle.make as string,
    model: vehicle.model as string,
    vin: (vehicle.vin ?? vehicle.vin) as string | undefined,
    lot_number: (vehicle.lotNumber ?? vehicle.lot_number) as string | undefined,
    mileage: (vehicle.mileage ?? vehicle.mileage) as number | undefined,
    fuel_type: (vehicle.fuelType ?? vehicle.fuel_type) as string | undefined,
    transmission: (vehicle.transmission ?? vehicle.transmission) as string | undefined,
    body_style: (vehicle.bodyStyle ?? vehicle.body_style) as string | undefined,
    current_status: (vehicle.currentStatus ?? vehicle.current_status) as string,
    sale_price: normalizeDecimal(vehicle.salePrice ?? vehicle.sale_price),
    sale_currency: (vehicle.saleCurrency ?? vehicle.sale_currency) as string | undefined,
    sale_type: (vehicle.saleType ?? vehicle.sale_type) as string | undefined,
    sale_price_includes_vat: (vehicle.salePriceIncludesVat ?? vehicle.sale_price_includes_vat) as boolean | undefined,
    expected_arrival_date: normalizeDate(vehicle.expectedArrivalDate ?? vehicle.expected_arrival_date),
    actual_arrival_date: normalizeDate(vehicle.actualArrivalDate ?? vehicle.actual_arrival_date),
    run_and_drive: (vehicle.runAndDrive ?? vehicle.run_and_drive) as boolean | undefined,
    primary_damage: (vehicle.primaryDamage ?? vehicle.primary_damage) as string | undefined,
    vehicle_photos: normalizePhotos(vehicle.vehiclePhotos ?? vehicle.vehicle_photos)
  }
}

/**
 * Normalizes Prisma Decimal to number
 */
function normalizeDecimal(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'number') return value
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber()
  }
  if (typeof value === 'string') return parseFloat(value)
  return undefined
}

/**
 * Normalizes date to string format
 */
function normalizeDate(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return undefined
}

/**
 * Normalizes photos array to consistent format
 */
function normalizePhotos(photos: unknown): PublicVehicleData['vehicle_photos'] {
  if (!Array.isArray(photos)) return undefined

  return photos.map((photo: Record<string, unknown>) => ({
    id: photo.id as string,
    url: photo.url as string,
    is_primary: (photo.isPrimary ?? photo.is_primary) as boolean,
    sort_order: (photo.sortOrder ?? photo.sort_order) as number | undefined
  }))
}
