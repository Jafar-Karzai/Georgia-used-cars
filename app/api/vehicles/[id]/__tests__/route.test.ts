import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, PUT, DELETE } from '../route'
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

describe('/api/vehicles/[id]', () => {
  const vehicleId = 'vehicle-123'
  const mockVehicle = {
    id: vehicleId,
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
    damage_severity: 'minor',
    repair_estimate: 2500,
    title_status: 'Clean',
    keys_available: true,
    run_and_drive: true,
    purchase_price: 18000,
    purchase_currency: 'USD',
    estimated_total_cost: 22000,
    current_status: 'available',
    current_location: 'Yard A',
    is_public: false,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    created_by: 'user-123',
    vehicle_photos: [],
    vehicle_documents: [],
    vehicle_status_history: [],
    expenses: []
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/vehicles/[id]', () => {
    it('should return vehicle by ID with all related data', async () => {
      mockVehicleService.getById.mockResolvedValue({
        success: true,
        data: mockVehicle
      })

      const response = await GET(
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123'),
        { params: { id: vehicleId } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(vehicleId)
      expect(data.data.vin).toBe('1HGBH41JXMN109186')
      expect(data.data).toHaveProperty('vehicle_photos')
      expect(data.data).toHaveProperty('vehicle_documents')
      expect(data.data).toHaveProperty('vehicle_status_history')
      expect(data.data).toHaveProperty('expenses')
      expect(mockVehicleService.getById).toHaveBeenCalledWith(vehicleId)
    })

    it('should return 404 when vehicle not found', async () => {
      mockVehicleService.getById.mockResolvedValue({
        success: false,
        error: 'Vehicle not found'
      })

      const response = await GET(
        new NextRequest('http://localhost:3000/api/vehicles/nonexistent'),
        { params: { id: 'nonexistent' } }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Vehicle not found')
    })

    it('should validate ID parameter', async () => {
      const response = await GET(
        new NextRequest('http://localhost:3000/api/vehicles/'),
        { params: { id: '' } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Vehicle ID is required')
    })

    it('should handle service errors', async () => {
      mockVehicleService.getById.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      })

      const response = await GET(
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123'),
        { params: { id: vehicleId } }
      )
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })

    it('should handle service exceptions', async () => {
      mockVehicleService.getById.mockRejectedValue(new Error('Unexpected error'))

      const response = await GET(
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123'),
        { params: { id: vehicleId } }
      )
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('PUT /api/vehicles/[id]', () => {
    const updateData = {
      current_status: 'ready_for_sale',
      current_location: 'Showroom',
      sale_price: 22000,
      sale_currency: 'USD',
      mileage: 26000,
      is_public: true
    }

    it('should update vehicle successfully', async () => {
      const updatedVehicle = {
        ...mockVehicle,
        ...updateData,
        updated_at: '2023-01-02T00:00:00Z'
      }

      mockVehicleService.update.mockResolvedValue({
        success: true,
        data: updatedVehicle
      })

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: vehicleId } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.current_status).toBe('ready_for_sale')
      expect(data.data.sale_price).toBe(22000)
      expect(data.data.is_public).toBe(true)
      expect(mockVehicleService.update).toHaveBeenCalledWith(vehicleId, updateData, 'user-123')
    })

    it('should validate update data types', async () => {
      const invalidUpdateData = {
        current_status: 'invalid_status',
        sale_price: 'not_a_number',
        mileage: -1000
      }

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123', {
          method: 'PUT',
          body: JSON.stringify(invalidUpdateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: vehicleId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('current_status')
      expect(data.details).toContain('sale_price')
      expect(data.details).toContain('mileage')
    })

    it('should validate status enum values', async () => {
      const invalidStatusData = {
        current_status: 'non_existent_status'
      }

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123', {
          method: 'PUT',
          body: JSON.stringify(invalidStatusData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: vehicleId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('Invalid status')
    })

    it('should validate currency enum values', async () => {
      const invalidCurrencyData = {
        sale_currency: 'EUR'
      }

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123', {
          method: 'PUT',
          body: JSON.stringify(invalidCurrencyData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: vehicleId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
      expect(data.details).toContain('sale_currency')
    })

    it('should validate numeric ranges', async () => {
      const invalidRangesData = {
        year: 1800,
        mileage: -5000,
        sale_price: -1000
      }

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123', {
          method: 'PUT',
          body: JSON.stringify(invalidRangesData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: vehicleId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.toLowerCase()).toContain('validation')
    })

    it('should handle VIN uniqueness validation', async () => {
      const vinUpdateData = {
        vin: 'DUPLICATE_VIN_123'
      }

      mockVehicleService.update.mockResolvedValue({
        success: false,
        error: 'A vehicle with VIN DUPLICATE_VIN_123 already exists'
      })

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123', {
          method: 'PUT',
          body: JSON.stringify(vinUpdateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: vehicleId } }
      )
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error).toContain('already exists')
    })

    it('should return 404 when updating non-existent vehicle', async () => {
      mockVehicleService.update.mockResolvedValue({
        success: false,
        error: 'Vehicle not found'
      })

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/vehicles/nonexistent', {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: 'nonexistent' } }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Vehicle not found')
    })

    it('should require authentication', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce(null)

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: vehicleId } }
      )
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should handle malformed JSON', async () => {
      const response = await PUT(
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123', {
          method: 'PUT',
          body: 'invalid json{',
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: vehicleId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid JSON')
    })

    it('should handle empty request body', async () => {
      const response = await PUT(
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: vehicleId } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Request body is required')
    })
  })

  describe('DELETE /api/vehicles/[id]', () => {
    it('should delete vehicle successfully', async () => {
      mockVehicleService.delete.mockResolvedValue({
        success: true
      })

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123', {
          method: 'DELETE'
        }),
        { params: { id: vehicleId } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Vehicle deleted successfully')
      expect(mockVehicleService.delete).toHaveBeenCalledWith(vehicleId)
    })

    it('should return 404 when deleting non-existent vehicle', async () => {
      mockVehicleService.delete.mockResolvedValue({
        success: false,
        error: 'Vehicle not found'
      })

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/vehicles/nonexistent', {
          method: 'DELETE'
        }),
        { params: { id: 'nonexistent' } }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Vehicle not found')
    })

    it('should handle foreign key constraint errors', async () => {
      mockVehicleService.delete.mockResolvedValue({
        success: false,
        error: 'Cannot delete vehicle with existing expenses'
      })

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123', {
          method: 'DELETE'
        }),
        { params: { id: vehicleId } }
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
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123', {
          method: 'DELETE'
        }),
        { params: { id: vehicleId } }
      )
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should validate ID parameter', async () => {
      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/vehicles/', {
          method: 'DELETE'
        }),
        { params: { id: '' } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Vehicle ID is required')
    })

    it('should handle service errors', async () => {
      mockVehicleService.delete.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      })

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123', {
          method: 'DELETE'
        }),
        { params: { id: vehicleId } }
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
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123', {
          method: 'DELETE'
        }),
        { params: { id: vehicleId } }
      )
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Insufficient permissions')
    })

    it('should allow inventory_manager to perform vehicle operations', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce({
        id: 'user-inventory',
        email: 'inventory@example.com',
        role: 'inventory_manager'
      })

      mockVehicleService.delete.mockResolvedValue({
        success: true
      })

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123', {
          method: 'DELETE'
        }),
        { params: { id: vehicleId } }
      )

      expect(response.status).toBe(200)
    })
  })

  describe('Rate Limiting', () => {
    it('should handle high frequency requests gracefully', async () => {
      mockVehicleService.getById.mockResolvedValue({
        success: true,
        data: mockVehicle
      })

      const requests = Array.from({ length: 10 }, () =>
        GET(
          new NextRequest('http://localhost:3000/api/vehicles/vehicle-123'),
          { params: { id: vehicleId } }
        )
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500)
      })
    })
  })

  describe('Data Integrity', () => {
    it('should maintain referential integrity when updating status', async () => {
      const statusUpdateData = {
        current_status: 'sold',
        current_location: 'Delivered'
      }

      const updatedVehicle = {
        ...mockVehicle,
        ...statusUpdateData
      }

      mockVehicleService.update.mockResolvedValue({
        success: true,
        data: updatedVehicle
      })

      const response = await PUT(
        new NextRequest('http://localhost:3000/api/vehicles/vehicle-123', {
          method: 'PUT',
          body: JSON.stringify(statusUpdateData),
          headers: { 'Content-Type': 'application/json' }
        }),
        { params: { id: vehicleId } }
      )

      expect(response.status).toBe(200)
      expect(mockVehicleService.update).toHaveBeenCalledWith(
        vehicleId,
        statusUpdateData,
        'user-123'
      )
    })
  })
})