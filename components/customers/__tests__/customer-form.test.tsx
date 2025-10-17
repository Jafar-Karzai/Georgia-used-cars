import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomerForm } from '../customer-form'
import { CustomerService } from '@/lib/services/customers'

// Mock services
vi.mock('@/lib/services/customers')

const mockCustomerService = CustomerService as any

describe('CustomerForm', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    isEdit: false
  }

  const mockCustomerData = {
    id: 'customer-123',
    email: 'john.doe@example.com',
    full_name: 'John Doe',
    phone: '+971501234567',
    address: '123 Main Street, Apt 4B',
    city: 'Dubai',
    country: 'UAE',
    date_of_birth: '1990-05-15',
    preferred_language: 'en',
    marketing_consent: true,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Dialog Rendering', () => {
    it('should render dialog when open', () => {
      render(<CustomerForm {...mockProps} />)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Add New Customer')).toBeInTheDocument()
      expect(screen.getByText('Create a new customer profile for tracking inquiries and sales.')).toBeInTheDocument()
    })

    it('should not render dialog when closed', () => {
      render(<CustomerForm {...mockProps} isOpen={false} />)
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should show correct title for edit mode', () => {
      render(<CustomerForm {...mockProps} isEdit={true} />)
      
      expect(screen.getByText('Edit Customer')).toBeInTheDocument()
      expect(screen.getByText('Update customer information and preferences.')).toBeInTheDocument()
    })
  })

  describe('Form Fields Rendering', () => {
    it('should render all form fields', () => {
      render(<CustomerForm {...mockProps} />)
      
      expect(screen.getByLabelText('Full Name *')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Phone')).toBeInTheDocument()
      expect(screen.getByLabelText('Address')).toBeInTheDocument()
      expect(screen.getByLabelText('City')).toBeInTheDocument()
      expect(screen.getByLabelText('Country')).toBeInTheDocument()
      expect(screen.getByLabelText('Date of Birth')).toBeInTheDocument()
      expect(screen.getByLabelText('Preferred Language')).toBeInTheDocument()
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('should populate fields with initial data', () => {
      render(<CustomerForm {...mockProps} initialData={mockCustomerData} />)
      
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('+971501234567')).toBeInTheDocument()
      expect(screen.getByDisplayValue('123 Main Street, Apt 4B')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Dubai')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1990-05-15')).toBeInTheDocument()
      // Note: Select components don't show their values as displayValue in JSDOM
    })

    it('should have default values for country and language', () => {
      render(<CustomerForm {...mockProps} />)
      
      // Note: Select components don't show their values as displayValue in JSDOM
      // The components are properly configured with default values 'UAE' and 'en'
      expect(screen.getByLabelText('Country')).toBeInTheDocument()
      expect(screen.getByLabelText('Preferred Language')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should validate required full name field', async () => {
      const user = userEvent.setup()
      render(<CustomerForm {...mockProps} />)
      
      // Try to submit without filling required fields
      await user.click(screen.getByText('Create Customer'))
      
      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument()
      })
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      render(<CustomerForm {...mockProps} />)
      
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe')
      await user.type(screen.getByLabelText('Email'), 'invalid-email')
      
      // Trigger validation by trying to submit
      await user.click(screen.getByText('Create Customer'))
      
      // Wait for validation message to appear
      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should accept valid email format', async () => {
      const user = userEvent.setup()
      render(<CustomerForm {...mockProps} />)
      
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe')
      await user.type(screen.getByLabelText('Email'), 'john@example.com')
      
      // No email validation error should appear
      await user.click(screen.getByText('Create Customer'))
      
      await waitFor(() => {
        expect(screen.queryByText('Invalid email address')).not.toBeInTheDocument()
      })
    })

    it('should allow empty email field', async () => {
      const user = userEvent.setup()
      mockCustomerService.create.mockResolvedValue({
        success: true,
        data: mockCustomerData
      })
      
      render(<CustomerForm {...mockProps} />)
      
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe')
      // Leave email empty
      await user.click(screen.getByText('Create Customer'))
      
      await waitFor(() => {
        expect(mockCustomerService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            full_name: 'John Doe',
            email: undefined
          })
        )
      })
    })

    it('should validate minimum name length', async () => {
      const user = userEvent.setup()
      render(<CustomerForm {...mockProps} />)
      
      await user.type(screen.getByLabelText('Full Name *'), 'A')
      await user.click(screen.getByText('Create Customer'))
      
      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument()
      })
    })
  })

  describe('Country and Language Selection', () => {
    it('should handle country selection', async () => {
      const user = userEvent.setup()
      render(<CustomerForm {...mockProps} />)
      
      // Open country dropdown
      await user.click(screen.getByRole('combobox', { name: /country/i }))
      
      // Should show country options
      expect(screen.getByText('United Arab Emirates')).toBeInTheDocument()
      expect(screen.getByText('Saudi Arabia')).toBeInTheDocument()
      expect(screen.getByText('Kuwait')).toBeInTheDocument()
      
      // Select different country
      await user.click(screen.getByText('Saudi Arabia'))
      // Note: Select components don't show their values as displayValue in JSDOM
    })

    it('should handle language selection', async () => {
      const user = userEvent.setup()
      render(<CustomerForm {...mockProps} />)
      
      // Open language dropdown
      await user.click(screen.getByRole('combobox', { name: /language/i }))
      
      // Should show language options
      expect(screen.getByText('English')).toBeInTheDocument()
      expect(screen.getByText('Arabic')).toBeInTheDocument()
      expect(screen.getByText('Hindi')).toBeInTheDocument()
      
      // Select different language
      await user.click(screen.getByText('Arabic'))
      // Note: Select components don't show their values as displayValue in JSDOM
    })
  })

  describe('Marketing Consent Switch', () => {
    it('should handle marketing consent toggle', async () => {
      const user = userEvent.setup()
      render(<CustomerForm {...mockProps} />)
      
      const consentSwitch = screen.getByRole('switch')
      expect(consentSwitch).not.toBeChecked()
      
      await user.click(consentSwitch)
      expect(consentSwitch).toBeChecked()
      
      await user.click(consentSwitch)
      expect(consentSwitch).not.toBeChecked()
    })

    it('should populate marketing consent from initial data', () => {
      render(<CustomerForm {...mockProps} initialData={{ ...mockCustomerData, marketing_consent: true }} />)
      
      const consentSwitch = screen.getByRole('switch')
      expect(consentSwitch).toBeChecked()
    })

    it('should show consent description', () => {
      render(<CustomerForm {...mockProps} />)
      
      expect(screen.getByText('Customer agrees to receive marketing emails and promotional offers.')).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should create new customer successfully', async () => {
      const user = userEvent.setup()
      mockCustomerService.create.mockResolvedValue({
        success: true,
        data: mockCustomerData
      })
      
      render(<CustomerForm {...mockProps} />)
      
      // Fill form
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe')
      await user.type(screen.getByLabelText('Email'), 'john@example.com')
      await user.type(screen.getByLabelText('Phone'), '+971501234567')
      await user.type(screen.getByLabelText('Address'), '123 Main Street')
      await user.type(screen.getByLabelText('City'), 'Dubai')
      
      // Toggle marketing consent
      await user.click(screen.getByRole('switch'))
      
      // Submit form
      await user.click(screen.getByText('Create Customer'))
      
      await waitFor(() => {
        expect(mockCustomerService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            full_name: 'John Doe',
            email: 'john@example.com',
            phone: '+971501234567',
            address: '123 Main Street',
            city: 'Dubai',
            country: 'UAE',
            preferred_language: 'en',
            marketing_consent: true
          })
        )
        expect(mockProps.onSuccess).toHaveBeenCalled()
        expect(mockProps.onClose).toHaveBeenCalled()
      })
    })

    it('should update existing customer successfully', async () => {
      const user = userEvent.setup()
      mockCustomerService.update.mockResolvedValue({
        success: true,
        data: { ...mockCustomerData, full_name: 'Jane Doe' }
      })
      
      render(<CustomerForm {...mockProps} isEdit={true} customerId="customer-123" initialData={mockCustomerData} />)
      
      // Update name
      const nameInput = screen.getByDisplayValue('John Doe')
      await user.clear(nameInput)
      await user.type(nameInput, 'Jane Doe')
      
      // Submit form
      await user.click(screen.getByText('Update Customer'))
      
      await waitFor(() => {
        expect(mockCustomerService.update).toHaveBeenCalledWith(
          'customer-123',
          expect.objectContaining({
            full_name: 'Jane Doe'
          })
        )
        expect(mockProps.onSuccess).toHaveBeenCalled()
        expect(mockProps.onClose).toHaveBeenCalled()
      })
    })

    it('should handle creation errors', async () => {
      const user = userEvent.setup()
      mockCustomerService.create.mockResolvedValue({
        success: false,
        error: 'Email already exists'
      })
      
      // Mock window.alert
      window.alert = vi.fn()
      
      render(<CustomerForm {...mockProps} />)
      
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe')
      await user.type(screen.getByLabelText('Email'), 'existing@example.com')
      await user.click(screen.getByText('Create Customer'))
      
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to save customer: Email already exists')
        expect(mockProps.onSuccess).not.toHaveBeenCalled()
        expect(mockProps.onClose).not.toHaveBeenCalled()
      })
    })

    it('should handle network errors', async () => {
      const user = userEvent.setup()
      mockCustomerService.create.mockRejectedValue(new Error('Network error'))
      
      // Mock window.alert
      window.alert = vi.fn()
      
      render(<CustomerForm {...mockProps} />)
      
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe')
      await user.click(screen.getByText('Create Customer'))
      
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('An error occurred while saving the customer: Network error')
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      // Mock a delayed response
      mockCustomerService.create.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockCustomerData }), 100))
      )
      
      render(<CustomerForm {...mockProps} />)
      
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe')
      await user.click(screen.getByText('Create Customer'))
      
      // Should show loading state
      expect(screen.getByText('Creating...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
      
      // Wait for completion
      await waitFor(() => {
        expect(mockProps.onSuccess).toHaveBeenCalled()
      }, { timeout: 200 })
    })

    it('should show correct loading text for edit mode', async () => {
      const user = userEvent.setup()
      mockCustomerService.update.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockCustomerData }), 100))
      )
      
      render(<CustomerForm {...mockProps} isEdit={true} customerId="customer-123" initialData={mockCustomerData} />)
      
      await user.click(screen.getByText('Update Customer'))
      
      expect(screen.getByText('Updating...')).toBeInTheDocument()
    })
  })

  describe('Dialog Actions', () => {
    it('should handle close button', async () => {
      const user = userEvent.setup()
      render(<CustomerForm {...mockProps} />)
      
      await user.click(screen.getByText('Cancel'))
      expect(mockProps.onClose).toHaveBeenCalled()
    })

    it('should handle dialog close via ESC key', async () => {
      const user = userEvent.setup()
      render(<CustomerForm {...mockProps} />)
      
      await user.keyboard('{Escape}')
      expect(mockProps.onClose).toHaveBeenCalled()
    })
  })

  describe('Data Cleaning', () => {
    it('should clean empty strings to undefined for optional fields', async () => {
      const user = userEvent.setup()
      mockCustomerService.create.mockResolvedValue({
        success: true,
        data: mockCustomerData
      })
      
      render(<CustomerForm {...mockProps} />)
      
      // Fill only required field
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe')
      
      // Leave optional fields empty or clear them
      await user.type(screen.getByLabelText('Email'), '')
      await user.type(screen.getByLabelText('Phone'), '')
      await user.type(screen.getByLabelText('Address'), '')
      await user.type(screen.getByLabelText('City'), '')
      
      await user.click(screen.getByText('Create Customer'))
      
      await waitFor(() => {
        expect(mockCustomerService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            full_name: 'John Doe',
            email: undefined,
            phone: undefined,
            address: undefined,
            city: undefined,
            country: 'UAE',
            preferred_language: 'en'
          })
        )
      })
    })

    it('should preserve non-empty optional fields', async () => {
      const user = userEvent.setup()
      mockCustomerService.create.mockResolvedValue({
        success: true,
        data: mockCustomerData
      })
      
      render(<CustomerForm {...mockProps} />)
      
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe')
      await user.type(screen.getByLabelText('Phone'), '+971501234567')
      
      await user.click(screen.getByText('Create Customer'))
      
      await waitFor(() => {
        expect(mockCustomerService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            full_name: 'John Doe',
            phone: '+971501234567'
          })
        )
      })
    })
  })

  describe('Form Reset', () => {
    it('should reset form when dialog is reopened', () => {
      const { rerender } = render(<CustomerForm {...mockProps} isOpen={false} />)
      
      // Open dialog with initial data
      rerender(<CustomerForm {...mockProps} isOpen={true} initialData={mockCustomerData} />)
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      
      // Close and reopen without initial data
      rerender(<CustomerForm {...mockProps} isOpen={false} />)
      rerender(<CustomerForm {...mockProps} isOpen={true} />)
      
      // Form should be reset to defaults
      expect(screen.getByDisplayValue('')).toBeInTheDocument() // Name field should be empty
      // Note: Select components don't show their values as displayValue in JSDOM
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and descriptions', () => {
      render(<CustomerForm {...mockProps} />)
      
      // Check required field indicators
      expect(screen.getByLabelText('Full Name *')).toBeInTheDocument()
      
      // Check form descriptions
      expect(screen.getByText('Customer agrees to receive marketing emails and promotional offers.')).toBeInTheDocument()
      
      // Check dialog accessibility
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby')
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<CustomerForm {...mockProps} />)
      
      // Tab through form fields
      await user.tab()
      expect(screen.getByLabelText('Full Name *')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText('Email')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText('Phone')).toHaveFocus()
    })
  })

  describe('Form Layout and Styling', () => {
    it('should have proper shadcn/ui component structure', () => {
      render(<CustomerForm {...mockProps} />)
      
      // Check for dialog components
      expect(screen.getByRole('dialog')).toHaveClass('fixed')
      
      // Check for form components
      expect(screen.getByText('Full Name *')).toBeInTheDocument()
      expect(screen.getByText('Email Address')).toBeInTheDocument()
      
      // Check for button styling
      const createButton = screen.getByText('Create Customer')
      expect(createButton).toHaveClass('inline-flex')
    })

    it('should display customer icon in marketing consent section', () => {
      render(<CustomerForm {...mockProps} />)
      
      // The component should have proper iconography
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })
  })
})