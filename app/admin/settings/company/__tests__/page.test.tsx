import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import CompanySettingsPage from '../page'

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

describe('Company Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn()
    })
  })

  const mockCompanyData = {
    id: 'company-1',
    name: 'Georgia Used Cars',
    legal_name: 'Georgia Used Cars LLC',
    registration_number: 'REG123456',
    vat_number: 'VAT987654321',
    email: 'info@georgiaused.com',
    phone: '+971501234567',
    website: 'https://georgiaused.com',
    address: '123 Business Street',
    city: 'Dubai',
    state: 'Dubai',
    postal_code: '12345',
    country: 'UAE',
    logo_url: 'https://example.com/logo.png',
    primary_currency: 'AED',
    timezone: 'Asia/Dubai',
    business_hours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '15:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: true }
    }
  }

  it('should render company settings page', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockCompanyData
      })
    })

    render(<CompanySettingsPage />)
    
    expect(screen.getByText('Company Settings')).toBeInTheDocument()
    expect(screen.getByText('Manage your company information and business details')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Georgia Used Cars')).toBeInTheDocument()
    })
  })

  it('should load and display company data', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockCompanyData
      })
    })

    render(<CompanySettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Georgia Used Cars')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Georgia Used Cars LLC')).toBeInTheDocument()
      expect(screen.getByDisplayValue('REG123456')).toBeInTheDocument()
      expect(screen.getByDisplayValue('VAT987654321')).toBeInTheDocument()
      expect(screen.getByDisplayValue('info@georgiaused.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('+971501234567')).toBeInTheDocument()
      expect(screen.getByDisplayValue('https://georgiaused.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('123 Business Street')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Dubai')).toBeInTheDocument()
    })
  })

  it('should handle form submission', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockCompanyData
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { ...mockCompanyData, name: 'Updated Company Name' }
        })
      })

    render(<CompanySettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Georgia Used Cars')).toBeInTheDocument()
    })

    const nameInput = screen.getByDisplayValue('Georgia Used Cars')
    fireEvent.change(nameInput, { target: { value: 'Updated Company Name' } })

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...mockCompanyData,
          name: 'Updated Company Name'
        })
      })
    })
  })

  it('should validate required fields', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockCompanyData
      })
    })

    render(<CompanySettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Georgia Used Cars')).toBeInTheDocument()
    })

    const nameInput = screen.getByDisplayValue('Georgia Used Cars')
    fireEvent.change(nameInput, { target: { value: '' } })

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Company name is required')).toBeInTheDocument()
    })
  })

  it('should validate email format', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockCompanyData
      })
    })

    render(<CompanySettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('info@georgiaused.com')).toBeInTheDocument()
    })

    const emailInput = screen.getByDisplayValue('info@georgiaused.com')
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('should validate website URL format', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockCompanyData
      })
    })

    render(<CompanySettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('https://georgiaused.com')).toBeInTheDocument()
    })

    const websiteInput = screen.getByDisplayValue('https://georgiaused.com')
    fireEvent.change(websiteInput, { target: { value: 'invalid-url' } })

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument()
    })
  })

  it('should handle business hours configuration', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockCompanyData
      })
    })

    render(<CompanySettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Business Hours')).toBeInTheDocument()
    })

    // Check if business hours are displayed
    expect(screen.getByText('Monday')).toBeInTheDocument()
    expect(screen.getByText('Tuesday')).toBeInTheDocument()
    expect(screen.getByText('Wednesday')).toBeInTheDocument()
    expect(screen.getByText('Thursday')).toBeInTheDocument()
    expect(screen.getByText('Friday')).toBeInTheDocument()
    expect(screen.getByText('Saturday')).toBeInTheDocument()
    expect(screen.getByText('Sunday')).toBeInTheDocument()
  })

  it('should handle toggle for closed days', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockCompanyData
      })
    })

    render(<CompanySettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Business Hours')).toBeInTheDocument()
    })

    // Find and toggle Sunday (which is closed in mock data)
    const sundayToggle = screen.getByLabelText(/sunday.*closed/i)
    expect(sundayToggle).toBeChecked()
    
    fireEvent.click(sundayToggle)
    expect(sundayToggle).not.toBeChecked()
  })

  it('should handle currency selection', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockCompanyData
      })
    })

    render(<CompanySettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Primary Currency')).toBeInTheDocument()
    })

    const currencySelect = screen.getByRole('combobox', { name: /primary currency/i })
    expect(currencySelect).toHaveValue('AED')
  })

  it('should handle timezone selection', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockCompanyData
      })
    })

    render(<CompanySettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Timezone')).toBeInTheDocument()
    })

    const timezoneSelect = screen.getByRole('combobox', { name: /timezone/i })
    expect(timezoneSelect).toHaveValue('Asia/Dubai')
  })

  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<CompanySettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load company settings')).toBeInTheDocument()
    })
  })

  it('should handle save API errors', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockCompanyData
        })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: 'Failed to update company settings'
        })
      })

    render(<CompanySettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Georgia Used Cars')).toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to update company settings')).toBeInTheDocument()
    })
  })

  it('should show loading state during save', async () => {
    let resolveFirstFetch: (value: any) => void
    const firstFetchPromise = new Promise(resolve => {
      resolveFirstFetch = resolve
    })

    global.fetch = vi.fn().mockReturnValue(firstFetchPromise)

    render(<CompanySettingsPage />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    resolveFirstFetch({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockCompanyData
      })
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue('Georgia Used Cars')).toBeInTheDocument()
    })

    // Mock slow save request
    let resolveSaveFetch: (value: any) => void
    const saveFetchPromise = new Promise(resolve => {
      resolveSaveFetch = resolve
    })

    global.fetch = vi.fn().mockReturnValue(saveFetchPromise)

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)

    expect(screen.getByRole('button', { name: /saving.../i })).toBeInTheDocument()

    resolveSaveFetch({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockCompanyData
      })
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
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

    render(<CompanySettingsPage />)
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText('You do not have permission to manage company settings')).toBeInTheDocument()
  })
})