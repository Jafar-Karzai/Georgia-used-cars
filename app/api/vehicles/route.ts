import { NextRequest, NextResponse } from 'next/server'
import { VehicleService, CreateVehicleData } from '@/lib/services/vehicles'
import { getCurrentUserFromRequest } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'
import type { VehicleStatus, DamageSeverity, CurrencyCode } from '@/types/database'

// Validation utilities
const VALID_STATUSES: VehicleStatus[] = [
  'auction_won', 'payment_processing', 'pickup_scheduled', 'in_transit_to_port',
  'at_port', 'shipped', 'in_transit', 'at_uae_port', 'customs_clearance',
  'released_from_customs', 'in_transit_to_yard', 'at_yard', 'under_enhancement',
  'ready_for_sale', 'reserved', 'sold', 'delivered'
]

const VALID_DAMAGE_SEVERITIES: DamageSeverity[] = ['minor', 'moderate', 'major', 'total_loss']
const VALID_CURRENCIES: CurrencyCode[] = ['USD', 'CAD', 'AED']

interface ValidationError {
  field: string
  message: string
}

function validateVehicleData(data: any): ValidationError[] {
  const errors: ValidationError[] = []

  // Required fields
  if (!data.vin) {
    errors.push({ field: 'vin', message: 'VIN is required' })
  } else if (typeof data.vin !== 'string' || data.vin.length < 10 || data.vin.length > 17) {
    errors.push({ field: 'vin', message: 'VIN must be between 10 and 17 characters' })
  }

  if (!data.year) {
    errors.push({ field: 'year', message: 'Year is required' })
  } else if (typeof data.year !== 'number' || data.year < 1900 || data.year > new Date().getFullYear() + 1) {
    errors.push({ field: 'year', message: `Year must be between 1900 and ${new Date().getFullYear() + 1}` })
  }

  if (!data.make) {
    errors.push({ field: 'make', message: 'Make is required' })
  }

  if (!data.model) {
    errors.push({ field: 'model', message: 'Model is required' })
  }

  if (!data.auction_house) {
    errors.push({ field: 'auction_house', message: 'Auction house is required' })
  }

  if (!data.purchase_price) {
    errors.push({ field: 'purchase_price', message: 'Purchase price is required' })
  } else if (typeof data.purchase_price !== 'number' || data.purchase_price <= 0) {
    errors.push({ field: 'purchase_price', message: 'Purchase price must be positive' })
  }

  // Optional field validations
  if (data.mileage !== undefined && (typeof data.mileage !== 'number' || data.mileage < 0)) {
    errors.push({ field: 'mileage', message: 'Mileage must be a non-negative number' })
  }

  if (data.repair_estimate !== undefined && (typeof data.repair_estimate !== 'number' || data.repair_estimate < 0)) {
    errors.push({ field: 'repair_estimate', message: 'Repair estimate must be non-negative' })
  }

  if (data.estimated_total_cost !== undefined && (typeof data.estimated_total_cost !== 'number' || data.estimated_total_cost < 0)) {
    errors.push({ field: 'estimated_total_cost', message: 'Estimated total cost must be non-negative' })
  }

  if (data.damage_severity && !VALID_DAMAGE_SEVERITIES.includes(data.damage_severity)) {
    errors.push({ field: 'damage_severity', message: `Invalid damage severity. Must be one of: ${VALID_DAMAGE_SEVERITIES.join(', ')}` })
  }

  if (data.purchase_currency && !VALID_CURRENCIES.includes(data.purchase_currency)) {
    errors.push({ field: 'purchase_currency', message: `Invalid currency. Must be one of: ${VALID_CURRENCIES.join(', ')}` })
  }

  return errors
}

function sanitizeError(error: string): string {
  // Remove sensitive information from error messages
  return error
    .replace(/connection string.*?failed/gi, 'database connection failed')
    .replace(/password.*?@/gi, 'credentials@')
    .replace(/user:.*?@/gi, 'user:***@')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined
    const make = searchParams.get('make') || undefined
    const model = searchParams.get('model') || undefined
    const auction_house = searchParams.get('auction_house') || undefined
    const is_public = searchParams.get('is_public') ? searchParams.get('is_public') === 'true' : undefined
    
    // Parse numeric filters
    const year_min = searchParams.get('year_min') ? parseInt(searchParams.get('year_min')!) : undefined
    const year_max = searchParams.get('year_max') ? parseInt(searchParams.get('year_max')!) : undefined
    const price_min = searchParams.get('price_min') ? parseFloat(searchParams.get('price_min')!) : undefined
    const price_max = searchParams.get('price_max') ? parseFloat(searchParams.get('price_max')!) : undefined
    
    // Parse pagination parameters
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const page = pageParam ? Math.max(1, parseInt(pageParam) || 1) : 1
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam) || 20)) : 20

    // Build filters object
    const filters: any = {}
    if (search) filters.search = search
    if (status) filters.status = status
    if (make) filters.make = make
    if (model) filters.model = model
    if (auction_house) filters.auction_house = auction_house
    if (is_public !== undefined) filters.is_public = is_public
    if (year_min !== undefined) filters.year_min = year_min
    if (year_max !== undefined) filters.year_max = year_max
    if (price_min !== undefined) filters.price_min = price_min
    if (price_max !== undefined) filters.price_max = price_max

    // Get vehicles from service
    const result = await VehicleService.getAll(filters, page, limit)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: sanitizeError(result.error || 'Failed to fetch vehicles') },
        { status: 500 }
      )
    }

    // Add cache headers for GET requests
    const response = NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    })

    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    
    return response

  } catch (error: any) {
    console.error('GET /api/vehicles error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check permissions
    if (!hasPermission(user.role, 'create_vehicles')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    let data: any
    try {
      const bodyText = await request.text()
      if (!bodyText.trim()) {
        return NextResponse.json(
          { success: false, error: 'Request body is required' },
          { status: 400 }
        )
      }
      data = JSON.parse(bodyText)
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate data
    const validationErrors = validateVehicleData(data)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationErrors.map(e => `${e.field}: ${e.message}`).join(', ')
        },
        { status: 400 }
      )
    }

    // Create vehicle
    const result = await VehicleService.create(data as CreateVehicleData, user.id)

    if (!result.success) {
      const errorMessage = result.error || 'Failed to create vehicle'
      
      // Handle specific error types
      if (errorMessage.includes('already exists')) {
        return NextResponse.json(
          { success: false, error: errorMessage },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { success: false, error: sanitizeError(errorMessage) },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('POST /api/vehicles error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}