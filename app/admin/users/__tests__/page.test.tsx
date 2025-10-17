import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UsersPage from '../page'

// Mock Next.js router
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh
  })
}))

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
      }))
    })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null }))
  }
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))

describe('Users Management Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ 
            data: [], 
            error: null, 
            count: 0 
          }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })
  })

  describe('Page Structure', () => {
    it('should render page title and description', async () => {
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /users management/i })).toBeInTheDocument()
        expect(screen.getByText(/manage system users and their permissions/i)).toBeInTheDocument()
      })
    })

    it('should render add user button', async () => {
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument()
      })
    })

    it('should render search functionality', async () => {
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search users/i)).toBeInTheDocument()
      })
    })

    it('should render filter controls', async () => {
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/role filter/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/status filter/i)).toBeInTheDocument()
      })
    })
  })

  describe('Users Table', () => {
    const mockUsers = [
      {
        id: '1',
        email: 'admin@example.com',
        full_name: 'Admin User',
        role: 'admin',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        last_login: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        email: 'manager@example.com',
        full_name: 'Manager User',
        role: 'manager',
        status: 'active',
        created_at: '2024-01-02T00:00:00Z',
        last_login: '2024-01-14T09:15:00Z'
      },
      {
        id: '3',
        email: 'staff@example.com',
        full_name: 'Staff User',
        role: 'staff',
        status: 'inactive',
        created_at: '2024-01-03T00:00:00Z',
        last_login: '2024-01-10T14:45:00Z'
      }
    ]

    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ 
              data: mockUsers, 
              error: null, 
              count: mockUsers.length 
            }))
          }))
        })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })
    })

    it('should display users table with headers', async () => {
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByText(/name/i)).toBeInTheDocument()
        expect(screen.getByText(/email/i)).toBeInTheDocument()
        expect(screen.getByText(/role/i)).toBeInTheDocument()
        expect(screen.getByText(/status/i)).toBeInTheDocument()
        expect(screen.getByText(/last login/i)).toBeInTheDocument()
        expect(screen.getByText(/actions/i)).toBeInTheDocument()
      })
    })

    it('should display user data in table', async () => {
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument()
        expect(screen.getByText('admin@example.com')).toBeInTheDocument()
        expect(screen.getByText('Manager User')).toBeInTheDocument()
        expect(screen.getByText('manager@example.com')).toBeInTheDocument()
        expect(screen.getByText('Staff User')).toBeInTheDocument()
        expect(screen.getByText('staff@example.com')).toBeInTheDocument()
      })
    })

    it('should display role badges', async () => {
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument()
        expect(screen.getByText('Manager')).toBeInTheDocument()
        expect(screen.getByText('Staff')).toBeInTheDocument()
      })
    })

    it('should display status badges', async () => {
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getAllByText('Active')).toHaveLength(2)
        expect(screen.getByText('Inactive')).toBeInTheDocument()
      })
    })

    it('should display action buttons for each user', async () => {
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(3)
        expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(3)
      })
    })

    it('should display last login dates', async () => {
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByText(/jan 15, 2024/i)).toBeInTheDocument()
        expect(screen.getByText(/jan 14, 2024/i)).toBeInTheDocument()
        expect(screen.getByText(/jan 10, 2024/i)).toBeInTheDocument()
      })
    })
  })

  describe('Add User Functionality', () => {
    it('should open add user dialog when button is clicked', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add user/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/add new user/i)).toBeInTheDocument()
      })
    })

    it('should display add user form fields', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      await user.click(screen.getByRole('button', { name: /add user/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/role/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      })
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      await user.click(screen.getByRole('button', { name: /add user/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /create user/i }))

      await waitFor(() => {
        expect(screen.getByText(/full name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      await user.click(screen.getByRole('button', { name: /add user/i }))

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'invalid-email')

      await user.click(screen.getByRole('button', { name: /create user/i }))

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
    })

    it('should validate password strength', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      await user.click(screen.getByRole('button', { name: /add user/i }))

      const passwordInput = screen.getByLabelText(/password/i)
      await user.type(passwordInput, '123')

      await user.click(screen.getByRole('button', { name: /create user/i }))

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
      })
    })

    it('should submit valid user data', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      await user.click(screen.getByRole('button', { name: /add user/i }))

      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      
      const roleSelect = screen.getByLabelText(/role/i)
      await user.click(roleSelect)
      const staffOption = await screen.findByText('Staff')
      await user.click(staffOption)

      await user.click(screen.getByRole('button', { name: /create user/i }))

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('users')
      })
    })

    it('should close dialog after successful submission', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      await user.click(screen.getByRole('button', { name: /add user/i }))

      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')

      await user.click(screen.getByRole('button', { name: /create user/i }))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edit User Functionality', () => {
    const mockUsers = [
      {
        id: '1',
        email: 'admin@example.com',
        full_name: 'Admin User',
        role: 'admin',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        last_login: '2024-01-15T10:30:00Z'
      }
    ]

    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ 
              data: mockUsers, 
              error: null, 
              count: mockUsers.length 
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })
    })

    it('should open edit dialog when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /edit/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/edit user/i)).toBeInTheDocument()
      })
    })

    it('should populate form with existing user data', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      await user.click(screen.getByRole('button', { name: /edit/i }))

      await waitFor(() => {
        expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument()
        expect(screen.getByDisplayValue('admin@example.com')).toBeInTheDocument()
      })
    })

    it('should update user data on form submission', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      await user.click(screen.getByRole('button', { name: /edit/i }))

      const nameInput = screen.getByDisplayValue('Admin User')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Admin')

      await user.click(screen.getByRole('button', { name: /update user/i }))

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('users')
      })
    })

    it('should not allow editing email address', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      await user.click(screen.getByRole('button', { name: /edit/i }))

      await waitFor(() => {
        const emailInput = screen.getByDisplayValue('admin@example.com')
        expect(emailInput).toBeDisabled()
      })
    })
  })

  describe('Delete User Functionality', () => {
    const mockUsers = [
      {
        id: '1',
        email: 'admin@example.com',
        full_name: 'Admin User',
        role: 'admin',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        last_login: '2024-01-15T10:30:00Z'
      }
    ]

    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ 
              data: mockUsers, 
              error: null, 
              count: mockUsers.length 
            }))
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })
    })

    it('should show confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /delete/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/delete user/i)).toBeInTheDocument()
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      })
    })

    it('should show user details in confirmation dialog', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      await user.click(screen.getByRole('button', { name: /delete/i }))

      await waitFor(() => {
        expect(screen.getByText(/admin user/i)).toBeInTheDocument()
        expect(screen.getByText(/admin@example.com/i)).toBeInTheDocument()
      })
    })

    it('should cancel deletion when cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      await user.click(screen.getByRole('button', { name: /delete/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should delete user when confirmed', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      await user.click(screen.getByRole('button', { name: /delete/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete user/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /delete user/i }))

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('users')
      })
    })
  })

  describe('Search and Filter Functionality', () => {
    const mockFilteredUsers = [
      {
        id: '1',
        email: 'admin@example.com',
        full_name: 'Admin User',
        role: 'admin',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        last_login: '2024-01-15T10:30:00Z'
      }
    ]

    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ 
              data: mockFilteredUsers, 
              error: null, 
              count: mockFilteredUsers.length 
            }))
          }))
        })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })
    })

    it('should filter users by search term', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      const searchInput = screen.getByPlaceholderText(/search users/i)
      await user.type(searchInput, 'admin')

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('users')
      })
    })

    it('should filter users by role', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      const roleFilter = screen.getByLabelText(/role filter/i)
      await user.click(roleFilter)
      
      const adminOption = await screen.findByText('Admin')
      await user.click(adminOption)

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('users')
      })
    })

    it('should filter users by status', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      const statusFilter = screen.getByLabelText(/status filter/i)
      await user.click(statusFilter)
      
      const activeOption = await screen.findByText('Active')
      await user.click(activeOption)

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('users')
      })
    })

    it('should clear search when clear button is clicked', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      const searchInput = screen.getByPlaceholderText(/search users/i)
      await user.type(searchInput, 'admin')

      const clearButton = screen.getByRole('button', { name: /clear search/i })
      await user.click(clearButton)

      await waitFor(() => {
        expect(searchInput).toHaveValue('')
      })
    })
  })

  describe('Pagination', () => {
    const mockManyUsers = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      email: `user${i + 1}@example.com`,
      full_name: `User ${i + 1}`,
      role: 'staff',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      last_login: '2024-01-15T10:30:00Z'
    }))

    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ 
              data: mockManyUsers.slice(0, 10), 
              error: null, 
              count: mockManyUsers.length 
            }))
          }))
        })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })
    })

    it('should display pagination controls', async () => {
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
      })
    })

    it('should disable previous button on first page', async () => {
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
      })
    })

    it('should navigate to next page', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('users')
      })
    })

    it('should display total count', async () => {
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByText(/showing 1-10 of 25 users/i)).toBeInTheDocument()
      })
    })
  })

  describe('Loading and Error States', () => {
    it('should show loading state while fetching users', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => new Promise(() => {})) // Never resolves
          }))
        })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })

      render(<UsersPage />)

      expect(screen.getByText(/loading users/i)).toBeInTheDocument()
    })

    it('should show error state when fetching fails', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ 
              data: null, 
              error: { message: 'Database error' } 
            }))
          }))
        })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })

      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByText(/error loading users/i)).toBeInTheDocument()
        expect(screen.getByText(/database error/i)).toBeInTheDocument()
      })
    })

    it('should show empty state when no users found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ 
              data: [], 
              error: null, 
              count: 0 
            }))
          }))
        })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })

      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByText(/no users found/i)).toBeInTheDocument()
        expect(screen.getByText(/get started by adding your first user/i)).toBeInTheDocument()
      })
    })
  })

  describe('Permissions and Security', () => {
    it('should not allow editing current user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: '1' } }, 
        error: null 
      })

      const mockUsers = [
        {
          id: '1',
          email: 'current@example.com',
          full_name: 'Current User',
          role: 'admin',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          last_login: '2024-01-15T10:30:00Z'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ 
              data: mockUsers, 
              error: null, 
              count: mockUsers.length 
            }))
          }))
        })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })

      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByText('Current User')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
      })
    })

    it('should show appropriate role options based on current user role', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      await user.click(screen.getByRole('button', { name: /add user/i }))

      const roleSelect = screen.getByLabelText(/role/i)
      await user.click(roleSelect)

      await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument()
        expect(screen.getByText('Manager')).toBeInTheDocument()
        expect(screen.getByText('Staff')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    it('should render mobile-friendly layout', async () => {
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /users management/i })).toBeInTheDocument()
        expect(document.querySelector('.overflow-x-auto')).toBeInTheDocument()
      })
    })
  })
})