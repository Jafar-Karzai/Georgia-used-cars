import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomerService } from '@/lib/services/customers'
import { InvoiceService } from '@/lib/services/invoices'
import { PaymentService } from '@/lib/services/payments'
import CustomersReportsPage from '../page'

// Mock the services
vi.mock('@/lib/services/customers')
vi.mock('@/lib/services/invoices')
vi.mock('@/lib/services/payments')

const mockCustomerService = CustomerService as any
const mockInvoiceService = InvoiceService as any
const mockPaymentService = PaymentService as any

describe('Customers Reports Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Page Structure', () => {
    it('should render page title and description', async () => {
      // Mock empty data
      mockCustomerService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byType: [], byRegion: [], activeCount: 0 } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {} } })

      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /customers reports/i })).toBeInTheDocument()
        expect(screen.getByText(/comprehensive customer analytics and relationship insights/i)).toBeInTheDocument()
      })
    })

    it('should render filter controls', async () => {
      // Mock empty data
      mockCustomerService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byType: [], byRegion: [], activeCount: 0 } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {} } })

      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/customer type filter/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/region filter/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /apply filters/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /reset filters/i })).toBeInTheDocument()
      })
    })
  })

  describe('Customer Overview Dashboard', () => {
    const mockCustomerData = {
      customers: {
        total: 250,
        byType: [
          { customer_type: 'individual', count: 150 },
          { customer_type: 'business', count: 80 },
          { customer_type: 'dealer', count: 20 }
        ],
        byRegion: [
          { region: 'Dubai', count: 120 },
          { region: 'Abu Dhabi', count: 80 },
          { region: 'Sharjah', count: 30 },
          { region: 'Other', count: 20 }
        ],
        activeCount: 200
      },
      invoices: {
        total: 300,
        totalValue: { AED: 1500000, USD: 200000, CAD: 100000 },
        byStatus: {
          counts: { sent: 80, fully_paid: 180, partially_paid: 30, overdue: 10 },
          totals: { sent: 400000, fully_paid: 1200000, partially_paid: 150000, overdue: 50000 }
        }
      },
      payments: {
        total: 400,
        totalValue: { AED: 1400000, USD: 180000, CAD: 90000 }
      }
    }

    beforeEach(() => {
      mockCustomerService.getStatistics.mockResolvedValue({ success: true, data: mockCustomerData.customers })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockCustomerData.invoices })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: mockCustomerData.payments })
    })

    it('should display customer overview cards', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/total customers/i)).toBeInTheDocument()
        expect(screen.getByText('250')).toBeInTheDocument()
        
        expect(screen.getByText(/active customers/i)).toBeInTheDocument()
        expect(screen.getAllByText('200')).toHaveLength(2) // Active customers and geographic data
        
        expect(screen.getByText(/individual customers/i)).toBeInTheDocument()
        expect(screen.getAllByText('150')).toHaveLength(2) // Individual customers and geographic data
        
        expect(screen.getByText(/business customers/i)).toBeInTheDocument()
        expect(screen.getAllByText('80')).toHaveLength(2) // Business customers and geographic data
      })
    })

    it('should display customer distribution by type', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/customer type distribution/i)).toBeInTheDocument()
        expect(screen.getByText(/individual.*150/i)).toBeInTheDocument()
        expect(screen.getByText(/business.*80/i)).toBeInTheDocument()
        expect(screen.getByText(/dealer.*20/i)).toBeInTheDocument()
      })
    })

    it('should display regional distribution', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/regional distribution/i)).toBeInTheDocument()
        expect(screen.getByText(/dubai.*120/i)).toBeInTheDocument()
        expect(screen.getByText(/abu dhabi.*80/i)).toBeInTheDocument()
        expect(screen.getByText(/sharjah.*30/i)).toBeInTheDocument()
        expect(screen.getByText(/other.*20/i)).toBeInTheDocument()
      })
    })

    it('should calculate customer activity rate', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/customer activity rate/i)).toBeInTheDocument()
        // 200 active / 250 total = 80%
        expect(screen.getByText(/80%/)).toBeInTheDocument()
      })
    })
  })

  describe('Revenue Analytics', () => {
    const mockRevenueData = {
      customers: {
        total: 100,
        byType: [{ customer_type: 'individual', count: 60 }],
        byRegion: [],
        activeCount: 85
      },
      invoices: {
        total: 200,
        totalValue: { AED: 800000, USD: 150000 },
        byStatus: {
          counts: { fully_paid: 150, sent: 30, overdue: 20 },
          totals: { fully_paid: 600000, sent: 200000, overdue: 100000 }
        }
      },
      payments: {
        total: 300,
        totalValue: { AED: 750000, USD: 140000 }
      }
    }

    beforeEach(() => {
      mockCustomerService.getStatistics.mockResolvedValue({ success: true, data: mockRevenueData.customers })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockRevenueData.invoices })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: mockRevenueData.payments })
    })

    it('should calculate average revenue per customer', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/average revenue per customer/i)).toBeInTheDocument()
        // Total revenue: 800000 + 150000*3.67 = 1,350,500 AED / 100 customers = 13,505 AED
        expect(screen.getByText(/13,505.*AED/)).toBeInTheDocument()
      })
    })

    it('should display customer lifetime value', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/average customer lifetime value/i)).toBeInTheDocument()
        // Based on payment history and projected value
        expect(screen.getByText(/AED/)).toBeInTheDocument()
      })
    })

    it('should calculate payment collection rate', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/payment collection rate/i)).toBeInTheDocument()
        // Payments received / Total invoiced: 1,263,800 / 1,350,500 = 93.6%
        expect(screen.getByText(/93\\.6%/)).toBeInTheDocument()
      })
    })

    it('should show outstanding receivables by customer', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/outstanding receivables/i)).toBeInTheDocument()
        // sent + overdue totals = 200000 + 100000 = 300,000 AED
        expect(screen.getByText(/300,000.*AED/)).toBeInTheDocument()
      })
    })
  })

  describe('Customer Engagement Metrics', () => {
    const mockEngagementData = {
      customers: {
        total: 150,
        byType: [
          { customer_type: 'individual', count: 90 },
          { customer_type: 'business', count: 60 }
        ],
        byRegion: [],
        activeCount: 120
      },
      invoices: {
        total: 250,
        totalValue: { AED: 1000000 },
        byStatus: { counts: {}, totals: {} }
      },
      payments: {
        total: 200,
        totalValue: { AED: 900000 }
      }
    }

    beforeEach(() => {
      mockCustomerService.getStatistics.mockResolvedValue({ success: true, data: mockEngagementData.customers })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockEngagementData.invoices })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: mockEngagementData.payments })
    })

    it('should calculate repeat customer rate', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/repeat customer rate/i)).toBeInTheDocument()
        // Based on customers with multiple transactions
        expect(screen.getByText(/%/)).toBeInTheDocument()
      })
    })

    it('should display average transactions per customer', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/average transactions per customer/i)).toBeInTheDocument()
        // 250 invoices / 150 customers = 1.67 transactions
        expect(screen.getByText(/1\\.67/)).toBeInTheDocument()
      })
    })

    it('should show customer acquisition trends', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/customer acquisition trends/i)).toBeInTheDocument()
      })
    })

    it('should display customer retention metrics', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/customer retention rate/i)).toBeInTheDocument()
        expect(screen.getByText(/%/)).toBeInTheDocument()
      })
    })
  })

  describe('Top Customers Analysis', () => {
    const mockTopCustomersData = {
      customers: {
        total: 50,
        byType: [],
        byRegion: [],
        activeCount: 45,
        topCustomers: [
          { 
            id: '1', 
            name: 'Ahmed Al-Rashid',
            customer_type: 'individual',
            region: 'Dubai',
            total_spent: 250000,
            currency: 'AED',
            transaction_count: 5,
            last_purchase: '2024-01-15'
          },
          { 
            id: '2', 
            name: 'Emirates Motors LLC',
            customer_type: 'business',
            region: 'Abu Dhabi',
            total_spent: 500000,
            currency: 'AED',
            transaction_count: 8,
            last_purchase: '2024-01-20'
          }
        ]
      },
      invoices: {
        total: 100,
        totalValue: { AED: 2000000 },
        byStatus: { counts: {}, totals: {} }
      },
      payments: {
        total: 80,
        totalValue: { AED: 1800000 }
      }
    }

    beforeEach(() => {
      mockCustomerService.getStatistics.mockResolvedValue({ success: true, data: mockTopCustomersData.customers })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockTopCustomersData.invoices })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: mockTopCustomersData.payments })
    })

    it('should display top customers table', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/top customers by revenue/i)).toBeInTheDocument()
        expect(screen.getByText(/ahmed al-rashid/i)).toBeInTheDocument()
        expect(screen.getByText(/emirates motors llc/i)).toBeInTheDocument()
      })
    })

    it('should show customer spending details', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/250,000.*AED/)).toBeInTheDocument()
        expect(screen.getByText(/500,000.*AED/)).toBeInTheDocument()
      })
    })

    it('should display transaction counts for top customers', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        // Check transaction counts in table
        expect(screen.getByText('5')).toBeInTheDocument() // Ahmed's transactions
        expect(screen.getByText('8')).toBeInTheDocument() // Emirates Motors transactions
      })
    })

    it('should show customer types and regions', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/individual/i)).toBeInTheDocument()
        expect(screen.getByText(/business/i)).toBeInTheDocument()
        expect(screen.getByText(/dubai/i)).toBeInTheDocument()
        expect(screen.getByText(/abu dhabi/i)).toBeInTheDocument()
      })
    })
  })

  describe('Charts and Visualizations', () => {
    beforeEach(() => {
      mockCustomerService.getStatistics.mockResolvedValue({ 
        success: true, 
        data: { total: 100, byType: [], byRegion: [], activeCount: 80 }
      })
      mockInvoiceService.getStatistics.mockResolvedValue({ 
        success: true, 
        data: { total: 200, totalValue: { AED: 1000000 }, byStatus: { counts: {}, totals: {} } }
      })
      mockPaymentService.getStatistics.mockResolvedValue({ 
        success: true, 
        data: { total: 150, totalValue: { AED: 900000 } }
      })
    })

    it('should render customer growth chart section', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/customer growth trends/i)).toBeInTheDocument()
        expect(screen.getAllByRole('tablist').length).toBeGreaterThan(0)
      })
    })

    it('should render customer type pie chart', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getAllByText(/customer type distribution/i)).toHaveLength(2) // Multiple "customer type distribution" in UI
      })
    })

    it('should render regional distribution chart', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getAllByText(/regional distribution/i)).toHaveLength(2) // Multiple "regional distribution" in UI
      })
    })

    it('should render revenue by customer segment chart', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/revenue by customer segment/i)).toBeInTheDocument()
      })
    })
  })

  describe('Filtering and Search', () => {
    it('should filter by customer type', async () => {
      const user = userEvent.setup()
      
      mockCustomerService.getStatistics.mockResolvedValue({ success: true, data: { total: 50, byType: [], byRegion: [], activeCount: 40 } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {} } })

      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/customer type filter/i)).toBeInTheDocument()
      })

      const typeFilter = screen.getByLabelText(/customer type filter/i)
      const applyButton = screen.getByRole('button', { name: /apply filters/i })

      // Click to open the dropdown first, then select business
      await user.click(typeFilter)
      const businessOption = await screen.findByText('Business')
      await user.click(businessOption)
      await user.click(applyButton)

      await waitFor(() => {
        expect(mockCustomerService.getStatistics).toHaveBeenCalledWith(
          expect.objectContaining({
            customer_type: 'business'
          })
        )
      })
    })

    it('should filter by region', async () => {
      const user = userEvent.setup()
      
      mockCustomerService.getStatistics.mockResolvedValue({ success: true, data: { total: 30, byType: [], byRegion: [], activeCount: 25 } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {} } })

      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/region filter/i)).toBeInTheDocument()
      })

      const regionFilter = screen.getByLabelText(/region filter/i)
      const applyButton = screen.getByRole('button', { name: /apply filters/i })

      await user.click(regionFilter)
      const dubaiOption = await screen.findByText('Dubai')
      await user.click(dubaiOption)
      await user.click(applyButton)

      await waitFor(() => {
        expect(mockCustomerService.getStatistics).toHaveBeenCalledWith(
          expect.objectContaining({
            region: 'Dubai'
          })
        )
      })
    })

    it('should reset filters when reset button is clicked', async () => {
      const user = userEvent.setup()
      
      mockCustomerService.getStatistics.mockResolvedValue({ success: true, data: { total: 100, byType: [], byRegion: [], activeCount: 80 } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {} } })

      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reset filters/i })).toBeInTheDocument()
      })

      const resetButton = screen.getByRole('button', { name: /reset filters/i })
      await user.click(resetButton)

      await waitFor(() => {
        expect(mockCustomerService.getStatistics).toHaveBeenCalledWith({})
      })
    })
  })

  describe('Export Functionality', () => {
    it('should render export buttons', async () => {
      mockCustomerService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byType: [], byRegion: [], activeCount: 0 } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {} } })

      render(<CustomersReportsPage />)

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
      mockCustomerService.getStatistics.mockReturnValue(neverResolves)
      mockInvoiceService.getStatistics.mockReturnValue(neverResolves)
      mockPaymentService.getStatistics.mockReturnValue(neverResolves)

      render(<CustomersReportsPage />)

      expect(screen.getByText(/loading customer data/i)).toBeInTheDocument()
    })

    it('should show error state when data fetching fails', async () => {
      mockCustomerService.getStatistics.mockResolvedValue({ success: false, error: 'Database error' })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: false, error: 'Database error' })
      mockPaymentService.getStatistics.mockResolvedValue({ success: false, error: 'Database error' })

      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/error loading customer data/i)).toBeInTheDocument()
        expect(screen.getByText(/database error/i)).toBeInTheDocument()
      })
    })

    it('should have retry functionality on error', async () => {
      const user = userEvent.setup()
      
      mockCustomerService.getStatistics.mockResolvedValue({ success: false, error: 'Network error' })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: false, error: 'Network error' })
      mockPaymentService.getStatistics.mockResolvedValue({ success: false, error: 'Network error' })

      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /retry/i }))

      // Should call the services again
      await waitFor(() => {
        expect(mockCustomerService.getStatistics).toHaveBeenCalledTimes(2)
        expect(mockInvoiceService.getStatistics).toHaveBeenCalledTimes(2)
        expect(mockPaymentService.getStatistics).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Responsive Design', () => {
    it('should render mobile-friendly layout', async () => {
      mockCustomerService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byType: [], byRegion: [], activeCount: 0 } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {} } })

      render(<CustomersReportsPage />)

      await waitFor(() => {
        // Should have responsive grid classes in dashboard section
        expect(screen.getByText(/total customers/i)).toBeInTheDocument()
        expect(document.querySelector('.grid')).toBeInTheDocument()
      })
    })
  })

  describe('Advanced Customer Analytics', () => {
    const mockAdvancedData = {
      customers: {
        total: 300,
        byType: [
          { customer_type: 'individual', count: 180 },
          { customer_type: 'business', count: 100 },
          { customer_type: 'dealer', count: 20 }
        ],
        byRegion: [
          { region: 'Dubai', count: 150 },
          { region: 'Abu Dhabi', count: 100 },
          { region: 'Sharjah', count: 50 }
        ],
        activeCount: 240
      },
      invoices: {
        total: 500,
        totalValue: { AED: 2500000, USD: 400000 },
        byStatus: { counts: {}, totals: {} }
      },
      payments: {
        total: 450,
        totalValue: { AED: 2300000, USD: 380000 }
      }
    }

    beforeEach(() => {
      mockCustomerService.getStatistics.mockResolvedValue({ success: true, data: mockAdvancedData.customers })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockAdvancedData.invoices })
      mockPaymentService.getStatistics.mockResolvedValue({ success: true, data: mockAdvancedData.payments })
    })

    it('should calculate customer acquisition cost', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/customer acquisition cost/i)).toBeInTheDocument()
        expect(screen.getByText(/AED/)).toBeInTheDocument()
      })
    })

    it('should display customer churn analysis', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/customer churn rate/i)).toBeInTheDocument()
        // (300 - 240) / 300 = 20% churn rate
        expect(screen.getByText(/20%/)).toBeInTheDocument()
      })
    })

    it('should show geographic performance metrics', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/geographic performance/i)).toBeInTheDocument()
        expect(screen.getByText(/dubai.*150/i)).toBeInTheDocument()
        expect(screen.getByText(/abu dhabi.*100/i)).toBeInTheDocument()
      })
    })

    it('should calculate customer segment profitability', async () => {
      render(<CustomersReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/segment profitability/i)).toBeInTheDocument()
        // Revenue per customer type analysis
        expect(screen.getByText(/individual/i)).toBeInTheDocument()
        expect(screen.getByText(/business/i)).toBeInTheDocument()
      })
    })
  })
})