import { NextRequest, NextResponse } from 'next/server'
import { VehicleService } from '@/lib/services/vehicles'
import { getCurrentUserFromRequest } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'
import { serializeToSnakeCase } from '@/lib/utils/serialization'

function sanitizeError(error: string): string {
  // Remove sensitive information from error messages
  return error
    .replace(/connection string.*?failed/gi, 'database connection failed')
    .replace(/password.*?@/gi, 'credentials@')
    .replace(/user:.*?@/gi, 'user:***@')
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check permissions (read access required)
    if (!hasPermission(user.role, 'view_vehicles')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get vehicle statistics
    const result = await VehicleService.getStatistics()

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: sanitizeError(result.error || 'Failed to fetch statistics') },
        { status: 500 }
      )
    }

    // Add cache headers for statistics endpoint
    const response = NextResponse.json({
      success: true,
      data: serializeToSnakeCase(result.data)
    })

    // Cache for 5 minutes since statistics change relatively slowly
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
    
    return response

  } catch (error: any) {
    console.error('GET /api/vehicles/stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
