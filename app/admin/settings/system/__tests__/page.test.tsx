import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import SystemSettingsPage from '../page'

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

describe('System Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn()
    })
  })

  const mockSystemData = {
    general: {
      system_name: 'Georgia Used Cars Management',
      version: '1.0.0',
      environment: 'production',
      maintenance_mode: false,
      debug_mode: false,
      log_level: 'info',
      session_timeout: 30,
      max_file_upload_size: 10,
      allowed_file_types: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
      backup_frequency: 'daily',
      backup_retention_days: 30
    },
    security: {
      password_min_length: 8,
      password_require_uppercase: true,
      password_require_lowercase: true,
      password_require_numbers: true,
      password_require_symbols: false,
      max_login_attempts: 5,
      lockout_duration: 30,
      two_factor_required: false,
      session_security: 'high',
      api_rate_limit: 1000,
      cors_origins: ['https://georgiaused.com', 'https://www.georgiaused.com']
    },
    notifications: {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      notification_retention_days: 90,
      daily_digest: true,
      weekly_reports: true,
      system_alerts: true
    },
    integrations: {
      google_analytics_id: 'GA-XXXXXXXXX',
      google_maps_api_key: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXX',
      stripe_public_key: 'pk_test_XXXXXXXXXXXXXXXX',
      stripe_webhook_secret: 'whsec_XXXXXXXXXXXXXXXX',
      twilio_account_sid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      external_apis: {
        auction_houses: true,
        shipping_providers: true,
        insurance_providers: false
      }
    }
  }

  it('should render system settings page', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockSystemData
      })
    })

    render(<SystemSettingsPage />)
    
    expect(screen.getByText('System Settings')).toBeInTheDocument()
    expect(screen.getByText('Configure system-wide settings and preferences')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Georgia Used Cars Management')).toBeInTheDocument()
    })
  })

  it('should display general settings section', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockSystemData
      })
    })

    render(<SystemSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('General Settings')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Georgia Used Cars Management')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1.0.0')).toBeInTheDocument()
      expect(screen.getByDisplayValue('production')).toBeInTheDocument()
      expect(screen.getByDisplayValue('30')).toBeInTheDocument() // session timeout
      expect(screen.getByDisplayValue('10')).toBeInTheDocument() // max file size
    })
  })

  it('should handle maintenance mode toggle', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockSystemData
      })
    })

    render(<SystemSettingsPage />)
    
    await waitFor(() => {
      const maintenanceToggle = screen.getByRole('checkbox', { name: /maintenance mode/i })
      expect(maintenanceToggle).not.toBeChecked()
      
      fireEvent.click(maintenanceToggle)
      expect(maintenanceToggle).toBeChecked()
    })
  })

  it('should display security settings section', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockSystemData
      })
    })

    render(<SystemSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Security Settings')).toBeInTheDocument()
      expect(screen.getByDisplayValue('8')).toBeInTheDocument() // password min length
      expect(screen.getByDisplayValue('5')).toBeInTheDocument() // max login attempts
      expect(screen.getByDisplayValue('30')).toBeInTheDocument() // lockout duration
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument() // API rate limit
    })
  })

  it('should handle password policy checkboxes', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockSystemData
      })
    })

    render(<SystemSettingsPage />)
    
    await waitFor(() => {
      const uppercaseToggle = screen.getByRole('checkbox', { name: /require uppercase/i })
      const lowercaseToggle = screen.getByRole('checkbox', { name: /require lowercase/i })
      const numbersToggle = screen.getByRole('checkbox', { name: /require numbers/i })
      const symbolsToggle = screen.getByRole('checkbox', { name: /require symbols/i })
      
      expect(uppercaseToggle).toBeChecked()
      expect(lowercaseToggle).toBeChecked()
      expect(numbersToggle).toBeChecked()
      expect(symbolsToggle).not.toBeChecked()
    })
  })

  it('should display notifications settings section', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockSystemData
      })
    })

    render(<SystemSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Notification Settings')).toBeInTheDocument()
      
      const emailToggle = screen.getByRole('checkbox', { name: /email notifications/i })
      const smsToggle = screen.getByRole('checkbox', { name: /sms notifications/i })
      const pushToggle = screen.getByRole('checkbox', { name: /push notifications/i })
      
      expect(emailToggle).toBeChecked()
      expect(smsToggle).not.toBeChecked()
      expect(pushToggle).toBeChecked()
    })
  })

  it('should display integrations settings section', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockSystemData
      })
    })

    render(<SystemSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Third-party Integrations')).toBeInTheDocument()
      expect(screen.getByDisplayValue('GA-XXXXXXXXX')).toBeInTheDocument()
      expect(screen.getByDisplayValue('AIzaSyXXXXXXXXXXXXXXXXXXXXXX')).toBeInTheDocument()
      expect(screen.getByDisplayValue('pk_test_XXXXXXXXXXXXXXXX')).toBeInTheDocument()
    })
  })

  it('should validate form fields', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockSystemData
      })
    })

    render(<SystemSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Georgia Used Cars Management')).toBeInTheDocument()
    })

    // Clear required field
    const systemNameInput = screen.getByDisplayValue('Georgia Used Cars Management')
    fireEvent.change(systemNameInput, { target: { value: '' } })

    // Set invalid session timeout
    const sessionTimeoutInput = screen.getByDisplayValue('30')
    fireEvent.change(sessionTimeoutInput, { target: { value: '0' } })

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('System name is required')).toBeInTheDocument()
      expect(screen.getByText('Session timeout must be at least 5 minutes')).toBeInTheDocument()
    })
  })

  it('should validate password policy settings', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockSystemData
      })
    })

    render(<SystemSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('8')).toBeInTheDocument()
    })

    const passwordMinLengthInput = screen.getByDisplayValue('8')
    fireEvent.change(passwordMinLengthInput, { target: { value: '3' } })

    const maxAttemptsInput = screen.getByDisplayValue('5')
    fireEvent.change(maxAttemptsInput, { target: { value: '0' } })

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Password minimum length must be at least 6')).toBeInTheDocument()
      expect(screen.getByText('Max login attempts must be at least 1')).toBeInTheDocument()
    })
  })

  it('should handle CORS origins management', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockSystemData
      })
    })

    render(<SystemSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('CORS Origins')).toBeInTheDocument()
      expect(screen.getByText('https://georgiaused.com')).toBeInTheDocument()
      expect(screen.getByText('https://www.georgiaused.com')).toBeInTheDocument()
    })

    const addOriginButton = screen.getByRole('button', { name: /add origin/i })
    fireEvent.click(addOriginButton)

    const newOriginInput = screen.getByPlaceholderText(/enter cors origin/i)
    fireEvent.change(newOriginInput, { target: { value: 'https://api.georgiaused.com' } })

    const confirmAddButton = screen.getByRole('button', { name: /add/i })
    fireEvent.click(confirmAddButton)

    await waitFor(() => {
      expect(screen.getByText('https://api.georgiaused.com')).toBeInTheDocument()
    })
  })

  it('should handle file type management', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockSystemData
      })
    })

    render(<SystemSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Allowed File Types')).toBeInTheDocument()
      expect(screen.getByText('jpg')).toBeInTheDocument()
      expect(screen.getByText('jpeg')).toBeInTheDocument()
      expect(screen.getByText('png')).toBeInTheDocument()
      expect(screen.getByText('pdf')).toBeInTheDocument()
    })
  })

  it('should handle backup settings', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockSystemData
      })
    })

    render(<SystemSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Backup Settings')).toBeInTheDocument()
      
      const backupFrequencySelect = screen.getByRole('combobox', { name: /backup frequency/i })
      expect(backupFrequencySelect).toHaveValue('daily')
      
      const retentionInput = screen.getByDisplayValue('30')
      expect(retentionInput).toBeInTheDocument()
    })
  })

  it('should handle manual backup trigger', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockSystemData
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Backup initiated successfully'
        })
      })

    render(<SystemSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Backup Settings')).toBeInTheDocument()
    })

    const manualBackupButton = screen.getByRole('button', { name: /create backup now/i })
    fireEvent.click(manualBackupButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/settings/system/backup', {
        method: 'POST'
      })
    })

    expect(screen.getByText('Backup initiated successfully')).toBeInTheDocument()
  })

  it('should handle environment switching warning', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockSystemData
      })
    })

    render(<SystemSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('production')).toBeInTheDocument()
    })

    const environmentSelect = screen.getByDisplayValue('production')
    fireEvent.change(environmentSelect, { target: { value: 'development' } })

    expect(screen.getByText('Environment Change Warning')).toBeInTheDocument()
    expect(screen.getByText('Changing the environment may affect system behavior')).toBeInTheDocument()
  })

  it('should handle form submission', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockSystemData
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { ...mockSystemData, general: { ...mockSystemData.general, session_timeout: 60 } }
        })
      })

    render(<SystemSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('30')).toBeInTheDocument()
    })

    const sessionTimeoutInput = screen.getByDisplayValue('30')
    fireEvent.change(sessionTimeoutInput, { target: { value: '60' } })

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/settings/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...mockSystemData,
          general: { ...mockSystemData.general, session_timeout: 60 }
        })
      })
    })
  })

  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<SystemSettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load system settings')).toBeInTheDocument()
    })
  })

  it('should require super admin permissions', async () => {
    const mockUseAuth = vi.fn(() => ({
      user: {
        id: 'user-123',
        email: 'manager@example.com',
        role: 'manager',
        full_name: 'Manager User'
      },
      hasPermission: vi.fn(() => false)
    }))

    vi.mocked(require('@/lib/auth/context').useAuth).mockImplementation(mockUseAuth)

    render(<SystemSettingsPage />)
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText('You do not have permission to manage system settings')).toBeInTheDocument()
  })

  it('should show confirmation for dangerous operations', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockSystemData
      })
    })

    render(<SystemSettingsPage />)
    
    await waitFor(() => {
      const debugToggle = screen.getByRole('checkbox', { name: /debug mode/i })
      expect(debugToggle).not.toBeChecked()
      
      fireEvent.click(debugToggle)
    })

    expect(screen.getByText('Enable Debug Mode?')).toBeInTheDocument()
    expect(screen.getByText('Debug mode should only be enabled for troubleshooting')).toBeInTheDocument()
  })

  it('should show loading state', async () => {
    let resolveFetch: (value: any) => void
    const fetchPromise = new Promise(resolve => {
      resolveFetch = resolve
    })

    global.fetch = vi.fn().mockReturnValue(fetchPromise)

    render(<SystemSettingsPage />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    resolveFetch({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockSystemData
      })
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue('Georgia Used Cars Management')).toBeInTheDocument()
    })
  })
})