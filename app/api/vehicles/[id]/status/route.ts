import { NextRequest, NextResponse } from 'next/server'
import { VehicleService } from '@/lib/services/vehicles'
import { getCurrentUserFromRequest } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'

export async function PATCH(
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
    let data: { status: string; location?: string; notes?: string }
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

    // Validate required fields
    if (!data.status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    // Update vehicle status
    const result = await VehicleService.updateStatus(
      id,
      data.status,
      data.location,
      data.notes,
      user.id
    )

    if (!result.success) {
      const errorMessage = result.error || 'Failed to update status'

      if (errorMessage.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'Vehicle not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Vehicle status updated successfully'
    })

  } catch (error: unknown) {
    console.error(`PATCH /api/vehicles/${id}/status error:`, error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
