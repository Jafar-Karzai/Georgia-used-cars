import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import VATSettingsPage from '../page'

// Mock the router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock the auth context
vi.mock('@/lib/auth/context', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'user-123',
      email: 'admin@example.com',
      role: 'super_admin',
      full_name: 'Admin User'
    },
    hasPermission: vi.fn(() => true)
  }))
}))

// Mock API calls
global.fetch = vi.fn()

const mockPush = vi.fn()
const mockRouter = useRouter as any

describe('VAT Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn()
    })
  })

  const mockVATData = {
    id: 'vat-1',
    default_vat_rate: 5,
    vat_registration_number: 'VAT123456789',
    vat_enabled: true,
    rates: [
      {
        id: 'rate-1',
        name: 'Standard Rate',
        rate: 5,
        description: 'Standard VAT rate for most goods and services',
        is_default: true,
        effective_date: '2024-01-01'
      },
      {
        id: 'rate-2',
        name: 'Zero Rate',
        rate: 0,
        description: 'Zero-rated goods and services',
        is_default: false,
        effective_date: '2024-01-01'
      }
    ],
    exemptions: [
      {
        id: 'exempt-1',
        category: 'medical_services',
        description: 'Medical and healthcare services',
        applies_to: 'services'
      },
      {
        id: 'exempt-2',
        category: 'education',
        description: 'Educational services and materials',
        applies_to: 'both'
      }
    ]
  }

  it('should render VAT settings page', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockVATData
      })
    })

    render(<VATSettingsPage />)
    
    expect(screen.getByText('VAT Settings')).toBeInTheDocument()
    expect(screen.getByText('Configure VAT rates and tax settings for your business')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('VAT123456789')).toBeInTheDocument()
    })
  })

  it('should load and display VAT configuration', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockVATData
      })
    })

    render(<VATSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('VAT123456789')).toBeInTheDocument()
      expect(screen.getByDisplayValue('5')).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /enable vat/i })).toBeChecked()
    })
  })

  it('should display VAT rates table', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockVATData
      })
    })

    render(<VATSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('VAT Rates')).toBeInTheDocument()
      expect(screen.getByText('Standard Rate')).toBeInTheDocument()
      expect(screen.getByText('Zero Rate')).toBeInTheDocument()
      expect(screen.getByText('5%')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  it('should handle VAT enabled toggle', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockVATData
      })
    })

    render(<VATSettingsPage />)
    
    await waitFor(() => {
      const vatEnabledToggle = screen.getByRole('checkbox', { name: /enable vat/i })
      expect(vatEnabledToggle).toBeChecked()
      
      fireEvent.click(vatEnabledToggle)
      expect(vatEnabledToggle).not.toBeChecked()
    })
  })

  it('should validate VAT registration number format', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockVATData
      })
    })

    render(<VATSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('VAT123456789')).toBeInTheDocument()
    })

    const vatRegInput = screen.getByDisplayValue('VAT123456789')
    fireEvent.change(vatRegInput, { target: { value: '123' } })

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('VAT registration number must be at least 9 characters')).toBeInTheDocument()
    })
  })

  it('should validate default VAT rate range', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockVATData
      })
    })

    render(<VATSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('5')).toBeInTheDocument()
    })

    const vatRateInput = screen.getByDisplayValue('5')
    fireEvent.change(vatRateInput, { target: { value: '150' } })

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('VAT rate must be between 0 and 100')).toBeInTheDocument()
    })
  })

  it('should handle adding new VAT rate', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockVATData
      })
    })

    render(<VATSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('VAT Rates')).toBeInTheDocument()
    })

    const addRateButton = screen.getByRole('button', { name: /add vat rate/i })
    fireEvent.click(addRateButton)

    expect(screen.getByText('Add VAT Rate')).toBeInTheDocument()
    expect(screen.getByLabelText(/rate name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rate percentage/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
  })

  it('should validate new VAT rate form', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockVATData
      })
    })

    render(<VATSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('VAT Rates')).toBeInTheDocument()
    })

    const addRateButton = screen.getByRole('button', { name: /add vat rate/i })
    fireEvent.click(addRateButton)

    const saveRateButton = screen.getByRole('button', { name: /save rate/i })
    fireEvent.click(saveRateButton)

    await waitFor(() => {
      expect(screen.getByText('Rate name is required')).toBeInTheDocument()
      expect(screen.getByText('Rate percentage is required')).toBeInTheDocument()
    })
  })

  it('should handle editing VAT rate', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockVATData
      })
    })

    render(<VATSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Standard Rate')).toBeInTheDocument()
    })

    const editButton = screen.getAllByRole('button', { name: /edit/i })[0]
    fireEvent.click(editButton)

    expect(screen.getByText('Edit VAT Rate')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Standard Rate')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
  })

  it('should handle deleting VAT rate', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockVATData
      })
    })

    render(<VATSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Zero Rate')).toBeInTheDocument()
    })

    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[1] // Delete Zero Rate (not default)
    fireEvent.click(deleteButton)

    expect(screen.getByText('Confirm Deletion')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete this VAT rate?')).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', { name: /delete rate/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/settings/vat/rates/rate-2', {
        method: 'DELETE'
      })
    })
  })

  it('should prevent deleting default VAT rate', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockVATData
      })
    })

    render(<VATSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Standard Rate')).toBeInTheDocument()
    })

    // The default rate should not have a delete button or it should be disabled
    const standardRateRow = screen.getByText('Standard Rate').closest('tr')
    const deleteButton = standardRateRow?.querySelector('button[aria-label*="delete"]')
    
    if (deleteButton) {
      expect(deleteButton).toBeDisabled()
    } else {
      // Delete button should not exist for default rate
      expect(standardRateRow?.textContent).not.toContain('Delete')
    }
  })

  it('should display VAT exemptions', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockVATData
      })
    })

    render(<VATSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('VAT Exemptions')).toBeInTheDocument()
      expect(screen.getByText('Medical and healthcare services')).toBeInTheDocument()
      expect(screen.getByText('Educational services and materials')).toBeInTheDocument()
    })
  })

  it('should handle adding new exemption', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockVATData
      })
    })

    render(<VATSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('VAT Exemptions')).toBeInTheDocument()
    })

    const addExemptionButton = screen.getByRole('button', { name: /add exemption/i })
    fireEvent.click(addExemptionButton)

    expect(screen.getByText('Add VAT Exemption')).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/applies to/i)).toBeInTheDocument()
  })

  it('should handle form submission', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockVATData
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { ...mockVATData, default_vat_rate: 10 }
        })
      })

    render(<VATSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('5')).toBeInTheDocument()
    })

    const vatRateInput = screen.getByDisplayValue('5')
    fireEvent.change(vatRateInput, { target: { value: '10' } })

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/settings/vat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...mockVATData,
          default_vat_rate: 10
        })
      })
    })
  })

  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<VATSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load VAT settings')).toBeInTheDocument()
    })
  })

  it('should require appropriate permissions', async () => {
    const mockUseAuth = vi.fn(() => ({
      user: {
        id: 'user-123',
        email: 'viewer@example.com',
        role: 'viewer',
        full_name: 'Viewer User'
      },
      hasPermission: vi.fn(() => false)
    }))

    vi.mocked(require('@/lib/auth/context').useAuth).mockImplementation(mockUseAuth)

    render(<VATSettingsPage />)
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText('You do not have permission to manage VAT settings')).toBeInTheDocument()
  })

  it('should show loading state during save', async () => {
    let resolveFirstFetch: (value: any) => void
    const firstFetchPromise = new Promise(resolve => {
      resolveFirstFetch = resolve
    })

    global.fetch = vi.fn().mockReturnValue(firstFetchPromise)

    render(<VATSettingsPage />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    resolveFirstFetch({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockVATData
      })
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue('VAT123456789')).toBeInTheDocument()
    })
  })
})