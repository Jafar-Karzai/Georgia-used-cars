import { NextRequest, NextResponse } from 'next/server'
import { CustomerService, type CreateCustomerData, type CustomerFilters } from '@/lib/services/customers'
import { getCurrentUser, hasPermission } from '@/lib/auth'
import { serializeToSnakeCase, serializeArrayToSnakeCase } from '@/lib/utils/serialization'

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

function validateCreateCustomerData(data: Record<string, unknown>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required fields
  if (!data.full_name || typeof data.full_name !== 'string' || data.full_name.trim().length < 2) {
    errors.push('full_name is required and must be at least 2 characters long')
  }

  // Optional email validation
  if (data.email && (typeof data.email !== 'string' || !validateEmail(data.email))) {
    errors.push('email must be a valid email address')
  }

  // Optional phone validation
  if (data.phone && (typeof data.phone !== 'string' || !validatePhone(data.phone))) {
    errors.push('phone must be a valid phone number with at least 8 digits')
  }

  // Optional preferred language validation
  if (data.preferred_language && (typeof data.preferred_language !== 'string' || !validateLanguage(data.preferred_language))) {
    errors.push('preferred_language must be one of: en, ar, fr, es, de, it, ru, hi, ur')
  }

  // Optional date of birth validation
  if (data.date_of_birth && (typeof data.date_of_birth !== 'string' || !validateDateFormat(data.date_of_birth))) {
    errors.push('date_of_birth must be in YYYY-MM-DD format')
  }

  // Optional marketing consent validation
  if (data.marketing_consent !== undefined && typeof data.marketing_consent !== 'boolean') {
    errors.push('marketing_consent must be a boolean value')
  }

  // Optional string fields validation
  const stringFields = ['address', 'city', 'country']
  stringFields.forEach(field => {
    if (data[field] && typeof data[field] !== 'string') {
      errors.push(`${field} must be a string`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
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

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))

    // Build filters
    const filters: CustomerFilters = {}
    
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!
    }
    
    if (searchParams.get('city')) {
      filters.city = searchParams.get('city')!
    }
    
    if (searchParams.get('country')) {
      filters.country = searchParams.get('country')!
    }
    
    if (searchParams.get('marketing_consent')) {
      filters.marketing_consent = searchParams.get('marketing_consent') === 'true'
    }
    
    if (searchParams.get('created_from')) {
      filters.created_from = searchParams.get('created_from')!
    }
    
    if (searchParams.get('created_to')) {
      filters.created_to = searchParams.get('created_to')!
    }

    // Get customers with filters and pagination
    const result = await CustomerService.getAll(filters, page, limit)

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
    console.error('Error in GET /api/customers:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    if (!hasPermission(currentUser.role, 'customers', 'create')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    let customerData: CreateCustomerData
    try {
      const body = await request.text()
      if (!body.trim()) {
        return NextResponse.json(
          { success: false, error: 'Request body is required' },
          { status: 400 }
        )
      }
      customerData = JSON.parse(body)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate customer data
    const validation = validateCreateCustomerData(customerData)
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

    // Create customer
    const result = await CustomerService.create(customerData)

    if (!result.success) {
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

    return NextResponse.json(
      { success: true, data: serializeToSnakeCase(result.data) },
      { status: 201 }
    )

  } catch (error: unknown) {
    console.error('Error in POST /api/customers:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}