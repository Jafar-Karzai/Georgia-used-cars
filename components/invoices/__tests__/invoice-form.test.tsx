import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InvoiceForm } from '../invoice-form'
import { InvoiceService } from '@/lib/services/invoices'
import { CustomerService } from '@/lib/services/customers'
import { VehicleService } from '@/lib/services/vehicles'

// Mock services
vi.mock('@/lib/services/invoices')
vi.mock('@/lib/services/customers')
vi.mock('@/lib/services/vehicles')

// Mock auth context
vi.mock('@/lib/auth/context', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'user-123',
      email: 'test@example.com',
      role: 'manager',
      full_name: 'Test User'
    }
  }))
}))

const mockInvoiceService = InvoiceService as any
const mockCustomerService = CustomerService as any
const mockVehicleService = VehicleService as any

describe('InvoiceForm', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    isEdit: false
  }

  const mockCustomers = [
    { id: 'customer-1', full_name: 'John Doe', email: 'john@example.com', phone: '+971501234567' },
    { id: 'customer-2', full_name: 'Jane Smith', email: 'jane@example.com', phone: '+971507654321' }
  ]

  const mockVehicles = [
    { id: 'vehicle-1', year: 2021, make: 'Honda', model: 'Civic', vin: '1HGBH41JXMN109186', sale_price: 22000 },
    { id: 'vehicle-2', year: 2020, make: 'Toyota', model: 'Camry', vin: '4T1BF1FK5CU123456', sale_price: 25000 }
  ]

  const mockInvoiceData = {
    id: 'invoice-123',
    invoice_number: 'INV-2024-0001',
    customer_id: 'customer-1',
    vehicle_id: 'vehicle-1',
    line_items: [
      {
        description: '2021 Honda Civic - Vehicle Sale',
        quantity: 1,
        unit_price: 22000,
        total: 22000
      },
      {
        description: 'Extended Warranty',
        quantity: 1,
        unit_price: 1500,
        total: 1500
      }
    ],
    subtotal: 23500,
    vat_rate: 5,
    vat_amount: 1175,
    total_amount: 24675,
    currency: 'AED' as const,
    status: 'draft' as const,
    due_date: '2024-02-15',
    payment_terms: 'Net 30 days',
    notes: 'Vehicle purchase invoice',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock responses
    mockCustomerService.getAll.mockResolvedValue({
      success: true,
      data: mockCustomers,
      pagination: { page: 1, limit: 20, total: 2, pages: 1 }
    })
    
    mockVehicleService.getAll.mockResolvedValue({
      success: true,
      data: mockVehicles,
      pagination: { page: 1, limit: 20, total: 2, pages: 1 }
    })
  })

  describe('Dialog Rendering', () => {
    it('should render dialog when open', () => {
      render(<InvoiceForm {...mockProps} />)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Create New Invoice')).toBeInTheDocument()
      expect(screen.getByText('Generate an invoice for a customer purchase.')).toBeInTheDocument()
    })

    it('should not render dialog when closed', () => {
      render(<InvoiceForm {...mockProps} isOpen={false} />)
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should show correct title for edit mode', () => {
      render(<InvoiceForm {...mockProps} isEdit={true} />)
      
      expect(screen.getByText('Edit Invoice')).toBeInTheDocument()
      expect(screen.getByText('Update invoice information')).toBeInTheDocument()
    })
  })

  describe('Customer Selection', () => {
    it('should render customer search field', async () => {
      render(<InvoiceForm {...mockProps} />)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Customer *')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Search customers...')).toBeInTheDocument()
      })
    })

    it('should load and display customers', async () => {
      render(<InvoiceForm {...mockProps} />)
      
      await waitFor(() => {
        expect(mockCustomerService.getAll).toHaveBeenCalled()
      })
      
      // Open customer dropdown by clicking the trigger
      const customerTrigger = screen.getByRole('combobox', { name: /customer/i })
      await userEvent.click(customerTrigger)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
    })

    it('should filter customers by search', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm {...mockProps} />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search customers...')).toBeInTheDocument()
      })
      
      // Type in search field
      await user.type(screen.getByPlaceholderText('Search customers...'), 'john')
      
      await waitFor(() => {
        expect(mockCustomerService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'john' }),
          1,
          20
        )
      })
    })

    it('should pre-select customer when customerId prop is provided', () => {
      render(<InvoiceForm {...mockProps} customerId="customer-1" />)
      
      expect(screen.getByDisplayValue('customer-1')).toBeInTheDocument()
    })
  })

  describe('Vehicle Selection', () => {
    it('should render vehicle selection field', async () => {
      render(<InvoiceForm {...mockProps} />)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Vehicle (Optional)')).toBeInTheDocument()
      })
    })

    it('should load and display vehicles', async () => {
      render(<InvoiceForm {...mockProps} />)
      
      await waitFor(() => {
        expect(mockVehicleService.getAll).toHaveBeenCalled()
      })
      
      // Open vehicle dropdown
      const vehicleTrigger = screen.getByRole('combobox', { name: /vehicle/i })
      await userEvent.click(vehicleTrigger)
      
      await waitFor(() => {
        expect(screen.getByText('2021 Honda Civic - 1HGBH41JXMN109186')).toBeInTheDocument()
        expect(screen.getByText('2020 Toyota Camry - 4T1BF1FK5CU123456')).toBeInTheDocument()
      })
    })

    it('should pre-select vehicle when vehicleId prop is provided', () => {
      render(<InvoiceForm {...mockProps} vehicleId="vehicle-1" />)
      
      expect(screen.getByDisplayValue('vehicle-1')).toBeInTheDocument()
    })

    it('should auto-add vehicle as line item when selected', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm {...mockProps} />)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Vehicle (Optional)')).toBeInTheDocument()
      })
      
      // Select a vehicle
      const vehicleTrigger = screen.getByRole('combobox', { name: /vehicle/i })
      await user.click(vehicleTrigger)
      await user.click(screen.getByText('2021 Honda Civic - 1HGBH41JXMN109186'))
      
      // Should auto-populate line item
      await waitFor(() => {
        expect(screen.getByDisplayValue('2021 Honda Civic - VIN: 1HGBH41JXMN109186')).toBeInTheDocument()
        expect(screen.getByDisplayValue('22000')).toBeInTheDocument()
      })
    })
  })

  describe('Line Items Management', () => {
    it('should render default line item', () => {
      render(<InvoiceForm {...mockProps} />)
      
      expect(screen.getByText('Line Items')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Item description')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1')).toBeInTheDocument() // quantity
    })

    it('should add new line item', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm {...mockProps} />)
      
      await user.click(screen.getByText('Add Item'))
      
      // Should have two line items now
      const descriptions = screen.getAllByPlaceholderText('Item description')
      expect(descriptions).toHaveLength(2)
    })

    it('should remove line item', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm {...mockProps} />)
      
      // Add a line item first
      await user.click(screen.getByText('Add Item'))
      
      // Should have two line items
      expect(screen.getAllByPlaceholderText('Item description')).toHaveLength(2)
      
      // Remove one line item
      const removeButtons = screen.getAllByRole('button', { name: /remove item/i })
      await user.click(removeButtons[0])
      
      // Should have one line item
      expect(screen.getAllByPlaceholderText('Item description')).toHaveLength(1)
    })

    it('should calculate line item total automatically', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm {...mockProps} />)
      
      // Fill quantity and unit price
      const quantityInput = screen.getByDisplayValue('1')
      await user.clear(quantityInput)
      await user.type(quantityInput, '2')
      
      const unitPriceInput = screen.getByDisplayValue('0')
      await user.clear(unitPriceInput)
      await user.type(unitPriceInput, '1000')
      
      // Total should be calculated automatically
      await waitFor(() => {
        expect(screen.getByDisplayValue('2000')).toBeInTheDocument()
      })
    })
  })

  describe('Financial Calculations', () => {
    it('should calculate subtotal from line items', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm {...mockProps} />)
      
      // Fill line item
      await user.type(screen.getByPlaceholderText('Item description'), 'Test Item')
      const quantityInput = screen.getByDisplayValue('1')
      await user.clear(quantityInput)
      await user.type(quantityInput, '1')
      
      const unitPriceInput = screen.getByDisplayValue('0')
      await user.clear(unitPriceInput)
      await user.type(unitPriceInput, '1000')
      
      // Should calculate subtotal
      await waitFor(() => {
        expect(screen.getByText('AED 1,000.00')).toBeInTheDocument()
      })
    })

    it('should calculate VAT amount based on rate', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm {...mockProps} />)
      
      // Fill line item
      await user.type(screen.getByPlaceholderText('Item description'), 'Test Item')
      const quantityInput = screen.getByDisplayValue('1')
      await user.clear(quantityInput)
      await user.type(quantityInput, '1')
      
      const unitPriceInput = screen.getByDisplayValue('0')
      await user.clear(unitPriceInput)
      await user.type(unitPriceInput, '1000')
      
      // Change VAT rate
      const vatRateInput = screen.getByDisplayValue('5')
      await user.clear(vatRateInput)
      await user.type(vatRateInput, '10')
      
      // Should calculate VAT amount (10% of 1000 = 100)
      await waitFor(() => {
        expect(screen.getByText('AED 100.00')).toBeInTheDocument()
      })
    })

    it('should calculate total amount including VAT', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm {...mockProps} />)
      
      // Fill line item
      await user.type(screen.getByPlaceholderText('Item description'), 'Test Item')
      const quantityInput = screen.getByDisplayValue('1')
      await user.clear(quantityInput)
      await user.type(quantityInput, '1')
      
      const unitPriceInput = screen.getByDisplayValue('0')
      await user.clear(unitPriceInput)
      await user.type(unitPriceInput, '1000')
      
      // Should calculate total (1000 + 5% VAT = 1050)
      await waitFor(() => {
        expect(screen.getByText('AED 1,050.00')).toBeInTheDocument()
      })
    })
  })

  describe('Currency Selection', () => {
    it('should handle currency selection', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm {...mockProps} />)
      
      // Open currency dropdown
      await user.click(screen.getByDisplayValue('AED'))
      
      // Should show currency options
      expect(screen.getByText('USD')).toBeInTheDocument()
      expect(screen.getByText('CAD')).toBeInTheDocument()
      
      // Select different currency
      await user.click(screen.getByText('USD'))
      expect(screen.getByDisplayValue('USD')).toBeInTheDocument()
    })

    it('should update currency display in calculations', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm {...mockProps} />)
      
      // Fill line item
      await user.type(screen.getByPlaceholderText('Item description'), 'Test Item')
      const quantityInput = screen.getByDisplayValue('1')
      await user.clear(quantityInput)
      await user.type(quantityInput, '1')
      
      const unitPriceInput = screen.getByDisplayValue('0')
      await user.clear(unitPriceInput)
      await user.type(unitPriceInput, '1000')
      
      // Change currency to USD
      await user.click(screen.getByDisplayValue('AED'))
      await user.click(screen.getByText('USD'))
      
      // Should show USD in calculations
      await waitFor(() => {
        expect(screen.getByText('USD 1,000.00')).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('should validate required customer field', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm {...mockProps} />)
      
      await user.click(screen.getByText('Create Invoice'))
      
      await waitFor(() => {
        expect(screen.getByText('Customer is required')).toBeInTheDocument()
      })
    })

    it('should validate required line items', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm {...mockProps} />)
      
      // Select customer but leave line items empty
      await waitFor(() => {
        expect(screen.getByLabelText('Customer *')).toBeInTheDocument()
      })
      
      const customerTrigger = screen.getByRole('combobox', { name: /customer/i })
      await user.click(customerTrigger)
      await user.click(screen.getByText('John Doe'))
      
      await user.click(screen.getByText('Create Invoice'))
      
      await waitFor(() => {
        expect(screen.getByText('Description is required')).toBeInTheDocument()
      })
    })

    it('should validate line item quantity', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm {...mockProps} />)
      
      // Set invalid quantity
      const quantityInput = screen.getByDisplayValue('1')
      await user.clear(quantityInput)
      await user.type(quantityInput, '0')
      
      await user.click(screen.getByText('Create Invoice'))
      
      await waitFor(() => {
        expect(screen.getByText('Quantity must be greater than 0')).toBeInTheDocument()
      })
    })

    it('should validate due date', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm {...mockProps} />)
      
      // Clear due date
      const dueDateInput = screen.getByLabelText('Due Date *')
      await user.clear(dueDateInput)
      
      await user.click(screen.getByText('Create Invoice'))
      
      await waitFor(() => {
        expect(screen.getByText('Due date is required')).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should create new invoice successfully', async () => {
      const user = userEvent.setup()
      mockInvoiceService.create.mockResolvedValue({
        success: true,
        data: mockInvoiceData
      })
      
      render(<InvoiceForm {...mockProps} />)
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByLabelText('Customer *')).toBeInTheDocument()
      })
      
      // Select customer
      const customerTrigger = screen.getByRole('combobox', { name: /customer/i })
      await user.click(customerTrigger)
      await user.click(screen.getByText('John Doe'))
      
      // Fill line item
      await user.type(screen.getByPlaceholderText('Item description'), 'Test Service')
      const quantityInput = screen.getByDisplayValue('1')
      await user.clear(quantityInput)
      await user.type(quantityInput, '1')
      
      const unitPriceInput = screen.getByDisplayValue('0')
      await user.clear(unitPriceInput)
      await user.type(unitPriceInput, '1000')
      
      // Submit form
      await user.click(screen.getByText('Create Invoice'))
      
      await waitFor(() => {
        expect(mockInvoiceService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            customer_id: 'customer-1',
            line_items: expect.arrayContaining([
              expect.objectContaining({
                description: 'Test Service',
                quantity: 1,
                unit_price: 1000,
                total: 1000
              })
            ])
          }),
          'user-123'
        )
        expect(mockProps.onSuccess).toHaveBeenCalled()
        expect(mockProps.onClose).toHaveBeenCalled()
      })
    })

    it('should update existing invoice successfully', async () => {
      const user = userEvent.setup()
      mockInvoiceService.update.mockResolvedValue({
        success: true,
        data: { ...mockInvoiceData, notes: 'Updated notes' }
      })
      
      render(<InvoiceForm {...mockProps} isEdit={true} invoiceId="invoice-123" initialData={mockInvoiceData} />)
      
      // Update notes
      const notesInput = screen.getByLabelText('Notes')
      await user.clear(notesInput)
      await user.type(notesInput, 'Updated notes')
      
      // Submit form
      await user.click(screen.getByText('Update Invoice'))
      
      await waitFor(() => {
        expect(mockInvoiceService.update).toHaveBeenCalledWith(
          'invoice-123',
          expect.objectContaining({
            notes: 'Updated notes'
          })
        )
        expect(mockProps.onSuccess).toHaveBeenCalled()
        expect(mockProps.onClose).toHaveBeenCalled()
      })
    })

    it('should handle creation errors', async () => {
      const user = userEvent.setup()
      mockInvoiceService.create.mockResolvedValue({
        success: false,
        error: 'Customer not found'
      })
      
      // Mock window.alert
      window.alert = vi.fn()
      
      render(<InvoiceForm {...mockProps} />)
      
      // Wait for data to load and fill form
      await waitFor(() => {
        expect(screen.getByLabelText('Customer *')).toBeInTheDocument()
      })
      
      const customerTrigger = screen.getByRole('combobox', { name: /customer/i })
      await user.click(customerTrigger)
      await user.click(screen.getByText('John Doe'))
      
      await user.type(screen.getByPlaceholderText('Item description'), 'Test Service')
      
      await user.click(screen.getByText('Create Invoice'))
      
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to save invoice: Customer not found')
        expect(mockProps.onSuccess).not.toHaveBeenCalled()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      // Mock a delayed response
      mockInvoiceService.create.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockInvoiceData }), 100))
      )
      
      render(<InvoiceForm {...mockProps} />)
      
      // Wait for data to load and fill form
      await waitFor(() => {
        expect(screen.getByLabelText('Customer *')).toBeInTheDocument()
      })
      
      const customerTrigger = screen.getByRole('combobox', { name: /customer/i })
      await user.click(customerTrigger)
      await user.click(screen.getByText('John Doe'))
      
      await user.type(screen.getByPlaceholderText('Item description'), 'Test Service')
      await user.click(screen.getByText('Create Invoice'))
      
      // Should show loading state
      expect(screen.getByText('Creating...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
      
      // Wait for completion
      await waitFor(() => {
        expect(mockProps.onSuccess).toHaveBeenCalled()
      }, { timeout: 200 })
    })

    it('should show loading state when loading customers', async () => {
      // Mock delayed customer loading
      mockCustomerService.getAll.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: mockCustomers,
          pagination: { page: 1, limit: 20, total: 2, pages: 1 }
        }), 100))
      )
      
      render(<InvoiceForm {...mockProps} />)
      
      expect(screen.getByText('Loading customers...')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.getByLabelText('Customer *')).toBeInTheDocument()
      }, { timeout: 200 })
    })
  })

  describe('Dialog Actions', () => {
    it('should handle close button', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm {...mockProps} />)
      
      await user.click(screen.getByText('Cancel'))
      expect(mockProps.onClose).toHaveBeenCalled()
    })
  })

  describe('Initial Data Population', () => {
    it('should populate form with initial data in edit mode', () => {
      render(<InvoiceForm {...mockProps} isEdit={true} initialData={mockInvoiceData} />)
      
      expect(screen.getByDisplayValue('customer-1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('vehicle-1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2021 Honda Civic - Vehicle Sale')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Net 30 days')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Vehicle purchase invoice')).toBeInTheDocument()
      expect(screen.getByDisplayValue('5')).toBeInTheDocument() // VAT rate
    })
  })

  describe('Financial Summary Card', () => {
    it('should display financial summary with proper formatting', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm {...mockProps} />)
      
      // Fill line item to generate calculations
      await user.type(screen.getByPlaceholderText('Item description'), 'Test Item')
      const quantityInput = screen.getByDisplayValue('1')
      await user.clear(quantityInput)
      await user.type(quantityInput, '1')
      
      const unitPriceInput = screen.getByDisplayValue('0')
      await user.clear(unitPriceInput)
      await user.type(unitPriceInput, '1000')
      
      // Should show formatted financial summary
      await waitFor(() => {
        expect(screen.getByText('Invoice Summary')).toBeInTheDocument()
        expect(screen.getByText('Subtotal:')).toBeInTheDocument()
        expect(screen.getByText('VAT (5%):')).toBeInTheDocument()
        expect(screen.getByText('Total:')).toBeInTheDocument()
        expect(screen.getByText('AED 1,000.00')).toBeInTheDocument()
        expect(screen.getByText('AED 50.00')).toBeInTheDocument()
        expect(screen.getByText('AED 1,050.00')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and descriptions', () => {
      render(<InvoiceForm {...mockProps} />)
      
      // Check required field indicators
      expect(screen.getByLabelText('Customer *')).toBeInTheDocument()
      expect(screen.getByLabelText('Due Date *')).toBeInTheDocument()
      
      // Check dialog accessibility
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby')
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm {...mockProps} />)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Customer *')).toBeInTheDocument()
      })
      
      // Tab through form fields
      await user.tab()
      expect(screen.getByLabelText('Customer *')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText('Vehicle (Optional)')).toHaveFocus()
    })
  })
})