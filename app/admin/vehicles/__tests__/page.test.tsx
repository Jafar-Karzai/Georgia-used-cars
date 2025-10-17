import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VehiclesPage from '../page'
import { VehicleService } from '@/lib/services/vehicles'
import type { Vehicle } from '@/types/database'

// Mock services
vi.mock('@/lib/services/vehicles')

// Mock auth context
vi.mock('@/lib/auth/context', () => ({
  useAuth: vi.fn(() => ({
    hasPermission: vi.fn(() => true),
    user: { id: 'user-123', role: 'admin' }
  }))
}))

// Mock vehicle card component
vi.mock('@/components/vehicles/vehicle-card', () => ({
  VehicleCard: ({ vehicle, onViewDetails, onEdit }: any) => (
    <div data-testid={`vehicle-card-${vehicle.id}`}>
      <h3>{vehicle.year} {vehicle.make} {vehicle.model}</h3>
      <p>Status: {vehicle.current_status}</p>
      <p>VIN: {vehicle.vin}</p>
      {onViewDetails && (
        <button onClick={() => onViewDetails(vehicle)}>View Details</button>
      )}
      {onEdit && (
        <button onClick={() => onEdit(vehicle)}>Edit</button>
      )}
    </div>
  )
}))

const mockVehicleService = VehicleService as any

const mockVehicles: Vehicle[] = [
  {
    id: 'vehicle-1',
    vin: '1HGBH41JXMN109186',
    year: 2021,
    make: 'Honda',
    model: 'Civic',
    current_status: 'at_yard',
    auction_house: 'Copart',
    purchase_price: 18000,
    purchase_currency: 'USD',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'vehicle-2',
    vin: '4T1BF1FK5CU123456',
    year: 2020,
    make: 'Toyota',
    model: 'Camry',
    current_status: 'ready_for_sale',
    auction_house: 'IAAI',
    purchase_price: 25000,
    purchase_currency: 'USD',
    created_at: '2024-01-16T00:00:00Z',
    updated_at: '2024-01-16T00:00:00Z'
  }
]

const mockStatistics = {
  total: 150,
  recentAdditions: 8,
  byStatus: [
    { current_status: 'ready_for_sale', count: 25 },
    { current_status: 'in_transit', count: 15 },
    { current_status: 'at_yard', count: 40 }
  ]
}

