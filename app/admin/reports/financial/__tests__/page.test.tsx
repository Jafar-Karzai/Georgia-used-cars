import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InvoiceService } from '@/lib/services/invoices'
import { ExpenseService } from '@/lib/services/expenses'
import { PaymentService } from '@/lib/services/payments'
import FinancialReportsPage from '../page'

// Mock the services
vi.mock('@/lib/services/invoices')
vi.mock('@/lib/services/expenses')
vi.mock('@/lib/services/payments')

const mockInvoiceService = InvoiceService as any
const mockExpenseService = ExpenseService as any
const mockPaymentService = PaymentService as any

describe('Financial Reports Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Page Structure', () => {
    it('should render page title and description', async () => {
      // Mock empty data
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byCurrency: {}, byCategory: {}, count: 0 } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {} } })

      render(<FinancialReportsPage />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /financial reports/i })).toBeInTheDocument()
        expect(screen.getByText(/comprehensive financial overview and cash flow analysis/i)).toBeInTheDocument()
      })
    })

    it('should render date range filter controls', async () => {
      // Mock empty data
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byCurrency: {}, byCategory: {}, count: 0 } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {} } })

      render(<FinancialReportsPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /apply filters/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /reset filters/i })).toBeInTheDocument()
      })
    })
  })

  describe('Financial Overview Dashboard', () => {
    const mockFinancialData = {
      invoices: {
        total: 100,
        totalValue: { AED: 400000, USD: 80000, CAD: 40000 },
        byStatus: {
          counts: { sent: 30, fully_paid: 60, partially_paid: 10 },
          totals: { sent: 150000, fully_paid: 300000, partially_paid: 50000 }
        }
      },
      expenses: {
        total: 200000,
        byCurrency: { AED: 120000, USD: 50000, CAD: 30000 },
        byCategory: { 
          acquisition: 100000, 
          transportation: 40000, 
          operational: 30000, 
          marketing: 20000, 
          enhancement: 10000 
        },
        count: 45
      },
      payments: {
        total: 85,
        totalValue: { AED: 350000, USD: 70000, CAD: 35000 }
      }
    }

    beforeEach(() => {
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockFinancialData.invoices })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: mockFinancialData.expenses })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: mockFinancialData.payments })
    })

    it('should display financial overview cards', async () => {
      render(<FinancialReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/total revenue/i)).toBeInTheDocument()
        expect(screen.getByText(/total expenses/i)).toBeInTheDocument()
        expect(screen.getByText(/net profit/i)).toBeInTheDocument()
        expect(screen.getByText(/profit margin/i)).toBeInTheDocument()
      })
    })

    it('should calculate and display total revenue correctly', async () => {
      render(<FinancialReportsPage />)

      await waitFor(() => {
        // Total revenue: 400000 + 80000*3.67 + 40000*2.70 = 801,600 AED
        expect(screen.getByText(/801,600.*AED/)).toBeInTheDocument()
      })
    })

    it('should calculate and display total expenses correctly', async () => {
      render(<FinancialReportsPage />)

      await waitFor(() => {
        // Total expenses: 120000 + 50000*3.67 + 30000*2.70 = 384,500 AED
        expect(screen.getAllByText(/384,500.*AED/)).toHaveLength(2) // Appears in both Total Expenses and Cash Outflow
      })
    })

    it('should calculate and display net profit', async () => {
      render(<FinancialReportsPage />)

      await waitFor(() => {
        // Net profit: 801,600 - 384,500 = 417,100 AED
        expect(screen.getByText(/417,100.*AED/)).toBeInTheDocument()
      })
    })

    it('should calculate and display profit margin percentage', async () => {
      render(<FinancialReportsPage />)

      await waitFor(() => {
        // Profit margin: (417,100 / 801,600) * 100 = 52.1%
        expect(screen.getByText(/52\.1%/)).toBeInTheDocument()
      })
    })
  })

  describe('Cash Flow Analysis', () => {
    const mockCashFlowData = {
      invoices: {
        total: 50,
        totalValue: { AED: 200000, USD: 40000 },
        byStatus: {
          counts: { sent: 20, fully_paid: 25, overdue: 5 },
          totals: { sent: 80000, fully_paid: 100000, overdue: 20000 }
        }
      },
      expenses: {
        total: 150000,
        byCurrency: { AED: 100000, USD: 25000 },
        byCategory: { acquisition: 80000, operational: 40000, transportation: 30000 },
        count: 30
      },
      payments: {
        total: 40,
        totalValue: { AED: 180000, USD: 35000 }
      }
    }

    beforeEach(() => {
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockCashFlowData.invoices })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: mockCashFlowData.expenses })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: mockCashFlowData.payments })
    })

    it('should display cash flow metrics', async () => {
      render(<FinancialReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/cash inflow/i)).toBeInTheDocument()
        expect(screen.getByText(/cash outflow/i)).toBeInTheDocument()
        expect(screen.getByText(/outstanding receivables/i)).toBeInTheDocument()
        expect(screen.getByText(/collection efficiency/i)).toBeInTheDocument()
      })
    })

    it('should calculate cash inflow from payments', async () => {
      render(<FinancialReportsPage />)

      await waitFor(() => {
        // Cash inflow: 180000 + 35000*3.67 = 308,450 AED
        expect(screen.getByText(/308,450.*AED/)).toBeInTheDocument()
      })
    })

    it('should calculate outstanding receivables', async () => {
      render(<FinancialReportsPage />)

      await waitFor(() => {
        // Outstanding: sent + overdue = 80000 + 20000 = 100,000 AED
        expect(screen.getAllByText(/100,000.*AED/)).toHaveLength(2) // Appears in Outstanding Receivables and expense breakdown
      })
    })

    it('should calculate collection efficiency percentage', async () => {
      render(<FinancialReportsPage />)

      await waitFor(() => {
        // Collection efficiency: payments / total invoiced
        // 308,450 / (200000 + 40000*3.67) = 308,450 / 346,800 = 88.9%
        expect(screen.getByText(/88\.9%/)).toBeInTheDocument()
      })
    })
  })

  describe('Expense Breakdown', () => {
    beforeEach(() => {
      const mockExpenseData = {
        invoices: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } },
        expenses: {
          total: 300000,
          byCurrency: { AED: 200000, USD: 60000, CAD: 40000 },
          byCategory: {
            acquisition: 150000,
            transportation: 60000,
            operational: 50000,
            marketing: 25000,
            enhancement: 15000
          },
          count: 75
        },
        payments: { total: 0, totalValue: {} }
      }

      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockExpenseData.invoices })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: mockExpenseData.expenses })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: mockExpenseData.payments })
    })

    it('should display expense breakdown by category', async () => {
      render(<FinancialReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/expense breakdown by category/i)).toBeInTheDocument()
        expect(screen.getByText(/acquisition.*150,000/)).toBeInTheDocument()
        expect(screen.getByText(/transportation.*60,000/)).toBeInTheDocument()
        expect(screen.getByText(/operational.*50,000/)).toBeInTheDocument()
        expect(screen.getByText(/marketing.*25,000/)).toBeInTheDocument()
        expect(screen.getByText(/enhancement.*15,000/)).toBeInTheDocument()
      })
    })

    it('should display expense breakdown by currency', async () => {
      render(<FinancialReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/expense breakdown by currency/i)).toBeInTheDocument()
        expect(screen.getByText(/200,000.*AED/)).toBeInTheDocument()
        expect(screen.getByText(/60,000.*USD/)).toBeInTheDocument()
        expect(screen.getByText(/40,000.*CAD/)).toBeInTheDocument()
      })
    })
  })

  describe('Charts and Visualizations', () => {
    beforeEach(() => {
      mockInvoiceService.getStatistics.mockResolvedValue({ 
        success: true, 
        data: { total: 50, totalValue: { AED: 200000 }, byStatus: { counts: {}, totals: {} } }
      })
      mockExpenseService.getStatistics.mockResolvedValue({ 
        success: true, 
        data: { total: 100000, byCurrency: { AED: 100000 }, byCategory: {}, count: 25 }
      })
      mockPaymentService.getStatistics.mockResolvedValue({ 
        success: true, 
        data: { total: 40, totalValue: { AED: 180000 } }
      })
    })

    it('should render profit and loss chart section', async () => {
      render(<FinancialReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/profit & loss trends/i)).toBeInTheDocument()
        expect(screen.getAllByRole('tablist').length).toBeGreaterThan(0)
      })
    })

    it('should render cash flow chart', async () => {
      render(<FinancialReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/cash flow analysis/i)).toBeInTheDocument()
      })
    })

    it('should render expense distribution pie chart', async () => {
      render(<FinancialReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/expense distribution/i)).toBeInTheDocument()
      })
    })
  })

  describe('Date Filtering', () => {
    it('should filter data when date range is applied', async () => {
      const user = userEvent.setup()
      
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 20, totalValue: { AED: 100000 }, byStatus: { counts: {}, totals: {} } } })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 50000, byCurrency: { AED: 50000 }, byCategory: {}, count: 15 } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 15, totalValue: { AED: 90000 } } })

      render(<FinancialReportsPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
      })

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
        expect(mockExpenseService.getStatistics).toHaveBeenCalledWith({
          date_from: '2024-01-01',
          date_to: '2024-01-31'
        })
        expect(mockPaymentService.getStatistics).toHaveBeenCalledWith({
          date_from: '2024-01-01',
          date_to: '2024-01-31'
        })
      })
    })

    it('should reset filters when reset button is clicked', async () => {
      const user = userEvent.setup()
      
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 50, totalValue: {}, byStatus: { counts: {}, totals: {} } } })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 100000, byCurrency: {}, byCategory: {}, count: 25 } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 40, totalValue: {} } })

      render(<FinancialReportsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reset filters/i })).toBeInTheDocument()
      })

      const resetButton = screen.getByRole('button', { name: /reset filters/i })
      await user.click(resetButton)

      await waitFor(() => {
        expect(mockInvoiceService.getStatistics).toHaveBeenCalledWith({})
        expect(mockExpenseService.getStatistics).toHaveBeenCalledWith({})
        expect(mockPaymentService.getStatistics).toHaveBeenCalledWith({})
      })
    })
  })

  describe('Export Functionality', () => {
    it('should render export buttons', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byCurrency: {}, byCategory: {}, count: 0 } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {} } })

      render(<FinancialReportsPage />)

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
      mockExpenseService.getStatistics.mockReturnValue(neverResolves)
      mockPaymentService.getStatistics.mockReturnValue(neverResolves)

      render(<FinancialReportsPage />)

      expect(screen.getByText(/loading financial data/i)).toBeInTheDocument()
    })

    it('should show error state when data fetching fails', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({ success: false, error: 'Database error' })
      mockExpenseService.getStatistics.mockResolvedValue({ success: false, error: 'Database error' })
      mockPaymentService.getStatistics.mockResolvedValue({ success: false, error: 'Database error' })

      render(<FinancialReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/error loading financial data/i)).toBeInTheDocument()
        expect(screen.getByText(/database error/i)).toBeInTheDocument()
      })
    })

    it('should have retry functionality on error', async () => {
      const user = userEvent.setup()
      
      mockInvoiceService.getStatistics.mockResolvedValue({ success: false, error: 'Network error' })
      mockExpenseService.getStatistics.mockResolvedValue({ success: false, error: 'Network error' })
      mockPaymentService.getStatistics.mockResolvedValue({ success: false, error: 'Network error' })

      render(<FinancialReportsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /retry/i }))

      // Should call the services again
      await waitFor(() => {
        expect(mockInvoiceService.getStatistics).toHaveBeenCalledTimes(2)
        expect(mockExpenseService.getStatistics).toHaveBeenCalledTimes(2)
        expect(mockPaymentService.getStatistics).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Responsive Design', () => {
    it('should render mobile-friendly layout', async () => {
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byCurrency: {}, byCategory: {}, count: 0 } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {} } })

      render(<FinancialReportsPage />)

      await waitFor(() => {
        // Should have responsive grid classes in KPI cards section
        expect(screen.getByText(/total revenue/i)).toBeInTheDocument()
        expect(document.querySelector('.grid')).toBeInTheDocument()
      })
    })
  })

  describe('Financial Ratios and KPIs', () => {
    const mockKPIData = {
      invoices: {
        total: 80,
        totalValue: { AED: 500000, USD: 100000 },
        byStatus: {
          counts: { sent: 20, fully_paid: 50, partially_paid: 10 },
          totals: { sent: 120000, fully_paid: 350000, partially_paid: 50000 }
        }
      },
      expenses: {
        total: 300000,
        byCurrency: { AED: 200000, USD: 60000 },
        byCategory: { acquisition: 180000, operational: 120000 },
        count: 60
      },
      payments: {
        total: 65,
        totalValue: { AED: 400000, USD: 80000 }
      }
    }

    beforeEach(() => {
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockKPIData.invoices })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: mockKPIData.expenses })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: mockKPIData.payments })
    })

    it('should calculate and display average transaction value', async () => {
      render(<FinancialReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/average transaction value/i)).toBeInTheDocument()
        // Total revenue / number of invoices: 867,000 / 80 = 10,838 AED
        expect(screen.getByText(/10,838.*AED/)).toBeInTheDocument()
      })
    })

    it('should display expense ratio', async () => {
      render(<FinancialReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/expense ratio/i)).toBeInTheDocument()
        // Expenses / Revenue ratio: 420,200 / 867,000 = 48.5%
        expect(screen.getByText(/48\.5%/)).toBeInTheDocument()
      })
    })

    it('should display working capital position', async () => {
      render(<FinancialReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/working capital/i)).toBeInTheDocument()
        // Cash received - Outstanding expenses = 693,600 - 420,200 = 273,400 AED
        expect(screen.getByText(/273,400.*AED/)).toBeInTheDocument()
      })
    })
  })
})