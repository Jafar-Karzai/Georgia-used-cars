import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '../route'
import { InvoiceService } from '@/lib/services/invoices'
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

describe('/api/invoices/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/invoices/stats', () => {
    const mockStatsData = {
      total: 150,
      totalValue: {
        'AED': 2450000,
        'USD': 350000,
        'CAD': 125000
      },
      byStatus: {
        counts: {
          'draft': 15,
          'sent': 45,
          'partially_paid': 25,
          'fully_paid': 55,
          'overdue': 8,
          'cancelled': 2
        },
        totals: {
          'draft': 245000,
          'sent': 890000,
          'partially_paid': 520000,
          'fully_paid': 1100000,
          'overdue': 185000,
          'cancelled': 35000
        }
      },
      overdue: {
        count: 8,
        amount: 185000
      }
    }

    it('should return invoice statistics successfully', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })

      const request = new NextRequest('http://localhost:3000/api/invoices/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.total).toBe(150)
      expect(data.data.totalValue).toEqual(mockStatsData.totalValue)
      expect(data.data.byStatus.counts).toEqual(mockStatsData.byStatus.counts)
      expect(data.data.byStatus.totals).toEqual(mockStatsData.byStatus.totals)
      expect(data.data.overdue).toEqual(mockStatsData.overdue)
      expect(mockInvoiceService.getStatistics).toHaveBeenCalledWith({})
    })

    it('should handle date filter parameters', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })

      const request = new NextRequest('http://localhost:3000/api/invoices/stats?created_from=2024-01-01&created_to=2024-12-31')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockInvoiceService.getStatistics).toHaveBeenCalledWith({
        created_from: '2024-01-01',
        created_to: '2024-12-31'
      })
    })

    it('should return correct status distribution', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })

      const request = new NextRequest('http://localhost:3000/api/invoices/stats')
      const response = await GET(request)
      const data = await response.json()

      const statusCounts = data.data.byStatus.counts
      const statusTotals = data.data.byStatus.totals
      
      expect(statusCounts['fully_paid']).toBe(55)
      expect(statusCounts['overdue']).toBe(8)
      expect(statusTotals['fully_paid']).toBe(1100000)
      expect(statusTotals['overdue']).toBe(185000)
    })

    it('should include currency breakdown', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })

      const request = new NextRequest('http://localhost:3000/api/invoices/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(data.data.totalValue).toHaveProperty('AED')
      expect(data.data.totalValue).toHaveProperty('USD')
      expect(data.data.totalValue).toHaveProperty('CAD')
      expect(data.data.totalValue.AED).toBe(2450000)
      expect(data.data.totalValue.USD).toBe(350000)
      expect(data.data.totalValue.CAD).toBe(125000)
    })

    it('should include overdue statistics', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })

      const request = new NextRequest('http://localhost:3000/api/invoices/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(data.data.overdue).toHaveProperty('count')
      expect(data.data.overdue).toHaveProperty('amount')
      expect(data.data.overdue.count).toBe(8)
      expect(data.data.overdue.amount).toBe(185000)
    })

    it('should handle empty statistics', async () => {
      const emptyStats = {
        total: 0,
        totalValue: {},
        byStatus: {
          counts: {},
          totals: {}
        },
        overdue: {
          count: 0,
          amount: 0
        }
      }

      mockInvoiceService.getStatistics.mockResolvedValue({
        success: true,
        data: emptyStats
      })

      const request = new NextRequest('http://localhost:3000/api/invoices/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.total).toBe(0)
      expect(Object.keys(data.data.totalValue)).toHaveLength(0)
      expect(Object.keys(data.data.byStatus.counts)).toHaveLength(0)
      expect(data.data.overdue.count).toBe(0)
      expect(data.data.overdue.amount).toBe(0)
    })

    it('should handle service errors', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      })

      const request = new NextRequest('http://localhost:3000/api/invoices/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })

    it('should handle service exceptions', async () => {
      mockInvoiceService.getStatistics.mockRejectedValue(new Error('Unexpected error'))

      const request = new NextRequest('http://localhost:3000/api/invoices/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })

    it('should require authentication', async () => {
      const mockAuth = await import('@/lib/auth')
      vi.mocked(mockAuth.getCurrentUser).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/invoices/stats')
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

      mockInvoiceService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })

      const request = new NextRequest('http://localhost:3000/api/invoices/stats')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should return statistics in consistent format', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })

      const request = new NextRequest('http://localhost:3000/api/invoices/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('total')
      expect(data.data).toHaveProperty('totalValue')
      expect(data.data).toHaveProperty('byStatus')
      expect(data.data).toHaveProperty('overdue')
      expect(data.data.byStatus).toHaveProperty('counts')
      expect(data.data.byStatus).toHaveProperty('totals')
      expect(typeof data.data.totalValue).toBe('object')
      expect(typeof data.data.byStatus.counts).toBe('object')
      expect(typeof data.data.byStatus.totals).toBe('object')
    })

    it('should validate status data structure', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({
        success: true,
        data: mockStatsData
      })

      const request = new NextRequest('http://localhost:3000/api/invoices/stats')
      const response = await GET(request)
      const data = await response.json()

      const statusCounts = data.data.byStatus.counts
      const statusTotals = data.data.byStatus.totals

      Object.keys(statusCounts).forEach(status => {
        expect(typeof statusCounts[status]).toBe('number')
        expect(statusCounts[status]).toBeGreaterThanOrEqual(0)
      })

      Object.keys(statusTotals).forEach(status => {
        expect(typeof statusTotals[status]).toBe('number')
        expect(statusTotals[status]).toBeGreaterThanOrEqual(0)
      })
    })

    it('should handle large statistics datasets', async () => {
      const largeStatsData = {
        total: 50000,
        totalValue: {
          'AED': 125000000,
          'USD': 25000000,
          'CAD': 8500000
        },
        byStatus: {
          counts: {
            'draft': 5000,
            'sent': 15000,
            'partially_paid': 8000,
            'fully_paid': 20000,
            'overdue': 1500,
            'cancelled': 500
          },
          totals: {
            'draft': 12500000,
            'sent': 38750000,
            'partially_paid': 20000000,
            'fully_paid': 75000000,
            'overdue': 10000000,
            'cancelled': 2250000
          }
        },
        overdue: {
          count: 1500,
          amount: 10000000
        }
      }

      mockInvoiceService.getStatistics.mockResolvedValue({
        success: true,
        data: largeStatsData
      })

      const request = new NextRequest('http://localhost:3000/api/invoices/stats')
      const startTime = Date.now()
      const response = await GET(request)
      const endTime = Date.now()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.total).toBe(50000)
      expect(Object.keys(data.data.totalValue)).toHaveLength(3)
      expect(endTime - startTime).toBeLessThan(1000) // Should respond within 1 second
    })
  })

  describe('Caching', () => {
    it('should include cache headers for stats endpoint', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({
        success: true,
        data: {
          total: 100,
          totalValue: { 'AED': 150000 },
          byStatus: {
            counts: { 'sent': 50, 'fully_paid': 50 },
            totals: { 'sent': 75000, 'fully_paid': 75000 }
          },
          overdue: {
            count: 5,
            amount: 15000
          }
        }
      })

      const request = new NextRequest('http://localhost:3000/api/invoices/stats')
      const response = await GET(request)

      // Check if response includes appropriate cache headers
      expect(response.headers.get('cache-control')).toBeTruthy()
    })
  })

  describe('Performance', () => {
    it('should respond quickly for statistics queries', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({
        success: true,
        data: {
          total: 1000,
          totalValue: {
            'AED': 2500000,
            'USD': 500000
          },
          byStatus: {
            counts: {
              'sent': 400,
              'fully_paid': 500,
              'overdue': 100
            },
            totals: {
              'sent': 1000000,
              'fully_paid': 1750000,
              'overdue': 250000
            }
          },
          overdue: {
            count: 100,
            amount: 250000
          }
        }
      })

      const request = new NextRequest('http://localhost:3000/api/invoices/stats')
      const startTime = Date.now()
      const response = await GET(request)
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(500) // Should be very fast
    })

    it('should handle concurrent requests efficiently', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({
        success: true,
        data: {
          total: 100,
          totalValue: { 'AED': 150000 },
          byStatus: {
            counts: { 'sent': 60, 'fully_paid': 40 },
            totals: { 'sent': 90000, 'fully_paid': 60000 }
          },
          overdue: { count: 10, amount: 15000 }
        }
      })

      const requests = Array.from({ length: 5 }, () => 
        GET(new NextRequest('http://localhost:3000/api/invoices/stats'))
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })

  describe('Data Validation', () => {
    it('should validate that status counts and totals are consistent', async () => {
      const consistentStats = {
        total: 100,
        totalValue: { 'AED': 150000 },
        byStatus: {
          counts: {
            'sent': 60,
            'fully_paid': 40
          },
          totals: {
            'sent': 90000,
            'fully_paid': 60000
          }
        },
        overdue: { count: 10, amount: 15000 }
      }

      mockInvoiceService.getStatistics.mockResolvedValue({
        success: true,
        data: consistentStats
      })

      const request = new NextRequest('http://localhost:3000/api/invoices/stats')
      const response = await GET(request)
      const data = await response.json()

      // API should return the data (service layer handles validation)
      expect(response.status).toBe(200)
      expect(data.data.byStatus).toEqual(consistentStats.byStatus)
      
      // Verify counts add up to total
      const totalCounts = Object.values(data.data.byStatus.counts).reduce((sum: number, count: any) => sum + count, 0)
      expect(totalCounts).toBeLessThanOrEqual(data.data.total)
    })

    it('should validate currency data structure', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({
        success: true,
        data: {
          total: 50,
          totalValue: {
            'AED': 75000,
            'USD': 25000,
            'CAD': 15000
          },
          byStatus: {
            counts: { 'sent': 30, 'fully_paid': 20 },
            totals: { 'sent': 70000, 'fully_paid': 45000 }
          },
          overdue: { count: 5, amount: 8000 }
        }
      })

      const request = new NextRequest('http://localhost:3000/api/invoices/stats')
      const response = await GET(request)
      const data = await response.json()

      const currencies = Object.keys(data.data.totalValue)
      const validCurrencies = ['AED', 'USD', 'CAD']
      
      currencies.forEach(currency => {
        expect(validCurrencies).toContain(currency)
        expect(typeof data.data.totalValue[currency]).toBe('number')
        expect(data.data.totalValue[currency]).toBeGreaterThan(0)
      })
    })
  })

  describe('Error Recovery', () => {
    it('should provide fallback data on partial service failure', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({
        success: true,
        data: {
          total: 0,
          totalValue: {},
          byStatus: {
            counts: {},
            totals: {}
          },
          overdue: { count: 0, amount: 0 }
        }
      })

      const request = new NextRequest('http://localhost:3000/api/invoices/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.total).toBeDefined()
      expect(typeof data.data.totalValue).toBe('object')
      expect(data.data.byStatus.counts).toBeDefined()
      expect(data.data.overdue.count).toBeDefined()
    })
  })
})