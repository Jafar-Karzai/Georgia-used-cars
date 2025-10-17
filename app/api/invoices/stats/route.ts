import { NextRequest, NextResponse } from 'next/server'
import { InvoiceService, type InvoiceFilters } from '@/lib/services/invoices'
import { getCurrentUser } from '@/lib/auth'

// Helper function to sanitize error messages
function sanitizeError(error: string): string {
  // Remove sensitive information from error messages
  return error
    .replace(/connection string ".*?"/gi, '[REDACTED]')
    .replace(/password[:\s].*?[\s"]/gi, '[REDACTED] ')
    .replace(/user:.*?@/gi, '[REDACTED]@')
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Extract query parameters for filtering
    const { searchParams } = new URL(request.url)
    
    // Build filters
    const filters: InvoiceFilters = {}
    
    if (searchParams.get('created_from')) {
      filters.created_from = searchParams.get('created_from')!
    }
    
    if (searchParams.get('created_to')) {
      filters.created_to = searchParams.get('created_to')!
    }
    
    if (searchParams.get('due_from')) {
      filters.due_from = searchParams.get('due_from')!
    }
    
    if (searchParams.get('due_to')) {
      filters.due_to = searchParams.get('due_to')!
    }

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!
    }

    if (searchParams.get('currency')) {
      filters.currency = searchParams.get('currency')!
    }

    if (searchParams.get('customer_id')) {
      filters.customer_id = searchParams.get('customer_id')!
    }

    if (searchParams.get('vehicle_id')) {
      filters.vehicle_id = searchParams.get('vehicle_id')!
    }

    // Get invoice statistics
    const result = await InvoiceService.getStatistics(filters)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: sanitizeError(result.error!) },
        { status: 500 }
      )
    }

    const response = NextResponse.json({
      success: true,
      data: result.data
    })

    // Add cache headers for statistics endpoint
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')

    return response

  } catch (error: unknown) {
    console.error('Error in GET /api/invoices/stats:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}