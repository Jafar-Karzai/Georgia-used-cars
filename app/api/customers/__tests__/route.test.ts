import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from '../route'
import { CustomerService } from '@/lib/services/customers'
import { NextRequest } from 'next/server'

// Mock the CustomerService
vi.mock('@/lib/services/customers')

const mockCustomerService = CustomerService as any

// Mock Next.js auth
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    id: 'user-123',
    email: 'test@example.com',
    role: 'manager'
  }),
  hasPermission: vi.fn().mockReturnValue(true)
}))

describe('/api/customers', () => {
  const validCustomerData = {
    email: 'john.doe@example.com',
    full_name: 'John Doe',
    phone: '+971501234567',
    address: '123 Main Street, Apartment 4B',
    city: 'Dubai',
    country: 'UAE',
    date_of_birth: '1985-06-15',
    preferred_language: 'en',
    marketing_consent: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/customers', () => {
    it('should return paginated customers list', async () => {
      const mockCustomers = [
        {
          id: '1',
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          phone: '+971501234567',
          city: 'Dubai',
          country: 'UAE',
          preferred_language: 'en',
          marketing_consent: true,
          inquiry_count: 3,
          total_purchases: 1,
          total_spent: 25000,
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: '2',
          email: 'jane.smith@example.com',
          full_name: 'Jane Smith',
          phone: '+971507654321',
          city: 'Abu Dhabi',
          country: 'UAE',
          preferred_language: 'ar',
          marketing_consent: false,
          inquiry_count: 1,
          total_purchases: 0,
          total_spent: 0,
          created_at: '2023-01-02T00:00:00Z'
        }
      ]

      mockCustomerService.getAll.mockResolvedValue({
        success: true,
        data: mockCustomers,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1
        }
      })

      const request = new NextRequest('http://localhost:3000/api/customers')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.pagination.total).toBe(2)
      expect(mockCustomerService.getAll).toHaveBeenCalledWith({}, 1, 20)
    })

    it('should handle search query parameters', async () => {
      mockCustomerService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      })

      const request = new NextRequest('http://localhost:3000/api/customers?search=John&city=Dubai&page=2&limit=10')
      await GET(request)

      expect(mockCustomerService.getAll).toHaveBeenCalledWith(
        { search: 'John', city: 'Dubai' },
        2,
        10
      )
    })

    it('should handle country and marketing consent filters', async () => {
      mockCustomerService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      })

      const request = new NextRequest('http://localhost:3000/api/customers?country=UAE&marketing_consent=true')
      await GET(request)

      expect(mockCustomerService.getAll).toHaveBeenCalledWith(
        { 
          country: 'UAE',
          marketing_consent: true
        },
        1,
        20
      )
    })

    it('should handle date range filters', async () => {
      mockCustomerService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      })

      const request = new NextRequest('http://localhost:3000/api/customers?created_from=2023-01-01&created_to=2023-12-31')
      await GET(request)

      expect(mockCustomerService.getAll).toHaveBeenCalledWith(
        { 
          created_from: '2023-01-01',
          created_to: '2023-12-31'
        },
        1,
        20
      )
    })

    it('should validate pagination parameters', async () => {
      mockCustomerService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 50, total: 0, pages: 0 }
      })

      const request = new NextRequest('http://localhost:3000/api/customers?page=invalid&limit=150')
      await GET(request)

      // Should fallback to defaults for invalid page, and cap limit at 100
      expect(mockCustomerService.getAll).toHaveBeenCalledWith({}, 1, 100)
    })

    it('should handle service errors', async () => {
      mockCustomerService.getAll.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      })

      const request = new NextRequest('http://localhost:3000/api/customers')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })

    it('should handle service exceptions', async () => {
      mockCustomerService.getAll.mockRejectedValue(new Error('Unexpected error'))

      const request = new NextRequest('http://localhost:3000/api/customers')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })

    it('should require authentication', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/customers')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })
  })

  describe('POST /api/customers', () => {
    it('should create a new customer successfully', async () => {
      const mockCreatedCustomer = {
        id: 'customer-123',
        ...validCustomerData,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      mockCustomerService.create.mockResolvedValue({
        success: true,
        data: mockCreatedCustomer
      })

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(validCustomerData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('customer-123')
      expect(data.data.email).toBe(validCustomerData.email)
      expect(mockCustomerService.create).toHaveBeenCalledWith(validCustomerData)
    })

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing required field: full_name
        email: 'test@example.com',
        phone: '+971501234567'
      }

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('full_name')
    })

    it('should validate email format', async () => {
      const invalidEmailData = {
        ...validCustomerData,
        email: 'invalid-email'
      }

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(invalidEmailData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('valid email address')
    })

    it('should validate phone number format', async () => {
      const invalidPhoneData = {
        ...validCustomerData,
        phone: '123'
      }

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(invalidPhoneData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('phone')
    })

    it('should validate full name length', async () => {
      const invalidNameData = {
        ...validCustomerData,
        full_name: 'A'
      }

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(invalidNameData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('full_name')
    })

    it('should validate preferred language enum', async () => {
      const invalidLanguageData = {
        ...validCustomerData,
        preferred_language: 'invalid'
      }

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(invalidLanguageData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('preferred_language')
    })

    it('should validate date of birth format', async () => {
      const invalidDateData = {
        ...validCustomerData,
        date_of_birth: 'invalid-date'
      }

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(invalidDateData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('date_of_birth')
    })

    it('should handle duplicate email error from service', async () => {
      mockCustomerService.create.mockResolvedValue({
        success: false,
        error: 'A customer with email john.doe@example.com already exists'
      })

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(validCustomerData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error).toContain('already exists')
    })

    it('should handle service errors', async () => {
      mockCustomerService.create.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      })

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(validCustomerData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/customers', {
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
      const request = new NextRequest('http://localhost:3000/api/customers', {
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

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(validCustomerData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should handle service exceptions', async () => {
      mockCustomerService.create.mockRejectedValue(new Error('Unexpected error'))

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(validCustomerData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })

    it('should allow optional fields to be omitted', async () => {
      const minimalCustomerData = {
        full_name: 'Jane Doe'
      }

      const mockCreatedCustomer = {
        id: 'customer-456',
        full_name: 'Jane Doe',
        country: 'UAE',
        preferred_language: 'en',
        marketing_consent: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      mockCustomerService.create.mockResolvedValue({
        success: true,
        data: mockCreatedCustomer
      })

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(minimalCustomerData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.full_name).toBe('Jane Doe')
      expect(mockCustomerService.create).toHaveBeenCalledWith(minimalCustomerData)
    })

    it('should validate marketing consent as boolean', async () => {
      const invalidConsentData = {
        ...validCustomerData,
        marketing_consent: 'yes'
      }

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(invalidConsentData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('marketing_consent')
    })
  })

  describe('Authorization', () => {
    it('should allow managers to perform all operations', async () => {
      // Already tested in individual tests above
    })

    it('should restrict viewer role from creating customers', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce({
        id: 'user-viewer',
        email: 'viewer@example.com',
        role: 'viewer'
      })
      vi.mocked(mockAuth.hasPermission).mockReturnValueOnce(false)

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(validCustomerData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Insufficient permissions')
    })

    it('should allow sales agents to create customers', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce({
        id: 'user-sales',
        email: 'sales@example.com',
        role: 'sales_agent'
      })

      mockCustomerService.create.mockResolvedValue({
        success: true,
        data: {
          id: 'customer-789',
          ...validCustomerData
        }
      })

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(validCustomerData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })
  })

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      mockCustomerService.getAll.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      )

      const request = new NextRequest('http://localhost:3000/api/customers')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('should sanitize error messages for security', async () => {
      mockCustomerService.create.mockResolvedValue({
        success: false,
        error: 'Database error: connection string "user:password@host" failed'
      })

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(validCustomerData),
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
        id: `customer-${i}`,
        email: `customer${i}@example.com`,
        full_name: `Customer ${i}`,
        phone: `+97150${i.toString().padStart(7, '0')}`,
        city: 'Dubai',
        country: 'UAE',
        preferred_language: 'en',
        marketing_consent: i % 2 === 0,
        inquiry_count: i % 5,
        total_purchases: i % 3,
        total_spent: i * 1000
      }))

      mockCustomerService.getAll.mockResolvedValue({
        success: true,
        data: largeMockData,
        pagination: {
          page: 1,
          limit: 100,
          total: 1000,
          pages: 10
        }
      })

      const request = new NextRequest('http://localhost:3000/api/customers?limit=100')
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