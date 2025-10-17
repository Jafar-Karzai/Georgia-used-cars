import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusTracker } from '../status-tracker'
import { VehicleService } from '@/lib/services/vehicles'
import type { VehicleStatus } from '@/types/database'

// Mock services
vi.mock('@/lib/services/vehicles')

// Mock auth context
vi.mock('@/lib/auth/context', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123', full_name: 'John Doe' }
  }))
}))

const mockVehicleService = VehicleService as any

const mockStatusHistory = [
  {
    id: 'history-1',
    status: 'auction_won' as VehicleStatus,
    location: 'Atlanta, GA',
    notes: 'Vehicle purchased at auction',
    changed_at: '2024-01-15T10:00:00Z',
    changed_by: 'user-456',
    profiles: { full_name: 'Jane Smith' }
  },
  {
    id: 'history-2',
    status: 'payment_processing' as VehicleStatus,
    location: 'Atlanta, GA',
    notes: 'Payment verification in progress',
    changed_at: '2024-01-16T14:30:00Z',
    changed_by: 'user-123',
    profiles: { full_name: 'John Doe' }
  },
  {
    id: 'history-3',
    status: 'at_yard' as VehicleStatus,
    location: 'Dubai, UAE',
    notes: null,
    changed_at: '2024-01-20T09:15:00Z',
    changed_by: 'user-789',
    profiles: { full_name: 'Mike Wilson' }
  }
]

