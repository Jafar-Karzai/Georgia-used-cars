import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, PUT, DELETE } from '../route'
import { InvoiceService, type UpdateInvoiceData } from '@/lib/services/invoices'
import { NextRequest } from 'next/server'

// Mock the InvoiceService
vi.mock('@/lib/services/invoices')

const mockInvoiceService = InvoiceService as any

// Mock Next.js auth
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    id: 'user-123',
    email: 'test@example.com',
    role: 'manager'
  }),
  hasPermission: vi.fn().mockReturnValue(true)
}))

describe('/api/invoices/[id]', () => {
  const invoiceId = 'invoice-123'
  const mockInvoice = {
    id: invoiceId,
    invoice_number: 'INV-2024-0001',
    customer_id: 'customer-123',
    vehicle_id: 'vehicle-456',
    subtotal: 23500,
    vat_rate: 5,
    vat_amount: 1175,
    total_amount: 24675,
    currency: 'AED',
    status: 'sent',
    due_date: '2024-02-15',
    payment_terms: 'Net 30 days',
    notes: 'Vehicle purchase invoice',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    created_by: 'user-123',
    customers: {
      id: 'customer-123',
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '+971501234567',
      address: '123 Main St',
      city: 'Dubai',
      country: 'UAE'
    },
    vehicles: {
      id: 'vehicle-456',
      year: 2021,
      make: 'Honda',
      model: 'Civic',
      vin: '1HGBH41JXMN109186',
      lot_number: 'LOT-001',
      sale_price: 22000
    },
    payments: [
      {
        id: 'payment-1',
        amount: 10000,
        currency: 'AED',
        payment_date: '2024-01-20',
        payment_method: 'bank_transfer',
        transaction_id: 'TXN-001',
        notes: 'Partial payment',
        created_at: '2024-01-20T00:00:00Z'
      }
    ],
    created_by_profile: {
      full_name: 'Admin User',
      email: 'admin@example.com'
    },
    total_paid: 10000,
    balance_due: 14675
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/invoices/[id]', () => {
    it('should return invoice by ID with all related data', async () => {
      mockInvoiceService.getById.mockResolvedValue({
        success: true,
        data: mockInvoice
      })

      const response = await GET(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123'),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(invoiceId)
      expect(data.data.invoice_number).toBe('INV-2024-0001')
      expect(data.data).toHaveProperty('customers')
      expect(data.data).toHaveProperty('vehicles')
      expect(data.data).toHaveProperty('payments')
      expect(data.data).toHaveProperty('created_by_profile')
      expect(data.data.total_paid).toBe(10000)
      expect(data.data.balance_due).toBe(14675)
      expect(mockInvoiceService.getById).toHaveBeenCalledWith(invoiceId)
    })

    it('should return 404 when invoice not found', async () => {
      mockInvoiceService.getById.mockResolvedValue({
        success: false,
        error: 'Invoice not found'
      })

      const response = await GET(
        new NextRequest('http://localhost:3000/api/invoices/nonexistent'),
        { params: { id: 'nonexistent' } }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invoice not found')
    })

    it('should validate ID parameter', async () => {
      const response = await GET(
        new NextRequest('http://localhost:3000/api/invoices/'),
        { params: { id: '' } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invoice ID is required')
    })

    it('should handle service errors', async () => {
      mockInvoiceService.getById.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      })

      const response = await GET(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123'),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })

    it('should handle service exceptions', async () => {
      mockInvoiceService.getById.mockRejectedValue(new Error('Unexpected error'))

      const response = await GET(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123'),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })

    it('should require authentication', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce(null)

      const response = await GET(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123'),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })
  })

  describe('PUT /api/invoices/[id]', () => {
    const updateData = {
      status: 'partially_paid' as const,
      notes: 'Updated payment status',
      due_date: '2024-02-20'
    }

    it('should update invoice successfully', async () => {
      const updatedInvoice = {
        ...mockInvoice,
        ...updateData,
        updated_at: '2024-01-16T00:00:00Z'
      }

      mockInvoiceService.update.mockResolvedValue({
        success: true,
        data: updatedInvoice
      })

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('partially_paid')
      expect(data.data.notes).toBe('Updated payment status')
      expect(data.data.due_date).toBe('2024-02-20')
      expect(mockInvoiceService.update).toHaveBeenCalledWith(invoiceId, updateData)
    })

    it('should validate update data types', async () => {
      const invalidUpdateData = {
        status: 'invalid_status',
        subtotal: 'not_a_number',
        vat_rate: -10,
        total_amount: -1000
      }

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123', {
          method: 'PUT',
          body: JSON.stringify(invalidUpdateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('status')
      expect(data.details).toContain('subtotal')
      expect(data.details).toContain('vat_rate')
      expect(data.details).toContain('total_amount')
    })

    it('should validate status enum values', async () => {
      const invalidStatusData = {
        status: 'non_existent_status'
      }

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123', {
          method: 'PUT',
          body: JSON.stringify(invalidStatusData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('Invalid status')
    })

    it('should validate currency enum values', async () => {
      const invalidCurrencyData = {
        currency: 'EUR'
      }

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123', {
          method: 'PUT',
          body: JSON.stringify(invalidCurrencyData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('currency')
    })

    it('should validate numeric ranges', async () => {
      const invalidRangesData = {
        subtotal: -1000,
        vat_rate: -5,
        total_amount: 0
      }

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123', {
          method: 'PUT',
          body: JSON.stringify(invalidRangesData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
    })

    it('should validate date format', async () => {
      const invalidDateData = {
        due_date: 'not-a-date'
      }

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123', {
          method: 'PUT',
          body: JSON.stringify(invalidDateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('due_date')
    })

    it('should validate line items if provided', async () => {
      const invalidLineItemsData = {
        line_items: [
          {
            description: 'Test item',
            quantity: 0,
            unit_price: -100,
            total: -100
          }
        ]
      }

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123', {
          method: 'PUT',
          body: JSON.stringify(invalidLineItemsData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('quantity')
      expect(data.details).toContain('unit_price')
    })

    it('should validate calculation consistency if amounts provided', async () => {
      const inconsistentCalculationData = {
        subtotal: 1000,
        vat_rate: 5,
        vat_amount: 100, // Should be 50
        total_amount: 1200 // Should be 1050
      }

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123', {
          method: 'PUT',
          body: JSON.stringify(inconsistentCalculationData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('calculation')
    })

    it('should return 404 when updating non-existent invoice', async () => {
      mockInvoiceService.update.mockResolvedValue({
        success: false,
        error: 'Invoice not found'
      })

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/invoices/nonexistent', {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: 'nonexistent' } }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invoice not found')
    })

    it('should require authentication', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce(null)

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should handle malformed JSON', async () => {
      const response = await PUT(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123', {
          method: 'PUT',
          body: 'invalid json{',
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid JSON')
    })

    it('should handle empty request body', async () => {
      const response = await PUT(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Request body is required')
    })
  })

  describe('DELETE /api/invoices/[id]', () => {
    it('should delete invoice successfully', async () => {
      mockInvoiceService.delete.mockResolvedValue({
        success: true
      })

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123', {
          method: 'DELETE'
        }),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Invoice deleted successfully')
      expect(mockInvoiceService.delete).toHaveBeenCalledWith(invoiceId)
    })

    it('should return 404 when deleting non-existent invoice', async () => {
      mockInvoiceService.delete.mockResolvedValue({
        success: false,
        error: 'Invoice not found'
      })

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/invoices/nonexistent', {
          method: 'DELETE'
        }),
        { params: { id: 'nonexistent' } }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invoice not found')
    })

    it('should handle foreign key constraint errors', async () => {
      mockInvoiceService.delete.mockResolvedValue({
        success: false,
        error: 'Cannot delete invoice with existing payments'
      })

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123', {
          method: 'DELETE'
        }),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Cannot delete')
    })

    it('should require authentication', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce(null)

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123', {
          method: 'DELETE'
        }),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should validate ID parameter', async () => {
      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/invoices/', {
          method: 'DELETE'
        }),
        { params: { id: '' } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invoice ID is required')
    })

    it('should handle service errors', async () => {
      mockInvoiceService.delete.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      })

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123', {
          method: 'DELETE'
        }),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })
  })

  describe('Authorization', () => {
    it('should allow managers to perform all operations', async () => {
      // Already tested in individual tests above
    })

    it('should restrict viewer role from modifications', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce({
        id: 'user-viewer',
        email: 'viewer@example.com',
        role: 'viewer'
      })
      vi.mocked(mockAuth.hasPermission).mockReturnValueOnce(false)

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123', {
          method: 'DELETE'
        }),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Insufficient permissions')
    })

    it('should allow finance managers to update invoices', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce({
        id: 'user-finance',
        email: 'finance@example.com',
        role: 'finance_manager'
      })

      mockInvoiceService.update.mockResolvedValue({
        success: true,
        data: mockInvoice
      })

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123', {
          method: 'PUT',
          body: JSON.stringify({ status: 'fully_paid' }),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: invoiceId } }
      )

      expect(response.status).toBe(200)
    })
  })

  describe('Rate Limiting', () => {
    it('should handle high frequency requests gracefully', async () => {
      mockInvoiceService.getById.mockResolvedValue({
        success: true,
        data: mockInvoice
      })

      const requests = Array.from({ length: 10 }, () =>
        GET(
          new NextRequest('http://localhost:3000/api/invoices/invoice-123'),
          { params: { id: invoiceId } }
        )
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500)
      })
    })
  })

  describe('Data Integrity', () => {
    it('should maintain referential integrity when updating invoice data', async () => {
      const statusUpdateData = {
        status: 'fully_paid' as const,
        notes: 'Payment completed'
      }

      const updatedInvoice = {
        ...mockInvoice,
        ...statusUpdateData
      }

      mockInvoiceService.update.mockResolvedValue({
        success: true,
        data: updatedInvoice
      })

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123', {
          method: 'PUT',
          body: JSON.stringify(statusUpdateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: invoiceId } }
      )

      expect(response.status).toBe(200)
      expect(mockInvoiceService.update).toHaveBeenCalledWith(
        invoiceId,
        statusUpdateData
      )
    })

    it('should return complete invoice data including relations', async () => {
      mockInvoiceService.getById.mockResolvedValue({
        success: true,
        data: mockInvoice
      })

      const response = await GET(
        new NextRequest('http://localhost:3000/api/invoices/invoice-123'),
        { params: { id: invoiceId } }
      )
      const data = await response.json()

      expect(data.data.customers).toBeDefined()
      expect(data.data.vehicles).toBeDefined()
      expect(data.data.payments).toHaveLength(1)
      expect(data.data.created_by_profile).toBeDefined()
      expect(data.data.customers).toHaveProperty('full_name')
      expect(data.data.vehicles).toHaveProperty('vin')
      expect(data.data.payments[0]).toHaveProperty('transaction_id')
    })
  })
})