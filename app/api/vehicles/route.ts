import { NextRequest, NextResponse } from 'next/server'
import { VehicleService, CreateVehicleData, VehicleFilters } from '@/lib/services/vehicles'
import { getCurrentUserFromRequest } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'
import { serializeToSnakeCase, serializeArrayToSnakeCase } from '@/lib/utils/serialization'
import { validateCreateVehicleData } from '@/lib/validators/vehicle-validators'

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
    const filters: Partial<VehicleFilters> = {}
    if (search) filters.search = search
    if (status) filters.status = status
    if (make) filters.make = make
    if (model) filters.model = model
    if (auction_house) filters.auctionHouse = auction_house
    if (is_public !== undefined) filters.isPublic = is_public
    if (year_min !== undefined) filters.yearMin = year_min
    if (year_max !== undefined) filters.yearMax = year_max
    if (price_min !== undefined) filters.priceMin = price_min
    if (price_max !== undefined) filters.priceMax = price_max

    // Get vehicles from service
    const result = await VehicleService.getAll(filters, page, limit)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: sanitizeError(result.error || 'Failed to fetch vehicles') },
        { status: 500 }
      )
    }

    // Serialize response to snake_case
    const serializedData = result.data ? serializeArrayToSnakeCase(result.data) : []

    // Add cache headers for GET requests
    const response = NextResponse.json({
      success: true,
      data: serializedData,
      pagination: result.pagination
    })

    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')

    return response

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('GET /api/vehicles error:', errorMessage)
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
    let data: unknown
    try {
      const bodyText = await request.text()
      if (!bodyText.trim()) {
        return NextResponse.json(
          { success: false, error: 'Request body is required' },
          { status: 400 }
        )
      }
      data = JSON.parse(bodyText)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate data
    const validationErrors = validateCreateVehicleData(data)
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

    // Serialize response to snake_case
    const serializedData = serializeToSnakeCase(result.data)

    return NextResponse.json(
      { success: true, data: serializedData },
      { status: 201 }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('POST /api/vehicles error:', errorMessage)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}