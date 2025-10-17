import { NextRequest, NextResponse } from 'next/server'
import { InvoiceService, type UpdateInvoiceData, type InvoiceLineItem } from '@/lib/services/invoices'
import { getCurrentUser, hasPermission } from '@/lib/auth'

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

function validateUpdateInvoiceData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // All fields are optional for updates, but if provided, must be valid

  // Optional status validation
  if (data.status && (typeof data.status !== 'string' || !validateStatus(data.status))) {
    errors.push('Invalid status. Must be one of: draft, sent, viewed, partially_paid, fully_paid, overdue, cancelled')
  }

  // Optional customer_id validation
  if (data.customer_id && typeof data.customer_id !== 'string') {
    errors.push('customer_id must be a string')
  }

  // Optional vehicle_id validation
  if (data.vehicle_id && typeof data.vehicle_id !== 'string') {
    errors.push('vehicle_id must be a string')
  }

  // Optional numeric field validations
  if (data.subtotal !== undefined && (typeof data.subtotal !== 'number' || data.subtotal < 0)) {
    errors.push('subtotal must be a non-negative number')
  }

  if (data.vat_rate !== undefined && (typeof data.vat_rate !== 'number' || data.vat_rate < 0 || data.vat_rate > 100)) {
    errors.push('vat_rate must be between 0 and 100')
  }

  if (data.vat_amount !== undefined && (typeof data.vat_amount !== 'number' || data.vat_amount < 0)) {
    errors.push('vat_amount must be a non-negative number')
  }

  if (data.total_amount !== undefined && (typeof data.total_amount !== 'number' || data.total_amount <= 0)) {
    errors.push('total_amount must be a positive number')
  }

  // Optional currency validation
  if (data.currency && (typeof data.currency !== 'string' || !validateCurrency(data.currency))) {
    errors.push('currency must be one of: AED, USD, CAD')
  }

  // Optional date validation
  if (data.due_date && (typeof data.due_date !== 'string' || !validateDateFormat(data.due_date))) {
    errors.push('due_date must be in YYYY-MM-DD format')
  }

  // Optional string fields validation
  const stringFields = ['invoice_number', 'payment_terms', 'notes']
  stringFields.forEach(field => {
    if (data[field] && typeof data[field] !== 'string') {
      errors.push(`${field} must be a string`)
    }
  })

  // Optional line items validation
  if (data.line_items !== undefined) {
    if (!Array.isArray(data.line_items)) {
      errors.push('line_items must be an array')
    } else {
      data.line_items.forEach((item: any, index: number) => {
        const validation = validateLineItem(item)
        if (!validation.isValid) {
          validation.errors.forEach(error => {
            errors.push(`Line item ${index + 1}: ${error}`)
          })
        }
      })
    }
  }

  // Validate calculation consistency if amounts provided
  if (data.subtotal !== undefined && data.vat_rate !== undefined && data.vat_amount !== undefined && data.total_amount !== undefined) {
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (!params.id || params.id.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Get invoice by ID
    const result = await InvoiceService.getById(params.id)

    if (!result.success) {
      if (result.error === 'Invoice not found') {
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
      data: result.data
    })

  } catch (error: unknown) {
    console.error('Error in GET /api/invoices/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (!hasPermission(currentUser.role, 'invoices', 'update')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Validate ID parameter
    if (!params.id || params.id.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Parse request body
    let updateData: UpdateInvoiceData
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
    const validation = validateUpdateInvoiceData(updateData)
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

    // Update invoice
    const result = await InvoiceService.update(params.id, updateData)

    if (!result.success) {
      if (result.error === 'Invoice not found') {
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
      data: result.data
    })

  } catch (error: unknown) {
    console.error('Error in PUT /api/invoices/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (!hasPermission(currentUser.role, 'invoices', 'delete')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Validate ID parameter
    if (!params.id || params.id.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Delete invoice
    const result = await InvoiceService.delete(params.id)

    if (!result.success) {
      if (result.error === 'Invoice not found') {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 404 }
        )
      }
      
      // Handle foreign key constraint errors
      if (result.error?.includes('Cannot delete') || result.error?.includes('foreign key')) {
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
      message: 'Invoice deleted successfully'
    })

  } catch (error: unknown) {
    console.error('Error in DELETE /api/invoices/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}