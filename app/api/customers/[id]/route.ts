import { NextRequest, NextResponse } from 'next/server'
import { CustomerService, type UpdateCustomerData } from '@/lib/services/customers'
import { getCurrentUser, hasPermission } from '@/lib/auth'
import { serializeToSnakeCase } from '@/lib/utils/serialization'

// Helper function to sanitize error messages
function sanitizeError(error: string): string {
  // Remove sensitive information from error messages
  return error
    .replace(/connection string ".*?"/gi, '[REDACTED]')
    .replace(/password[:\s].*?[\s"]/gi, '[REDACTED] ')
    .replace(/user:.*?@/gi, '[REDACTED]@')
}

// Validation helper functions
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePhone(phone: string): boolean {
  // Allow various phone formats including international
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8
}

function validateLanguage(language: string): boolean {
  const allowedLanguages = ['en', 'ar', 'fr', 'es', 'de', 'it', 'ru', 'hi', 'ur']
  return allowedLanguages.includes(language)
}

function validateDateFormat(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && Boolean(dateString.match(/^\d{4}-\d{2}-\d{2}$/))
}

function validateUpdateCustomerData(data: Record<string, unknown>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Optional full name validation
  if (data.full_name !== undefined && (typeof data.full_name !== 'string' || data.full_name.trim().length < 2)) {
    errors.push('full_name must be at least 2 characters long')
  }

  // Optional email validation
  if (data.email !== undefined && (typeof data.email !== 'string' || !validateEmail(data.email))) {
    errors.push('email must be a valid email address')
  }

  // Optional phone validation
  if (data.phone !== undefined && (typeof data.phone !== 'string' || !validatePhone(data.phone))) {
    errors.push('phone must be a valid phone number with at least 8 digits')
  }

  // Optional preferred language validation
  if (data.preferred_language !== undefined && (typeof data.preferred_language !== 'string' || !validateLanguage(data.preferred_language))) {
    errors.push('preferred_language must be one of: en, ar, fr, es, de, it, ru, hi, ur')
  }

  // Optional date of birth validation
  if (data.date_of_birth !== undefined && (typeof data.date_of_birth !== 'string' || !validateDateFormat(data.date_of_birth))) {
    errors.push('date_of_birth must be in YYYY-MM-DD format')
  }

  // Optional marketing consent validation
  if (data.marketing_consent !== undefined && typeof data.marketing_consent !== 'boolean') {
    errors.push('marketing_consent must be a boolean value')
  }

  // Optional string fields validation
  const stringFields = ['address', 'city', 'country']
  stringFields.forEach(field => {
    if (data[field] !== undefined && typeof data[field] !== 'string') {
      errors.push(`${field} must be a string`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params: paramsPromise }: RouteParams) {
  const params = await paramsPromise
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate ID parameter
    const { id } = params
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    // Get customer by ID
    const result = await CustomerService.getById(id)

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
    console.error('Error in GET /api/customers/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params: paramsPromise }: RouteParams) {
  const params = await paramsPromise
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check permissions
    if (!hasPermission(currentUser.role, 'customers', 'update')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Validate ID parameter
    const { id } = params
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    // Parse request body
    let updateData: UpdateCustomerData
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

    // Validate update data
    const validation = validateUpdateCustomerData(updateData)
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validation.errors.join(', ')
        },
        { status: 400 }
      )
    }

    // Update customer
    const result = await CustomerService.update(id, updateData)

    if (!result.success) {
      // Handle not found
      if (result.error?.includes('not found')) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 404 }
        )
      }

      // Handle duplicate email
      if (result.error?.includes('already exists')) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 409 }
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
    console.error('Error in PUT /api/customers/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params: paramsPromise }: RouteParams) {
  const params = await paramsPromise
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check permissions
    if (!hasPermission(currentUser.role, 'customers', 'delete')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Validate ID parameter
    const { id } = params
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    // Delete customer
    const result = await CustomerService.delete(id)

    if (!result.success) {
      // Handle not found
      if (result.error?.includes('not found')) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 404 }
        )
      }

      // Handle foreign key constraints
      if (result.error?.includes('Cannot delete')) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: sanitizeError(result.error!) },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    })

  } catch (error: unknown) {
    console.error('Error in DELETE /api/customers/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}