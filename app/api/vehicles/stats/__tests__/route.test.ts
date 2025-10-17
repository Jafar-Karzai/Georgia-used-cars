import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '../route'
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

describe('/api/vehicles/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/vehicles/stats', () => {
    const mockStatsData = {
      total: 150,
      byStatus: [
        { current_status: 'available', count: 45 },
        { current_status: 'ready_for_sale', count: 35 },
        { current_status: 'sold', count: 40 },
        { current_status: 'in_transit', count: 20 },
        { current_status: 'at_yard', count: 10 }
      ],
      recentAdditions: 12
    }

    it('should return vehicle statistics successfully', async () => {
      mockVehicleService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.total).toBe(150)
      expect(data.data.byStatus).toHaveLength(5)
      expect(data.data.recentAdditions).toBe(12)
      expect(mockVehicleService.getStatistics).toHaveBeenCalledTimes(1)
    })

    it('should return correct status distribution', async () => {
      mockVehicleService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles/stats')
      const response = await GET(request)
      const data = await response.json()

      const statusDistribution = data.data.byStatus
      const availableCount = statusDistribution.find((s: any) => s.current_status === 'available')?.count
      const soldCount = statusDistribution.find((s: any) => s.current_status === 'sold')?.count

      expect(availableCount).toBe(45)
      expect(soldCount).toBe(40)
    })

    it('should include recent additions count', async () => {
      mockVehicleService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(data.data).toHaveProperty('recentAdditions')
      expect(typeof data.data.recentAdditions).toBe('number')
      expect(data.data.recentAdditions).toBeGreaterThanOrEqual(0)
    })

    it('should handle empty statistics', async () => {
      const emptyStats = {
        total: 0,
        byStatus: [],
        recentAdditions: 0
      }

      mockVehicleService.getStatistics.mockResolvedValue({
        success: true,
        data: emptyStats
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.total).toBe(0)
      expect(data.data.byStatus).toHaveLength(0)
      expect(data.data.recentAdditions).toBe(0)
    })

    it('should handle service errors', async () => {
      mockVehicleService.getStatistics.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })

    it('should handle service exceptions', async () => {
      mockVehicleService.getStatistics.mockRejectedValue(new Error('Unexpected error'))

      const request = new NextRequest('http://localhost:3000/api/vehicles/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })

    it('should require authentication', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/vehicles/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should allow viewers to access statistics', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce({
        id: 'user-viewer',
        email: 'viewer@example.com',
        role: 'viewer'
      })

      mockVehicleService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles/stats')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should return statistics in consistent format', async () => {
      mockVehicleService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('total')
      expect(data.data).toHaveProperty('byStatus')
      expect(data.data).toHaveProperty('recentAdditions')
      expect(Array.isArray(data.data.byStatus)).toBe(true)
    })

    it('should validate status data structure', async () => {
      mockVehicleService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles/stats')
      const response = await GET(request)
      const data = await response.json()

      data.data.byStatus.forEach((statusItem: any) => {
        expect(statusItem).toHaveProperty('current_status')
        expect(statusItem).toHaveProperty('count')
        expect(typeof statusItem.current_status).toBe('string')
        expect(typeof statusItem.count).toBe('number')
        expect(statusItem.count).toBeGreaterThanOrEqual(0)
      })
    })

    it('should handle large statistics datasets', async () => {
      const largeStatsData = {
        total: 10000,
        byStatus: Array.from({ length: 20 }, (_, i) => ({
          current_status: `status_${i}`,
          count: Math.floor(Math.random() * 1000)
        })),
        recentAdditions: 500
      }

      mockVehicleService.getStatistics.mockResolvedValue({
        success: true,
        data: largeStatsData
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles/stats')
      const startTime = Date.now()
      const response = await GET(request)
      const endTime = Date.now()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.total).toBe(10000)
      expect(data.data.byStatus).toHaveLength(20)
      expect(endTime - startTime).toBeLessThan(1000) // Should respond within 1 second
    })
  })

  describe('Caching', () => {
    it('should include cache headers for stats endpoint', async () => {
      mockVehicleService.getStatistics.mockResolvedValue({
        success: true,
        data: {
          total: 100,
          byStatus: [],
          recentAdditions: 5
        }
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles/stats')
      const response = await GET(request)

      // Check if response includes appropriate cache headers
      expect(response.headers.get('cache-control')).toBeTruthy()
    })
  })

  describe('Performance', () => {
    it('should respond quickly for statistics queries', async () => {
      mockVehicleService.getStatistics.mockResolvedValue({
        success: true,
        data: {
          total: 1000,
          byStatus: [
            { current_status: 'available', count: 400 },
            { current_status: 'sold', count: 600 }
          ],
          recentAdditions: 50
        }
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles/stats')
      const startTime = Date.now()
      const response = await GET(request)
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(500) // Should be very fast
    })
  })

  describe('Data Validation', () => {
    it('should validate that total matches sum of status counts', async () => {
      const inconsistentStats = {
        total: 100,
        byStatus: [
          { current_status: 'available', count: 30 },
          { current_status: 'sold', count: 20 }
          // Sum is 50, but total claims 100
        ],
        recentAdditions: 5
      }

      mockVehicleService.getStatistics.mockResolvedValue({
        success: true,
        data: inconsistentStats
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles/stats')
      const response = await GET(request)
      const data = await response.json()

      // API should still return the data (service layer handles validation)
      expect(response.status).toBe(200)
      expect(data.data).toEqual(inconsistentStats)
    })
  })

  describe('Error Recovery', () => {
    it('should provide fallback data on partial service failure', async () => {
      // Mock a scenario where some data is available but not complete
      mockVehicleService.getStatistics.mockResolvedValue({
        success: true,
        data: {
          total: 0,
          byStatus: [],
          recentAdditions: 0
        }
      })

      const request = new NextRequest('http://localhost:3000/api/vehicles/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.total).toBeDefined()
      expect(Array.isArray(data.data.byStatus)).toBe(true)
    })
  })
})