describe('VehiclesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock responses
    mockVehicleService.getAll.mockResolvedValue({
      success: true,
      data: mockVehicles,
      pagination: { page: 1, limit: 12, total: 2, pages: 1 }
    })
    
    mockVehicleService.getStatistics.mockResolvedValue({
      success: true,
      data: mockStatistics
    })
  })

  describe('Page Structure and Loading', () => {
    it('should render page title and description', async () => {
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Vehicle Inventory')).toBeInTheDocument()
        expect(screen.getByText('Manage your vehicle inventory and track status')).toBeInTheDocument()
      })
    })

    it('should show loading skeleton when initially loading', () => {
      // Mock delayed response
      mockVehicleService.getAll.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: mockVehicles,
          pagination: { page: 1, limit: 12, total: 2, pages: 1 }
        }), 100))
      )
      
      render(<VehiclesPage />)
      
      // Should show loading skeleton
      expect(screen.getAllByRole('generic')).toHaveLength(6) // 6 skeleton cards
    })

    it('should display Add Vehicle button for users with manage_vehicles permission', async () => {
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Add Vehicle')).toBeInTheDocument()
      })
    })

    it('should not display Add Vehicle button for users without permission', async () => {
      // Mock user without permission
      vi.mocked(require('@/lib/auth/context').useAuth).mockReturnValue({
        hasPermission: vi.fn(() => false),
        user: { id: 'user-123', role: 'viewer' }
      })
      
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.queryByText('Add Vehicle')).not.toBeInTheDocument()
      })
    })
  })

  describe('Statistics Cards', () => {
    it('should display statistics cards when data is available', async () => {
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Total Vehicles')).toBeInTheDocument()
        expect(screen.getByText('150')).toBeInTheDocument()
        expect(screen.getByText('Ready for Sale')).toBeInTheDocument()
        expect(screen.getByText('25')).toBeInTheDocument()
        expect(screen.getByText('In Transit')).toBeInTheDocument()
        expect(screen.getByText('Recent Additions')).toBeInTheDocument()
        expect(screen.getByText('8')).toBeInTheDocument()
      })
    })

    it('should calculate in transit vehicles correctly', async () => {
      render(<VehiclesPage />)
      
      await waitFor(() => {
        // Should show sum of in_transit + any other shipping statuses
        expect(screen.getByText('15')).toBeInTheDocument()
      })
    })

    it('should not display statistics cards when data is not available', async () => {
      mockVehicleService.getStatistics.mockResolvedValue({
        success: true,
        data: null
      })
      
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.queryByText('Total Vehicles')).not.toBeInTheDocument()
      })
    })
  })

  describe('Search and Filtering', () => {
    it('should render search input and filter controls', async () => {
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by VIN, make, model...')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
        expect(screen.getByRole('combobox')).toBeInTheDocument() // Status filter
      })
    })

    it('should perform search when search button is clicked', async () => {
      const user = userEvent.setup()
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by VIN, make, model...')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText('Search by VIN, make, model...')
      const searchButton = screen.getByRole('button', { name: /search/i })
      
      await user.type(searchInput, 'Honda')
      await user.click(searchButton)
      
      expect(mockVehicleService.getAll).toHaveBeenCalledWith(
        { search: 'Honda' },
        1,
        12
      )
    })

    it('should perform search when Enter key is pressed', async () => {
      const user = userEvent.setup()
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by VIN, make, model...')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText('Search by VIN, make, model...')
      
      await user.type(searchInput, 'Toyota')
      await user.keyboard('{Enter}')
      
      expect(mockVehicleService.getAll).toHaveBeenCalledWith(
        { search: 'Toyota' },
        1,
        12
      )
    })

    it('should filter by status when status filter is changed', async () => {
      const user = userEvent.setup()
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
      
      const statusSelect = screen.getByRole('combobox')
      await user.click(statusSelect)
      
      // Select 'ready_for_sale' status
      await waitFor(() => {
        expect(screen.getByText('Ready for Sale')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Ready for Sale'))
      
      expect(mockVehicleService.getAll).toHaveBeenCalledWith(
        { status: 'ready_for_sale' },
        1,
        12
      )
    })

    it('should reset page to 1 when applying filters', async () => {
      const user = userEvent.setup()
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by VIN, make, model...')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText('Search by VIN, make, model...')
      await user.type(searchInput, 'test')
      await user.keyboard('{Enter}')
      
      // Should call with page 1
      expect(mockVehicleService.getAll).toHaveBeenLastCalledWith(
        { search: 'test' },
        1,
        12
      )
    })
  })

  describe('Vehicle Grid Display', () => {
    it('should display vehicle cards when vehicles are loaded', async () => {
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('vehicle-card-vehicle-1')).toBeInTheDocument()
        expect(screen.getByTestId('vehicle-card-vehicle-2')).toBeInTheDocument()
        expect(screen.getByText('2021 Honda Civic')).toBeInTheDocument()
        expect(screen.getByText('2020 Toyota Camry')).toBeInTheDocument()
      })
    })

    it('should display no vehicles message when list is empty', async () => {
      mockVehicleService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 12, total: 0, pages: 0 }
      })
      
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('No vehicles found')).toBeInTheDocument()
      })
    })

    it('should display filtered message when no vehicles match filters', async () => {
      mockVehicleService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 12, total: 0, pages: 0 }
      })
      
      const user = userEvent.setup()
      render(<VehiclesPage />)
      
      // Apply a search filter first
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by VIN, make, model...')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText('Search by VIN, make, model...')
      await user.type(searchInput, 'nonexistent')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('No vehicles match your filters')).toBeInTheDocument()
      })
    })

    it('should show Add Your First Vehicle button when no vehicles and user has permission', async () => {
      mockVehicleService.getAll.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 12, total: 0, pages: 0 }
      })
      
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Add Your First Vehicle')).toBeInTheDocument()
      })
    })
  })

  describe('Pagination', () => {
    it('should display pagination when there are multiple pages', async () => {
      mockVehicleService.getAll.mockResolvedValue({
        success: true,
        data: mockVehicles,
        pagination: { page: 1, limit: 12, total: 24, pages: 2 }
      })
      
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
        expect(screen.getByText('Previous')).toBeInTheDocument()
        expect(screen.getByText('Next')).toBeInTheDocument()
      })
    })

    it('should not display pagination when there is only one page', async () => {
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.queryByText('Previous')).not.toBeInTheDocument()
        expect(screen.queryByText('Next')).not.toBeInTheDocument()
      })
    })

    it('should disable Previous button on first page', async () => {
      mockVehicleService.getAll.mockResolvedValue({
        success: true,
        data: mockVehicles,
        pagination: { page: 1, limit: 12, total: 24, pages: 2 }
      })
      
      render(<VehiclesPage />)
      
      await waitFor(() => {
        const prevButton = screen.getByText('Previous')
        expect(prevButton).toBeDisabled()
      })
    })

    it('should disable Next button on last page', async () => {
      mockVehicleService.getAll.mockResolvedValue({
        success: true,
        data: mockVehicles,
        pagination: { page: 2, limit: 12, total: 24, pages: 2 }
      })
      
      render(<VehiclesPage />)
      
      await waitFor(() => {
        const nextButton = screen.getByText('Next')
        expect(nextButton).toBeDisabled()
      })
    })

    it('should navigate to next page when Next button is clicked', async () => {
      mockVehicleService.getAll.mockResolvedValue({
        success: true,
        data: mockVehicles,
        pagination: { page: 1, limit: 12, total: 24, pages: 2 }
      })
      
      const user = userEvent.setup()
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument()
      })
      
      const nextButton = screen.getByText('Next')
      await user.click(nextButton)
      
      // Should be called twice: once on mount, once on page change
      expect(mockVehicleService.getAll).toHaveBeenCalledTimes(2)
    })

    it('should navigate to previous page when Previous button is clicked', async () => {
      mockVehicleService.getAll.mockResolvedValue({
        success: true,
        data: mockVehicles,
        pagination: { page: 2, limit: 12, total: 24, pages: 2 }
      })
      
      const user = userEvent.setup()
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument()
      })
      
      const prevButton = screen.getByText('Previous')
      await user.click(prevButton)
      
      expect(mockVehicleService.getAll).toHaveBeenCalledTimes(2)
    })
  })

  describe('Vehicle Card Actions', () => {
    it('should handle view details action', async () => {
      // Mock window.location.href
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true
      })
      
      const user = userEvent.setup()
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('vehicle-card-vehicle-1')).toBeInTheDocument()
      })
      
      const viewButton = screen.getAllByText('View Details')[0]
      await user.click(viewButton)
      
      expect(window.location.href).toBe('/admin/vehicles/vehicle-1')
    })

    it('should handle edit action for users with permission', async () => {
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true
      })
      
      const user = userEvent.setup()
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('vehicle-card-vehicle-1')).toBeInTheDocument()
      })
      
      const editButton = screen.getAllByText('Edit')[0]
      await user.click(editButton)
      
      expect(window.location.href).toBe('/admin/vehicles/vehicle-1/edit')
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockVehicleService.getAll.mockResolvedValue({
        success: false,
        error: 'Failed to fetch vehicles'
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load vehicles:', 'Failed to fetch vehicles')
      })
      
      consoleSpy.mockRestore()
    })

    it('should handle statistics loading errors gracefully', async () => {
      mockVehicleService.getStatistics.mockResolvedValue({
        success: false,
        error: 'Failed to fetch statistics'
      })
      
      render(<VehiclesPage />)
      
      await waitFor(() => {
        // Should still render the page without statistics
        expect(screen.getByText('Vehicle Inventory')).toBeInTheDocument()
        expect(screen.queryByText('Total Vehicles')).not.toBeInTheDocument()
      })
    })
  })

  describe('Data Refresh', () => {
    it('should reload data when filters change', async () => {
      const user = userEvent.setup()
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(mockVehicleService.getAll).toHaveBeenCalledTimes(1)
      })
      
      // Change status filter
      const statusSelect = screen.getByRole('combobox')
      await user.click(statusSelect)
      
      await waitFor(() => {
        expect(screen.getByText('At Yard')).toBeInTheDocument()
      })
      await user.click(screen.getByText('At Yard'))
      
      // Should be called again with new filter
      expect(mockVehicleService.getAll).toHaveBeenCalledTimes(2)
      expect(mockVehicleService.getAll).toHaveBeenLastCalledWith(
        { status: 'at_yard' },
        1,
        12
      )
    })

    it('should reload statistics when filters change', async () => {
      const user = userEvent.setup()
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(mockVehicleService.getStatistics).toHaveBeenCalledTimes(1)
      })
      
      // Change status filter
      const statusSelect = screen.getByRole('combobox')
      await user.click(statusSelect)
      
      await waitFor(() => {
        expect(screen.getByText('At Yard')).toBeInTheDocument()
      })
      await user.click(screen.getByText('At Yard'))
      
      // Should reload statistics
      expect(mockVehicleService.getStatistics).toHaveBeenCalledTimes(2)
    })
  })

  describe('Navigation', () => {
    it('should navigate to add vehicle page when Add Vehicle button is clicked', async () => {
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true
      })
      
      const user = userEvent.setup()
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Add Vehicle')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('Add Vehicle'))
      expect(window.location.href).toBe('/admin/vehicles/new')
    })
  })

  describe('Responsive Design', () => {
    it('should display grid with appropriate breakpoints', async () => {
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('vehicle-card-vehicle-1')).toBeInTheDocument()
      })
      
      const grid = screen.getByTestId('vehicle-card-vehicle-1').closest('.grid')
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4')
    })
  })

  describe('Loading States', () => {
    it('should maintain loading state consistency', async () => {
      const user = userEvent.setup()
      render(<VehiclesPage />)
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('vehicle-card-vehicle-1')).toBeInTheDocument()
      })
      
      // Trigger a search that causes loading
      const searchInput = screen.getByPlaceholderText('Search by VIN, make, model...')
      await user.type(searchInput, 'Honda')
      await user.keyboard('{Enter}')
      
      // Should maintain data while loading new results
      expect(screen.getByTestId('vehicle-card-vehicle-1')).toBeInTheDocument()
    })
  })

  describe('Performance Optimizations', () => {
    it('should not reload statistics unnecessarily on page change', async () => {
      mockVehicleService.getAll.mockResolvedValue({
        success: true,
        data: mockVehicles,
        pagination: { page: 1, limit: 12, total: 24, pages: 2 }
      })
      
      const user = userEvent.setup()
      render(<VehiclesPage />)
      
      await waitFor(() => {
        expect(mockVehicleService.getStatistics).toHaveBeenCalledTimes(1)
      })
      
      // Navigate to next page
      const nextButton = screen.getByText('Next')
      await user.click(nextButton)
      
      // Statistics should not be reloaded on pagination
      expect(mockVehicleService.getStatistics).toHaveBeenCalledTimes(1)
    })
  })
})