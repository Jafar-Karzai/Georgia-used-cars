import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VehicleForm } from '../vehicle-form'
import { VehicleService } from '@/lib/services/vehicles'
import { VinDecoderService } from '@/lib/services/vin-decoder'

// Mock services
vi.mock('@/lib/services/vehicles')
vi.mock('@/lib/services/vin-decoder')

// Mock auth context
vi.mock('@/lib/auth/context', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'user-123',
      email: 'test@example.com',
      role: 'manager',
      full_name: 'Test User'
    }
  }))
}))

// Mock child components
vi.mock('../vin-input', () => ({
  VinInput: ({ value, onChange, onVinDecoded }: any) => (
    <div>
      <input
        data-testid="vin-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter VIN"
      />
      <button
        data-testid="decode-vin-button"
        onClick={() => onVinDecoded({
          year: 2021,
          make: 'Honda',
          model: 'Civic',
          trim: 'LX',
          engine: '2.0L 4-Cylinder',
          transmission: 'Automatic',
          fuel_type: 'Gasoline',
          body_style: 'Sedan'
        })}
      >
        Decode VIN
      </button>
    </div>
  )
}))

vi.mock('../photo-upload', () => ({
  PhotoUpload: ({ vehicleId, onPhotosUpdate }: any) => (
    <div data-testid="photo-upload">
      Photo Upload for vehicle {vehicleId}
      <button onClick={onPhotosUpdate}>Update Photos</button>
    </div>
  )
}))

const mockVehicleService = VehicleService as any
const mockVinDecoderService = VinDecoderService as any

