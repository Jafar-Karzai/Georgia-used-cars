import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, PUT, DELETE } from '../route'
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

describe('/api/customers/[id]', () => {
  const customerId = 'customer-123'
  const mockCustomer = {
    id: customerId,
    email: 'john.doe@example.com',
    full_name: 'John Doe',
    phone: '+971501234567',
    address: '123 Main Street, Apartment 4B',
    city: 'Dubai',
    country: 'UAE',
    date_of_birth: '1985-06-15',
    preferred_language: 'en',
    marketing_consent: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    inquiries: [
      {
        id: 'inquiry-1',
        subject: 'Vehicle Inquiry',
        status: 'open',
        created_at: '2023-01-15T00:00:00Z',
        vehicle_id: 'vehicle-1',
        vehicles: { year: 2021, make: 'Honda', model: 'Civic', vin: '1HGBH41JXMN109186' }
      }
    ],
    invoices: [
      {
        id: 'invoice-1',
        invoice_number: 'INV-001',
        total_amount: 25000,
        currency: 'AED',
        status: 'fully_paid',
        created_at: '2023-01-20T00:00:00Z',
        vehicle_id: 'vehicle-1',
        vehicles: { year: 2021, make: 'Honda', model: 'Civic', vin: '1HGBH41JXMN109186' }
      }
    ],
    communications: [
      {
        id: 'comm-1',
        type: 'email',
        direction: 'outbound',
        subject: 'Welcome Email',
        content: 'Welcome to our service',
        created_at: '2023-01-02T00:00:00Z',
        handled_by: 'user-123',
        profiles: { full_name: 'Admin User' }
      }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/customers/[id]', () => {
    it('should return customer by ID with all related data', async () => {
      mockCustomerService.getById.mockResolvedValue({
        success: true,
        data: mockCustomer
      })

      const response = await GET(
        new NextRequest('http://localhost:3000/api/customers/customer-123'),
        { params: { id: customerId } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(customerId)
      expect(data.data.email).toBe('john.doe@example.com')
      expect(data.data).toHaveProperty('inquiries')
      expect(data.data).toHaveProperty('invoices')
      expect(data.data).toHaveProperty('communications')
      expect(mockCustomerService.getById).toHaveBeenCalledWith(customerId)
    })

    it('should return 404 when customer not found', async () => {
      mockCustomerService.getById.mockResolvedValue({
        success: false,
        error: 'Customer not found'
      })

      const response = await GET(
        new NextRequest('http://localhost:3000/api/customers/nonexistent'),
        { params: { id: 'nonexistent' } }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Customer not found')
    })

    it('should validate ID parameter', async () => {
      const response = await GET(
        new NextRequest('http://localhost:3000/api/customers/'),
        { params: { id: '' } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Customer ID is required')
    })

    it('should handle service errors', async () => {
      mockCustomerService.getById.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      })

      const response = await GET(
        new NextRequest('http://localhost:3000/api/customers/customer-123'),
        { params: { id: customerId } }
      )
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })

    it('should handle service exceptions', async () => {
      mockCustomerService.getById.mockRejectedValue(new Error('Unexpected error'))

      const response = await GET(
        new NextRequest('http://localhost:3000/api/customers/customer-123'),
        { params: { id: customerId } }
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
        new NextRequest('http://localhost:3000/api/customers/customer-123'),
        { params: { id: customerId } }
      )
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })
  })

  describe('PUT /api/customers/[id]', () => {
    const updateData = {
      phone: '+971507654321',
      address: '456 New Street, Unit 2A',
      city: 'Abu Dhabi',
      preferred_language: 'ar',
      marketing_consent: false
    }

    it('should update customer successfully', async () => {
      const updatedCustomer = {
        ...mockCustomer,
        ...updateData,
        updated_at: '2023-01-02T00:00:00Z'
      }

      mockCustomerService.update.mockResolvedValue({
        success: true,
        data: updatedCustomer
      })

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/customers/customer-123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: customerId } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.phone).toBe('+971507654321')
      expect(data.data.city).toBe('Abu Dhabi')
      expect(data.data.marketing_consent).toBe(false)
      expect(mockCustomerService.update).toHaveBeenCalledWith(customerId, updateData)
    })

    it('should validate update data types', async () => {
      const invalidUpdateData = {
        email: 'invalid-email',
        phone: '123',
        marketing_consent: 'yes'
      }

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/customers/customer-123', {
          method: 'PUT',
          body: JSON.stringify(invalidUpdateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: customerId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('email')
      expect(data.details).toContain('phone')
      expect(data.details).toContain('marketing_consent')
    })

    it('should validate email format', async () => {
      const invalidEmailData = {
        email: 'not-an-email'
      }

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/customers/customer-123', {
          method: 'PUT',
          body: JSON.stringify(invalidEmailData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: customerId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('valid email address')
    })

    it('should validate phone number format', async () => {
      const invalidPhoneData = {
        phone: 'abc123'
      }

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/customers/customer-123', {
          method: 'PUT',
          body: JSON.stringify(invalidPhoneData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: customerId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('phone')
    })

    it('should validate preferred language enum', async () => {
      const invalidLanguageData = {
        preferred_language: 'invalid'
      }

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/customers/customer-123', {
          method: 'PUT',
          body: JSON.stringify(invalidLanguageData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: customerId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('preferred_language')
    })

    it('should validate full name length', async () => {
      const invalidNameData = {
        full_name: 'A'
      }

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/customers/customer-123', {
          method: 'PUT',
          body: JSON.stringify(invalidNameData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: customerId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('full_name')
    })

    it('should validate date of birth format', async () => {
      const invalidDateData = {
        date_of_birth: 'not-a-date'
      }

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/customers/customer-123', {
          method: 'PUT',
          body: JSON.stringify(invalidDateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: customerId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('date_of_birth')
    })

    it('should handle email uniqueness validation', async () => {
      const emailUpdateData = {
        email: 'existing@example.com'
      }

      mockCustomerService.update.mockResolvedValue({
        success: false,
        error: 'A customer with email existing@example.com already exists'
      })

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/customers/customer-123', {
          method: 'PUT',
          body: JSON.stringify(emailUpdateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: customerId } }
      )
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error).toContain('already exists')
    })

    it('should return 404 when updating non-existent customer', async () => {
      mockCustomerService.update.mockResolvedValue({
        success: false,
        error: 'Customer not found'
      })

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/customers/nonexistent', {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: 'nonexistent' } }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Customer not found')
    })

    it('should require authentication', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce(null)

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/customers/customer-123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: customerId } }
      )
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should handle malformed JSON', async () => {
      const response = await PUT(
        new NextRequest('http://localhost:3000/api/customers/customer-123', {
          method: 'PUT',
          body: 'invalid json{',
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: customerId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid JSON')
    })

    it('should handle empty request body', async () => {
      const response = await PUT(
        new NextRequest('http://localhost:3000/api/customers/customer-123', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: customerId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Request body is required')
    })
  })

  describe('DELETE /api/customers/[id]', () => {
    it('should delete customer successfully', async () => {
      mockCustomerService.delete.mockResolvedValue({
        success: true
      })

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/customers/customer-123', {
          method: 'DELETE'
        }),
        { params: { id: customerId } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Customer deleted successfully')
      expect(mockCustomerService.delete).toHaveBeenCalledWith(customerId)
    })

    it('should return 404 when deleting non-existent customer', async () => {
      mockCustomerService.delete.mockResolvedValue({
        success: false,
        error: 'Customer not found'
      })

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/customers/nonexistent', {
          method: 'DELETE'
        }),
        { params: { id: 'nonexistent' } }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Customer not found')
    })

    it('should handle foreign key constraint errors', async () => {
      mockCustomerService.delete.mockResolvedValue({
        success: false,
        error: 'Cannot delete customer with existing inquiries or invoices'
      })

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/customers/customer-123', {
          method: 'DELETE'
        }),
        { params: { id: customerId } }
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
        new NextRequest('http://localhost:3000/api/customers/customer-123', {
          method: 'DELETE'
        }),
        { params: { id: customerId } }
      )
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should validate ID parameter', async () => {
      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/customers/', {
          method: 'DELETE'
        }),
        { params: { id: '' } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Customer ID is required')
    })

    it('should handle service errors', async () => {
      mockCustomerService.delete.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      })

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/customers/customer-123', {
          method: 'DELETE'
        }),
        { params: { id: customerId } }
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
        new NextRequest('http://localhost:3000/api/customers/customer-123', {
          method: 'DELETE'
        }),
        { params: { id: customerId } }
      )
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Insufficient permissions')
    })

    it('should allow sales agents to update customers', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce({
        id: 'user-sales',
        email: 'sales@example.com',
        role: 'sales_agent'
      })

      mockCustomerService.update.mockResolvedValue({
        success: true,
        data: mockCustomer
      })

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/customers/customer-123', {
          method: 'PUT',
          body: JSON.stringify({ phone: '+971507654321' }),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: customerId } }
      )

      expect(response.status).toBe(200)
    })
  })

  describe('Rate Limiting', () => {
    it('should handle high frequency requests gracefully', async () => {
      mockCustomerService.getById.mockResolvedValue({
        success: true,
        data: mockCustomer
      })

      const requests = Array.from({ length: 10 }, () =>
        GET(
          new NextRequest('http://localhost:3000/api/customers/customer-123'),
          { params: { id: customerId } }
        )
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500)
      })
    })
  })

  describe('Data Integrity', () => {
    it('should maintain referential integrity when updating customer data', async () => {
      const contactUpdateData = {
        email: 'newemail@example.com',
        phone: '+971509876543'
      }

      const updatedCustomer = {
        ...mockCustomer,
        ...contactUpdateData
      }

      mockCustomerService.update.mockResolvedValue({
        success: true,
        data: updatedCustomer
      })

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/customers/customer-123', {
          method: 'PUT',
          body: JSON.stringify(contactUpdateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: customerId } }
      )

      expect(response.status).toBe(200)
      expect(mockCustomerService.update).toHaveBeenCalledWith(
        customerId,
        contactUpdateData
      )
    })

    it('should return complete customer data including relations', async () => {
      mockCustomerService.getById.mockResolvedValue({
        success: true,
        data: mockCustomer
      })

      const response = await GET(
        new NextRequest('http://localhost:3000/api/customers/customer-123'),
        { params: { id: customerId } }
      )
      const data = await response.json()

      expect(data.data.inquiries).toHaveLength(1)
      expect(data.data.invoices).toHaveLength(1)
      expect(data.data.communications).toHaveLength(1)
      expect(data.data.inquiries[0]).toHaveProperty('vehicles')
      expect(data.data.invoices[0]).toHaveProperty('vehicles')
      expect(data.data.communications[0]).toHaveProperty('profiles')
    })
  })
})