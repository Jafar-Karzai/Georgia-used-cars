import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VehicleService } from '@/lib/services/vehicles'
import VehicleImportPage from '../page'

// Mock the services
vi.mock('@/lib/services/vehicles')

const mockVehicleService = VehicleService as any

// Mock CSV data
const mockValidCsvData = `vin,year,make,model,engine,mileage,auction_house,purchase_price,purchase_currency
1HGBH41JXMN109186,2021,Honda,Civic,2.0L,25000,Copart,18000,USD
JH4KA7532PC009047,2020,Acura,TLX,3.5L,30000,IAAI,22000,USD
WBAFR9C56BC123456,2019,BMW,330i,2.0L,28000,Manheim,25000,USD`

const mockInvalidCsvData = `vin,year,make,model
invalid_vin,not_a_year,Honda,Civic
,2021,,Model`

const mockDuplicateVinCsvData = `vin,year,make,model,engine,mileage,auction_house,purchase_price,purchase_currency
1HGBH41JXMN109186,2021,Honda,Civic,2.0L,25000,Copart,18000,USD
1HGBH41JXMN109186,2022,Honda,Accord,2.4L,15000,Copart,20000,USD`

describe('Vehicle Import Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Page Structure', () => {
    it('should render page title and description', () => {
      render(<VehicleImportPage />)

      expect(screen.getByRole('heading', { name: /vehicle import/i })).toBeInTheDocument()
      expect(screen.getByText(/import vehicles from csv files or external auction data/i)).toBeInTheDocument()
    })

    it('should render import method selection tabs', () => {
      render(<VehicleImportPage />)

      expect(screen.getByRole('tablist')).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /csv upload/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /auction api/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /manual entry/i })).toBeInTheDocument()
    })

    it('should display CSV upload section by default', () => {
      render(<VehicleImportPage />)

      expect(screen.getByText(/upload csv file/i)).toBeInTheDocument()
      expect(screen.getByText(/select a csv file containing vehicle data/i)).toBeInTheDocument()
    })
  })

  describe('CSV Upload Tab', () => {
    it('should render file upload area', () => {
      render(<VehicleImportPage />)

      expect(screen.getByText(/drag and drop csv file here/i)).toBeInTheDocument()
      expect(screen.getByText(/or click to browse/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument()
    })

    it('should display supported file formats', () => {
      render(<VehicleImportPage />)

      expect(screen.getByText(/supported formats: csv/i)).toBeInTheDocument()
      expect(screen.getByText(/maximum file size: 10mb/i)).toBeInTheDocument()
    })

    it('should show CSV template download link', () => {
      render(<VehicleImportPage />)

      expect(screen.getByRole('link', { name: /download csv template/i })).toBeInTheDocument()
    })

    it('should display required CSV columns information', () => {
      render(<VehicleImportPage />)

      expect(screen.getByText(/required columns/i)).toBeInTheDocument()
      expect(screen.getByText(/vin, year, make, model, auction_house, purchase_price/i)).toBeInTheDocument()
      expect(screen.getByText(/optional columns/i)).toBeInTheDocument()
      expect(screen.getByText(/engine, mileage, exterior_color, purchase_currency/i)).toBeInTheDocument()
    })
  })

  describe('File Selection and Validation', () => {
    it('should accept valid CSV files', async () => {
      const user = userEvent.setup()
      render(<VehicleImportPage />)

      const file = new File([mockValidCsvData], 'vehicles.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/upload csv file/i)

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText(/vehicles.csv/i)).toBeInTheDocument()
        expect(screen.getByText(/3 vehicles detected/i)).toBeInTheDocument()
      })
    })

    it('should reject non-CSV files', async () => {
      const user = userEvent.setup()
      render(<VehicleImportPage />)

      const file = new File(['test'], 'document.txt', { type: 'text/plain' })
      const fileInput = screen.getByLabelText(/upload csv file/i)

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText(/only csv files are supported/i)).toBeInTheDocument()
      })
    })

    it('should reject files larger than 10MB', async () => {
      const user = userEvent.setup()
      render(<VehicleImportPage />)

      const largeContent = 'a'.repeat(11 * 1024 * 1024) // 11MB
      const file = new File([largeContent], 'large.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/upload csv file/i)

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText(/file size exceeds maximum limit of 10mb/i)).toBeInTheDocument()
      })
    })

    it('should validate CSV structure and show preview', async () => {
      const user = userEvent.setup()
      render(<VehicleImportPage />)

      const file = new File([mockValidCsvData], 'vehicles.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/upload csv file/i)

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText(/data preview/i)).toBeInTheDocument()
        expect(screen.getByText(/1HGBH41JXMN109186/)).toBeInTheDocument()
        expect(screen.getByText(/Honda/)).toBeInTheDocument()
        expect(screen.getByText(/Civic/)).toBeInTheDocument()
      })
    })

    it('should show validation errors for invalid CSV data', async () => {
      const user = userEvent.setup()
      render(<VehicleImportPage />)

      const file = new File([mockInvalidCsvData], 'invalid.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/upload csv file/i)

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText(/validation errors found/i)).toBeInTheDocument()
        expect(screen.getByText(/invalid vin format/i)).toBeInTheDocument()
        expect(screen.getByText(/year must be a number/i)).toBeInTheDocument()
        expect(screen.getByText(/missing required fields/i)).toBeInTheDocument()
      })
    })

    it('should detect duplicate VINs in CSV', async () => {
      const user = userEvent.setup()
      render(<VehicleImportPage />)

      const file = new File([mockDuplicateVinCsvData], 'duplicates.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/upload csv file/i)

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText(/duplicate vins detected/i)).toBeInTheDocument()
        expect(screen.getByText(/1HGBH41JXMN109186.*appears 2 times/i)).toBeInTheDocument()
      })
    })
  })

  describe('Import Process', () => {
    beforeEach(() => {
      mockVehicleService.create.mockResolvedValue({ success: true, data: { id: '1' } })
    })

    it('should render import button when valid file is selected', async () => {
      const user = userEvent.setup()
      render(<VehicleImportPage />)

      const file = new File([mockValidCsvData], 'vehicles.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/upload csv file/i)

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /import 3 vehicles/i })).toBeInTheDocument()
      })
    })

    it('should disable import button when validation errors exist', async () => {
      const user = userEvent.setup()
      render(<VehicleImportPage />)

      const file = new File([mockInvalidCsvData], 'invalid.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/upload csv file/i)

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /import vehicles/i })).toBeDisabled()
      })
    })

    it('should show progress during import', async () => {
      const user = userEvent.setup()
      
      // Mock slow response
      mockVehicleService.create.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: { id: '1' } }), 100))
      )

      render(<VehicleImportPage />)

      const file = new File([mockValidCsvData], 'vehicles.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/upload csv file/i)

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /import 3 vehicles/i })).toBeInTheDocument()
      })

      const importButton = screen.getByRole('button', { name: /import 3 vehicles/i })
      await user.click(importButton)

      await waitFor(() => {
        expect(screen.getByText(/importing vehicles/i)).toBeInTheDocument()
        expect(screen.getByText(/0 of 3 completed/i)).toBeInTheDocument()
      })
    })

    it('should handle successful import', async () => {
      const user = userEvent.setup()
      render(<VehicleImportPage />)

      const file = new File([mockValidCsvData], 'vehicles.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/upload csv file/i)

      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /import 3 vehicles/i })).toBeInTheDocument()
      })

      const importButton = screen.getByRole('button', { name: /import 3 vehicles/i })
      await user.click(importButton)

      await waitFor(() => {
        expect(screen.getByText(/import completed successfully/i)).toBeInTheDocument()
        expect(screen.getByText(/3 vehicles imported/i)).toBeInTheDocument()
        expect(screen.getByText(/0 failed/i)).toBeInTheDocument()
      })

      expect(mockVehicleService.create).toHaveBeenCalledTimes(3)
    })

    it('should handle partial import failures', async () => {
      const user = userEvent.setup()
      
      // Mock some failures
      mockVehicleService.create
        .mockResolvedValueOnce({ success: true, data: { id: '1' } })
        .mockResolvedValueOnce({ success: false, error: 'VIN already exists' })
        .mockResolvedValueOnce({ success: true, data: { id: '3' } })

      render(<VehicleImportPage />)

      const file = new File([mockValidCsvData], 'vehicles.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/upload csv file/i)

      await user.upload(fileInput, file)

      const importButton = await screen.findByRole('button', { name: /import 3 vehicles/i })
      await user.click(importButton)

      await waitFor(() => {
        expect(screen.getByText(/import completed with errors/i)).toBeInTheDocument()
        expect(screen.getByText(/2 vehicles imported/i)).toBeInTheDocument()
        expect(screen.getByText(/1 failed/i)).toBeInTheDocument()
        expect(screen.getByText(/vin already exists/i)).toBeInTheDocument()
      })
    })

    it('should handle complete import failure', async () => {
      const user = userEvent.setup()
      
      mockVehicleService.create.mockResolvedValue({ success: false, error: 'Database error' })

      render(<VehicleImportPage />)

      const file = new File([mockValidCsvData], 'vehicles.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/upload csv file/i)

      await user.upload(fileInput, file)

      const importButton = await screen.findByRole('button', { name: /import 3 vehicles/i })
      await user.click(importButton)

      await waitFor(() => {
        expect(screen.getByText(/import failed/i)).toBeInTheDocument()
        expect(screen.getByText(/0 vehicles imported/i)).toBeInTheDocument()
        expect(screen.getByText(/3 failed/i)).toBeInTheDocument()
      })
    })

    it('should allow retry after failure', async () => {
      const user = userEvent.setup()
      
      mockVehicleService.create.mockResolvedValue({ success: false, error: 'Network error' })

      render(<VehicleImportPage />)

      const file = new File([mockValidCsvData], 'vehicles.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/upload csv file/i)

      await user.upload(fileInput, file)

      const importButton = await screen.findByRole('button', { name: /import 3 vehicles/i })
      await user.click(importButton)

      await waitFor(() => {
        expect(screen.getByText(/import failed/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry import/i })).toBeInTheDocument()
      })

      // Mock successful retry
      mockVehicleService.create.mockResolvedValue({ success: true, data: { id: '1' } })

      const retryButton = screen.getByRole('button', { name: /retry import/i })
      await user.click(retryButton)

      await waitFor(() => {
        expect(mockVehicleService.create).toHaveBeenCalledTimes(6) // 3 failed + 3 retry
      })
    })
  })

  describe('Auction API Tab', () => {
    it('should render auction API integration section', async () => {
      const user = userEvent.setup()
      render(<VehicleImportPage />)

      const auctionTab = screen.getByRole('tab', { name: /auction api/i })
      await user.click(auctionTab)

      await waitFor(() => {
        expect(screen.getByText(/connect to auction house apis/i)).toBeInTheDocument()
        expect(screen.getByText(/import vehicle data directly from copart, iaai, and manheim/i)).toBeInTheDocument()
      })
    })

    it('should display supported auction houses', async () => {
      const user = userEvent.setup()
      render(<VehicleImportPage />)

      const auctionTab = screen.getByRole('tab', { name: /auction api/i })
      await user.click(auctionTab)

      await waitFor(() => {
        expect(screen.getByText(/copart/i)).toBeInTheDocument()
        expect(screen.getByText(/iaai/i)).toBeInTheDocument()
        expect(screen.getByText(/manheim/i)).toBeInTheDocument()
      })
    })

    it('should show API configuration form', async () => {
      const user = userEvent.setup()
      render(<VehicleImportPage />)

      const auctionTab = screen.getByRole('tab', { name: /auction api/i })
      await user.click(auctionTab)

      await waitFor(() => {
        expect(screen.getByLabelText(/auction house/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/api key/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/search criteria/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /test connection/i })).toBeInTheDocument()
      })
    })
  })

  describe('Manual Entry Tab', () => {
    it('should render manual entry form', async () => {
      const user = userEvent.setup()
      render(<VehicleImportPage />)

      const manualTab = screen.getByRole('tab', { name: /manual entry/i })
      await user.click(manualTab)

      await waitFor(() => {
        expect(screen.getByText(/add vehicles manually/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/vin/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/year/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/make/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/model/i)).toBeInTheDocument()
      })
    })

    it('should validate manual entry form', async () => {
      const user = userEvent.setup()
      render(<VehicleImportPage />)

      const manualTab = screen.getByRole('tab', { name: /manual entry/i })
      await user.click(manualTab)

      const submitButton = await screen.findByRole('button', { name: /add vehicle/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/vin is required/i)).toBeInTheDocument()
        expect(screen.getByText(/year is required/i)).toBeInTheDocument()
        expect(screen.getByText(/make is required/i)).toBeInTheDocument()
        expect(screen.getByText(/model is required/i)).toBeInTheDocument()
      })
    })

    it('should submit valid manual entry', async () => {
      const user = userEvent.setup()
      render(<VehicleImportPage />)

      const manualTab = screen.getByRole('tab', { name: /manual entry/i })
      await user.click(manualTab)

      await user.type(screen.getByLabelText(/vin/i), '1HGBH41JXMN109186')
      await user.type(screen.getByLabelText(/year/i), '2021')
      await user.type(screen.getByLabelText(/make/i), 'Honda')
      await user.type(screen.getByLabelText(/model/i), 'Civic')
      await user.type(screen.getByLabelText(/auction house/i), 'Copart')
      await user.type(screen.getByLabelText(/purchase price/i), '18000')

      const submitButton = screen.getByRole('button', { name: /add vehicle/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockVehicleService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            vin: '1HGBH41JXMN109186',
            year: 2021,
            make: 'Honda',
            model: 'Civic',
            auction_house: 'Copart',
            purchase_price: 18000
          }),
          expect.any(String)
        )
      })
    })
  })

  describe('Import History', () => {
    it('should display import history section', () => {
      render(<VehicleImportPage />)

      expect(screen.getByText(/import history/i)).toBeInTheDocument()
      expect(screen.getByText(/recent import activities/i)).toBeInTheDocument()
    })

    it('should show recent import records', () => {
      render(<VehicleImportPage />)

      // Mock data would be loaded here
      expect(screen.getByText(/no import history found/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle file read errors', async () => {
      const user = userEvent.setup()
      render(<VehicleImportPage />)

      // Create a file that will cause a read error
      const corruptedFile = new File([''], 'corrupted.csv', { type: 'text/csv' })
      Object.defineProperty(corruptedFile, 'size', { value: 1024 })
      
      const fileInput = screen.getByLabelText(/upload csv file/i)
      await user.upload(fileInput, corruptedFile)

      await waitFor(() => {
        expect(screen.getByText(/error reading file/i)).toBeInTheDocument()
      })
    })

    it('should handle network errors during import', async () => {
      const user = userEvent.setup()
      
      mockVehicleService.create.mockRejectedValue(new Error('Network error'))

      render(<VehicleImportPage />)

      const file = new File([mockValidCsvData], 'vehicles.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/upload csv file/i)

      await user.upload(fileInput, file)

      const importButton = await screen.findByRole('button', { name: /import 3 vehicles/i })
      await user.click(importButton)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Data Export', () => {
    it('should provide import results export', async () => {
      const user = userEvent.setup()
      render(<VehicleImportPage />)

      const file = new File([mockValidCsvData], 'vehicles.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/upload csv file/i)

      await user.upload(fileInput, file)

      const importButton = await screen.findByRole('button', { name: /import 3 vehicles/i })
      await user.click(importButton)

      await waitFor(() => {
        expect(screen.getByText(/import completed successfully/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /export results/i })).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    it('should render mobile-friendly layout', () => {
      render(<VehicleImportPage />)

      // Should have responsive classes
      expect(document.querySelector('.container')).toBeInTheDocument()
      expect(document.querySelector('.grid')).toBeInTheDocument()
    })
  })
})