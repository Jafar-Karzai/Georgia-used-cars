import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PaymentsPage from '../page'
import { PaymentService } from '@/lib/services/payments'
import type { PaymentWithDetails } from '@/lib/services/payments'

// Mock services
vi.mock('@/lib/services/payments')

// Mock auth context
vi.mock('@/lib/auth/context', () => ({
  useAuth: vi.fn(() => ({
    hasPermission: vi.fn(() => true),
    user: { id: 'user-123', role: 'admin' }
  }))
}))

// Mock payment form component
vi.mock('@/components/payments/payment-form', () => ({
  PaymentForm: ({ isOpen, onClose, onSuccess }: any) => 
    isOpen ? (
      <div data-testid="payment-form">
        <h2>Payment Form</h2>
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save Payment</button>
      </div>
    ) : null
}))

const mockPaymentService = PaymentService as any

const mockPayments: PaymentWithDetails[] = [
  {
    id: 'payment-1',
    amount: 5000,
    currency: 'AED',
    payment_method: 'bank_transfer',
    payment_date: '2024-01-15T00:00:00Z',
    transaction_id: 'TXN123456',
    notes: 'Initial payment for vehicle',
    invoice_id: 'invoice-1',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    invoices: {
      id: 'invoice-1',
      invoice_number: 'INV-001',
      customers: {
        id: 'customer-1',
        full_name: 'John Doe'
      },
      vehicles: {
        id: 'vehicle-1',
        year: 2021,
        make: 'Honda',
        model: 'Civic'
      }
    }
  },
  {
    id: 'payment-2',
    amount: 15000,
    currency: 'USD',
    payment_method: 'cash',
    payment_date: '2024-01-16T00:00:00Z',
    transaction_id: null,
    notes: null,
    invoice_id: 'invoice-2',
    created_at: '2024-01-16T00:00:00Z',
    updated_at: '2024-01-16T00:00:00Z',
    invoices: {
      id: 'invoice-2',
      invoice_number: 'INV-002',
      customers: {
        id: 'customer-2',
        full_name: 'Jane Smith'
      },
      vehicles: {
        id: 'vehicle-2',
        year: 2020,
        make: 'Toyota',
        model: 'Camry'
      }
    }
  }
]

const mockStatistics = {
  total: 125,
  totalValue: {
    AED: 75000,
    USD: 25000,
    CAD: 5000
  },
  byMethod: {
    counts: {
      bank_transfer: 45,
      cash: 35,
      check: 25,
      credit_card: 15,
      other: 5
    },
    values: {
      bank_transfer: { AED: 50000, USD: 15000 },
      cash: { AED: 20000, USD: 8000 }
    }
  }
}