describe('StatusTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockVehicleService.updateStatus.mockResolvedValue({
      success: true,
      data: {}
    })
  })

  describe('Current Status Display', () => {
    it('should display current status badge with correct styling', () => {
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
          currentLocation="Dubai, UAE"
        />
      )
      
      expect(screen.getByText('At Yard')).toBeInTheDocument()
      const statusBadge = screen.getByText('At Yard')
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('should display current location when provided', () => {
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="in_transit"
          currentLocation="On route to UAE"
        />
      )
      
      expect(screen.getByText('On route to UAE')).toBeInTheDocument()
      // MapPin icon should be present
      const locationDiv = screen.getByText('On route to UAE').closest('div')
      expect(locationDiv).toBeInTheDocument()
    })

    it('should not display location when not provided', () => {
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      expect(screen.queryByText('Dubai, UAE')).not.toBeInTheDocument()
    })

    it('should display Update Status button', () => {
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      expect(screen.getByText('Update Status')).toBeInTheDocument()
    })
  })

  describe('Status Update Dialog', () => {
    it('should open dialog when Update Status button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      
      expect(screen.getByText('Update Vehicle Status')).toBeInTheDocument()
      expect(screen.getByText('Update the current status and location of the vehicle.')).toBeInTheDocument()
    })

    it('should display all form fields in dialog', async () => {
      const user = userEvent.setup()
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      
      expect(screen.getByLabelText('New Status')).toBeInTheDocument()
      expect(screen.getByLabelText('Location (Optional)')).toBeInTheDocument()
      expect(screen.getByLabelText('Notes (Optional)')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Update Status')).toBeInTheDocument()
    })

    it('should populate status select with current status', async () => {
      const user = userEvent.setup()
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      
      const statusSelect = screen.getByRole('combobox')
      expect(statusSelect).toHaveValue('at_yard')
    })

    it('should pre-populate location field with current location', async () => {
      const user = userEvent.setup()
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
          currentLocation="Dubai, UAE"
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      
      const locationInput = screen.getByPlaceholderText('Enter current location')
      expect(locationInput).toHaveValue('Dubai, UAE')
    })

    it('should allow changing status selection', async () => {
      const user = userEvent.setup()
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      
      const statusSelect = screen.getByRole('combobox')
      await user.click(statusSelect)
      
      await waitFor(() => {
        expect(screen.getByText('Ready for Sale')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('Ready for Sale'))
      expect(statusSelect).toHaveValue('ready_for_sale')
    })

    it('should allow updating location', async () => {
      const user = userEvent.setup()
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      
      const locationInput = screen.getByPlaceholderText('Enter current location')
      await user.clear(locationInput)
      await user.type(locationInput, 'Abu Dhabi, UAE')
      
      expect(locationInput).toHaveValue('Abu Dhabi, UAE')
    })

    it('should allow adding notes', async () => {
      const user = userEvent.setup()
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      
      const notesTextarea = screen.getByPlaceholderText('Add any additional notes')
      await user.type(notesTextarea, 'Vehicle ready for inspection')
      
      expect(notesTextarea).toHaveValue('Vehicle ready for inspection')
    })

    it('should close dialog when Cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      expect(screen.getByText('Update Vehicle Status')).toBeInTheDocument()
      
      await user.click(screen.getByText('Cancel'))
      expect(screen.queryByText('Update Vehicle Status')).not.toBeInTheDocument()
    })
  })

  describe('Status Update Functionality', () => {
    it('should call VehicleService.updateStatus with correct parameters', async () => {
      const user = userEvent.setup()
      const onStatusUpdate = vi.fn()
      
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
          currentLocation="Dubai, UAE"
          onStatusUpdate={onStatusUpdate}
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      
      // Change status
      const statusSelect = screen.getByRole('combobox')
      await user.click(statusSelect)
      await waitFor(() => {
        expect(screen.getByText('Ready for Sale')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Ready for Sale'))
      
      // Update location
      const locationInput = screen.getByPlaceholderText('Enter current location')
      await user.clear(locationInput)
      await user.type(locationInput, 'Showroom, Dubai')
      
      // Add notes
      const notesTextarea = screen.getByPlaceholderText('Add any additional notes')
      await user.type(notesTextarea, 'Vehicle ready for sale')
      
      // Submit update
      const updateButton = screen.getAllByText('Update Status')[1] // Second one is in dialog
      await user.click(updateButton)
      
      expect(mockVehicleService.updateStatus).toHaveBeenCalledWith(
        'vehicle-123',
        'ready_for_sale',
        'Showroom, Dubai',
        'Vehicle ready for sale',
        'user-123'
      )
    })

    it('should call onStatusUpdate callback on successful update', async () => {
      const user = userEvent.setup()
      const onStatusUpdate = vi.fn()
      
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
          onStatusUpdate={onStatusUpdate}
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      
      const updateButton = screen.getAllByText('Update Status')[1]
      await user.click(updateButton)
      
      await waitFor(() => {
        expect(onStatusUpdate).toHaveBeenCalled()
      })
    })

    it('should close dialog on successful update', async () => {
      const user = userEvent.setup()
      
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      expect(screen.getByText('Update Vehicle Status')).toBeInTheDocument()
      
      const updateButton = screen.getAllByText('Update Status')[1]
      await user.click(updateButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Update Vehicle Status')).not.toBeInTheDocument()
      })
    })

    it('should clear notes field on successful update', async () => {
      const user = userEvent.setup()
      
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      
      const notesTextarea = screen.getByPlaceholderText('Add any additional notes')
      await user.type(notesTextarea, 'Test notes')
      
      const updateButton = screen.getAllByText('Update Status')[1]
      await user.click(updateButton)
      
      // Reopen dialog to check if notes are cleared
      await waitFor(() => {
        expect(screen.queryByText('Update Vehicle Status')).not.toBeInTheDocument()
      })
      
      await user.click(screen.getByText('Update Status'))
      const clearedNotesTextarea = screen.getByPlaceholderText('Add any additional notes')
      expect(clearedNotesTextarea).toHaveValue('')
    })

    it('should show loading state while updating', async () => {
      const user = userEvent.setup()
      
      // Mock a delayed response
      mockVehicleService.updateStatus.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      )
      
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      
      const updateButton = screen.getAllByText('Update Status')[1]
      await user.click(updateButton)
      
      expect(screen.getByText('Updating...')).toBeInTheDocument()
      expect(updateButton).toBeDisabled()
    })

    it('should handle update errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      mockVehicleService.updateStatus.mockResolvedValue({
        success: false,
        error: 'Failed to update status'
      })
      
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      
      const updateButton = screen.getAllByText('Update Status')[1]
      await user.click(updateButton)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update status:', 'Failed to update status')
      })
      
      consoleSpy.mockRestore()
    })

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      mockVehicleService.updateStatus.mockRejectedValue(new Error('Network error'))
      
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      
      const updateButton = screen.getAllByText('Update Status')[1]
      await user.click(updateButton)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error updating status:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })

    it('should not update when user is not available', async () => {
      // Mock no user
      const mockUseAuth = vi.mocked(await import('@/lib/auth/context')).useAuth as any
      mockUseAuth.mockReturnValue({
        user: null
      })
      
      const user = userEvent.setup()
      
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      
      const updateButton = screen.getAllByText('Update Status')[1]
      await user.click(updateButton)
      
      expect(mockVehicleService.updateStatus).not.toHaveBeenCalled()
    })
  })

  describe('Status History Display', () => {
    it('should display status history when provided', () => {
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
          statusHistory={mockStatusHistory}
        />
      )
      
      expect(screen.getByText('Status History')).toBeInTheDocument()
    })

    it('should not display status history when empty', () => {
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
          statusHistory={[]}
        />
      )
      
      expect(screen.queryByText('Status History')).not.toBeInTheDocument()
    })

    it('should display all history entries', () => {
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
          statusHistory={mockStatusHistory}
        />
      )
      
      expect(screen.getByText('Auction Won')).toBeInTheDocument()
      expect(screen.getByText('Payment Processing')).toBeInTheDocument()
      expect(screen.getByText('At Yard')).toBeInTheDocument()
    })

    it('should display formatted dates for history entries', () => {
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
          statusHistory={mockStatusHistory}
        />
      )
      
      // Check that dates are formatted and displayed (may vary by locale)
      expect(screen.getByText(/2024/)).toBeInTheDocument()
    })

    it('should display user names for history entries when available', () => {
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
          statusHistory={mockStatusHistory}
        />
      )
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Mike Wilson')).toBeInTheDocument()
    })

    it('should display locations for history entries when available', () => {
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
          statusHistory={mockStatusHistory}
        />
      )
      
      expect(screen.getAllByText('Atlanta, GA')).toHaveLength(2)
      expect(screen.getByText('Dubai, UAE')).toBeInTheDocument()
    })

    it('should display notes for history entries when available', () => {
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
          statusHistory={mockStatusHistory}
        />
      )
      
      expect(screen.getByText('Vehicle purchased at auction')).toBeInTheDocument()
      expect(screen.getByText('Payment verification in progress')).toBeInTheDocument()
    })

    it('should handle history entries without notes', () => {
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
          statusHistory={mockStatusHistory}
        />
      )
      
      // Should not crash and should still display the entry without notes
      expect(screen.getByText('Mike Wilson')).toBeInTheDocument()
    })

    it('should limit history height with scrolling', () => {
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
          statusHistory={mockStatusHistory}
        />
      )
      
      const historyContainer = screen.getByText('Jane Smith').closest('.space-y-2')
      expect(historyContainer).toHaveClass('max-h-60', 'overflow-y-auto')
    })
  })

  describe('Status Options and Colors', () => {
    it('should display correct labels for all status options', async () => {
      const user = userEvent.setup()
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      
      const statusSelect = screen.getByRole('combobox')
      await user.click(statusSelect)
      
      // Check that all status options are available
      await waitFor(() => {
        expect(screen.getByText('Auction Won')).toBeInTheDocument()
        expect(screen.getByText('Payment Processing')).toBeInTheDocument()
        expect(screen.getByText('Pickup Scheduled')).toBeInTheDocument()
        expect(screen.getByText('Ready for Sale')).toBeInTheDocument()
        expect(screen.getByText('Sold')).toBeInTheDocument()
        expect(screen.getByText('Delivered')).toBeInTheDocument()
      })
    })

    it('should apply correct colors for different statuses', () => {
      const testCases = [
        { status: 'auction_won' as VehicleStatus, expectedClass: 'bg-blue-100 text-blue-800' },
        { status: 'payment_processing' as VehicleStatus, expectedClass: 'bg-yellow-100 text-yellow-800' },
        { status: 'at_yard' as VehicleStatus, expectedClass: 'bg-green-100 text-green-800' },
        { status: 'ready_for_sale' as VehicleStatus, expectedClass: 'bg-purple-100 text-purple-800' },
        { status: 'sold' as VehicleStatus, expectedClass: 'bg-rose-100 text-rose-800' }
      ]
      
      testCases.forEach(({ status, expectedClass }) => {
        const { unmount } = render(
          <StatusTracker
            vehicleId="vehicle-123"
            currentStatus={status}
          />
        )
        
        const statusBadge = screen.getByText(status.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '))
        
        expect(statusBadge).toHaveClass(...expectedClass.split(' '))
        
        unmount()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for form fields', async () => {
      const user = userEvent.setup()
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      
      expect(screen.getByLabelText('New Status')).toBeInTheDocument()
      expect(screen.getByLabelText('Location (Optional)')).toBeInTheDocument()
      expect(screen.getByLabelText('Notes (Optional)')).toBeInTheDocument()
    })

    it('should have accessible button text', () => {
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      expect(screen.getByRole('button', { name: 'Update Status' })).toBeInTheDocument()
    })

    it('should have proper dialog accessibility', async () => {
      const user = userEvent.setup()
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
        />
      )
      
      await user.click(screen.getByText('Update Status'))
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Update Vehicle Status')).toBeInTheDocument()
    })
  })

  describe('Date Formatting', () => {
    it('should format dates correctly for different locales', () => {
      const testHistory = [{
        id: 'test-1',
        status: 'at_yard' as VehicleStatus,
        changed_at: '2024-01-15T14:30:00Z',
        changed_by: 'user-123',
        profiles: { full_name: 'Test User' }
      }]
      
      render(
        <StatusTracker
          vehicleId="vehicle-123"
          currentStatus="at_yard"
          statusHistory={testHistory}
        />
      )
      
      // Should format date using toLocaleString (may vary by locale)
      expect(screen.getByText(/2024/)).toBeInTheDocument()
    })
  })
})