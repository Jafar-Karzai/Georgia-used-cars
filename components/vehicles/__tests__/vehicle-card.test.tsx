import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VehicleCard } from '../vehicle-card'
import type { Vehicle } from '@/types/database'

const mockVehicle: Vehicle = {
  id: 'vehicle-123',
  vin: '1HGBH41JXMN109186',
  year: 2021,
  make: 'Honda',
  model: 'Civic',
  trim: 'LX',
  engine: '2.0L 4-Cylinder',
  mileage: 15000,
  exterior_color: 'Pearl White',
  interior_color: 'Black',
  transmission: 'Automatic',
  fuel_type: 'Gasoline',
  body_style: 'Sedan',
  auction_house: 'Copart',
  auction_location: 'Atlanta GA',
  sale_date: '2024-01-15',
  lot_number: '12345',
  primary_damage: 'Front End',
  secondary_damage: 'Rear Bumper',
  damage_description: 'Minor damage',
  damage_severity: 'minor',
  repair_estimate: 2500,
  title_status: 'Clean',
  keys_available: true,
  run_and_drive: true,
  purchase_price: 18000,
  purchase_currency: 'USD',
  estimated_total_cost: 22000,
  current_status: 'at_yard',
  current_location: 'Atlanta, GA',
  is_public: false,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z'
}

const mockVehicleWithPhotos = {
  ...mockVehicle,
  vehicle_photos: [
    { url: 'https://example.com/photo1.jpg', is_primary: true },
    { url: 'https://example.com/photo2.jpg', is_primary: false }
  ]
}

