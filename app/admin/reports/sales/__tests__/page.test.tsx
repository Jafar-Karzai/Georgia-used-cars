import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InvoiceService } from '@/lib/services/invoices'
import { VehicleService } from '@/lib/services/vehicles'
import { PaymentService } from '@/lib/services/payments'
import SalesReportsPage from '../page'

// Mock the services
vi.mock('@/lib/services/invoices')
vi.mock('@/lib/services/vehicles')
vi.mock('@/lib/services/payments')

const mockInvoiceService = InvoiceService as any
const mockVehicleService = VehicleService as any
const mockPaymentService = PaymentService as any

describe('Sales Reports Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Page Structure', () => {
    it('should render page title and description', async () => {
      // Mock empty data
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byStatus: { counts: {}, totals: {} }, totalValue: {} } })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byStatus: [] } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {} } })

      render(<SalesReportsPage />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sales reports/i })).toBeInTheDocument()
        expect(screen.getByText(/comprehensive sales performance analytics/i)).toBeInTheDocument()
      })
    })

    it('should render date range filter controls', async () => {
      // Mock empty data
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byStatus: { counts: {}, totals: {} }, totalValue: {} } })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byStatus: [] } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {} } })

      render(<SalesReportsPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /apply filters/i })).toBeInTheDocument()
      })
    })
  })

  describe('Sales Metrics Dashboard', () => {
    const mockSalesData = {
      invoices: {
        total: 150,
        totalValue: { AED: 500000, USD: 100000, CAD: 50000 },
        byStatus: {
          counts: { sent: 50, fully_paid: 80, partially_paid: 15, overdue: 5 },
          totals: { sent: 200000, fully_paid: 400000, partially_paid: 75000, overdue: 25000 }
        }
      },
      vehicles: {
        total: 120,
        byStatus: [
          { current_status: 'sold', count: 80 },
          { current_status: 'ready_for_sale', count: 30 },
          { current_status: 'reserved', count: 10 }
        ]
      },
      payments: {
        total: 200,
        totalValue: { AED: 450000, USD: 90000, CAD: 45000 }
      }
    }

    beforeEach(() => {
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockSalesData.invoices })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: mockSalesData.vehicles })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: mockSalesData.payments })
    })

    it('should display sales overview cards', async () => {
      render(<SalesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/total invoices/i)).toBeInTheDocument()
        expect(screen.getByText('150')).toBeInTheDocument()
        
        expect(screen.getByText(/vehicles sold/i)).toBeInTheDocument()
        expect(screen.getByText('80')).toBeInTheDocument()
        
        expect(screen.getByText(/total payments/i)).toBeInTheDocument()
        expect(screen.getByText('200')).toBeInTheDocument()
      })
    })

    it('should display revenue breakdown by currency', async () => {
      render(<SalesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/revenue by currency/i)).toBeInTheDocument()
        expect(screen.getByText(/500,000.*AED/)).toBeInTheDocument()
        expect(screen.getByText(/100,000.*USD/)).toBeInTheDocument()
        expect(screen.getByText(/50,000.*CAD/)).toBeInTheDocument()
      })
    })

    it('should display invoice status breakdown', async () => {
      render(<SalesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/invoice status breakdown/i)).toBeInTheDocument()
        expect(screen.getByText(/fully paid.*80/)).toBeInTheDocument()
        expect(screen.getByText(/sent.*50/)).toBeInTheDocument()
        expect(screen.getByText(/partially paid.*15/)).toBeInTheDocument()
        expect(screen.getByText(/overdue.*5/)).toBeInTheDocument()
      })
    })

    it('should display conversion rate calculation', async () => {
      render(<SalesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/conversion rate/i)).toBeInTheDocument()
        // 80 sold / 120 total vehicles = 66.67%
        expect(screen.getByText(/66\.67%/)).toBeInTheDocument()
      })
    })
  })

  describe('Charts and Visualizations', () => {
    beforeEach(() => {
      mockInvoiceService.getStatistics.mockResolvedValue({ 
        success: true, 
        data: { 
          total: 100,
          byStatus: {
            counts: { sent: 30, fully_paid: 50, partially_paid: 15, overdue: 5 }
          }
        }
      })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 80 } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 120 } })
    })

    it('should render sales trend chart section', async () => {
      render(<SalesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/sales trends/i)).toBeInTheDocument()
        expect(screen.getAllByRole('tablist').length).toBeGreaterThan(0)
      })
    })

    it('should render invoice status pie chart', async () => {
      render(<SalesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/invoice status distribution/i)).toBeInTheDocument()
      })
    })
  })

  describe('Date Filtering', () => {
    it('should filter data when date range is applied', async () => {
      const user = userEvent.setup()
      
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 50 } })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 40 } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 60 } })

      render(<SalesReportsPage />)

      // Set date range
      const startDate = screen.getByLabelText(/start date/i)
      const endDate = screen.getByLabelText(/end date/i)
      const applyButton = screen.getByRole('button', { name: /apply filters/i })

      await user.type(startDate, '2024-01-01')
      await user.type(endDate, '2024-01-31')
      await user.click(applyButton)

      await waitFor(() => {
        expect(mockInvoiceService.getStatistics).toHaveBeenCalledWith({
          created_from: '2024-01-01',
          created_to: '2024-01-31'
        })
      })
    })

    it('should reset filters when reset button is clicked', async () => {
      const user = userEvent.setup()
      
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 100 } })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 80 } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 120 } })

      render(<SalesReportsPage />)

      const resetButton = screen.getByRole('button', { name: /reset filters/i })
      await user.click(resetButton)

      await waitFor(() => {
        expect(mockInvoiceService.getStatistics).toHaveBeenCalledWith({})
      })
    })
  })

  describe('Export Functionality', () => {
    it('should render export buttons', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byStatus: { counts: {}, totals: {} }, totalValue: {} } })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byStatus: [] } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {} } })

      render(<SalesReportsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /export excel/i })).toBeInTheDocument()
      })
    })
  })

  describe('Loading and Error States', () => {
    it('should show loading state while fetching data', async () => {
      // Create a promise that never resolves to simulate loading
      const neverResolves = new Promise(() => {})
      mockInvoiceService.getStatistics.mockReturnValue(neverResolves)
      mockVehicleService.getStatistics.mockReturnValue(neverResolves)
      mockPaymentService.getStatistics.mockReturnValue(neverResolves)

      render(<SalesReportsPage />)

      expect(screen.getByText(/loading sales data/i)).toBeInTheDocument()
    })

    it('should show error state when data fetching fails', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({ success: false, error: 'Database error' })
      mockVehicleService.getStatistics.mockResolvedValue({ success: false, error: 'Database error' })
      mockPaymentService.getStatistics.mockResolvedValue({ success: false, error: 'Database error' })

      render(<SalesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/error loading sales data/i)).toBeInTheDocument()
        expect(screen.getByText(/database error/i)).toBeInTheDocument()
      })
    })

    it('should have retry functionality on error', async () => {
      const user = userEvent.setup()
      
      mockInvoiceService.getStatistics.mockResolvedValue({ success: false, error: 'Network error' })
      mockVehicleService.getStatistics.mockResolvedValue({ success: false, error: 'Network error' })
      mockPaymentService.getStatistics.mockResolvedValue({ success: false, error: 'Network error' })

      render(<SalesReportsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /retry/i }))

      // Should call the services again
      await waitFor(() => {
        expect(mockInvoiceService.getStatistics).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Responsive Design', () => {
    it('should render mobile-friendly layout', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byStatus: { counts: {}, totals: {} }, totalValue: {} } })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byStatus: [] } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {} } })

      render(<SalesReportsPage />)

      await waitFor(() => {
        // Should have responsive grid classes in KPI cards section
        expect(screen.getByText(/total invoices/i)).toBeInTheDocument()
        expect(document.querySelector('.grid')).toBeInTheDocument()
      })
    })
  })

  describe('Performance Metrics', () => {
    const mockDetailedData = {
      invoices: {
        total: 200,
        totalValue: { AED: 1000000, USD: 200000 },
        byStatus: { counts: { fully_paid: 150, sent: 30, overdue: 20 } }
      },
      vehicles: {
        total: 180,
        byStatus: [{ current_status: 'sold', count: 150 }]
      },
      payments: {
        total: 300,
        totalValue: { AED: 950000, USD: 190000 }
      }
    }

    beforeEach(() => {
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockDetailedData.invoices })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: mockDetailedData.vehicles })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: mockDetailedData.payments })
    })

    it('should calculate and display average invoice value', async () => {
      render(<SalesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/average invoice value/i)).toBeInTheDocument()
        // 1,200,000 total / 200 invoices = 6,000 AED average
        expect(screen.getByText(/6,000.*AED/)).toBeInTheDocument()
      })
    })

    it('should calculate and display collection rate', async () => {
      render(<SalesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/collection rate/i)).toBeInTheDocument()
        // 1,140,000 collected / 1,200,000 invoiced = 95%
        expect(screen.getByText(/95%/)).toBeInTheDocument()
      })
    })
  })
})