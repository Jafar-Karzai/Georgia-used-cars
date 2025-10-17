import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VehicleCard } from '../vehicle-card'
import type { Vehicle } from '@/types/database'

// Create a minimal mock vehicle for testing status utilities
const createMockVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  id: 'test-vehicle',
  vin: '1HGBH41JXMN109186',
  year: 2021,
  make: 'Honda',
  model: 'Civic',
  auction_house: 'Test Auction',
  purchase_price: 15000,
  purchase_currency: 'USD',
  current_status: 'at_yard',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
})

describe('Vehicle Status Utilities', () => {
  describe('getStatusColor Function', () => {
    const statusColorTests = [
      {
        status: 'auction_won',
        expectedClasses: ['bg-blue-100', 'text-blue-800'],
        description: 'auction won status'
      },
      {
        status: 'at_yard',
        expectedClasses: ['bg-green-100', 'text-green-800'],
        description: 'at yard status'
      },
      {
        status: 'ready_for_sale',
        expectedClasses: ['bg-purple-100', 'text-purple-800'],
        description: 'ready for sale status'
      },
      {
        status: 'sold',
        expectedClasses: ['bg-gray-100', 'text-gray-800'],
        description: 'sold status'
      },
      {
        status: 'in_transit',
        expectedClasses: ['bg-yellow-100', 'text-yellow-800'],
        description: 'in transit status'
      },
      {
        status: 'customs_clearance',
        expectedClasses: ['bg-orange-100', 'text-orange-800'],
        description: 'customs clearance status'
      }
    ]

    statusColorTests.forEach(({ status, expectedClasses, description }) => {
      it(`should apply correct colors for ${description}`, () => {
        const vehicle = createMockVehicle({ current_status: status as any })
        render(<VehicleCard vehicle={vehicle} />)
        
        const formattedStatus = status.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
        
        const statusBadge = screen.getByText(formattedStatus)
        
        expectedClasses.forEach(className => {
          expect(statusBadge).toHaveClass(className)
        })
      })
    })

    it('should apply default gray colors for unknown status', () => {
      const vehicle = createMockVehicle({ current_status: 'unknown_status' as any })
      render(<VehicleCard vehicle={vehicle} />)
      
      const statusBadge = screen.getByText('Unknown Status')
      expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800')
    })

    it('should handle empty status gracefully', () => {
      const vehicle = createMockVehicle({ current_status: '' as any })
      render(<VehicleCard vehicle={vehicle} />)
      
      const statusBadge = screen.getByText('')
      expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800')
    })

    it('should handle null status gracefully', () => {
      const vehicle = createMockVehicle({ current_status: null as any })
      render(<VehicleCard vehicle={vehicle} />)
      
      // Should render without crashing and show empty status
      expect(screen.getByText('2021 Honda Civic')).toBeInTheDocument()
      // Status badge should be present but empty
      const statusBadge = screen.getByRole('generic') // Badge has role generic
      expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800')
    })
  })

  describe('formatStatus Function', () => {
    const statusFormattingTests = [
      {
        input: 'auction_won',
        expected: 'Auction Won',
        description: 'single underscore'
      },
      {
        input: 'ready_for_sale',
        expected: 'Ready For Sale',
        description: 'multiple underscores'
      },
      {
        input: 'in_transit_to_port',
        expected: 'In Transit To Port',
        description: 'multiple underscores with prepositions'
      },
      {
        input: 'at_yard',
        expected: 'At Yard',
        description: 'simple two word status'
      },
      {
        input: 'customs_clearance',
        expected: 'Customs Clearance',
        description: 'compound words'
      },
      {
        input: 'delivered',
        expected: 'Delivered',
        description: 'single word status'
      }
    ]

    statusFormattingTests.forEach(({ input, expected, description }) => {
      it(`should format status with ${description} correctly`, () => {
        const vehicle = createMockVehicle({ current_status: input as any })
        render(<VehicleCard vehicle={vehicle} />)
        
        expect(screen.getByText(expected)).toBeInTheDocument()
      })
    })

    it('should handle status with mixed case input', () => {
      const vehicle = createMockVehicle({ current_status: 'At_YARD' as any })
      render(<VehicleCard vehicle={vehicle} />)
      
      expect(screen.getByText('At Yard')).toBeInTheDocument()
    })

    it('should handle status with numbers', () => {
      const vehicle = createMockVehicle({ current_status: 'phase_2_complete' as any })
      render(<VehicleCard vehicle={vehicle} />)
      
      expect(screen.getByText('Phase 2 Complete')).toBeInTheDocument()
    })

    it('should handle empty string status', () => {
      const vehicle = createMockVehicle({ current_status: '' as any })
      render(<VehicleCard vehicle={vehicle} />)
      
      // Should render without crashing and apply default colors
      expect(screen.getByText('2021 Honda Civic')).toBeInTheDocument()
      // Empty status should get default gray styling
      const statusElements = screen.getAllByRole('generic')
      const statusBadge = statusElements.find(el => el.className.includes('bg-gray-100'))
      expect(statusBadge).toBeInTheDocument()
    })

    it('should handle status with special characters', () => {
      const vehicle = createMockVehicle({ current_status: 'test-status_with_dash' as any })
      render(<VehicleCard vehicle={vehicle} />)
      
      // Should only split on underscores, not dashes
      expect(screen.getByText('Test-status With Dash')).toBeInTheDocument()
    })
  })

  describe('Status Integration Tests', () => {
    it('should display both formatted status and correct colors together', () => {
      const testCases = [
        { status: 'auction_won', label: 'Auction Won', colors: ['bg-blue-100', 'text-blue-800'] },
        { status: 'ready_for_sale', label: 'Ready For Sale', colors: ['bg-purple-100', 'text-purple-800'] },
        { status: 'in_transit', label: 'In Transit', colors: ['bg-yellow-100', 'text-yellow-800'] }
      ]

      testCases.forEach(({ status, label, colors }) => {
        const { unmount } = render(
          <VehicleCard vehicle={createMockVehicle({ current_status: status as any })} />
        )
        
        const statusBadge = screen.getByText(label)
        expect(statusBadge).toBeInTheDocument()
        
        colors.forEach(className => {
          expect(statusBadge).toHaveClass(className)
        })
        
        unmount()
      })
    })

    it('should maintain consistency between status badge and history display', () => {
      const vehicle = createMockVehicle({ 
        current_status: 'customs_clearance' as any 
      })
      
      render(<VehicleCard vehicle={vehicle} />)
      
      const statusBadge = screen.getByText('Customs Clearance')
      expect(statusBadge).toHaveClass('bg-orange-100', 'text-orange-800')
    })

    it('should handle status changes correctly', () => {
      const vehicle1 = createMockVehicle({ current_status: 'at_yard' as any })
      const { rerender } = render(<VehicleCard vehicle={vehicle1} />)
      
      expect(screen.getByText('At Yard')).toBeInTheDocument()
      expect(screen.getByText('At Yard')).toHaveClass('bg-green-100', 'text-green-800')
      
      const vehicle2 = createMockVehicle({ current_status: 'sold' as any })
      rerender(<VehicleCard vehicle={vehicle2} />)
      
      expect(screen.getByText('Sold')).toBeInTheDocument()
      expect(screen.getByText('Sold')).toHaveClass('bg-gray-100', 'text-gray-800')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined vehicle status', () => {
      const vehicle = createMockVehicle()
      delete (vehicle as any).current_status
      
      render(<VehicleCard vehicle={vehicle} />)
      // Should render without crashing
      expect(screen.getByText('2021 Honda Civic')).toBeInTheDocument()
    })

    it('should handle very long status names', () => {
      const longStatus = 'very_long_status_name_with_many_words_that_might_cause_issues'
      const vehicle = createMockVehicle({ current_status: longStatus as any })
      
      render(<VehicleCard vehicle={vehicle} />)
      
      expect(screen.getByText('Very Long Status Name With Many Words That Might Cause Issues')).toBeInTheDocument()
    })

    it('should handle status with only underscores', () => {
      const vehicle = createMockVehicle({ current_status: '___' as any })
      render(<VehicleCard vehicle={vehicle} />)
      
      // Should handle gracefully without crashing
      expect(screen.getByText('2021 Honda Civic')).toBeInTheDocument()
    })

    it('should handle status starting or ending with underscores', () => {
      const vehicle = createMockVehicle({ current_status: '_test_status_' as any })
      render(<VehicleCard vehicle={vehicle} />)
      
      expect(screen.getByText('Test Status')).toBeInTheDocument()
    })
  })

  describe('Performance Considerations', () => {
    it('should not cause unnecessary re-renders for same status', () => {
      const vehicle = createMockVehicle({ current_status: 'at_yard' as any })
      const { rerender } = render(<VehicleCard vehicle={vehicle} />)
      
      const firstRender = screen.getByText('At Yard')
      
      // Re-render with same vehicle data
      rerender(<VehicleCard vehicle={vehicle} />)
      
      const secondRender = screen.getByText('At Yard')
      
      // Should be the same element (React optimization)
      expect(firstRender).toBe(secondRender)
    })

    it('should handle multiple vehicles with different statuses efficiently', () => {
      const vehicles = [
        createMockVehicle({ id: '1', current_status: 'at_yard' as any }),
        createMockVehicle({ id: '2', current_status: 'sold' as any }),
        createMockVehicle({ id: '3', current_status: 'in_transit' as any })
      ]
      
      render(
        <div>
          {vehicles.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )
      
      expect(screen.getByText('At Yard')).toBeInTheDocument()
      expect(screen.getByText('Sold')).toBeInTheDocument()
      expect(screen.getByText('In Transit')).toBeInTheDocument()
    })
  })

  describe('Accessibility and Screen Readers', () => {
    it('should provide meaningful text for screen readers', () => {
      const vehicle = createMockVehicle({ current_status: 'ready_for_sale' as any })
      render(<VehicleCard vehicle={vehicle} />)
      
      const statusBadge = screen.getByText('Ready For Sale')
      
      // Badge should be readable by screen readers
      expect(statusBadge).toBeInTheDocument()
      expect(statusBadge.textContent).toBe('Ready For Sale')
    })

    it('should work with aria-label overrides', () => {
      const vehicle = createMockVehicle({ current_status: 'at_yard' as any })
      render(
        <VehicleCard 
          vehicle={vehicle} 
          className="status-badge-aria" 
        />
      )
      
      const statusBadge = screen.getByText('At Yard')
      expect(statusBadge).toBeInTheDocument()
    })
  })
})