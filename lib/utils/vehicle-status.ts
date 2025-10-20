/**
 * Vehicle Status Utilities
 * Handles status mapping, formatting, and badge styling for both public and admin contexts
 */

import type { VehicleStatus } from '@/types/database'

// Status groupings for public display
const ARRIVING_SOON_STATUSES: VehicleStatus[] = [
  'auction_won',
  'payment_processing',
  'pickup_scheduled',
  'in_transit_to_port',
  'at_port',
  'shipped',
  'in_transit',
  'at_uae_port',
  'customs_clearance',
  'released_from_customs',
  'in_transit_to_yard'
]

const ARRIVED_STATUSES: VehicleStatus[] = [
  'at_yard',
  'under_enhancement',
  'ready_for_sale'
]

const RESERVED_STATUSES: VehicleStatus[] = [
  'reserved'
]

const HIDDEN_STATUSES: VehicleStatus[] = [
  'sold',
  'delivered'
]

/**
 * Get the public-facing status label for a vehicle
 * Used for the public site to display simplified status information
 */
export function getPublicStatusLabel(status: VehicleStatus): string | null {
  if (ARRIVING_SOON_STATUSES.includes(status)) {
    return 'Arriving Soon'
  }
  if (ARRIVED_STATUSES.includes(status)) {
    return 'Arrived'
  }
  if (RESERVED_STATUSES.includes(status)) {
    return 'Reserved'
  }
  return null
}

/**
 * Determine if a vehicle should be shown on the public site
 * Filters out sold and delivered vehicles
 */
export function shouldShowInPublic(status: VehicleStatus): boolean {
  return !HIDDEN_STATUSES.includes(status)
}

/**
 * Get badge styling for public status display
 * Returns Tailwind classes for badge styling
 */
export function getPublicStatusBadgeStyle(status: VehicleStatus): string {
  if (ARRIVING_SOON_STATUSES.includes(status)) {
    // Blue - representing incoming vehicles
    return 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-200'
  }
  if (ARRIVED_STATUSES.includes(status)) {
    // Green for ready vehicles
    return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }
  if (RESERVED_STATUSES.includes(status)) {
    // Amber for reserved vehicles
    return 'bg-amber-100 text-amber-800 border-amber-200'
  }
  // Default fallback
  return 'bg-gray-100 text-gray-800 border-gray-200'
}

/**
 * Format status for admin display
 * Converts snake_case to Title Case
 */
export function formatAdminStatus(status: string): string {
  if (!status) return ''
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get all statuses that should be hidden from public
 */
export function getHiddenStatuses(): VehicleStatus[] {
  return HIDDEN_STATUSES
}

/**
 * Get color palette for badge based on status category
 */
export function getStatusColorInfo(status: VehicleStatus) {
  if (ARRIVING_SOON_STATUSES.includes(status)) {
    return {
      category: 'arriving-soon',
      color: 'blue',
      label: 'Arriving Soon'
    }
  }
  if (ARRIVED_STATUSES.includes(status)) {
    return {
      category: 'arrived',
      color: 'emerald',
      label: 'Arrived'
    }
  }
  if (RESERVED_STATUSES.includes(status)) {
    return {
      category: 'reserved',
      color: 'amber',
      label: 'Reserved'
    }
  }
  return {
    category: 'unknown',
    color: 'gray',
    label: formatAdminStatus(status)
  }
}
