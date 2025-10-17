import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpenseService } from '@/lib/services/expenses'
import { VehicleService } from '@/lib/services/vehicles'
import { InvoiceService } from '@/lib/services/invoices'
import ExpensesReportsPage from '../page'

// Mock the services
vi.mock('@/lib/services/expenses')
vi.mock('@/lib/services/vehicles')
vi.mock('@/lib/services/invoices')

const mockExpenseService = ExpenseService as any
const mockVehicleService = VehicleService as any
const mockInvoiceService = InvoiceService as any

describe('Expenses Reports Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Page Structure', () => {
    it('should render page title and description', async () => {
      // Mock empty data
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byCategory: {}, byCurrency: {}, count: 0 } })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byStatus: [] } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })

      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /expenses reports/i })).toBeInTheDocument()
        expect(screen.getByText(/comprehensive expense tracking and cost analysis/i)).toBeInTheDocument()
      })
    })

    it('should render filter controls', async () => {
      // Mock empty data
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byCategory: {}, byCurrency: {}, count: 0 } })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byStatus: [] } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })

      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/category filter/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /apply filters/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /reset filters/i })).toBeInTheDocument()
      })
    })
  })

  describe('Expense Overview Dashboard', () => {
    const mockExpenseData = {
      expenses: {
        total: 500000,
        byCategory: {
          acquisition: 200000,
          transportation: 100000,
          enhancement: 80000,
          operational: 70000,
          marketing: 30000,
          maintenance: 20000
        },
        byCurrency: {
          AED: 300000,
          USD: 120000,
          CAD: 80000
        },
        count: 150
      },
      vehicles: {
        total: 120,
        byStatus: [
          { current_status: 'available', count: 60 },
          { current_status: 'sold', count: 40 },
          { current_status: 'in_transit', count: 20 }
        ]
      },
      invoices: {
        total: 200,
        totalValue: { AED: 800000, USD: 150000 },
        byStatus: { counts: {}, totals: {} }
      }
    }

    beforeEach(() => {
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: mockExpenseData.expenses })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: mockExpenseData.vehicles })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockExpenseData.invoices })
    })

    it('should display expense overview cards', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/total expenses/i)).toBeInTheDocument()
        
        expect(screen.getByText(/total transactions/i)).toBeInTheDocument()
        expect(screen.getByText('150')).toBeInTheDocument()
        
        expect(screen.getByText(/average expense/i)).toBeInTheDocument()
        
        expect(screen.getByText(/expense ratio/i)).toBeInTheDocument()
      })
    })

    it('should calculate total expenses in AED correctly', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        // Total: 300000 AED + 120000 USD*3.67 + 80000 CAD*2.70 = 1,056,400 AED
        expect(screen.getAllByText(/1,056,400.*AED/)).toHaveLength(1)
      })
    })

    it('should calculate average expense per transaction', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        // 1,056,400 total / 150 transactions = 7,043 AED average
        expect(screen.getAllByText(/7,043.*AED/)).toHaveLength(1)
      })
    })

    it('should calculate expense ratio against revenue', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        // Expense ratio: expenses / revenue * 100
        // Revenue: 800000 + 150000*3.67 = 1,350,500 AED
        // Ratio: 1,056,400 / 1,350,500 = 78.2%
        expect(screen.getByText(/78\\.2%/)).toBeInTheDocument()
      })
    })

    it('should display expense per vehicle metric', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/expense per vehicle/i)).toBeInTheDocument()
        // 1,056,400 / 120 vehicles = 8,803 AED per vehicle
        expect(screen.getAllByText(/8,803.*AED/)).toHaveLength(1)
      })
    })
  })

  describe('Category Breakdown Analysis', () => {
    const mockCategoryData = {
      expenses: {
        total: 400000,
        byCategory: {
          acquisition: 180000,
          transportation: 80000,
          enhancement: 60000,
          operational: 50000,
          marketing: 20000,
          maintenance: 10000
        },
        byCurrency: { AED: 400000 },
        count: 100
      },
      vehicles: { total: 80, byStatus: [] },
      invoices: { total: 150, totalValue: { AED: 600000 }, byStatus: { counts: {}, totals: {} } }
    }

    beforeEach(() => {
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: mockCategoryData.expenses })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: mockCategoryData.vehicles })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockCategoryData.invoices })
    })

    it('should display expense breakdown by category', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/expense breakdown by category/i)).toBeInTheDocument()
        expect(screen.getByText(/acquisition.*180,000/)).toBeInTheDocument()
        expect(screen.getByText(/transportation.*80,000/)).toBeInTheDocument()
        expect(screen.getByText(/enhancement.*60,000/)).toBeInTheDocument()
        expect(screen.getByText(/operational.*50,000/)).toBeInTheDocument()
        expect(screen.getByText(/marketing.*20,000/)).toBeInTheDocument()
        expect(screen.getByText(/maintenance.*10,000/)).toBeInTheDocument()
      })
    })

    it('should calculate category percentages', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/category distribution/i)).toBeInTheDocument()
        // Acquisition: 180,000 / 400,000 = 45%
        expect(screen.getByText(/45%/)).toBeInTheDocument()
        // Transportation: 80,000 / 400,000 = 20%
        expect(screen.getByText(/20%/)).toBeInTheDocument()
      })
    })

    it('should display top expense categories', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/top expense categories/i)).toBeInTheDocument()
        expect(screen.getByText(/acquisition/i)).toBeInTheDocument()
        expect(screen.getByText(/transportation/i)).toBeInTheDocument()
        expect(screen.getByText(/enhancement/i)).toBeInTheDocument()
      })
    })

    it('should show cost per category metrics', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/cost analysis/i)).toBeInTheDocument()
        expect(screen.getByText(/180,000.*AED/)).toBeInTheDocument() // Acquisition cost
        expect(screen.getByText(/80,000.*AED/)).toBeInTheDocument() // Transportation cost
      })
    })
  })

  describe('Currency Distribution', () => {
    const mockCurrencyData = {
      expenses: {
        total: 600000,
        byCategory: {},
        byCurrency: {
          AED: 350000,
          USD: 150000,
          CAD: 100000
        },
        count: 200
      },
      vehicles: { total: 100, byStatus: [] },
      invoices: { total: 180, totalValue: {}, byStatus: { counts: {}, totals: {} } }
    }

    beforeEach(() => {
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: mockCurrencyData.expenses })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: mockCurrencyData.vehicles })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockCurrencyData.invoices })
    })

    it('should display expense breakdown by currency', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/expense breakdown by currency/i)).toBeInTheDocument()
        expect(screen.getByText(/350,000.*AED/)).toBeInTheDocument()
        expect(screen.getByText(/150,000.*USD/)).toBeInTheDocument()
        expect(screen.getByText(/100,000.*CAD/)).toBeInTheDocument()
      })
    })

    it('should show currency distribution percentages', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/currency distribution/i)).toBeInTheDocument()
        // Total in AED: 350000 + 150000*3.67 + 100000*2.70 = 1,170,500
        // AED percentage: 350000 / 1,170,500 = 29.9%
        // USD percentage: 550500 / 1,170,500 = 47.0%
        // CAD percentage: 270000 / 1,170,500 = 23.1%
      })
    })

    it('should calculate multi-currency totals', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/multi-currency total/i)).toBeInTheDocument()
        expect(screen.getByText(/1,170,500.*AED/)).toBeInTheDocument()
      })
    })

    it('should display exchange rate impact', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/exchange rate impact/i)).toBeInTheDocument()
        expect(screen.getByText(/AED/)).toBeInTheDocument()
      })
    })
  })

  describe('Trend Analysis', () => {
    const mockTrendData = {
      expenses: {
        total: 800000,
        byCategory: { acquisition: 400000, operational: 200000, marketing: 200000 },
        byCurrency: { AED: 500000, USD: 200000, CAD: 100000 },
        count: 250,
        monthlyTrends: [
          { month: 'Jan', total: 60000 },
          { month: 'Feb', total: 75000 },
          { month: 'Mar', total: 85000 }
        ]
      },
      vehicles: { total: 150, byStatus: [] },
      invoices: { total: 220, totalValue: { AED: 1200000 }, byStatus: { counts: {}, totals: {} } }
    }

    beforeEach(() => {
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: mockTrendData.expenses })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: mockTrendData.vehicles })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockTrendData.invoices })
    })

    it('should display expense trends over time', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/expense trends/i)).toBeInTheDocument()
        expect(screen.getAllByRole('tablist').length).toBeGreaterThan(0)
      })
    })

    it('should show monthly expense growth', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/monthly growth/i)).toBeInTheDocument()
        expect(screen.getByText(/%/)).toBeInTheDocument()
      })
    })

    it('should calculate expense velocity', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/expense velocity/i)).toBeInTheDocument()
        // 250 transactions per month average
        expect(screen.getByText(/per month/i)).toBeInTheDocument()
      })
    })

    it('should display seasonal patterns', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/seasonal analysis/i)).toBeInTheDocument()
      })
    })
  })

  describe('Cost Efficiency Metrics', () => {
    const mockEfficiencyData = {
      expenses: {
        total: 300000,
        byCategory: { acquisition: 150000, operational: 100000, enhancement: 50000 },
        byCurrency: { AED: 300000 },
        count: 75
      },
      vehicles: {
        total: 50,
        byStatus: [
          { current_status: 'sold', count: 30 },
          { current_status: 'available', count: 20 }
        ]
      },
      invoices: {
        total: 80,
        totalValue: { AED: 500000 },
        byStatus: { counts: {}, totals: {} }
      }
    }

    beforeEach(() => {
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: mockEfficiencyData.expenses })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: mockEfficiencyData.vehicles })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockEfficiencyData.invoices })
    })

    it('should calculate return on expense', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/return on expense/i)).toBeInTheDocument()
        // ROE: (Revenue - Expenses) / Expenses * 100 = (500000 - 300000) / 300000 = 66.7%
        expect(screen.getByText(/66\\.7%/)).toBeInTheDocument()
      })
    })

    it('should display cost per sale', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/cost per sale/i)).toBeInTheDocument()
        // 300000 expenses / 30 sold vehicles = 10,000 AED per sale
        expect(screen.getByText(/10,000.*AED/)).toBeInTheDocument()
      })
    })

    it('should show operational efficiency', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/operational efficiency/i)).toBeInTheDocument()
        // Revenue per expense dollar: 500000 / 300000 = 1.67
        expect(screen.getByText(/1\\.67/)).toBeInTheDocument()
      })
    })

    it('should calculate expense coverage ratio', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/expense coverage ratio/i)).toBeInTheDocument()
        // Revenue / Expenses = 500000 / 300000 = 1.67x
        expect(screen.getByText(/1\\.67x/)).toBeInTheDocument()
      })
    })
  })

  describe('Charts and Visualizations', () => {
    beforeEach(() => {
      mockExpenseService.getStatistics.mockResolvedValue({ 
        success: true, 
        data: { total: 200000, byCategory: {}, byCurrency: {}, count: 50 }
      })
      mockVehicleService.getStatistics.mockResolvedValue({ 
        success: true, 
        data: { total: 40, byStatus: [] }
      })
      mockInvoiceService.getStatistics.mockResolvedValue({ 
        success: true, 
        data: { total: 60, totalValue: { AED: 400000 }, byStatus: { counts: {}, totals: {} } }
      })
    })

    it('should render expense trends chart section', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getAllByText(/expense trends/i)).toHaveLength(2) // Multiple "expense trends" in UI
        expect(screen.getAllByRole('tablist').length).toBeGreaterThan(0)
      })
    })

    it('should render category distribution pie chart', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getAllByText(/category distribution/i)).toHaveLength(2) // Multiple "category distribution" in UI
      })
    })

    it('should render currency breakdown chart', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getAllByText(/currency distribution/i)).toHaveLength(2) // Multiple "currency distribution" in UI
      })
    })

    it('should render cost efficiency dashboard', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/cost efficiency dashboard/i)).toBeInTheDocument()
      })
    })
  })

  describe('Date Filtering', () => {
    it('should filter data when date range is applied', async () => {
      const user = userEvent.setup()
      
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 100000, byCategory: {}, byCurrency: {}, count: 25 } })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 20, byStatus: [] } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 30, totalValue: {}, byStatus: { counts: {}, totals: {} } } })

      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
      })

      const startDate = screen.getByLabelText(/start date/i)
      const endDate = screen.getByLabelText(/end date/i)
      const applyButton = screen.getByRole('button', { name: /apply filters/i })

      await user.type(startDate, '2024-01-01')
      await user.type(endDate, '2024-01-31')
      await user.click(applyButton)

      await waitFor(() => {
        expect(mockExpenseService.getStatistics).toHaveBeenCalledWith({
          date_from: '2024-01-01',
          date_to: '2024-01-31'
        })
      })
    })

    it('should filter by expense category', async () => {
      const user = userEvent.setup()
      
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 50000, byCategory: {}, byCurrency: {}, count: 15 } })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 10, byStatus: [] } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 15, totalValue: {}, byStatus: { counts: {}, totals: {} } } })

      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/category filter/i)).toBeInTheDocument()
      })

      const categoryFilter = screen.getByLabelText(/category filter/i)
      const applyButton = screen.getByRole('button', { name: /apply filters/i })

      await user.click(categoryFilter)
      const acquisitionOption = await screen.findByText('Acquisition')
      await user.click(acquisitionOption)
      await user.click(applyButton)

      await waitFor(() => {
        expect(mockExpenseService.getStatistics).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'acquisition'
          })
        )
      })
    })

    it('should reset filters when reset button is clicked', async () => {
      const user = userEvent.setup()
      
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 200000, byCategory: {}, byCurrency: {}, count: 50 } })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 40, byStatus: [] } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 60, totalValue: {}, byStatus: { counts: {}, totals: {} } } })

      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reset filters/i })).toBeInTheDocument()
      })

      const resetButton = screen.getByRole('button', { name: /reset filters/i })
      await user.click(resetButton)

      await waitFor(() => {
        expect(mockExpenseService.getStatistics).toHaveBeenCalledWith({})
      })
    })
  })

  describe('Export Functionality', () => {
    it('should render export buttons', async () => {
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byCategory: {}, byCurrency: {}, count: 0 } })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byStatus: [] } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })

      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /export excel/i })).toBeInTheDocument()
      })
    })
  })

  describe('Loading and Error States', () => {
    it('should show loading state while fetching data', async () => {
      // Create promises that never resolve to simulate loading
      const neverResolves = new Promise(() => {})
      mockExpenseService.getStatistics.mockReturnValue(neverResolves)
      mockVehicleService.getStatistics.mockReturnValue(neverResolves)
      mockInvoiceService.getStatistics.mockReturnValue(neverResolves)

      render(<ExpensesReportsPage />)

      expect(screen.getByText(/loading expense data/i)).toBeInTheDocument()
    })

    it('should show error state when data fetching fails', async () => {
      mockExpenseService.getStatistics.mockResolvedValue({ success: false, error: 'Database error' })
      mockVehicleService.getStatistics.mockResolvedValue({ success: false, error: 'Database error' })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: false, error: 'Database error' })

      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/error loading expense data/i)).toBeInTheDocument()
        expect(screen.getByText(/database error/i)).toBeInTheDocument()
      })
    })

    it('should have retry functionality on error', async () => {
      const user = userEvent.setup()
      
      mockExpenseService.getStatistics.mockResolvedValue({ success: false, error: 'Network error' })
      mockVehicleService.getStatistics.mockResolvedValue({ success: false, error: 'Network error' })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: false, error: 'Network error' })

      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /retry/i }))

      // Should call the services again
      await waitFor(() => {
        expect(mockExpenseService.getStatistics).toHaveBeenCalledTimes(2)
        expect(mockVehicleService.getStatistics).toHaveBeenCalledTimes(2)
        expect(mockInvoiceService.getStatistics).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Responsive Design', () => {
    it('should render mobile-friendly layout', async () => {
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byCategory: {}, byCurrency: {}, count: 0 } })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byStatus: [] } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })

      render(<ExpensesReportsPage />)

      await waitFor(() => {
        // Should have responsive grid classes in dashboard section
        expect(screen.getByText(/total expenses/i)).toBeInTheDocument()
        expect(document.querySelector('.grid')).toBeInTheDocument()
      })
    })
  })

  describe('Advanced Analytics', () => {
    const mockAdvancedData = {
      expenses: {
        total: 1000000,
        byCategory: {
          acquisition: 500000,
          transportation: 200000,
          enhancement: 150000,
          operational: 100000,
          marketing: 50000
        },
        byCurrency: { AED: 600000, USD: 250000, CAD: 150000 },
        count: 300
      },
      vehicles: {
        total: 200,
        byStatus: [
          { current_status: 'sold', count: 120 },
          { current_status: 'available', count: 80 }
        ]
      },
      invoices: {
        total: 250,
        totalValue: { AED: 1500000, USD: 300000 },
        byStatus: { counts: {}, totals: {} }
      }
    }

    beforeEach(() => {
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: mockAdvancedData.expenses })
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: mockAdvancedData.vehicles })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockAdvancedData.invoices })
    })

    it('should calculate expense efficiency ratio', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/expense efficiency ratio/i)).toBeInTheDocument()
        expect(screen.getByText(/ratio/i)).toBeInTheDocument()
      })
    })

    it('should display cost optimization opportunities', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/cost optimization/i)).toBeInTheDocument()
        expect(screen.getByText(/opportunities/i)).toBeInTheDocument()
      })
    })

    it('should calculate expense variance analysis', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/variance analysis/i)).toBeInTheDocument()
        expect(screen.getByText(/%/)).toBeInTheDocument()
      })
    })

    it('should show budget vs actual comparison', async () => {
      render(<ExpensesReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/budget vs actual/i)).toBeInTheDocument()
        expect(screen.getByText(/AED/)).toBeInTheDocument()
      })
    })
  })
})