describe('VehicleCard', () => {
  describe('Vehicle Information Display', () => {
    it('should display basic vehicle information', () => {
      render(<VehicleCard vehicle={mockVehicle} />)
      
      expect(screen.getByText('2021 Honda Civic')).toBeInTheDocument()
      expect(screen.getByText('LX')).toBeInTheDocument()
      expect(screen.getByText('VIN: 1HGBH41JXMN109186')).toBeInTheDocument()
    })

    it('should display auction house information', () => {
      render(<VehicleCard vehicle={mockVehicle} />)
      
      expect(screen.getByText('Copart')).toBeInTheDocument()
    })

    it('should display current location when available', () => {
      render(<VehicleCard vehicle={mockVehicle} />)
      
      expect(screen.getByText('Atlanta, GA')).toBeInTheDocument()
    })

    it('should display purchase price with currency formatting', () => {
      render(<VehicleCard vehicle={mockVehicle} />)
      
      expect(screen.getByText('$18,000.00')).toBeInTheDocument()
    })

    it('should display sale date when available', () => {
      render(<VehicleCard vehicle={mockVehicle} />)
      
      expect(screen.getByText('1/15/2024')).toBeInTheDocument()
    })
  })

  describe('Vehicle Status and Badges', () => {
    it('should display vehicle status badge', () => {
      render(<VehicleCard vehicle={mockVehicle} />)
      
      expect(screen.getByText('At Yard')).toBeInTheDocument()
    })

    it('should apply correct color class for status', () => {
      render(<VehicleCard vehicle={mockVehicle} />)
      
      const statusBadge = screen.getByText('At Yard')
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('should display private visibility badge when is_public is false', () => {
      render(<VehicleCard vehicle={mockVehicle} />)
      
      expect(screen.getByText('Private')).toBeInTheDocument()
    })

    it('should display public visibility badge when is_public is true', () => {
      const publicVehicle = { ...mockVehicle, is_public: true }
      render(<VehicleCard vehicle={publicVehicle} />)
      
      expect(screen.getByText('Public')).toBeInTheDocument()
    })

    it('should not display visibility badge when is_public is undefined', () => {
      const vehicleWithoutPublic = { ...mockVehicle }
      delete vehicleWithoutPublic.is_public
      render(<VehicleCard vehicle={vehicleWithoutPublic} />)
      
      expect(screen.queryByText('Private')).not.toBeInTheDocument()
      expect(screen.queryByText('Public')).not.toBeInTheDocument()
    })
  })

  describe('Damage Information', () => {
    it('should display primary damage', () => {
      render(<VehicleCard vehicle={mockVehicle} />)
      
      expect(screen.getByText('Front End, Rear Bumper')).toBeInTheDocument()
    })

    it('should display damage severity badge', () => {
      render(<VehicleCard vehicle={mockVehicle} />)
      
      expect(screen.getByText('minor')).toBeInTheDocument()
    })

    it('should handle vehicle without secondary damage', () => {
      const vehicleWithoutSecondary = { ...mockVehicle, secondary_damage: null }
      render(<VehicleCard vehicle={vehicleWithoutSecondary} />)
      
      expect(screen.getByText('Front End')).toBeInTheDocument()
      expect(screen.queryByText('Front End,')).not.toBeInTheDocument()
    })

    it('should not display damage information when not available', () => {
      const vehicleWithoutDamage = { ...mockVehicle, primary_damage: null, damage_severity: null }
      render(<VehicleCard vehicle={vehicleWithoutDamage} />)
      
      // Should not find wrench icon or damage text
      expect(screen.queryByTestId('wrench-icon')).not.toBeInTheDocument()
    })
  })

  describe('Vehicle Photos', () => {
    it('should display primary photo when available', () => {
      render(<VehicleCard vehicle={mockVehicleWithPhotos} />)
      
      const image = screen.getByAltText('2021 Honda Civic')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/photo1.jpg')
    })

    it('should display first photo when no primary photo is marked', () => {
      const vehicleWithNonPrimaryPhotos = {
        ...mockVehicle,
        vehicle_photos: [
          { url: 'https://example.com/photo1.jpg', is_primary: false },
          { url: 'https://example.com/photo2.jpg', is_primary: false }
        ]
      }
      render(<VehicleCard vehicle={vehicleWithNonPrimaryPhotos} />)
      
      const image = screen.getByAltText('2021 Honda Civic')
      expect(image).toHaveAttribute('src', 'https://example.com/photo1.jpg')
    })

    it('should display no photo placeholder when no photos available', () => {
      render(<VehicleCard vehicle={mockVehicle} />)
      
      expect(screen.getByText('No photo')).toBeInTheDocument()
    })

    it('should display no photo placeholder when vehicle_photos is empty', () => {
      const vehicleWithEmptyPhotos = { ...mockVehicle, vehicle_photos: [] }
      render(<VehicleCard vehicle={vehicleWithEmptyPhotos} />)
      
      expect(screen.getByText('No photo')).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should display View Details button when onViewDetails is provided', () => {
      const onViewDetails = vi.fn()
      render(<VehicleCard vehicle={mockVehicle} onViewDetails={onViewDetails} />)
      
      expect(screen.getByText('View Details')).toBeInTheDocument()
    })

    it('should display Edit button when onEdit is provided', () => {
      const onEdit = vi.fn()
      render(<VehicleCard vehicle={mockVehicle} onEdit={onEdit} />)
      
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    it('should not display action buttons when callbacks are not provided', () => {
      render(<VehicleCard vehicle={mockVehicle} />)
      
      expect(screen.queryByText('View Details')).not.toBeInTheDocument()
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })

    it('should call onViewDetails when View Details button is clicked', async () => {
      const onViewDetails = vi.fn()
      const user = userEvent.setup()
      render(<VehicleCard vehicle={mockVehicle} onViewDetails={onViewDetails} />)
      
      await user.click(screen.getByText('View Details'))
      expect(onViewDetails).toHaveBeenCalledWith(mockVehicle)
    })

    it('should call onEdit when Edit button is clicked', async () => {
      const onEdit = vi.fn()
      const user = userEvent.setup()
      render(<VehicleCard vehicle={mockVehicle} onEdit={onEdit} />)
      
      await user.click(screen.getByText('Edit'))
      expect(onEdit).toHaveBeenCalledWith(mockVehicle)
    })
  })

  describe('Currency Formatting', () => {
    it('should format USD currency correctly', () => {
      render(<VehicleCard vehicle={mockVehicle} />)
      
      expect(screen.getByText('$18,000.00')).toBeInTheDocument()
    })

    it('should format AED currency correctly', () => {
      const aedVehicle = { ...mockVehicle, purchase_currency: 'AED', purchase_price: 25000 }
      render(<VehicleCard vehicle={aedVehicle} />)
      
      expect(screen.getByText('AED 25,000.00')).toBeInTheDocument()
    })

    it('should format CAD currency correctly', () => {
      const cadVehicle = { ...mockVehicle, purchase_currency: 'CAD', purchase_price: 30000 }
      render(<VehicleCard vehicle={cadVehicle} />)
      
      expect(screen.getByText('CA$30,000.00')).toBeInTheDocument()
    })
  })

  describe('Status Color Coding', () => {
    it('should apply blue color for auction_won status', () => {
      const auctionWonVehicle = { ...mockVehicle, current_status: 'auction_won' }
      render(<VehicleCard vehicle={auctionWonVehicle} />)
      
      const statusBadge = screen.getByText('Auction Won')
      expect(statusBadge).toHaveClass('bg-blue-100', 'text-blue-800')
    })

    it('should apply purple color for ready_for_sale status', () => {
      const readyVehicle = { ...mockVehicle, current_status: 'ready_for_sale' }
      render(<VehicleCard vehicle={readyVehicle} />)
      
      const statusBadge = screen.getByText('Ready For Sale')
      expect(statusBadge).toHaveClass('bg-purple-100', 'text-purple-800')
    })

    it('should apply gray color for sold status', () => {
      const soldVehicle = { ...mockVehicle, current_status: 'sold' }
      render(<VehicleCard vehicle={soldVehicle} />)
      
      const statusBadge = screen.getByText('Sold')
      expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800')
    })

    it('should apply default gray color for unknown status', () => {
      const unknownStatusVehicle = { ...mockVehicle, current_status: 'unknown_status' as any }
      render(<VehicleCard vehicle={unknownStatusVehicle} />)
      
      const statusBadge = screen.getByText('Unknown Status')
      expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800')
    })
  })

  describe('Optional Fields Handling', () => {
    it('should handle vehicle without trim', () => {
      const vehicleWithoutTrim = { ...mockVehicle, trim: null }
      render(<VehicleCard vehicle={vehicleWithoutTrim} />)
      
      expect(screen.getByText('2021 Honda Civic')).toBeInTheDocument()
      expect(screen.queryByText('LX')).not.toBeInTheDocument()
    })

    it('should handle vehicle without current_location', () => {
      const vehicleWithoutLocation = { ...mockVehicle, current_location: null }
      render(<VehicleCard vehicle={vehicleWithoutLocation} />)
      
      // Should still render other information but not location
      expect(screen.getByText('2021 Honda Civic')).toBeInTheDocument()
      expect(screen.queryByText('Atlanta, GA')).not.toBeInTheDocument()
    })

    it('should handle vehicle without sale_date', () => {
      const vehicleWithoutDate = { ...mockVehicle, sale_date: null }
      render(<VehicleCard vehicle={vehicleWithoutDate} />)
      
      expect(screen.getByText('2021 Honda Civic')).toBeInTheDocument()
      expect(screen.queryByText('1/15/2024')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper alt text for vehicle image', () => {
      render(<VehicleCard vehicle={mockVehicleWithPhotos} />)
      
      const image = screen.getByAltText('2021 Honda Civic')
      expect(image).toBeInTheDocument()
    })

    it('should have accessible button text', () => {
      const onViewDetails = vi.fn()
      const onEdit = vi.fn()
      render(<VehicleCard vehicle={mockVehicle} onViewDetails={onViewDetails} onEdit={onEdit} />)
      
      expect(screen.getByRole('button', { name: 'View Details' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    })
  })

  describe('Hover Effects', () => {
    it('should have hover effect classes on the card', () => {
      const { container } = render(<VehicleCard vehicle={mockVehicle} />)
      
      const card = container.querySelector('.hover\\:shadow-lg')
      expect(card).toBeInTheDocument()
    })

    it('should have hover effect on image', () => {
      const { container } = render(<VehicleCard vehicle={mockVehicleWithPhotos} />)
      
      const image = container.querySelector('.hover\\:scale-105')
      expect(image).toBeInTheDocument()
    })
  })

  describe('Custom className', () => {
    it('should apply custom className to the card', () => {
      const { container } = render(<VehicleCard vehicle={mockVehicle} className="custom-class" />)
      
      const card = container.querySelector('.custom-class')
      expect(card).toBeInTheDocument()
    })
  })
})