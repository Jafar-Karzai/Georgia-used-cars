import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import EmailTemplatesPage from '../page'

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

describe('Email Templates Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn()
    })
  })

  const mockEmailTemplates = {
    templates: [
      {
        id: 'template-1',
        name: 'Invoice Notification',
        type: 'invoice_notification',
        subject: 'Your Invoice from Georgia Used Cars - {{invoice_number}}',
        content: 'Dear {{customer_name}},\n\nYour invoice {{invoice_number}} is ready.',
        variables: ['customer_name', 'invoice_number', 'total_amount', 'due_date'],
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'template-2',
        name: 'Payment Confirmation',
        type: 'payment_confirmation',
        subject: 'Payment Received - Thank You!',
        content: 'Dear {{customer_name}},\n\nWe have received your payment of {{amount}}.',
        variables: ['customer_name', 'amount', 'payment_date', 'invoice_number'],
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'template-3',
        name: 'Welcome Email',
        type: 'customer_welcome',
        subject: 'Welcome to Georgia Used Cars',
        content: 'Dear {{customer_name}},\n\nWelcome to Georgia Used Cars!',
        variables: ['customer_name', 'customer_email'],
        is_active: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ],
    settings: {
      smtp_host: 'smtp.example.com',
      smtp_port: 587,
      smtp_username: 'noreply@georgiaused.com',
      smtp_password: '***hidden***',
      from_name: 'Georgia Used Cars',
      from_email: 'noreply@georgiaused.com',
      reply_to: 'support@georgiaused.com',
      use_tls: true
    }
  }

  it('should render email templates page', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockEmailTemplates
      })
    })

    render(<EmailTemplatesPage />)
    
    expect(screen.getByText('Email Templates')).toBeInTheDocument()
    expect(screen.getByText('Manage email templates and SMTP settings')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('Invoice Notification')).toBeInTheDocument()
    })
  })

  it('should display email templates list', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockEmailTemplates
      })
    })

    render(<EmailTemplatesPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Invoice Notification')).toBeInTheDocument()
      expect(screen.getByText('Payment Confirmation')).toBeInTheDocument()
      expect(screen.getByText('Welcome Email')).toBeInTheDocument()
      
      // Check template types
      expect(screen.getByText('invoice_notification')).toBeInTheDocument()
      expect(screen.getByText('payment_confirmation')).toBeInTheDocument()
      expect(screen.getByText('customer_welcome')).toBeInTheDocument()
    })
  })

  it('should show template status (active/inactive)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockEmailTemplates
      })
    })

    render(<EmailTemplatesPage />)
    
    await waitFor(() => {
      const activeLabels = screen.getAllByText('Active')
      const inactiveLabels = screen.getAllByText('Inactive')
      
      expect(activeLabels).toHaveLength(2) // Invoice and Payment templates
      expect(inactiveLabels).toHaveLength(1) // Welcome template
    })
  })

  it('should handle editing email template', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockEmailTemplates
      })
    })

    render(<EmailTemplatesPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Invoice Notification')).toBeInTheDocument()
    })

    const editButton = screen.getAllByRole('button', { name: /edit/i })[0]
    fireEvent.click(editButton)

    expect(screen.getByText('Edit Email Template')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Invoice Notification')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Your Invoice from Georgia Used Cars - {{invoice_number}}')).toBeInTheDocument()
  })

  it('should validate template form fields', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockEmailTemplates
      })
    })

    render(<EmailTemplatesPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Invoice Notification')).toBeInTheDocument()
    })

    const editButton = screen.getAllByRole('button', { name: /edit/i })[0]
    fireEvent.click(editButton)

    // Clear required fields
    const nameInput = screen.getByDisplayValue('Invoice Notification')
    fireEvent.change(nameInput, { target: { value: '' } })

    const subjectInput = screen.getByDisplayValue('Your Invoice from Georgia Used Cars - {{invoice_number}}')
    fireEvent.change(subjectInput, { target: { value: '' } })

    const saveButton = screen.getByRole('button', { name: /save template/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Template name is required')).toBeInTheDocument()
      expect(screen.getByText('Subject is required')).toBeInTheDocument()
    })
  })

  it('should handle template preview', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockEmailTemplates
      })
    })

    render(<EmailTemplatesPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Invoice Notification')).toBeInTheDocument()
    })

    const previewButton = screen.getAllByRole('button', { name: /preview/i })[0]
    fireEvent.click(previewButton)

    expect(screen.getByText('Template Preview')).toBeInTheDocument()
    expect(screen.getByText('Available Variables:')).toBeInTheDocument()
    expect(screen.getByText('customer_name')).toBeInTheDocument()
    expect(screen.getByText('invoice_number')).toBeInTheDocument()
  })

  it('should handle sending test email', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockEmailTemplates
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Test email sent successfully'
        })
      })

    render(<EmailTemplatesPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Invoice Notification')).toBeInTheDocument()
    })

    const testButton = screen.getAllByRole('button', { name: /test/i })[0]
    fireEvent.click(testButton)

    expect(screen.getByText('Send Test Email')).toBeInTheDocument()
    
    const emailInput = screen.getByLabelText(/test email address/i)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    const sendButton = screen.getByRole('button', { name: /send test/i })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/settings/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: 'template-1',
          test_email: 'test@example.com'
        })
      })
    })
  })

  it('should handle template activation/deactivation', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockEmailTemplates
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { ...mockEmailTemplates.templates[2], is_active: true }
        })
      })

    render(<EmailTemplatesPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Welcome Email')).toBeInTheDocument()
    })

    // Find the toggle for Welcome Email (inactive template)
    const welcomeRow = screen.getByText('Welcome Email').closest('tr')
    const toggleButton = welcomeRow?.querySelector('button[role="switch"]')
    
    if (toggleButton) {
      fireEvent.click(toggleButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/settings/emails/template-3', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_active: true
          })
        })
      })
    }
  })

  it('should display SMTP settings', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockEmailTemplates
      })
    })

    render(<EmailTemplatesPage />)
    
    await waitFor(() => {
      expect(screen.getByText('SMTP Settings')).toBeInTheDocument()
      expect(screen.getByDisplayValue('smtp.example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('587')).toBeInTheDocument()
      expect(screen.getByDisplayValue('noreply@georgiaused.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Georgia Used Cars')).toBeInTheDocument()
    })
  })

  it('should validate SMTP settings', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockEmailTemplates
      })
    })

    render(<EmailTemplatesPage />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('smtp.example.com')).toBeInTheDocument()
    })

    const smtpHostInput = screen.getByDisplayValue('smtp.example.com')
    fireEvent.change(smtpHostInput, { target: { value: '' } })

    const fromEmailInput = screen.getByDisplayValue('noreply@georgiaused.com')
    fireEvent.change(fromEmailInput, { target: { value: 'invalid-email' } })

    const saveButton = screen.getByRole('button', { name: /save smtp settings/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('SMTP host is required')).toBeInTheDocument()
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('should handle testing SMTP connection', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockEmailTemplates
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'SMTP connection successful'
        })
      })

    render(<EmailTemplatesPage />)
    
    await waitFor(() => {
      expect(screen.getByText('SMTP Settings')).toBeInTheDocument()
    })

    const testConnectionButton = screen.getByRole('button', { name: /test connection/i })
    fireEvent.click(testConnectionButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/settings/emails/test-connection', {
        method: 'POST'
      })
    })

    expect(screen.getByText('SMTP connection successful')).toBeInTheDocument()
  })

  it('should handle creating new template', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockEmailTemplates
      })
    })

    render(<EmailTemplatesPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Email Templates')).toBeInTheDocument()
    })

    const addTemplateButton = screen.getByRole('button', { name: /add template/i })
    fireEvent.click(addTemplateButton)

    expect(screen.getByText('Create Email Template')).toBeInTheDocument()
    expect(screen.getByLabelText(/template name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/template type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument()
  })

  it('should handle deleting template', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockEmailTemplates
      })
    })

    render(<EmailTemplatesPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Welcome Email')).toBeInTheDocument()
    })

    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[2] // Welcome Email
    fireEvent.click(deleteButton)

    expect(screen.getByText('Confirm Deletion')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete this email template?')).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', { name: /delete template/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/settings/emails/template-3', {
        method: 'DELETE'
      })
    })
  })

  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<EmailTemplatesPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load email templates')).toBeInTheDocument()
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

    render(<EmailTemplatesPage />)
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText('You do not have permission to manage email templates')).toBeInTheDocument()
  })

  it('should show loading state', async () => {
    let resolveFetch: (value: any) => void
    const fetchPromise = new Promise(resolve => {
      resolveFetch = resolve
    })

    global.fetch = vi.fn().mockReturnValue(fetchPromise)

    render(<EmailTemplatesPage />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    resolveFetch({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockEmailTemplates
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Invoice Notification')).toBeInTheDocument()
    })
  })
})