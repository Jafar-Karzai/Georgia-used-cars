import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VehicleService } from '@/lib/services/vehicles'
import { ExpenseService } from '@/lib/services/expenses'
import { InvoiceService } from '@/lib/services/invoices'
import InventoryReportsPage from '../page'

// Mock the services
vi.mock('@/lib/services/vehicles')
vi.mock('@/lib/services/expenses')
vi.mock('@/lib/services/invoices')

const mockVehicleService = VehicleService as any
const mockExpenseService = ExpenseService as any
const mockInvoiceService = InvoiceService as any

describe('Inventory Reports Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Page Structure', () => {
    it('should render page title and description', async () => {
      // Mock empty data
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byStatus: [] } })
      mockVehicleService.getAll.mockResolvedValue({ success: true, data: [], pagination: { total: 0 } })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byCategory: {}, byCurrency: {}, count: 0 } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })

      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /inventory reports/i })).toBeInTheDocument()
        expect(screen.getByText(/comprehensive vehicle inventory analysis and management insights/i)).toBeInTheDocument()
      })
    })

    it('should render filter controls', async () => {
      // Mock empty data
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byStatus: [] } })
      mockVehicleService.getAll.mockResolvedValue({ success: true, data: [], pagination: { total: 0 } })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byCategory: {}, byCurrency: {}, count: 0 } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })

      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/status filter/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/make filter/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /apply filters/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /reset filters/i })).toBeInTheDocument()
      })
    })
  })

  describe('Inventory Overview Dashboard', () => {
    const mockInventoryData = {
      vehicles: {
        total: 150,
        byStatus: [
          { current_status: 'available', count: 60 },
          { current_status: 'ready_for_sale', count: 40 },
          { current_status: 'sold', count: 30 },
          { current_status: 'reserved', count: 15 },
          { current_status: 'in_transit', count: 5 }
        ]
      },
      vehicleList: [
        { 
          id: '1', 
          year: 2020, 
          make: 'Toyota', 
          model: 'Camry', 
          current_status: 'available',
          purchase_price: 50000,
          currency: 'AED',
          days_in_inventory: 45,
          lot_number: 'LOT-001',
          vin: '1234567890'
        },
        { 
          id: '2', 
          year: 2019, 
          make: 'Honda', 
          model: 'Accord', 
          current_status: 'sold',
          purchase_price: 45000,
          currency: 'AED',
          days_in_inventory: 60,
          lot_number: 'LOT-002',
          vin: '0987654321'
        }
      ],
      expenses: {
        total: 500000,
        byCategory: { acquisition: 400000, enhancement: 100000 },
        byCurrency: { AED: 350000, USD: 100000, CAD: 50000 },
        count: 75
      },
      invoices: {
        total: 85,
        totalValue: { AED: 800000, USD: 150000 },
        byStatus: { counts: { sent: 20, fully_paid: 50, partially_paid: 15 } }
      }
    }

    beforeEach(() => {
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: mockInventoryData.vehicles })
      mockVehicleService.getAll.mockResolvedValue({ success: true, data: mockInventoryData.vehicleList, pagination: { total: 150 } })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: mockInventoryData.expenses })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockInventoryData.invoices })
    })

    it('should display inventory overview cards', async () => {
      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/total vehicles/i)).toBeInTheDocument()
        expect(screen.getByText('150')).toBeInTheDocument()
        
        expect(screen.getByText(/available vehicles/i)).toBeInTheDocument()
        expect(screen.getByText('100')).toBeInTheDocument()
        
        expect(screen.getByText(/vehicles sold/i)).toBeInTheDocument()
        expect(screen.getByText('30')).toBeInTheDocument()
        
        expect(screen.getByText(/average days in inventory/i)).toBeInTheDocument()
      })
    })

    it('should display vehicle status breakdown', async () => {
      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/vehicle status distribution/i)).toBeInTheDocument()
        expect(screen.getByText(/available.*60/i)).toBeInTheDocument()
        expect(screen.getByText(/ready for sale.*40/i)).toBeInTheDocument()
        expect(screen.getByText(/sold.*30/i)).toBeInTheDocument()
        expect(screen.getByText(/reserved.*15/i)).toBeInTheDocument()
        expect(screen.getByText(/in transit.*5/i)).toBeInTheDocument()
      })
    })

    it('should calculate and display inventory turnover rate', async () => {
      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/inventory turnover/i)).toBeInTheDocument()
        // 30 sold / 150 total = 20%
        expect(screen.getAllByText(/20%/)).toHaveLength(2) // Also shows in inventory velocity
      })
    })

    it('should calculate average inventory value', async () => {
      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/average vehicle value/i)).toBeInTheDocument()
        // Total expenses / vehicle count: 500,000 / 150 = 3,333 AED per vehicle
        expect(screen.getByText(/3,333.*AED/)).toBeInTheDocument()
      })
    })
  })

  describe('Vehicle Listings and Details', () => {
    const mockVehicleDetails = [
      { 
        id: '1', 
        year: 2021, 
        make: 'BMW', 
        model: 'X5', 
        current_status: 'available',
        purchase_price: 120000,
        currency: 'AED',
        days_in_inventory: 30,
        lot_number: 'LOT-BMW-001',
        vin: 'BMW123456789',
        engine: '3.0L',
        mileage: 45000,
        color: 'Black'
      },
      { 
        id: '2', 
        year: 2020, 
        make: 'Mercedes', 
        model: 'C-Class', 
        current_status: 'ready_for_sale',
        purchase_price: 95000,
        currency: 'AED',
        days_in_inventory: 60,
        lot_number: 'LOT-MB-002',
        vin: 'MB0987654321',
        engine: '2.0L',
        mileage: 35000,
        color: 'White'
      }
    ]

    beforeEach(() => {
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 50, byStatus: [] } })
      mockVehicleService.getAll.mockResolvedValue({ success: true, data: mockVehicleDetails, pagination: { total: 50 } })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byCategory: {}, byCurrency: {}, count: 0 } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })
    })

    it('should display vehicle inventory table', async () => {
      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/vehicle inventory details/i)).toBeInTheDocument()
        expect(screen.getByText(/LOT-BMW-001/)).toBeInTheDocument()
        expect(screen.getByText(/BMW X5/)).toBeInTheDocument()
        expect(screen.getByText(/LOT-MB-002/)).toBeInTheDocument()
        expect(screen.getByText(/Mercedes C-Class/)).toBeInTheDocument()
      })
    })

    it('should show vehicle details in table format', async () => {
      render(<InventoryReportsPage />)

      await waitFor(() => {
        // Check table headers
        expect(screen.getByText(/lot number/i)).toBeInTheDocument()
        expect(screen.getAllByText(/vehicle/i)).toHaveLength(9) // Multiple "vehicle" in UI
        expect(screen.getAllByText(/status/i)).toHaveLength(6) // Multiple "status" in UI
        expect(screen.getAllByText(/days in inventory/i)).toHaveLength(2) // Multiple "days in inventory" in UI
        expect(screen.getAllByText(/value/i)).toHaveLength(3) // Multiple "value" in UI

        // Check specific vehicle data
        expect(screen.getByText('30')).toBeInTheDocument() // Days in inventory for BMW
        expect(screen.getByText('60')).toBeInTheDocument() // Days in inventory for Mercedes
        expect(screen.getByText(/120,000.*AED/)).toBeInTheDocument()
        expect(screen.getByText(/95,000.*AED/)).toBeInTheDocument()
      })
    })

    it('should display vehicle status badges', async () => {
      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByText('Available')).toBeInTheDocument()
        expect(screen.getByText('Ready For Sale')).toBeInTheDocument()
      })
    })
  })

  describe('Performance Analytics', () => {
    const mockPerformanceData = {
      vehicles: {
        total: 200,
        byStatus: [
          { current_status: 'sold', count: 80 },
          { current_status: 'available', count: 120 }
        ]
      },
      vehicleList: [
        { days_in_inventory: 30, current_status: 'sold', purchase_price: 50000, currency: 'AED' },
        { days_in_inventory: 45, current_status: 'sold', purchase_price: 60000, currency: 'AED' },
        { days_in_inventory: 90, current_status: 'available', purchase_price: 70000, currency: 'AED' }
      ],
      expenses: { total: 600000, byCategory: {}, byCurrency: { AED: 600000 }, count: 100 },
      invoices: { total: 80, totalValue: { AED: 800000 }, byStatus: { counts: {}, totals: {} } }
    }

    beforeEach(() => {
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: mockPerformanceData.vehicles })
      mockVehicleService.getAll.mockResolvedValue({ success: true, data: mockPerformanceData.vehicleList, pagination: { total: 200 } })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: mockPerformanceData.expenses })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockPerformanceData.invoices })
    })

    it('should calculate average time to sell', async () => {
      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/average time to sell/i)).toBeInTheDocument()
        // Average of sold vehicles: (30 + 45) / 2 = 37.5 days
        expect(screen.getByText(/38.*days/)).toBeInTheDocument()
      })
    })

    it('should show slow-moving inventory count', async () => {
      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/slow-moving inventory/i)).toBeInTheDocument()
        // Vehicles with 60+ days in inventory
        expect(screen.getByText(/1.*vehicle/)).toBeInTheDocument()
      })
    })

    it('should display inventory aging analysis', async () => {
      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/aging analysis/i)).toBeInTheDocument()
        expect(screen.getByText(/0-30 days/)).toBeInTheDocument()
        expect(screen.getByText(/31-60 days/)).toBeInTheDocument()
        expect(screen.getByText(/60\+ days/)).toBeInTheDocument()
      })
    })

    it('should show total inventory value', async () => {
      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/total inventory value/i)).toBeInTheDocument()
        expect(screen.getByText(/600,000.*AED/)).toBeInTheDocument()
      })
    })
  })

  describe('Charts and Visualizations', () => {
    beforeEach(() => {
      mockVehicleService.getStatistics.mockResolvedValue({ 
        success: true, 
        data: { total: 100, byStatus: [{ current_status: 'available', count: 60 }] }
      })
      mockVehicleService.getAll.mockResolvedValue({ success: true, data: [], pagination: { total: 100 } })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 300000, byCategory: {}, byCurrency: {}, count: 50 } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 40, totalValue: {}, byStatus: { counts: {}, totals: {} } } })
    })

    it('should render inventory trends chart section', async () => {
      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getAllByText(/inventory trends/i)).toHaveLength(2) // Multiple "inventory trends" in UI
        expect(screen.getAllByRole('tablist').length).toBeGreaterThan(0)
      })
    })

    it('should render status distribution pie chart', async () => {
      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getAllByText(/status distribution/i)).toHaveLength(2) // Multiple "status distribution" in UI
      })
    })

    it('should render aging analysis chart', async () => {
      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/aging analysis/i)).toBeInTheDocument()
      })
    })
  })

  describe('Filtering and Search', () => {
    it('should filter by vehicle status', async () => {
      const user = userEvent.setup()
      
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 25, byStatus: [] } })
      mockVehicleService.getAll.mockResolvedValue({ success: true, data: [], pagination: { total: 25 } })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byCategory: {}, byCurrency: {}, count: 0 } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })

      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/status filter/i)).toBeInTheDocument()
      })

      const statusFilter = screen.getByLabelText(/status filter/i)
      const applyButton = screen.getByRole('button', { name: /apply filters/i })

      // Click to open the dropdown first, then select available
      await user.click(statusFilter)
      const availableOption = await screen.findByText('Available')
      await user.click(availableOption)
      await user.click(applyButton)

      await waitFor(() => {
        expect(mockVehicleService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            current_status: 'available'
          }),
          expect.any(Number),
          expect.any(Number)
        )
      })
    })

    it('should filter by vehicle make', async () => {
      const user = userEvent.setup()
      
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 15, byStatus: [] } })
      mockVehicleService.getAll.mockResolvedValue({ success: true, data: [], pagination: { total: 15 } })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byCategory: {}, byCurrency: {}, count: 0 } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })

      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/make filter/i)).toBeInTheDocument()
      })

      const makeFilter = screen.getByLabelText(/make filter/i)
      const applyButton = screen.getByRole('button', { name: /apply filters/i })

      await user.type(makeFilter, 'Toyota')
      await user.click(applyButton)

      await waitFor(() => {
        expect(mockVehicleService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            make: 'Toyota'
          }),
          expect.any(Number),
          expect.any(Number)
        )
      })
    })

    it('should reset filters when reset button is clicked', async () => {
      const user = userEvent.setup()
      
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 100, byStatus: [] } })
      mockVehicleService.getAll.mockResolvedValue({ success: true, data: [], pagination: { total: 100 } })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byCategory: {}, byCurrency: {}, count: 0 } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })

      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reset filters/i })).toBeInTheDocument()
      })

      const resetButton = screen.getByRole('button', { name: /reset filters/i })
      await user.click(resetButton)

      await waitFor(() => {
        expect(mockVehicleService.getAll).toHaveBeenCalledWith({}, 1, 20)
      })
    })
  })

  describe('Export Functionality', () => {
    it('should render export buttons', async () => {
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byStatus: [] } })
      mockVehicleService.getAll.mockResolvedValue({ success: true, data: [], pagination: { total: 0 } })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byCategory: {}, byCurrency: {}, count: 0 } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })

      render(<InventoryReportsPage />)

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
      mockVehicleService.getStatistics.mockReturnValue(neverResolves)
      mockVehicleService.getAll.mockReturnValue(neverResolves)
      mockExpenseService.getStatistics.mockReturnValue(neverResolves)
      mockInvoiceService.getStatistics.mockReturnValue(neverResolves)

      render(<InventoryReportsPage />)

      expect(screen.getByText(/loading inventory data/i)).toBeInTheDocument()
    })

    it('should show error state when data fetching fails', async () => {
      mockVehicleService.getStatistics.mockResolvedValue({ success: false, error: 'Database error' })
      mockVehicleService.getAll.mockResolvedValue({ success: false, error: 'Database error' })
      mockExpenseService.getStatistics.mockResolvedValue({ success: false, error: 'Database error' })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: false, error: 'Database error' })

      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/error loading inventory data/i)).toBeInTheDocument()
        expect(screen.getByText(/database error/i)).toBeInTheDocument()
      })
    })

    it('should have retry functionality on error', async () => {
      const user = userEvent.setup()
      
      mockVehicleService.getStatistics.mockResolvedValue({ success: false, error: 'Network error' })
      mockVehicleService.getAll.mockResolvedValue({ success: false, error: 'Network error' })
      mockExpenseService.getStatistics.mockResolvedValue({ success: false, error: 'Network error' })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: false, error: 'Network error' })

      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /retry/i }))

      // Should call the services again
      await waitFor(() => {
        expect(mockVehicleService.getStatistics).toHaveBeenCalledTimes(2)
        expect(mockVehicleService.getAll).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Responsive Design', () => {
    it('should render mobile-friendly layout', async () => {
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byStatus: [] } })
      mockVehicleService.getAll.mockResolvedValue({ success: true, data: [], pagination: { total: 0 } })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, byCategory: {}, byCurrency: {}, count: 0 } })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: { total: 0, totalValue: {}, byStatus: { counts: {}, totals: {} } } })

      render(<InventoryReportsPage />)

      await waitFor(() => {
        // Should have responsive grid classes in dashboard section
        expect(screen.getByText(/total vehicles/i)).toBeInTheDocument()
        expect(document.querySelector('.grid')).toBeInTheDocument()
      })
    })
  })

  describe('Advanced Analytics', () => {
    const mockAdvancedData = {
      vehicles: {
        total: 300,
        byStatus: [
          { current_status: 'available', count: 150 },
          { current_status: 'sold', count: 100 },
          { current_status: 'reserved', count: 50 }
        ]
      },
      vehicleList: [
        { days_in_inventory: 20, current_status: 'sold', purchase_price: 80000, currency: 'AED' },
        { days_in_inventory: 35, current_status: 'sold', purchase_price: 90000, currency: 'AED' },
        { days_in_inventory: 120, current_status: 'available', purchase_price: 100000, currency: 'AED' }
      ],
      expenses: { total: 2000000, byCategory: {}, byCurrency: { AED: 2000000 }, count: 200 },
      invoices: { total: 100, totalValue: { AED: 2500000 }, byStatus: { counts: {}, totals: {} } }
    }

    beforeEach(() => {
      mockVehicleService.getStatistics.mockResolvedValue({ success: true, data: mockAdvancedData.vehicles })
      mockVehicleService.getAll.mockResolvedValue({ success: true, data: mockAdvancedData.vehicleList, pagination: { total: 300 } })
      mockExpenseService.getStatistics.mockResolvedValue({ success: true, data: mockAdvancedData.expenses })
      mockInvoiceService.getStatistics.mockResolvedValue({ success: true, data: mockAdvancedData.invoices })
    })

    it('should calculate inventory ROI', async () => {
      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/inventory roi/i)).toBeInTheDocument()
        // ROI = (Revenue - Cost) / Cost * 100 = (2,500,000 - 2,000,000) / 2,000,000 * 100 = 25%
        expect(screen.getByText(/25%/)).toBeInTheDocument()
      })
    })

    it('should show inventory velocity metrics', async () => {
      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/inventory velocity/i)).toBeInTheDocument()
        // Velocity = Sold vehicles / Total vehicles = 100 / 300 = 33.3%
        expect(screen.getAllByText(/33\.3%/)).toHaveLength(2) // Multiple "33.3%" in UI
      })
    })

    it('should display carrying cost analysis', async () => {
      render(<InventoryReportsPage />)

      await waitFor(() => {
        expect(screen.getByText(/carrying cost per day/i)).toBeInTheDocument()
        // Basic carrying cost calculation would be implemented
        expect(screen.getByText(/AED/)).toBeInTheDocument()
      })
    })
  })
})