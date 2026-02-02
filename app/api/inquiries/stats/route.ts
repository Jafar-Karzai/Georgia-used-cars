import { NextRequest, NextResponse } from 'next/server'
import { InquiryService, type InquiryFilters } from '@/lib/services/inquiries'
import { getCurrentUser } from '@/lib/auth'

function sanitizeError(error: string): string {
  return error
    .replace(/connection string ".*?"/gi, '[REDACTED]')
    .replace(/password[:\s].*?[\s"]/gi, '[REDACTED] ')
    .replace(/user:.*?@/gi, '[REDACTED]@')
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)

    const filters: InquiryFilters = {}
    if (searchParams.get('status')) filters.status = searchParams.get('status')!
    if (searchParams.get('priority')) filters.priority = searchParams.get('priority')!
    if (searchParams.get('source')) filters.source = searchParams.get('source')!
    if (searchParams.get('assigned_to')) filters.assignedTo = searchParams.get('assigned_to')!

    const result = await InquiryService.getStatistics(filters)

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

    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )

    return response

  } catch (error: unknown) {
    console.error('Error in GET /api/inquiries/stats:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
