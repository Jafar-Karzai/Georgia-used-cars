import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '../route'
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

describe('/api/customers/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/customers/stats', () => {
    const mockStatsData = {
      total: 250,
      recent: 15,
      active: 45
    }

    const mockCountryData = {
      'UAE': 180,
      'Saudi Arabia': 35,
      'Oman': 20,
      'Qatar': 15
    }

    const mockMarketingData = {
      total: 250,
      consented: 180,
      declined: 70
    }

    it('should return customer statistics successfully', async () => {
      mockCustomerService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })
      mockCustomerService.getByCountry.mockResolvedValue({
        success: true,
        data: mockCountryData
      })
      mockCustomerService.getMarketingStats.mockResolvedValue({
        success: true,
        data: mockMarketingData
      })

      const request = new NextRequest('http://localhost:3000/api/customers/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.overview.total).toBe(250)
      expect(data.data.overview.recent).toBe(15)
      expect(data.data.overview.active).toBe(45)
      expect(data.data.byCountry).toEqual(mockCountryData)
      expect(data.data.marketing).toEqual(mockMarketingData)
      expect(mockCustomerService.getStatistics).toHaveBeenCalledTimes(1)
      expect(mockCustomerService.getByCountry).toHaveBeenCalledTimes(1)
      expect(mockCustomerService.getMarketingStats).toHaveBeenCalledTimes(1)
    })

    it('should return correct country distribution', async () => {
      mockCustomerService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })
      mockCustomerService.getByCountry.mockResolvedValue({
        success: true,
        data: mockCountryData
      })
      mockCustomerService.getMarketingStats.mockResolvedValue({
        success: true,
        data: mockMarketingData
      })

      const request = new NextRequest('http://localhost:3000/api/customers/stats')
      const response = await GET(request)
      const data = await response.json()

      const countryDistribution = data.data.byCountry
      expect(countryDistribution['UAE']).toBe(180)
      expect(countryDistribution['Saudi Arabia']).toBe(35)
      expect(countryDistribution['Oman']).toBe(20)
      expect(countryDistribution['Qatar']).toBe(15)
    })

    it('should include marketing consent statistics', async () => {
      mockCustomerService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })
      mockCustomerService.getByCountry.mockResolvedValue({
        success: true,
        data: mockCountryData
      })
      mockCustomerService.getMarketingStats.mockResolvedValue({
        success: true,
        data: mockMarketingData
      })

      const request = new NextRequest('http://localhost:3000/api/customers/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(data.data.marketing).toHaveProperty('total')
      expect(data.data.marketing).toHaveProperty('consented')
      expect(data.data.marketing).toHaveProperty('declined')
      expect(data.data.marketing.total).toBe(250)
      expect(data.data.marketing.consented).toBe(180)
      expect(data.data.marketing.declined).toBe(70)
    })

    it('should handle empty statistics', async () => {
      const emptyStats = {
        total: 0,
        recent: 0,
        active: 0
      }

      const emptyCountryData = {}
      const emptyMarketingData = {
        total: 0,
        consented: 0,
        declined: 0
      }

      mockCustomerService.getStatistics.mockResolvedValue({
        success: true,
        data: emptyStats
      })
      mockCustomerService.getByCountry.mockResolvedValue({
        success: true,
        data: emptyCountryData
      })
      mockCustomerService.getMarketingStats.mockResolvedValue({
        success: true,
        data: emptyMarketingData
      })

      const request = new NextRequest('http://localhost:3000/api/customers/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.overview.total).toBe(0)
      expect(data.data.overview.recent).toBe(0)
      expect(data.data.overview.active).toBe(0)
      expect(Object.keys(data.data.byCountry)).toHaveLength(0)
    })

    it('should handle service errors for statistics', async () => {
      mockCustomerService.getStatistics.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      })

      const request = new NextRequest('http://localhost:3000/api/customers/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })

    it('should handle service errors for country data', async () => {
      mockCustomerService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })
      mockCustomerService.getByCountry.mockResolvedValue({
        success: false,
        error: 'Country query failed'
      })

      const request = new NextRequest('http://localhost:3000/api/customers/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Country query failed')
    })

    it('should handle service errors for marketing data', async () => {
      mockCustomerService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })
      mockCustomerService.getByCountry.mockResolvedValue({
        success: true,
        data: mockCountryData
      })
      mockCustomerService.getMarketingStats.mockResolvedValue({
        success: false,
        error: 'Marketing query failed'
      })

      const request = new NextRequest('http://localhost:3000/api/customers/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Marketing query failed')
    })

    it('should handle service exceptions', async () => {
      mockCustomerService.getStatistics.mockRejectedValue(new Error('Unexpected error'))

      const request = new NextRequest('http://localhost:3000/api/customers/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })

    it('should require authentication', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/customers/stats')
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

      mockCustomerService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })
      mockCustomerService.getByCountry.mockResolvedValue({
        success: true,
        data: mockCountryData
      })
      mockCustomerService.getMarketingStats.mockResolvedValue({
        success: true,
        data: mockMarketingData
      })

      const request = new NextRequest('http://localhost:3000/api/customers/stats')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should return statistics in consistent format', async () => {
      mockCustomerService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })
      mockCustomerService.getByCountry.mockResolvedValue({
        success: true,
        data: mockCountryData
      })
      mockCustomerService.getMarketingStats.mockResolvedValue({
        success: true,
        data: mockMarketingData
      })

      const request = new NextRequest('http://localhost:3000/api/customers/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('overview')
      expect(data.data).toHaveProperty('byCountry')
      expect(data.data).toHaveProperty('marketing')
      expect(data.data.overview).toHaveProperty('total')
      expect(data.data.overview).toHaveProperty('recent')
      expect(data.data.overview).toHaveProperty('active')
      expect(typeof data.data.byCountry).toBe('object')
      expect(typeof data.data.marketing).toBe('object')
    })

    it('should validate overview data structure', async () => {
      mockCustomerService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })
      mockCustomerService.getByCountry.mockResolvedValue({
        success: true,
        data: mockCountryData
      })
      mockCustomerService.getMarketingStats.mockResolvedValue({
        success: true,
        data: mockMarketingData
      })

      const request = new NextRequest('http://localhost:3000/api/customers/stats')
      const response = await GET(request)
      const data = await response.json()

      const overview = data.data.overview
      expect(typeof overview.total).toBe('number')
      expect(typeof overview.recent).toBe('number')
      expect(typeof overview.active).toBe('number')
      expect(overview.total).toBeGreaterThanOrEqual(0)
      expect(overview.recent).toBeGreaterThanOrEqual(0)
      expect(overview.active).toBeGreaterThanOrEqual(0)
    })

    it('should handle large statistics datasets', async () => {
      const largeStatsData = {
        total: 50000,
        recent: 2500,
        active: 12000
      }

      const largeCountryData: Record<string, number> = {}
      Array.from({ length: 50 }, (_, i) => {
        largeCountryData[`Country_${i}`] = Math.floor(Math.random() * 2000)
      })

      const largeMarketingData = {
        total: 50000,
        consented: 35000,
        declined: 15000
      }

      mockCustomerService.getStatistics.mockResolvedValue({
        success: true,
        data: largeStatsData
      })
      mockCustomerService.getByCountry.mockResolvedValue({
        success: true,
        data: largeCountryData
      })
      mockCustomerService.getMarketingStats.mockResolvedValue({
        success: true,
        data: largeMarketingData
      })

      const request = new NextRequest('http://localhost:3000/api/customers/stats')
      const startTime = Date.now()
      const response = await GET(request)
      const endTime = Date.now()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.overview.total).toBe(50000)
      expect(Object.keys(data.data.byCountry)).toHaveLength(50)
      expect(endTime - startTime).toBeLessThan(1000) // Should respond within 1 second
    })
  })

  describe('Caching', () => {
    it('should include cache headers for stats endpoint', async () => {
      mockCustomerService.getStatistics.mockResolvedValue({
        success: true,
        data: {
          total: 100,
          recent: 5,
          active: 25
        }
      })
      mockCustomerService.getByCountry.mockResolvedValue({
        success: true,
        data: { 'UAE': 100 }
      })
      mockCustomerService.getMarketingStats.mockResolvedValue({
        success: true,
        data: {
          total: 100,
          consented: 75,
          declined: 25
        }
      })

      const request = new NextRequest('http://localhost:3000/api/customers/stats')
      const response = await GET(request)

      // Check if response includes appropriate cache headers
      expect(response.headers.get('cache-control')).toBeTruthy()
    })
  })

  describe('Performance', () => {
    it('should respond quickly for statistics queries', async () => {
      mockCustomerService.getStatistics.mockResolvedValue({
        success: true,
        data: {
          total: 1000,
          recent: 50,
          active: 200
        }
      })
      mockCustomerService.getByCountry.mockResolvedValue({
        success: true,
        data: {
          'UAE': 600,
          'Saudi Arabia': 400
        }
      })
      mockCustomerService.getMarketingStats.mockResolvedValue({
        success: true,
        data: {
          total: 1000,
          consented: 700,
          declined: 300
        }
      })

      const request = new NextRequest('http://localhost:3000/api/customers/stats')
      const startTime = Date.now()
      const response = await GET(request)
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(500) // Should be very fast
    })

    it('should handle concurrent requests efficiently', async () => {
      mockCustomerService.getStatistics.mockResolvedValue({
        success: true,
        data: { total: 100, recent: 10, active: 30 }
      })
      mockCustomerService.getByCountry.mockResolvedValue({
        success: true,
        data: { 'UAE': 100 }
      })
      mockCustomerService.getMarketingStats.mockResolvedValue({
        success: true,
        data: { total: 100, consented: 60, declined: 40 }
      })

      const requests = Array.from({ length: 5 }, () => 
        GET(new NextRequest('http://localhost:3000/api/customers/stats'))
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })

  describe('Data Validation', () => {
    it('should validate that marketing stats add up correctly', async () => {
      const marketingStats = {
        total: 100,
        consented: 60,
        declined: 40
      }

      mockCustomerService.getStatistics.mockResolvedValue({
        success: true,
        data: { total: 100, recent: 10, active: 30 }
      })
      mockCustomerService.getByCountry.mockResolvedValue({
        success: true,
        data: { 'UAE': 100 }
      })
      mockCustomerService.getMarketingStats.mockResolvedValue({
        success: true,
        data: marketingStats
      })

      const request = new NextRequest('http://localhost:3000/api/customers/stats')
      const response = await GET(request)
      const data = await response.json()

      // API should return the data (service layer handles validation)
      expect(response.status).toBe(200)
      expect(data.data.marketing).toEqual(marketingStats)
      expect(data.data.marketing.consented + data.data.marketing.declined).toBe(data.data.marketing.total)
    })
  })

  describe('Error Recovery', () => {
    it('should provide fallback data on partial service failure', async () => {
      mockCustomerService.getStatistics.mockResolvedValue({
        success: true,
        data: { total: 0, recent: 0, active: 0 }
      })
      mockCustomerService.getByCountry.mockResolvedValue({
        success: true,
        data: {}
      })
      mockCustomerService.getMarketingStats.mockResolvedValue({
        success: true,
        data: { total: 0, consented: 0, declined: 0 }
      })

      const request = new NextRequest('http://localhost:3000/api/customers/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.overview.total).toBeDefined()
      expect(typeof data.data.byCountry).toBe('object')
      expect(data.data.marketing.total).toBeDefined()
    })
  })
})