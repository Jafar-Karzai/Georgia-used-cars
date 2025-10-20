import { NextRequest, NextResponse } from 'next/server'
import { InvoiceService, type CreateInvoiceData, type InvoiceFilters, type InvoiceLineItem } from '@/lib/services/invoices'
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
function validateCurrency(currency: string): boolean {
  const allowedCurrencies = ['AED', 'USD', 'CAD']
  return allowedCurrencies.includes(currency)
}

function validateStatus(status: string): boolean {
  const allowedStatuses = ['draft', 'sent', 'viewed', 'partially_paid', 'fully_paid', 'overdue', 'cancelled']
  return allowedStatuses.includes(status)
}

function validateDateFormat(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && Boolean(dateString.match(/^\d{4}-\d{2}-\d{2}$/))
}

function validateLineItem(item: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!item.description || typeof item.description !== 'string' || item.description.trim().length === 0) {
    errors.push('Line item description is required')
  }

  if (typeof item.quantity !== 'number' || item.quantity <= 0) {
    errors.push('Line item quantity must be a positive number')
  }

  if (typeof item.unit_price !== 'number' || item.unit_price < 0) {
    errors.push('Line item unit_price must be a non-negative number')
  }

  if (typeof item.total !== 'number' || item.total < 0) {
    errors.push('Line item total must be a non-negative number')
  }

  // Validate calculation consistency
  if (typeof item.quantity === 'number' && typeof item.unit_price === 'number' && typeof item.total === 'number') {
    const expectedTotal = Math.round(item.quantity * item.unit_price * 100) / 100
    const actualTotal = Math.round(item.total * 100) / 100
    if (Math.abs(expectedTotal - actualTotal) > 0.01) {
      errors.push('Line item calculation inconsistent: quantity × unit_price should equal total')
    }
  }

  if (item.vat_rate !== undefined && (typeof item.vat_rate !== 'number' || item.vat_rate < 0 || item.vat_rate > 100)) {
    errors.push('Line item vat_rate must be between 0 and 100')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

function validateCreateInvoiceData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required fields
  if (!data.customer_id || typeof data.customer_id !== 'string') {
    errors.push('customer_id is required and must be a string')
  }

  if (!Array.isArray(data.line_items) || data.line_items.length === 0) {
    errors.push('line_items is required and must be a non-empty array')
  } else {
    // Validate each line item
    data.line_items.forEach((item: any, index: number) => {
      const validation = validateLineItem(item)
      if (!validation.isValid) {
        validation.errors.forEach(error => {
          errors.push(`Line item ${index + 1}: ${error}`)
        })
      }
    })
  }

  if (typeof data.subtotal !== 'number' || data.subtotal < 0) {
    errors.push('subtotal is required and must be a non-negative number')
  }

  if (typeof data.vat_rate !== 'number' || data.vat_rate < 0 || data.vat_rate > 100) {
    errors.push('vat_rate is required and must be between 0 and 100')
  }

  if (typeof data.vat_amount !== 'number' || data.vat_amount < 0) {
    errors.push('vat_amount is required and must be a non-negative number')
  }

  if (typeof data.total_amount !== 'number' || data.total_amount <= 0) {
    errors.push('total_amount is required and must be a positive number')
  }

  if (!data.currency || typeof data.currency !== 'string' || !validateCurrency(data.currency)) {
    errors.push('currency is required and must be one of: AED, USD, CAD')
  }

  if (!data.due_date || typeof data.due_date !== 'string' || !validateDateFormat(data.due_date)) {
    errors.push('due_date is required and must be in YYYY-MM-DD format')
  }

  // Optional status validation
  if (data.status && (typeof data.status !== 'string' || !validateStatus(data.status))) {
    errors.push('status must be one of: draft, sent, viewed, partially_paid, fully_paid, overdue, cancelled')
  }

  // Optional vehicle_id validation
  if (data.vehicle_id && typeof data.vehicle_id !== 'string') {
    errors.push('vehicle_id must be a string')
  }

  // Optional string fields validation
  const stringFields = ['invoice_number', 'payment_terms', 'notes']
  stringFields.forEach(field => {
    if (data[field] && typeof data[field] !== 'string') {
      errors.push(`${field} must be a string`)
    }
  })

  // Validate calculation consistency
  if (typeof data.subtotal === 'number' && typeof data.vat_rate === 'number' && typeof data.vat_amount === 'number' && typeof data.total_amount === 'number') {
    const expectedVat = Math.round(data.subtotal * data.vat_rate / 100 * 100) / 100
    const actualVat = Math.round(data.vat_amount * 100) / 100
    const expectedTotal = Math.round((data.subtotal + data.vat_amount) * 100) / 100
    const actualTotal = Math.round(data.total_amount * 100) / 100

    if (Math.abs(expectedVat - actualVat) > 0.01) {
      errors.push('VAT calculation inconsistent: subtotal × vat_rate / 100 should equal vat_amount')
    }

    if (Math.abs(expectedTotal - actualTotal) > 0.01) {
      errors.push('Total calculation inconsistent: subtotal + vat_amount should equal total_amount')
    }
  }

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
    const filters: InvoiceFilters = {}
    
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!
    }
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!
    }
    
    if (searchParams.get('customer_id')) {
      filters.customer_id = searchParams.get('customer_id')!
    }
    
    if (searchParams.get('vehicle_id')) {
      filters.vehicle_id = searchParams.get('vehicle_id')!
    }
    
    if (searchParams.get('currency')) {
      filters.currency = searchParams.get('currency')!
    }
    
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

    if (searchParams.get('overdue_only')) {
      filters.overdue_only = searchParams.get('overdue_only') === 'true'
    }

    // Get invoices with filters and pagination
    const result = await InvoiceService.getAll(filters, page, limit)

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
    console.error('Error in GET /api/invoices:', error)
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
    if (!hasPermission(currentUser.role, 'invoices', 'create')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    let invoiceData: CreateInvoiceData
    try {
      const body = await request.text()
      if (!body.trim()) {
        return NextResponse.json(
          { success: false, error: 'Request body is required' },
          { status: 400 }
        )
      }
      invoiceData = JSON.parse(body)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate invoice data
    const validation = validateCreateInvoiceData(invoiceData)
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

    // Create invoice
    const result = await InvoiceService.create(invoiceData, currentUser.id)

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
    console.error('Error in POST /api/invoices:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}