describe('PaymentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock responses
    mockPaymentService.getAll.mockResolvedValue({
      success: true,
      data: mockPayments,
      pagination: { page: 1, limit: 20, total: 2, pages: 1 }
    })
    
    mockPaymentService.getStatistics.mockResolvedValue({
      success: true,
      data: mockStatistics
    })
  })

  describe('Page Structure and Loading', () => {
    it('should render page title and description', async () => {
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Payment Management')).toBeInTheDocument()
        expect(screen.getByText('Track and manage all customer payments')).toBeInTheDocument()
      })
    })

    it('should show loading skeleton when initially loading', () => {
      // Mock delayed response
      mockPaymentService.getAll.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: mockPayments,
          pagination: { page: 1, limit: 20, total: 2, pages: 1 }
        }), 100))
      )
      
      render(<PaymentsPage />)
      
      // Should show loading skeleton
      expect(screen.getByText('Payment Management')).toBeInTheDocument()
      expect(screen.getByRole('generic')).toBeInTheDocument() // Loading skeleton visible
    })

    it('should display Record Payment button for users with manage_finances permission', async () => {
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Record Payment')).toBeInTheDocument()
      })
    })

    it('should not display Record Payment button for users without permission', async () => {
      // Mock user without permission
      const mockUseAuth = vi.mocked(await import('@/lib/auth/context')).useAuth as any
      mockUseAuth.mockReturnValue({
        hasPermission: vi.fn(() => false),
        user: { id: 'user-123', role: 'viewer' }
      })
      
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.queryByText('Record Payment')).not.toBeInTheDocument()
      })
    })
  })

  describe('Statistics Cards', () => {
    it('should display statistics cards when data is available', async () => {
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Total Payments')).toBeInTheDocument()
        expect(screen.getByText('125')).toBeInTheDocument()
        expect(screen.getByText('Total Value (AED)')).toBeInTheDocument()
        expect(screen.getByText('AED 75,000.00')).toBeInTheDocument()
        expect(screen.getByText('Bank Transfers')).toBeInTheDocument()
        expect(screen.getByText('45')).toBeInTheDocument()
      })
    })

    it('should format currency values correctly in statistics', async () => {
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('AED 75,000.00')).toBeInTheDocument()
      })
    })

    it('should not display statistics cards when data is not available', async () => {
      mockPaymentService.getStatistics.mockResolvedValue({
        success: true,
        data: null
      })
      
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.queryByText('Total Payments')).not.toBeInTheDocument()
      })
    })
  })

  describe('Search and Filtering', () => {
    it('should render search input and filter controls', async () => {
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by transaction ID or notes...')).toBeInTheDocument()
        expect(screen.getByText('Search')).toBeInTheDocument()
        expect(screen.getAllByRole('combobox')).toHaveLength(2) // Method and currency filters
      })
    })

    it('should perform search when search button is clicked', async () => {
      const user = userEvent.setup()
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by transaction ID or notes...')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText('Search by transaction ID or notes...')
      const searchButton = screen.getByText('Search')
      
      await user.type(searchInput, 'TXN123')
      await user.click(searchButton)
      
      expect(mockPaymentService.getAll).toHaveBeenCalledWith(
        { search: 'TXN123' },
        1,
        20
      )
    })

    it('should perform search when Enter key is pressed', async () => {
      const user = userEvent.setup()
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by transaction ID or notes...')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText('Search by transaction ID or notes...')
      
      await user.type(searchInput, 'payment')
      await user.keyboard('{Enter}')
      
      expect(mockPaymentService.getAll).toHaveBeenCalledWith(
        { search: 'payment' },
        1,
        20
      )
    })

    it('should filter by payment method when method filter is changed', async () => {
      const user = userEvent.setup()
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getAllByRole('combobox')).toHaveLength(2)
      })
      
      const methodSelect = screen.getAllByRole('combobox')[0]
      await user.click(methodSelect)
      
      await waitFor(() => {
        expect(screen.getByText('Bank Transfer')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Bank Transfer'))
      
      expect(mockPaymentService.getAll).toHaveBeenCalledWith(
        { payment_method: 'bank_transfer' },
        1,
        20
      )
    })

    it('should filter by currency when currency filter is changed', async () => {
      const user = userEvent.setup()
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getAllByRole('combobox')).toHaveLength(2)
      })
      
      const currencySelect = screen.getAllByRole('combobox')[1]
      await user.click(currencySelect)
      
      await waitFor(() => {
        expect(screen.getByText('USD')).toBeInTheDocument()
      })
      await user.click(screen.getByText('USD'))
      
      expect(mockPaymentService.getAll).toHaveBeenCalledWith(
        { currency: 'USD' },
        1,
        20
      )
    })

    it('should filter by date range when date filters are set', async () => {
      const user = userEvent.setup()
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('')).toBeInTheDocument()
      })
      
      const fromDateInput = screen.getAllByDisplayValue('').find(input => input.getAttribute('type') === 'date')
      if (fromDateInput) {
        await user.type(fromDateInput, '2024-01-01')
      }
      
      expect(mockPaymentService.getAll).toHaveBeenCalledWith(
        { date_from: '2024-01-01' },
        1,
        20
      )
    })

    it('should reset page to 1 when applying filters', async () => {
      const user = userEvent.setup()
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by transaction ID or notes...')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText('Search by transaction ID or notes...')
      await user.type(searchInput, 'test')
      await user.keyboard('{Enter}')
      
      // Should call with page 1
      expect(mockPaymentService.getAll).toHaveBeenLastCalledWith(
        { search: 'test' },
        1,
        20
      )
    })
  })

  describe('Payment List Display', () => {
    it('should display payment cards when payments are loaded', async () => {
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('AED 5,000.00')).toBeInTheDocument()
        expect(screen.getByText('$15,000.00')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
    })

    it('should display payment method badges with correct styling', async () => {
      render(<PaymentsPage />)
      
      await waitFor(() => {
        const bankTransferBadge = screen.getByText('Bank Transfer')
        expect(bankTransferBadge).toHaveClass('bg-blue-100', 'text-blue-800')
        
        const cashBadge = screen.getByText('Cash')
        expect(cashBadge).toHaveClass('bg-green-100', 'text-green-800')
      })
    })

    it('should display invoice and customer information', async () => {
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Invoice: INV-001')).toBeInTheDocument()
        expect(screen.getByText('Invoice: INV-002')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
    })

    it('should display vehicle information when available', async () => {
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Vehicle: 2021 Honda Civic')).toBeInTheDocument()
        expect(screen.getByText('Vehicle: 2020 Toyota Camry')).toBeInTheDocument()
      })
    })

    it('should display transaction ID when available', async () => {
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Ref: TXN123456')).toBeInTheDocument()
      })
    })

    it('should display payment notes when available', async () => {
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Initial payment for vehicle')).toBeInTheDocument()
      })
    })

    it('should format payment dates correctly', async () => {
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('1/15/2024')).toBeInTheDocument()
        expect(screen.getByText('1/16/2024')).toBeInTheDocument()
      })
    })

    it('should display no payments message when list is empty', async () => {
      mockPaymentService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      })
      
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('No payments found')).toBeInTheDocument()
      })
    })

    it('should display filtered message when no payments match filters', async () => {
      mockPaymentService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      })
      
      const user = userEvent.setup()
      render(<PaymentsPage />)
      
      // Apply a search filter first
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by transaction ID or notes...')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText('Search by transaction ID or notes...')
      await user.type(searchInput, 'nonexistent')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('No payments match your filters')).toBeInTheDocument()
      })
    })

    it('should show Record Your First Payment button when no payments and user has permission', async () => {
      mockPaymentService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      })
      
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Record Your First Payment')).toBeInTheDocument()
      })
    })
  })

  describe('Pagination', () => {
    it('should display pagination when there are multiple pages', async () => {
      mockPaymentService.getAll.mockResolvedValue({
        success: true,
        data: mockPayments,
        pagination: { page: 1, limit: 20, total: 40, pages: 2 }
      })
      
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
        expect(screen.getByText('Previous')).toBeInTheDocument()
        expect(screen.getByText('Next')).toBeInTheDocument()
      })
    })

    it('should not display pagination when there is only one page', async () => {
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.queryByText('Previous')).not.toBeInTheDocument()
        expect(screen.queryByText('Next')).not.toBeInTheDocument()
      })
    })

    it('should disable Previous button on first page', async () => {
      mockPaymentService.getAll.mockResolvedValue({
        success: true,
        data: mockPayments,
        pagination: { page: 1, limit: 20, total: 40, pages: 2 }
      })
      
      render(<PaymentsPage />)
      
      await waitFor(() => {
        const prevButton = screen.getByText('Previous')
        expect(prevButton).toBeDisabled()
      })
    })

    it('should disable Next button on last page', async () => {
      mockPaymentService.getAll.mockResolvedValue({
        success: true,
        data: mockPayments,
        pagination: { page: 2, limit: 20, total: 40, pages: 2 }
      })
      
      render(<PaymentsPage />)
      
      await waitFor(() => {
        const nextButton = screen.getByText('Next')
        expect(nextButton).toBeDisabled()
      })
    })

    it('should navigate to next page when Next button is clicked', async () => {
      mockPaymentService.getAll.mockResolvedValue({
        success: true,
        data: mockPayments,
        pagination: { page: 1, limit: 20, total: 40, pages: 2 }
      })
      
      const user = userEvent.setup()
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument()
      })
      
      const nextButton = screen.getByText('Next')
      await user.click(nextButton)
      
      // Should be called twice: once on mount, once on page change
      expect(mockPaymentService.getAll).toHaveBeenCalledTimes(2)
    })
  })

  describe('Payment Form Integration', () => {
    it('should open payment form when Record Payment button is clicked', async () => {
      const user = userEvent.setup()
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Record Payment')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('Record Payment'))
      
      expect(screen.getByTestId('payment-form')).toBeInTheDocument()
    })

    it('should close payment form when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Record Payment')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('Record Payment'))
      expect(screen.getByTestId('payment-form')).toBeInTheDocument()
      
      await user.click(screen.getByText('Close'))
      expect(screen.queryByTestId('payment-form')).not.toBeInTheDocument()
    })

    it('should reload data when payment is successfully saved', async () => {
      const user = userEvent.setup()
      render(<PaymentsPage />)
      
      // Initial load
      await waitFor(() => {
        expect(mockPaymentService.getAll).toHaveBeenCalledTimes(1)
        expect(mockPaymentService.getStatistics).toHaveBeenCalledTimes(1)
      })
      
      await user.click(screen.getByText('Record Payment'))
      await user.click(screen.getByText('Save Payment'))
      
      // Should reload data after successful save
      expect(mockPaymentService.getAll).toHaveBeenCalledTimes(2)
      expect(mockPaymentService.getStatistics).toHaveBeenCalledTimes(2)
    })
  })

  describe('Action Buttons', () => {
    it('should display view and edit buttons for users with permission', async () => {
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getAllByRole('button')).toContainEqual(
          expect.objectContaining({
            innerHTML: expect.stringContaining('Eye')
          })
        )
        expect(screen.getAllByRole('button')).toContainEqual(
          expect.objectContaining({
            innerHTML: expect.stringContaining('Edit')
          })
        )
      })
    })

    it('should not display action buttons for users without permission', async () => {
      const mockUseAuth = vi.mocked(await import('@/lib/auth/context')).useAuth as any
      mockUseAuth.mockReturnValue({
        hasPermission: vi.fn(() => false),
        user: { id: 'user-123', role: 'viewer' }
      })
      
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('AED 5,000.00')).toBeInTheDocument()
      })
      
      const actionButtons = screen.queryAllByRole('button').filter(button => 
        button.innerHTML.includes('Eye') || button.innerHTML.includes('Edit')
      )
      expect(actionButtons).toHaveLength(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockPaymentService.getAll.mockResolvedValue({
        success: false,
        error: 'Failed to fetch payments'
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load payments:', 'Failed to fetch payments')
      })
      
      consoleSpy.mockRestore()
    })

    it('should handle statistics loading errors gracefully', async () => {
      mockPaymentService.getStatistics.mockResolvedValue({
        success: false,
        error: 'Failed to fetch statistics'
      })
      
      render(<PaymentsPage />)
      
      await waitFor(() => {
        // Should still render the page without statistics
        expect(screen.getByText('Payment Management')).toBeInTheDocument()
        expect(screen.queryByText('Total Payments')).not.toBeInTheDocument()
      })
    })
  })

  describe('Currency Formatting', () => {
    it('should format AED currency correctly', async () => {
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('AED 5,000.00')).toBeInTheDocument()
      })
    })

    it('should format USD currency correctly', async () => {
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('$15,000.00')).toBeInTheDocument()
      })
    })

    it('should handle missing currency gracefully', async () => {
      const paymentWithoutCurrency = {
        ...mockPayments[0],
        currency: undefined
      }
      
      mockPaymentService.getAll.mockResolvedValue({
        success: true,
        data: [paymentWithoutCurrency],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 }
      })
      
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('AED 5,000.00')).toBeInTheDocument() // Default to AED
      })
    })
  })

  describe('Data Refresh', () => {
    it('should reload data when filters change', async () => {
      const user = userEvent.setup()
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(mockPaymentService.getAll).toHaveBeenCalledTimes(1)
      })
      
      // Change payment method filter
      const methodSelect = screen.getAllByRole('combobox')[0]
      await user.click(methodSelect)
      
      await waitFor(() => {
        expect(screen.getByText('Cash')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Cash'))
      
      // Should be called again with new filter
      expect(mockPaymentService.getAll).toHaveBeenCalledTimes(2)
      expect(mockPaymentService.getAll).toHaveBeenLastCalledWith(
        { payment_method: 'cash' },
        1,
        20
      )
    })

    it('should reload statistics when filters change', async () => {
      const user = userEvent.setup()
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(mockPaymentService.getStatistics).toHaveBeenCalledTimes(1)
      })
      
      // Change currency filter
      const currencySelect = screen.getAllByRole('combobox')[1]
      await user.click(currencySelect)
      
      await waitFor(() => {
        expect(screen.getByText('USD')).toBeInTheDocument()
      })
      await user.click(screen.getByText('USD'))
      
      // Should reload statistics with new filter
      expect(mockPaymentService.getStatistics).toHaveBeenCalledTimes(2)
      expect(mockPaymentService.getStatistics).toHaveBeenLastCalledWith(
        { currency: 'USD' }
      )
    })
  })

  describe('Responsive Design', () => {
    it('should display responsive grid layout for payment information', async () => {
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
      
      const paymentGrid = screen.getByText('John Doe').closest('.grid')
      expect(paymentGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4')
    })

    it('should handle mobile layout for filters', async () => {
      render(<PaymentsPage />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by transaction ID or notes...')).toBeInTheDocument()
      })
      
      const searchContainer = screen.getByPlaceholderText('Search by transaction ID or notes...').closest('div')
      expect(searchContainer?.parentElement).toHaveClass('flex-col', 'lg:flex-row')
    })
  })
})