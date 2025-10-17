import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from '../route'
import { InvoiceService, type CreateInvoiceData, type InvoiceFilters } from '@/lib/services/invoices'
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

describe('/api/invoices', () => {
  const validInvoiceData = {
    customer_id: 'customer-123',
    vehicle_id: 'vehicle-456',
    line_items: [
      {
        description: '2021 Honda Civic - VIN: 1HGBH41JXMN109186',
        quantity: 1,
        unit_price: 22000,
        total: 22000
      },
      {
        description: 'Extended Warranty',
        quantity: 1,
        unit_price: 1500,
        total: 1500
      }
    ],
    subtotal: 23500,
    vat_rate: 5,
    vat_amount: 1175,
    total_amount: 24675,
    currency: 'AED' as const,
    due_date: '2024-02-15',
    payment_terms: 'Net 30 days',
    notes: 'Vehicle purchase invoice'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/invoices', () => {
    it('should return paginated invoices list', async () => {
      const mockInvoices = [
        {
          id: 'invoice-1',
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
          created_at: '2024-01-15T00:00:00Z',
          customers: {
            id: 'customer-123',
            full_name: 'John Doe',
            email: 'john@example.com',
            phone: '+971501234567'
          },
          vehicles: {
            id: 'vehicle-456',
            year: 2021,
            make: 'Honda',
            model: 'Civic',
            vin: '1HGBH41JXMN109186'
          },
          total_paid: 10000,
          balance_due: 14675
        },
        {
          id: 'invoice-2',
          invoice_number: 'INV-2024-0002',
          customer_id: 'customer-789',
          subtotal: 18000,
          vat_rate: 5,
          vat_amount: 900,
          total_amount: 18900,
          currency: 'AED',
          status: 'draft',
          due_date: '2024-02-20',
          created_at: '2024-01-16T00:00:00Z',
          customers: {
            id: 'customer-789',
            full_name: 'Jane Smith',
            email: 'jane@example.com'
          },
          total_paid: 0,
          balance_due: 18900
        }
      ]

      mockInvoiceService.getAll.mockResolvedValue({
        success: true,
        data: mockInvoices,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1
        }
      })

      const request = new NextRequest('http://localhost:3000/api/invoices')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.pagination.total).toBe(2)
      expect(mockInvoiceService.getAll).toHaveBeenCalledWith({}, 1, 20)
    })

    it('should handle search and filter query parameters', async () => {
      mockInvoiceService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      })

      const request = new NextRequest('http://localhost:3000/api/invoices?search=INV-2024&status=sent&customer_id=customer-123&page=2&limit=10')
      await GET(request)

      expect(mockInvoiceService.getAll).toHaveBeenCalledWith(
        { search: 'INV-2024', status: 'sent', customer_id: 'customer-123' },
        2,
        10
      )
    })

    it('should handle currency and vehicle filters', async () => {
      mockInvoiceService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      })

      const request = new NextRequest('http://localhost:3000/api/invoices?currency=AED&vehicle_id=vehicle-456')
      await GET(request)

      expect(mockInvoiceService.getAll).toHaveBeenCalledWith(
        { currency: 'AED', vehicle_id: 'vehicle-456' },
        1,
        20
      )
    })

    it('should handle date range filters', async () => {
      mockInvoiceService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      })

      const request = new NextRequest('http://localhost:3000/api/invoices?created_from=2024-01-01&created_to=2024-12-31&due_from=2024-02-01&due_to=2024-02-28')
      await GET(request)

      expect(mockInvoiceService.getAll).toHaveBeenCalledWith(
        { 
          created_from: '2024-01-01',
          created_to: '2024-12-31',
          due_from: '2024-02-01',
          due_to: '2024-02-28'
        },
        1,
        20
      )
    })

    it('should handle overdue filter', async () => {
      mockInvoiceService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      })

      const request = new NextRequest('http://localhost:3000/api/invoices?overdue_only=true')
      await GET(request)

      expect(mockInvoiceService.getAll).toHaveBeenCalledWith(
        { overdue_only: true },
        1,
        20
      )
    })

    it('should validate pagination parameters', async () => {
      mockInvoiceService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 50, total: 0, pages: 0 }
      })

      const request = new NextRequest('http://localhost:3000/api/invoices?page=invalid&limit=150')
      await GET(request)

      // Should fallback to defaults for invalid page, and cap limit at 100
      expect(mockInvoiceService.getAll).toHaveBeenCalledWith({}, 1, 100)
    })

    it('should handle service errors', async () => {
      mockInvoiceService.getAll.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      })

      const request = new NextRequest('http://localhost:3000/api/invoices')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })

    it('should handle service exceptions', async () => {
      mockInvoiceService.getAll.mockRejectedValue(new Error('Unexpected error'))

      const request = new NextRequest('http://localhost:3000/api/invoices')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })

    it('should require authentication', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/invoices')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })
  })

  describe('POST /api/invoices', () => {
    it('should create a new invoice successfully', async () => {
      const mockCreatedInvoice = {
        id: 'invoice-123',
        invoice_number: 'INV-2024-0003',
        ...validInvoiceData,
        status: 'draft',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
        created_by: 'user-123'
      }

      mockInvoiceService.create.mockResolvedValue({
        success: true,
        data: mockCreatedInvoice
      })

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(validInvoiceData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('invoice-123')
      expect(data.data.invoice_number).toBe('INV-2024-0003')
      expect(mockInvoiceService.create).toHaveBeenCalledWith(validInvoiceData, 'user-123')
    })

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing required fields
        customer_id: 'customer-123',
        subtotal: 1000
      }

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('line_items')
      expect(data.details).toContain('total_amount')
      expect(data.details).toContain('currency')
      expect(data.details).toContain('due_date')
    })

    it('should validate line items structure', async () => {
      const invalidLineItemsData = {
        ...validInvoiceData,
        line_items: [
          {
            // Missing required fields
            description: 'Test item'
          }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(invalidLineItemsData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('quantity')
      expect(data.details).toContain('unit_price')
      expect(data.details).toContain('total')
    })

    it('should validate numeric ranges', async () => {
      const invalidRangesData = {
        ...validInvoiceData,
        subtotal: -1000,
        vat_rate: -5,
        total_amount: 0,
        line_items: [
          {
            description: 'Test item',
            quantity: 0,
            unit_price: -100,
            total: -100
          }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(invalidRangesData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('subtotal')
      expect(data.details).toContain('vat_rate')
      expect(data.details).toContain('total_amount')
      expect(data.details).toContain('quantity')
      expect(data.details).toContain('unit_price')
    })

    it('should validate currency enum values', async () => {
      const invalidCurrencyData = {
        ...validInvoiceData,
        currency: 'EUR'
      }

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(invalidCurrencyData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('currency')
    })

    it('should validate status enum values', async () => {
      const invalidStatusData = {
        ...validInvoiceData,
        status: 'invalid_status'
      }

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(invalidStatusData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('status')
    })

    it('should validate date format', async () => {
      const invalidDateData = {
        ...validInvoiceData,
        due_date: 'invalid-date'
      }

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(invalidDateData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('due_date')
    })

    it('should validate calculation consistency', async () => {
      const inconsistentCalculationData = {
        ...validInvoiceData,
        subtotal: 1000,
        vat_rate: 5,
        vat_amount: 100, // Should be 50 (5% of 1000)
        total_amount: 1200 // Should be 1050 (1000 + 50)
      }

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(inconsistentCalculationData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('calculation')
    })

    it('should handle service errors', async () => {
      mockInvoiceService.create.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      })

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(validInvoiceData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid JSON')
    })

    it('should handle missing request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Request body is required')
    })

    it('should require authentication', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(validInvoiceData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should handle service exceptions', async () => {
      mockInvoiceService.create.mockRejectedValue(new Error('Unexpected error'))

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(validInvoiceData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('Authorization', () => {
    it('should allow managers to perform all operations', async () => {
      // Already tested in individual tests above
    })

    it('should restrict viewer role from creating invoices', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce({
        id: 'user-viewer',
        email: 'viewer@example.com',
        role: 'viewer'
      })
      vi.mocked(mockAuth.hasPermission).mockReturnValueOnce(false)

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(validInvoiceData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Insufficient permissions')
    })

    it('should allow finance managers to create invoices', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce({
        id: 'user-finance',
        email: 'finance@example.com',
        role: 'finance_manager'
      })

      mockInvoiceService.create.mockResolvedValue({
        success: true,
        data: {
          id: 'invoice-789',
          ...validInvoiceData
        }
      })

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(validInvoiceData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })
  })

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      mockInvoiceService.getAll.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      )

      const request = new NextRequest('http://localhost:3000/api/invoices')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('should sanitize error messages for security', async () => {
      mockInvoiceService.create.mockResolvedValue({
        success: false,
        error: 'Database error: connection string "user:password@host" failed'
      })

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(validInvoiceData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).not.toContain('password')
      expect(data.error).not.toContain('connection string')
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const largeMockData = Array.from({ length: 100 }, (_, i) => ({
        id: `invoice-${i}`,
        invoice_number: `INV-2024-${(i + 1).toString().padStart(4, '0')}`,
        customer_id: `customer-${i}`,
        subtotal: 10000 + i * 100,
        vat_rate: 5,
        vat_amount: (10000 + i * 100) * 0.05,
        total_amount: (10000 + i * 100) * 1.05,
        currency: 'AED',
        status: 'sent',
        due_date: '2024-02-15',
        created_at: '2024-01-15T00:00:00Z'
      }))

      mockInvoiceService.getAll.mockResolvedValue({
        success: true,
        data: largeMockData,
        pagination: {
          page: 1,
          limit: 100,
          total: 1000,
          pages: 10
        }
      })

      const request = new NextRequest('http://localhost:3000/api/invoices?limit=100')
      const startTime = Date.now()
      const response = await GET(request)
      const endTime = Date.now()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(1000) // Should respond within 1 second
    })
  })
})