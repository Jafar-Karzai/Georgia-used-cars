import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VehicleService, CreateVehicleData, UpdateVehicleData, VehicleFilters } from '../vehicles'
import { supabase } from '@/lib/supabase/client'

// Cast the mocked supabase to access mock functions
const mockSupabase = supabase as any

describe('VehicleService', () => {
  const mockUserId = 'test-user-123'
  const mockVehicleId = 'vehicle-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    const validVehicleData: CreateVehicleData = {
      vin: '1HGBH41JXMN109186',
      year: 2021,
      make: 'Honda',
      model: 'Civic',
      trim: 'LX',
      auctionHouse: 'Copart',
      purchasePrice: 15000,
      purchaseCurrency: 'USD',
      isPublic: false
    }

    it('should create a vehicle with valid data', async () => {
      // Mock no existing vehicle
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      })

      // Mock successful insert
      const mockVehicle = { id: mockVehicleId, ...validVehicleData }
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockVehicle, error: null })
      })

      // Mock status history insert
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null })
      })

      const result = await VehicleService.create(validVehicleData, mockUserId)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockVehicle)
      expect(mockSupabase.from).toHaveBeenCalledWith('vehicles')
    })

    it('should fail if VIN already exists', async () => {
      // Mock existing vehicle with same VIN
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { id: 'existing-id', vin: validVehicleData.vin }, 
          error: null 
        })
      })

      const result = await VehicleService.create(validVehicleData, mockUserId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('already exists')
    })

    it('should set default values for required fields', async () => {
      const vehicleDataMinimal: CreateVehicleData = {
        vin: '1HGBH41JXMN109187',
        year: 2020,
        make: 'Toyota',
        model: 'Camry',
        auctionHouse: 'IAAI',
        purchasePrice: 20000
      }

      // Mock no existing vehicle
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      })

      // Mock successful insert and capture what was inserted
      let insertedData: any
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockImplementation((data) => {
          insertedData = data
          return {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: mockVehicleId, ...data }, error: null })
          }
        })
      })

      // Mock status history insert
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null })
      })

      await VehicleService.create(vehicleDataMinimal, mockUserId)

      expect(insertedData.currentStatus).toBe('auction_won')
      expect(insertedData.keysAvailable).toBe(false)
      expect(insertedData.runAndDrive).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      // Mock no existing vehicle
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      })

      // Mock database error
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database connection failed' } 
        })
      })

      const result = await VehicleService.create(validVehicleData, mockUserId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('getAll', () => {
    const mockVehicles = [
      { id: '1', vin: '1HGBH41JXMN109186', make: 'Honda', model: 'Civic' },
      { id: '2', vin: '1FTFW1ET5DFC10312', make: 'Ford', model: 'F-150' }
    ]

    it('should return all vehicles without filters', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: mockVehicles, 
          error: null, 
          count: mockVehicles.length 
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await VehicleService.getAll()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockVehicles)
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        pages: 1
      })
    })

    it('should apply status filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: [mockVehicles[0]], 
          error: null, 
          count: 1 
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: VehicleFilters = { status: 'ready_for_sale' }
      await VehicleService.getAll(filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('currentStatus', 'ready_for_sale')
    })

    it('should apply make filter with case-insensitive search', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: [mockVehicles[0]], 
          error: null, 
          count: 1 
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: VehicleFilters = { make: 'honda' }
      await VehicleService.getAll(filters)

      expect(mockQuery.ilike).toHaveBeenCalledWith('make', '%honda%')
    })

    it('should apply year range filters', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: mockVehicles, 
          error: null, 
          count: 2 
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: VehicleFilters = { yearMin: 2020, yearMax: 2022 }
      await VehicleService.getAll(filters)

      expect(mockQuery.gte).toHaveBeenCalledWith('year', 2020)
      expect(mockQuery.lte).toHaveBeenCalledWith('year', 2022)
    })

    it('should apply search filter across multiple fields', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: mockVehicles, 
          error: null, 
          count: 2 
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: VehicleFilters = { search: 'Honda' }
      await VehicleService.getAll(filters)

      expect(mockQuery.or).toHaveBeenCalledWith('vin.ilike.%Honda%,make.ilike.%Honda%,model.ilike.%Honda%')
    })

    it('should handle pagination correctly', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: mockVehicles, 
          error: null, 
          count: 50 
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await VehicleService.getAll({}, 3, 10)

      expect(mockQuery.range).toHaveBeenCalledWith(20, 29) // Page 3, limit 10: from (3-1)*10=20, to 20+10-1=29
      expect(result.pagination).toEqual({
        page: 3,
        limit: 10,
        total: 50,
        pages: 5
      })
    })
  })

  describe('getById', () => {
    it('should return vehicle with related data', async () => {
      const mockVehicleData = {
        id: mockVehicleId,
        vin: '1HGBH41JXMN109186',
        make: 'Honda',
        model: 'Civic',
        photos: [{ id: '1', url: 'photo1.jpg', isPrimary: true }],
        expenses: [{ id: '1', category: 'acquisition', amount: 500 }]
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockVehicleData, error: null })
      })

      const result = await VehicleService.getById(mockVehicleId)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockVehicleData)
    })

    it('should handle vehicle not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'No rows returned' } 
        })
      })

      const result = await VehicleService.getById('non-existent-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('No rows returned')
    })
  })

  describe('update', () => {
    const updateData: UpdateVehicleData = {
      mileage: 30000,
      currentStatus: 'ready_for_sale',
      currentLocation: 'Showroom'
    }

    it('should update vehicle successfully', async () => {
      const updatedVehicle = { id: mockVehicleId, ...updateData }
      
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedVehicle, error: null })
      })

      // Mock status history insert
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null })
      })

      const result = await VehicleService.update(mockVehicleId, updateData, mockUserId)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedVehicle)
    })

    it('should add status history when status changes', async () => {
      const updatedVehicle = { id: mockVehicleId, ...updateData }
      
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedVehicle, error: null })
      })

      let statusHistoryData: any
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockImplementation((data) => {
          statusHistoryData = data
          return { error: null }
        })
      })

      await VehicleService.update(mockVehicleId, updateData, mockUserId)

      expect(statusHistoryData.vehicleId).toBe(mockVehicleId)
      expect(statusHistoryData.status).toBe('ready_for_sale')
      expect(statusHistoryData.notes).toBe('Location: Showroom')
      expect(statusHistoryData.changedBy).toBe(mockUserId)
    })
  })

  describe('updateStatus', () => {
    it('should update vehicle status and add history entry', async () => {
      // Mock vehicle update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      })

      // Mock status history insert
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null })
      })

      const result = await VehicleService.updateStatus(
        mockVehicleId, 
        'in_transit', 
        'Port of Dubai', 
        'Shipped from USA',
        mockUserId
      )

      expect(result.success).toBe(true)
    })
  })

  describe('searchByVin', () => {
    it('should search vehicles by VIN with partial matching', async () => {
      const mockVehicles = [
        { id: '1', vin: '1HGBH41JXMN109186' },
        { id: '2', vin: '1HGBH41JXMN109187' }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockVehicles, error: null })
      })

      const result = await VehicleService.searchByVin('1HGBH41J')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockVehicles)
    })
  })

  describe('getStatistics', () => {
    it('should return vehicle statistics', async () => {
      // Mock total vehicles count
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ count: 150, error: null })
      })

      // Mock vehicles by status
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        group: vi.fn().mockResolvedValue({
          data: [
            { currentStatus: 'ready_for_sale', count: 50 },
            { currentStatus: 'in_transit', count: 30 }
          ],
          error: null
        })
      })

      // Mock recent additions
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: 15, error: null })
      })

      const result = await VehicleService.getStatistics()

      expect(result.success).toBe(true)
      expect(result.data?.total).toBe(150)
      expect(result.data?.recentAdditions).toBe(15)
      expect(result.data?.byStatus).toHaveLength(2)
    })
  })

  describe('getPublic', () => {
    it('should return only public vehicles ready for sale', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [{ id: '1', isPublic: true, currentStatus: 'ready_for_sale' }],
          error: null,
          count: 1
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await VehicleService.getPublic()

      expect(result.success).toBe(true)
      // Should call getAll with is_public: true filter
      expect(mockSupabase.from).toHaveBeenCalledWith('vehicles')
    })
  })

  describe('delete', () => {
    it('should delete vehicle successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      })

      const result = await VehicleService.delete(mockVehicleId)

      expect(result.success).toBe(true)
    })

    it('should handle delete errors', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Cannot delete vehicle with existing references' } })
      })

      const result = await VehicleService.delete(mockVehicleId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot delete vehicle with existing references')
    })
  })

  describe('getStatusHistory', () => {
    it('should return status history for vehicle', async () => {
      const mockHistory = [
        {
          id: '1',
          vehicleId: mockVehicleId,
          status: 'ready_for_sale',
          changedAt: '2024-01-01T00:00:00Z',
          profiles: { fullName: 'John Doe' }
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockHistory, error: null })
      })

      const result = await VehicleService.getStatusHistory(mockVehicleId)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockHistory)
    })
  })
})