describe('VehicleForm', () => {
  const mockProps = {
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
    isEdit: false
  }

  const mockVehicleData = {
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
    secondary_damage: 'None',
    damage_description: 'Minor front bumper damage',
    damage_severity: 'minor' as const,
    repair_estimate: 2500,
    title_status: 'Clean',
    keys_available: true,
    run_and_drive: true,
    purchase_price: 18000,
    purchase_currency: 'USD' as const,
    estimated_total_cost: 22000,
    is_public: false,
    current_status: 'at_yard' as const,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Rendering', () => {
    it('should render all form tabs', () => {
      render(<VehicleForm {...mockProps} />)
      
      expect(screen.getByText('Basic Info')).toBeInTheDocument()
      expect(screen.getByText('Auction Details')).toBeInTheDocument()
      expect(screen.getByText('Condition')).toBeInTheDocument()
      expect(screen.getByText('Financial')).toBeInTheDocument()
      expect(screen.getByText('Photos')).toBeInTheDocument()
    })

    it('should show correct title for new vehicle', () => {
      render(<VehicleForm {...mockProps} />)
      expect(screen.getByText('Add New Vehicle')).toBeInTheDocument()
      expect(screen.getByText('Enter comprehensive vehicle information for inventory tracking')).toBeInTheDocument()
    })

    it('should show correct title for edit vehicle', () => {
      render(<VehicleForm {...mockProps} isEdit={true} initialData={mockVehicleData} />)
      expect(screen.getByText('Edit Vehicle')).toBeInTheDocument()
      expect(screen.getByText('Update vehicle information and details')).toBeInTheDocument()
    })

    it('should render all required form fields in basic tab', () => {
      render(<VehicleForm {...mockProps} />)
      
      expect(screen.getByTestId('vin-input')).toBeInTheDocument()
      expect(screen.getByLabelText('Year *')).toBeInTheDocument()
      expect(screen.getByLabelText('Make *')).toBeInTheDocument()
      expect(screen.getByLabelText('Model *')).toBeInTheDocument()
      expect(screen.getByLabelText('Trim')).toBeInTheDocument()
      expect(screen.getByLabelText('Mileage')).toBeInTheDocument()
      expect(screen.getByLabelText('Exterior Color')).toBeInTheDocument()
      expect(screen.getByLabelText('Interior Color')).toBeInTheDocument()
      expect(screen.getByLabelText('Transmission')).toBeInTheDocument()
      expect(screen.getByLabelText('Fuel Type')).toBeInTheDocument()
      expect(screen.getByLabelText('Body Style')).toBeInTheDocument()
      expect(screen.getByLabelText('Engine')).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('should switch between tabs', async () => {
      const user = userEvent.setup()
      render(<VehicleForm {...mockProps} />)
      
      // Switch to auction tab
      await user.click(screen.getByText('Auction Details'))
      expect(screen.getByText('Auction Information')).toBeInTheDocument()
      expect(screen.getByLabelText('Auction House *')).toBeInTheDocument()
      
      // Switch to condition tab
      await user.click(screen.getByText('Condition'))
      expect(screen.getByText('Vehicle Condition')).toBeInTheDocument()
      expect(screen.getByLabelText('Primary Damage')).toBeInTheDocument()
      
      // Switch to financial tab
      await user.click(screen.getByText('Financial'))
      expect(screen.getByText('Financial Information')).toBeInTheDocument()
      expect(screen.getByLabelText('Purchase Price *')).toBeInTheDocument()
      
      // Switch to photos tab
      await user.click(screen.getByText('Photos'))
      expect(screen.getByText('Vehicle Photos')).toBeInTheDocument()
    })

    it('should navigate with Previous/Next buttons', async () => {
      const user = userEvent.setup()
      render(<VehicleForm {...mockProps} />)
      
      // Should start on basic tab
      expect(screen.getByText('Vehicle Identification')).toBeInTheDocument()
      
      // Click Next to go to auction tab
      await user.click(screen.getByText('Next'))
      expect(screen.getByText('Auction Information')).toBeInTheDocument()
      
      // Click Previous to go back to basic tab
      await user.click(screen.getByText('Previous'))
      expect(screen.getByText('Vehicle Identification')).toBeInTheDocument()
      
      // Previous button should be disabled on first tab
      expect(screen.getByText('Previous')).toBeDisabled()
    })
  })

  describe('VIN Decoding', () => {
    it('should auto-populate fields when VIN is decoded', async () => {
      const user = userEvent.setup()
      render(<VehicleForm {...mockProps} />)
      
      // Trigger VIN decode
      await user.click(screen.getByTestId('decode-vin-button'))
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('2021')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Honda')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Civic')).toBeInTheDocument()
        expect(screen.getByDisplayValue('LX')).toBeInTheDocument()
      })
      
      // Should show success message
      expect(screen.getByText('Auto-filling vehicle details...')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<VehicleForm {...mockProps} />)
      
      // Navigate to photos tab to access submit button
      await user.click(screen.getByText('Photos'))
      
      // Try to submit without filling required fields
      await user.click(screen.getByText('Create Vehicle'))
      
      await waitFor(() => {
        expect(screen.getByText('VIN must be exactly 17 characters')).toBeInTheDocument()
        expect(screen.getByText('Make is required')).toBeInTheDocument()
        expect(screen.getByText('Model is required')).toBeInTheDocument()
      })
    })

    it('should validate VIN length', async () => {
      const user = userEvent.setup()
      render(<VehicleForm {...mockProps} />)
      
      await user.type(screen.getByTestId('vin-input'), 'SHORT')
      await user.click(screen.getByText('Photos'))
      await user.click(screen.getByText('Create Vehicle'))
      
      await waitFor(() => {
        expect(screen.getByText('VIN must be exactly 17 characters')).toBeInTheDocument()
      })
    })

    it('should validate year range', async () => {
      const user = userEvent.setup()
      render(<VehicleForm {...mockProps} />)
      
      const yearInput = screen.getByLabelText('Year *')
      await user.clear(yearInput)
      await user.type(yearInput, '1800')
      
      await user.click(screen.getByText('Photos'))
      await user.click(screen.getByText('Create Vehicle'))
      
      await waitFor(() => {
        expect(screen.getByText('Invalid year')).toBeInTheDocument()
      })
    })

    it('should validate purchase price is required', async () => {
      const user = userEvent.setup()
      render(<VehicleForm {...mockProps} />)
      
      // Go to financial tab
      await user.click(screen.getByText('Financial'))
      
      const priceInput = screen.getByLabelText('Purchase Price *')
      await user.clear(priceInput)
      await user.type(priceInput, '0')
      
      await user.click(screen.getByText('Photos'))
      await user.click(screen.getByText('Create Vehicle'))
      
      await waitFor(() => {
        expect(screen.getByText('Purchase price is required')).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should create new vehicle successfully', async () => {
      const user = userEvent.setup()
      mockVehicleService.create.mockResolvedValue({
        success: true,
        data: mockVehicleData
      })
      
      render(<VehicleForm {...mockProps} />)
      
      // Fill required fields
      await user.type(screen.getByTestId('vin-input'), '1HGBH41JXMN109186')
      await user.type(screen.getByLabelText('Make *'), 'Honda')
      await user.type(screen.getByLabelText('Model *'), 'Civic')
      
      // Go to auction tab and fill required auction house
      await user.click(screen.getByText('Auction Details'))
      await user.click(screen.getByLabelText('Auction House *'))
      await user.click(screen.getByText('Copart'))
      
      // Go to financial tab and fill purchase price
      await user.click(screen.getByText('Financial'))
      await user.clear(screen.getByLabelText('Purchase Price *'))
      await user.type(screen.getByLabelText('Purchase Price *'), '18000')
      
      // Submit form
      await user.click(screen.getByText('Photos'))
      await user.click(screen.getByText('Create Vehicle'))
      
      await waitFor(() => {
        expect(mockVehicleService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            vin: '1HGBH41JXMN109186',
            make: 'Honda',
            model: 'Civic',
            auction_house: 'Copart',
            purchase_price: 18000
          }),
          'user-123'
        )
        expect(mockProps.onSuccess).toHaveBeenCalledWith(mockVehicleData)
      })
    })

    it('should update existing vehicle successfully', async () => {
      const user = userEvent.setup()
      mockVehicleService.update.mockResolvedValue({
        success: true,
        data: { ...mockVehicleData, make: 'Toyota' }
      })
      
      render(<VehicleForm {...mockProps} isEdit={true} initialData={mockVehicleData} />)
      
      // Update make field
      const makeInput = screen.getByDisplayValue('Honda')
      await user.clear(makeInput)
      await user.type(makeInput, 'Toyota')
      
      // Submit form
      await user.click(screen.getByText('Photos'))
      await user.click(screen.getByText('Update Vehicle'))
      
      await waitFor(() => {
        expect(mockVehicleService.update).toHaveBeenCalledWith(
          'vehicle-123',
          expect.objectContaining({
            make: 'Toyota'
          }),
          'user-123'
        )
        expect(mockProps.onSuccess).toHaveBeenCalled()
      })
    })

    it('should handle creation errors', async () => {
      const user = userEvent.setup()
      mockVehicleService.create.mockResolvedValue({
        success: false,
        error: 'VIN already exists'
      })
      
      // Mock window.alert
      window.alert = vi.fn()
      
      render(<VehicleForm {...mockProps} />)
      
      // Fill form and submit
      await user.type(screen.getByTestId('vin-input'), '1HGBH41JXMN109186')
      await user.type(screen.getByLabelText('Make *'), 'Honda')
      await user.type(screen.getByLabelText('Model *'), 'Civic')
      
      await user.click(screen.getByText('Auction Details'))
      await user.click(screen.getByLabelText('Auction House *'))
      await user.click(screen.getByText('Copart'))
      
      await user.click(screen.getByText('Financial'))
      await user.clear(screen.getByLabelText('Purchase Price *'))
      await user.type(screen.getByLabelText('Purchase Price *'), '18000')
      
      await user.click(screen.getByText('Photos'))
      await user.click(screen.getByText('Create Vehicle'))
      
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to save vehicle: VIN already exists')
        expect(mockProps.onSuccess).not.toHaveBeenCalled()
      })
    })
  })

  describe('Switch Components', () => {
    it('should handle toggle switches correctly', async () => {
      const user = userEvent.setup()
      render(<VehicleForm {...mockProps} />)
      
      // Go to condition tab
      await user.click(screen.getByText('Condition'))
      
      // Test keys available switch
      const keysSwitch = screen.getByRole('switch', { name: /keys available/i })
      expect(keysSwitch).not.toBeChecked()
      
      await user.click(keysSwitch)
      expect(keysSwitch).toBeChecked()
      
      // Test run and drive switch
      const runDriveSwitch = screen.getByRole('switch', { name: /run and drive/i })
      expect(runDriveSwitch).not.toBeChecked()
      
      await user.click(runDriveSwitch)
      expect(runDriveSwitch).toBeChecked()
      
      // Test public visibility switch
      const publicSwitch = screen.getByRole('switch', { name: /show on website/i })
      expect(publicSwitch).not.toBeChecked()
      
      await user.click(publicSwitch)
      expect(publicSwitch).toBeChecked()
    })
  })

  describe('Select Components', () => {
    it('should handle dropdown selections', async () => {
      const user = userEvent.setup()
      render(<VehicleForm {...mockProps} />)
      
      // Test transmission select
      await user.click(screen.getByLabelText('Transmission'))
      await user.click(screen.getByText('Automatic'))
      expect(screen.getByDisplayValue('Automatic')).toBeInTheDocument()
      
      // Test fuel type select
      await user.click(screen.getByLabelText('Fuel Type'))
      await user.click(screen.getByText('Gasoline'))
      expect(screen.getByDisplayValue('Gasoline')).toBeInTheDocument()
      
      // Test damage severity in condition tab
      await user.click(screen.getByText('Condition'))
      await user.click(screen.getByLabelText('Damage Severity'))
      await user.click(screen.getByText('Minor'))
      expect(screen.getByDisplayValue('Minor')).toBeInTheDocument()
    })
  })

  describe('Photos Tab', () => {
    it('should show photo upload for existing vehicle', () => {
      render(<VehicleForm {...mockProps} isEdit={true} initialData={mockVehicleData} />)
      
      fireEvent.click(screen.getByText('Photos'))
      expect(screen.getByTestId('photo-upload')).toBeInTheDocument()
      expect(screen.getByText('Photo Upload for vehicle vehicle-123')).toBeInTheDocument()
    })

    it('should show placeholder message for new vehicle', () => {
      render(<VehicleForm {...mockProps} />)
      
      fireEvent.click(screen.getByText('Photos'))
      expect(screen.getByText('Photos can be uploaded after creating the vehicle')).toBeInTheDocument()
      expect(screen.getByText('Complete the vehicle information first, then add photos on the next screen')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      // Mock a delayed response
      mockVehicleService.create.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockVehicleData }), 100))
      )
      
      render(<VehicleForm {...mockProps} />)
      
      // Fill required fields and submit
      await user.type(screen.getByTestId('vin-input'), '1HGBH41JXMN109186')
      await user.type(screen.getByLabelText('Make *'), 'Honda')
      await user.type(screen.getByLabelText('Model *'), 'Civic')
      
      await user.click(screen.getByText('Auction Details'))
      await user.click(screen.getByLabelText('Auction House *'))
      await user.click(screen.getByText('Copart'))
      
      await user.click(screen.getByText('Financial'))
      await user.clear(screen.getByLabelText('Purchase Price *'))
      await user.type(screen.getByLabelText('Purchase Price *'), '18000')
      
      await user.click(screen.getByText('Photos'))
      await user.click(screen.getByText('Create Vehicle'))
      
      // Should show loading state
      expect(screen.getByText('Creating...')).toBeInTheDocument()
      expect(screen.getByText('Create Vehicle')).toBeDisabled()
      
      // Wait for completion
      await waitFor(() => {
        expect(mockProps.onSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('Form Interactions', () => {
    it('should handle cancel button', async () => {
      const user = userEvent.setup()
      render(<VehicleForm {...mockProps} />)
      
      await user.click(screen.getByText('Cancel'))
      expect(mockProps.onCancel).toHaveBeenCalled()
    })

    it('should populate initial data correctly', () => {
      render(<VehicleForm {...mockProps} isEdit={true} initialData={mockVehicleData} />)
      
      expect(screen.getByDisplayValue('1HGBH41JXMN109186')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Honda')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Civic')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2021')).toBeInTheDocument()
    })
  })

  describe('Financial Information Tips', () => {
    it('should display cost estimation tips', async () => {
      const user = userEvent.setup()
      render(<VehicleForm {...mockProps} />)
      
      await user.click(screen.getByText('Financial'))
      
      expect(screen.getByText('Cost Estimation Tips:')).toBeInTheDocument()
      expect(screen.getByText('Include auction fees (typically 5-10% of purchase price)')).toBeInTheDocument()
      expect(screen.getByText('Factor in shipping costs ($500-2000 depending on distance)')).toBeInTheDocument()
      expect(screen.getByText('Consider import duties and taxes for international purchases')).toBeInTheDocument()
      expect(screen.getByText('Add estimated repair costs based on damage assessment')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and descriptions', () => {
      render(<VehicleForm {...mockProps} />)
      
      // Check form labels
      expect(screen.getByLabelText('Year *')).toBeInTheDocument()
      expect(screen.getByLabelText('Make *')).toBeInTheDocument()
      expect(screen.getByLabelText('Model *')).toBeInTheDocument()
      
      // Check switch descriptions
      fireEvent.click(screen.getByText('Condition'))
      expect(screen.getByText('Vehicle comes with keys')).toBeInTheDocument()
      expect(screen.getByText('Vehicle is operational and driveable')).toBeInTheDocument()
      expect(screen.getByText('Make this vehicle visible to public on the website')).toBeInTheDocument()
    })
  })
})