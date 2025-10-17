import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from '../route'
import { VehicleService } from '@/lib/services/vehicles'
import { NextRequest } from 'next/server'

// Mock the VehicleService
vi.mock('@/lib/services/vehicles')

const mockVehicleService = VehicleService as any

// Mock Next.js auth
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    id: 'user-123',
    email: 'test@example.com',
    role: 'manager'
  }),
  hasPermission: vi.fn().mockReturnValue(true)
}))

describe('/api/vehicles', () => {
  const validVehicleData = {
    vin: '1HGBH41JXMN109186',
    year: 2021,
    make: 'Honda',
    model: 'Civic',
    trim: 'EX',
    engine: '2.0L',
    mileage: 25000,
    exterior_color: 'Black',
    interior_color: 'Black',
    transmission: 'CVT',
    fuel_type: 'Gasoline',
    body_style: 'Sedan',
    auction_house: 'Copart',
    auction_location: 'California',
    sale_date: '2023-01-15',
    lot_number: 'LOT-001',
    primary_damage: 'Front End',
    secondary_damage: 'Left Side',
    damage_description: 'Minor front bumper damage',
    damage_severity: 'minor' as const,
    repair_estimate: 2500,
    title_status: 'Clean',
    keys_available: true,
    run_and_drive: true,
    purchase_price: 18000,
    purchase_currency: 'USD' as const,
    estimated_total_cost: 22000,
    is_public: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/vehicles', () => {
    it('should return paginated vehicles list', async () => {
      const mockVehicles = [
        {
          id: '1',
          vin: '1HGBH41JXMN109186',
          year: 2021,
          make: 'Honda',
          model: 'Civic',
          current_status: 'available',
          purchase_price: 18000,
          currency: 'USD'
        },
        {
          id: '2',
          vin: 'JH4KA7532PC009047',
          year: 2020,
          make: 'Acura',
          model: 'TLX',
          current_status: 'sold',
          purchase_price: 22000,
          currency: 'USD'
        }
      ]

      mockVehicleService.getAll.mockResolvedValue({
        success: true,
        data: mockVehicles,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1
        }
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.pagination.total).toBe(2)
      expect(mockVehicleService.getAll).toHaveBeenCalledWith({}, 1, 20)
    })

    it('should handle search query parameters', async () => {
      mockVehicleService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles?search=Honda&status=available&page=2&limit=10')
      await GET(request)

      expect(mockVehicleService.getAll).toHaveBeenCalledWith(
        { search: 'Honda', status: 'available' },
        2,
        10
      )
    })

    it('should handle make and model filters', async () => {
      mockVehicleService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles?make=Honda&model=Civic&year_min=2020&year_max=2023')
      await GET(request)

      expect(mockVehicleService.getAll).toHaveBeenCalledWith(
        { 
          make: 'Honda', 
          model: 'Civic',
          year_min: 2020,
          year_max: 2023
        },
        1,
        20
      )
    })

    it('should handle price range filters', async () => {
      mockVehicleService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles?price_min=15000&price_max=30000')
      await GET(request)

      expect(mockVehicleService.getAll).toHaveBeenCalledWith(
        { 
          price_min: 15000,
          price_max: 30000
        },
        1,
        20
      )
    })

    it('should handle auction house filter', async () => {
      mockVehicleService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles?auction_house=Copart')
      await GET(request)

      expect(mockVehicleService.getAll).toHaveBeenCalledWith(
        { auction_house: 'Copart' },
        1,
        20
      )
    })

    it('should handle public filter for website listings', async () => {
      mockVehicleService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles?is_public=true')
      await GET(request)

      expect(mockVehicleService.getAll).toHaveBeenCalledWith(
        { is_public: true },
        1,
        20
      )
    })

    it('should validate pagination parameters', async () => {
      mockVehicleService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 50, total: 0, pages: 0 }
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles?page=invalid&limit=150')
      await GET(request)

      // Should fallback to defaults for invalid page, and cap limit at 100
      expect(mockVehicleService.getAll).toHaveBeenCalledWith({}, 1, 100)
    })

    it('should handle service errors', async () => {
      mockVehicleService.getAll.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })

    it('should handle service exceptions', async () => {
      mockVehicleService.getAll.mockRejectedValue(new Error('Unexpected error'))

      const request = new NextRequest('http://localhost:3000/api/vehicles')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('POST /api/vehicles', () => {

    it('should create a new vehicle successfully', async () => {
      const mockCreatedVehicle = {
        id: 'vehicle-123',
        ...validVehicleData,
        current_status: 'auction_won',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      mockVehicleService.create.mockResolvedValue({
        success: true,
        data: mockCreatedVehicle
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(validVehicleData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('vehicle-123')
      expect(data.data.vin).toBe(validVehicleData.vin)
      expect(mockVehicleService.create).toHaveBeenCalledWith(validVehicleData, 'user-123')
    })

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing required fields
        year: 2021,
        make: 'Honda'
      }

      const request = new NextRequest('http://localhost:3000/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('vin')
      expect(data.details).toContain('model')
      expect(data.details).toContain('auction_house')
      expect(data.details).toContain('purchase_price')
    })

    it('should validate VIN format', async () => {
      const invalidVinData = {
        ...validVehicleData,
        vin: 'INVALID'
      }

      const request = new NextRequest('http://localhost:3000/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(invalidVinData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('VIN must be between 10 and 17 characters')
    })

    it('should validate year range', async () => {
      const invalidYearData = {
        ...validVehicleData,
        year: 1800
      }

      const request = new NextRequest('http://localhost:3000/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(invalidYearData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('Year must be between 1900')
    })

    it('should validate purchase price', async () => {
      const invalidPriceData = {
        ...validVehicleData,
        purchase_price: -1000
      }

      const request = new NextRequest('http://localhost:3000/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(invalidPriceData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('Purchase price must be positive')
    })

    it('should validate damage severity enum', async () => {
      const invalidSeverityData = {
        ...validVehicleData,
        damage_severity: 'catastrophic'
      }

      const request = new NextRequest('http://localhost:3000/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(invalidSeverityData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('damage_severity')
    })

    it('should validate currency enum', async () => {
      const invalidCurrencyData = {
        ...validVehicleData,
        purchase_currency: 'EUR'
      }

      const request = new NextRequest('http://localhost:3000/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(invalidCurrencyData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('purchase_currency')
    })

    it('should handle duplicate VIN error from service', async () => {
      mockVehicleService.create.mockResolvedValue({
        success: false,
        error: 'A vehicle with VIN 1HGBH41JXMN109186 already exists'
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(validVehicleData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error).toContain('already exists')
    })

    it('should handle service errors', async () => {
      mockVehicleService.create.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(validVehicleData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/vehicles', {
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
      const request = new NextRequest('http://localhost:3000/api/vehicles', {
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
      // Mock unauthenticated user
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(validVehicleData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should handle service exceptions', async () => {
      mockVehicleService.create.mockRejectedValue(new Error('Unexpected error'))

      const request = new NextRequest('http://localhost:3000/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(validVehicleData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      mockVehicleService.getAll.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      )

      const request = new NextRequest('http://localhost:3000/api/vehicles')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('should sanitize error messages for security', async () => {
      mockVehicleService.create.mockResolvedValue({
        success: false,
        error: 'Database error: connection string "user:password@host" failed'
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(validVehicleData),
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
        id: `vehicle-${i}`,
        vin: `VIN${i.toString().padStart(14, '0')}`,
        year: 2020 + (i % 4),
        make: 'Honda',
        model: 'Civic',
        current_status: 'available',
        purchase_price: 15000 + i * 100,
        currency: 'USD'
      }))

      mockVehicleService.getAll.mockResolvedValue({
        success: true,
        data: largeMockData,
        pagination: {
          page: 1,
          limit: 100,
          total: 1000,
          pages: 10
        }
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles?limit=100')
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