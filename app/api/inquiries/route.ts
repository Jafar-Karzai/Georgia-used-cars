import { NextRequest, NextResponse } from 'next/server'
import { InquiryService, type CreateInquiryData, type InquiryFilters } from '@/lib/services/inquiries'
import { getCurrentUser, hasPermission } from '@/lib/auth'
import { serializeArrayToSnakeCase, serializeToSnakeCase } from '@/lib/utils/serialization'

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

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))

    const filters: InquiryFilters = {}

    if (searchParams.get('search')) filters.search = searchParams.get('search')!
    if (searchParams.get('status')) filters.status = searchParams.get('status')!
    if (searchParams.get('priority')) filters.priority = searchParams.get('priority')!
    if (searchParams.get('source')) filters.source = searchParams.get('source')!
    if (searchParams.get('assigned_to')) filters.assignedTo = searchParams.get('assigned_to')!
    if (searchParams.get('customer_id')) filters.customerId = searchParams.get('customer_id')!
    if (searchParams.get('vehicle_id')) filters.vehicleId = searchParams.get('vehicle_id')!
    if (searchParams.get('created_from')) filters.createdFrom = searchParams.get('created_from')!
    if (searchParams.get('created_to')) filters.createdTo = searchParams.get('created_to')!

    const result = await InquiryService.getAll(filters, page, limit)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: sanitizeError(result.error!) },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: serializeArrayToSnakeCase(result.data),
      pagination: result.pagination
    })

  } catch (error: unknown) {
    console.error('Error in GET /api/inquiries:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!hasPermission(currentUser.role, 'inquiries', 'create')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    let inquiryData: CreateInquiryData
    try {
      const body = await request.text()
      if (!body.trim()) {
        return NextResponse.json(
          { success: false, error: 'Request body is required' },
          { status: 400 }
        )
      }
      inquiryData = JSON.parse(body)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const result = await InquiryService.create(inquiryData)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: sanitizeError(result.error!) },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data: serializeToSnakeCase(result.data) },
      { status: 201 }
    )

  } catch (error: unknown) {
    console.error('Error in POST /api/inquiries:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
