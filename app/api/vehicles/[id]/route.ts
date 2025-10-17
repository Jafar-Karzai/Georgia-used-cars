import { NextRequest, NextResponse } from 'next/server'
import { VehicleService, UpdateVehicleData } from '@/lib/services/vehicles'
import { getCurrentUser, hasPermission } from '@/lib/auth'
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

function validateUpdateData(data: any): ValidationError[] {
  const errors: ValidationError[] = []

  // VIN validation (if provided)
  if (data.vin !== undefined) {
    if (typeof data.vin !== 'string' || data.vin.length < 10 || data.vin.length > 17) {
      errors.push({ field: 'vin', message: 'VIN must be between 10 and 17 characters' })
    }
  }

  // Year validation (if provided)
  if (data.year !== undefined) {
    if (typeof data.year !== 'number' || data.year < 1900 || data.year > new Date().getFullYear() + 1) {
      errors.push({ field: 'year', message: `Year must be between 1900 and ${new Date().getFullYear() + 1}` })
    }
  }

  // Numeric field validations
  if (data.mileage !== undefined && (typeof data.mileage !== 'number' || data.mileage < 0)) {
    errors.push({ field: 'mileage', message: 'Mileage must be a non-negative number' })
  }

  if (data.purchase_price !== undefined && (typeof data.purchase_price !== 'number' || data.purchase_price <= 0)) {
    errors.push({ field: 'purchase_price', message: 'Purchase price must be positive' })
  }

  if (data.sale_price !== undefined && (typeof data.sale_price !== 'number' || data.sale_price <= 0)) {
    errors.push({ field: 'sale_price', message: 'Sale price must be positive' })
  }

  if (data.repair_estimate !== undefined && (typeof data.repair_estimate !== 'number' || data.repair_estimate < 0)) {
    errors.push({ field: 'repair_estimate', message: 'Repair estimate must be non-negative' })
  }

  if (data.estimated_total_cost !== undefined && (typeof data.estimated_total_cost !== 'number' || data.estimated_total_cost < 0)) {
    errors.push({ field: 'estimated_total_cost', message: 'Estimated total cost must be non-negative' })
  }

  // Enum validations
  if (data.current_status && !VALID_STATUSES.includes(data.current_status)) {
    errors.push({ field: 'current_status', message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` })
  }

  if (data.damage_severity && !VALID_DAMAGE_SEVERITIES.includes(data.damage_severity)) {
    errors.push({ field: 'damage_severity', message: `Invalid damage severity. Must be one of: ${VALID_DAMAGE_SEVERITIES.join(', ')}` })
  }

  if (data.purchase_currency && !VALID_CURRENCIES.includes(data.purchase_currency)) {
    errors.push({ field: 'purchase_currency', message: `Invalid currency. Must be one of: ${VALID_CURRENCIES.join(', ')}` })
  }

  if (data.sale_currency && !VALID_CURRENCIES.includes(data.sale_currency)) {
    errors.push({ field: 'sale_currency', message: `Invalid currency. Must be one of: ${VALID_CURRENCIES.join(', ')}` })
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    // Get vehicle by ID
    const result = await VehicleService.getById(id)

    if (!result.success) {
      const errorMessage = result.error || 'Failed to fetch vehicle'
      
      if (errorMessage.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'Vehicle not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { success: false, error: sanitizeError(errorMessage) },
        { status: 500 }
      )
    }

    // Add cache headers
    const response = NextResponse.json({
      success: true,
      data: result.data
    })

    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
    
    return response

  } catch (error: any) {
    console.error(`GET /api/vehicles/${params.id} error:`, error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check permissions
    if (!hasPermission(user.role, 'vehicles', 'update')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Vehicle ID is required' },
        { status: 400 }
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
    const validationErrors = validateUpdateData(data)
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

    // Update vehicle
    const result = await VehicleService.update(id, data as UpdateVehicleData, user.id)

    if (!result.success) {
      const errorMessage = result.error || 'Failed to update vehicle'
      
      // Handle specific error types
      if (errorMessage.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'Vehicle not found' },
          { status: 404 }
        )
      }

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

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error: any) {
    console.error(`PUT /api/vehicles/${params.id} error:`, error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check permissions (delete requires elevated permissions)
    if (!hasPermission(user.role, 'vehicles', 'delete')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    // Delete vehicle
    const result = await VehicleService.delete(id)

    if (!result.success) {
      const errorMessage = result.error || 'Failed to delete vehicle'
      
      // Handle specific error types
      if (errorMessage.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'Vehicle not found' },
          { status: 404 }
        )
      }

      if (errorMessage.includes('Cannot delete') || errorMessage.includes('constraint')) {
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

    return NextResponse.json({
      success: true,
      message: 'Vehicle deleted successfully'
    })

  } catch (error: any) {
    console.error(`DELETE /api/vehicles/${params.id} error:`, error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}