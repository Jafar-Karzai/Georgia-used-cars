import { NextRequest, NextResponse } from 'next/server'
import { VehicleService, UpdateVehicleData } from '@/lib/services/vehicles'
import { getCurrentUserFromRequest } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'
import { serializeToSnakeCase } from '@/lib/utils/serialization'
import { validateUpdateVehicleData } from '@/lib/validators/vehicle-validators'

function sanitizeError(error: string): string {
  // Remove sensitive information from error messages
  return error
    .replace(/connection string.*?failed/gi, 'database connection failed')
    .replace(/password.*?@/gi, 'credentials@')
    .replace(/user:.*?@/gi, 'user:***@')
}

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  let id = 'unknown'
  try {
    const params = await ctx.params
    id = params.id

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

    // Serialize response to snake_case
    const serializedData = serializeToSnakeCase(result.data)

    // Add cache headers
    const response = NextResponse.json({
      success: true,
      data: serializedData
    })

    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')

    return response

  } catch (error: any) {
    console.error(`GET /api/vehicles/${id} error:`, error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  let id = 'unknown'
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
    if (!hasPermission(user.role, 'edit_vehicles') && !hasPermission(user.role, 'manage_vehicles')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const params = await ctx.params
    id = params.id

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
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate data
    const validationErrors = validateUpdateVehicleData(data)
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

    // Serialize response to snake_case
    const serializedData = serializeToSnakeCase(result.data)

    return NextResponse.json({
      success: true,
      data: serializedData
    })

  } catch (error: any) {
    console.error(`PUT /api/vehicles/${id} error:`, error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  let id = 'unknown'
  try {
    // Check authentication
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check permissions (delete requires elevated permissions)
    if (!hasPermission(user.role, 'delete_vehicles') && !hasPermission(user.role, 'manage_vehicles')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const params = await ctx.params
    id = params.id

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
    console.error(`DELETE /api/vehicles/${id} error:`, error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
