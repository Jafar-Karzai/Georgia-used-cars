import { NextRequest, NextResponse } from 'next/server'
import { CustomerService } from '@/lib/services/customers'
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

    // Get all statistics in parallel for better performance
    const [statisticsResult, countryResult, marketingResult] = await Promise.all([
      CustomerService.getStatistics(),
      CustomerService.getByCountry(),
      CustomerService.getMarketingStats()
    ])

    // Check for errors in any of the results
    if (!statisticsResult.success) {
      return NextResponse.json(
        { success: false, error: sanitizeError(statisticsResult.error!) },
        { status: 500 }
      )
    }

    if (!countryResult.success) {
      return NextResponse.json(
        { success: false, error: sanitizeError(countryResult.error!) },
        { status: 500 }
      )
    }

    if (!marketingResult.success) {
      return NextResponse.json(
        { success: false, error: sanitizeError(marketingResult.error!) },
        { status: 500 }
      )
    }

    // Combine all statistics
    const combinedStats = {
      overview: statisticsResult.data,
      byCountry: countryResult.data,
      marketing: marketingResult.data
    }

    const response = NextResponse.json({
      success: true,
      data: combinedStats
    })

    // Add cache headers for performance
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )

    return response

  } catch (error: unknown) {
    console.error('Error in GET /api/customers/stats:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}