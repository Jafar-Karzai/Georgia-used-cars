import { NextRequest, NextResponse } from 'next/server'
import { InquiryService, type UpdateInquiryData } from '@/lib/services/inquiries'
import { getCurrentUser, hasPermission } from '@/lib/auth'
import { serializeToSnakeCase } from '@/lib/utils/serialization'

function sanitizeError(error: string): string {
  return error
    .replace(/connection string ".*?"/gi, '[REDACTED]')
    .replace(/password[:\s].*?[\s"]/gi, '[REDACTED] ')
    .replace(/user:.*?@/gi, '[REDACTED]@')
}

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params: paramsPromise }: RouteParams) {
  const params = await paramsPromise
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Inquiry ID is required' },
        { status: 400 }
      )
    }

    const result = await InquiryService.getById(id)

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { success: false, error: sanitizeError(result.error!) },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: serializeToSnakeCase(result.data)
    })

  } catch (error: unknown) {
    console.error('Error in GET /api/inquiries/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params: paramsPromise }: RouteParams) {
  const params = await paramsPromise
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!hasPermission(currentUser.role, 'inquiries', 'update')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = params
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Inquiry ID is required' },
        { status: 400 }
      )
    }

    let updateData: UpdateInquiryData
    try {
      const body = await request.text()
      if (!body.trim()) {
        return NextResponse.json(
          { success: false, error: 'Request body is required' },
          { status: 400 }
        )
      }
      updateData = JSON.parse(body)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const result = await InquiryService.update(id, updateData)

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { success: false, error: sanitizeError(result.error!) },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: serializeToSnakeCase(result.data)
    })

  } catch (error: unknown) {
    console.error('Error in PUT /api/inquiries/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params: paramsPromise }: RouteParams) {
  const params = await paramsPromise
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!hasPermission(currentUser.role, 'inquiries', 'delete')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = params
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Inquiry ID is required' },
        { status: 400 }
      )
    }

    const result = await InquiryService.delete(id)

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { success: false, error: sanitizeError(result.error!) },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry deleted successfully'
    })

  } catch (error: unknown) {
    console.error('Error in DELETE /api/inquiries/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
