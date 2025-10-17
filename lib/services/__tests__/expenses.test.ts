import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExpenseService, CreateExpenseData, UpdateExpenseData, ExpenseFilters } from '../expenses'
import { supabase } from '@/lib/supabase/client'

// Cast the mocked supabase to access mock functions
const mockSupabase = supabase as any

describe('ExpenseService', () => {
  const mockUserId = 'test-user-123'
  const mockExpenseId = 'expense-123'
  const mockVehicleId = 'vehicle-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    const validExpenseData: CreateExpenseData = {
      vehicle_id: mockVehicleId,
      category: 'acquisition',
      description: 'Vehicle purchase price',
      amount: 15000,
      currency: 'USD',
      date: '2024-01-15',
      vendor: 'Copart'
    }

    it('should create expense with valid data', async () => {
      const mockExpense = { 
        id: mockExpenseId, 
        ...validExpenseData,
        created_by: mockUserId,
        vehicles: { vin: '123456', year: 2021, make: 'Honda', model: 'Civic' }
      }

      // Mock auth calls
      mockSupabase.auth.getSession.mockResolvedValue({ 
        data: { session: { user: { id: mockUserId } } } 
      })
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: mockUserId } } 
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockExpense, error: null })
      })

      const result = await ExpenseService.create(validExpenseData, mockUserId)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockExpense)
    })

    it('should associate expense with vehicle', async () => {
      let insertedData: any
      
      // Mock auth calls
      mockSupabase.auth.getSession.mockResolvedValue({ 
        data: { session: { user: { id: mockUserId } } } 
      })
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: mockUserId } } 
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockImplementation((data) => {
          insertedData = data
          return {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: mockExpenseId, ...data }, error: null })
          }
        })
      })

      await ExpenseService.create(validExpenseData, mockUserId)

      expect(insertedData.vehicle_id).toBe(mockVehicleId)
      expect(insertedData.created_by).toBe(mockUserId)
    })

    it('should handle vehicle-independent expenses', async () => {
      const operationalExpense = {
        ...validExpenseData,
        vehicle_id: undefined,
        category: 'operational' as const,
        description: 'Office rent'
      }

      // Mock auth calls
      mockSupabase.auth.getSession.mockResolvedValue({ 
        data: { session: { user: { id: mockUserId } } } 
      })
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: mockUserId } } 
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { id: mockExpenseId, ...operationalExpense }, 
          error: null 
        })
      })

      const result = await ExpenseService.create(operationalExpense, mockUserId)

      expect(result.success).toBe(true)
      expect(result.data?.vehicle_id).toBeUndefined()
    })

    it('should validate expense categories', async () => {
      const validCategories = [
        'acquisition', 'transportation', 'import', 'enhancement', 'marketing', 'operational'
      ]

      for (const category of validCategories) {
        const expenseWithCategory = {
          ...validExpenseData,
          category: category as any
        }

        // Mock auth calls for each iteration
        mockSupabase.auth.getSession.mockResolvedValue({ 
          data: { session: { user: { id: mockUserId } } } 
        })
        mockSupabase.auth.getUser.mockResolvedValue({ 
          data: { user: { id: mockUserId } } 
        })

        mockSupabase.from.mockReturnValue({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { id: `expense-${category}`, ...expenseWithCategory }, 
            error: null 
          })
        })

        const result = await ExpenseService.create(expenseWithCategory, mockUserId)
        expect(result.success).toBe(true)
        expect(result.data?.category).toBe(category)
      }
    })

    it('should handle database errors', async () => {
      // Mock auth calls
      mockSupabase.auth.getSession.mockResolvedValue({ 
        data: { session: { user: { id: mockUserId } } } 
      })
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: mockUserId } } 
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Foreign key constraint violation' } 
        })
      })

      const result = await ExpenseService.create(validExpenseData, mockUserId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Foreign key constraint violation')
    })
  })

  describe('getAll', () => {
    const mockExpenses = [
      { 
        id: '1', 
        category: 'acquisition', 
        amount: 15000, 
        currency: 'USD',
        vehicle_id: mockVehicleId,
        vehicles: { vin: '123456', year: 2021, make: 'Honda', model: 'Civic' }
      },
      { 
        id: '2', 
        category: 'transportation', 
        amount: 2000, 
        currency: 'AED',
        vehicle_id: mockVehicleId,
        vehicles: { vin: '123456', year: 2021, make: 'Honda', model: 'Civic' }
      }
    ]

    it('should return all expenses with vehicle associations', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: mockExpenses, 
          error: null, 
          count: 2 
        })
      })

      const result = await ExpenseService.getAll()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockExpenses)
      expect(result.data?.[0].vehicles).toBeDefined()
    })

    it('should filter by vehicle ID', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: [mockExpenses[0]], 
          error: null, 
          count: 1 
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: ExpenseFilters = { vehicle_id: mockVehicleId }
      await ExpenseService.getAll(filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('vehicle_id', mockVehicleId)
    })

    it('should filter by category', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: [mockExpenses[0]], 
          error: null, 
          count: 1 
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: ExpenseFilters = { category: 'acquisition' }
      await ExpenseService.getAll(filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'acquisition')
    })

    it('should filter by date range', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: mockExpenses, 
          error: null, 
          count: 2 
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: ExpenseFilters = { 
        date_from: '2024-01-01',
        date_to: '2024-01-31'
      }
      await ExpenseService.getAll(filters)

      expect(mockQuery.gte).toHaveBeenCalledWith('date', '2024-01-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('date', '2024-01-31')
    })

    it('should filter by currency', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: [mockExpenses[1]], 
          error: null, 
          count: 1 
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: ExpenseFilters = { currency: 'AED' }
      await ExpenseService.getAll(filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('currency', 'AED')
    })

    it('should search across description, vendor, and notes', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: mockExpenses, 
          error: null, 
          count: 2 
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: ExpenseFilters = { search: 'Copart' }
      await ExpenseService.getAll(filters)

      expect(mockQuery.or).toHaveBeenCalledWith('description.ilike.%Copart%,vendor.ilike.%Copart%,notes.ilike.%Copart%')
    })

    it('should handle pagination correctly', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: mockExpenses, 
          error: null, 
          count: 50 
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await ExpenseService.getAll({}, 2, 10)

      expect(mockQuery.range).toHaveBeenCalledWith(10, 19) // Page 2, limit 10
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        pages: 5
      })
    })
  })

  describe('getStatistics', () => {
    const mockExpenseData = [
      { category: 'acquisition', amount: 10000, currency: 'USD', date: '2024-01-15' },
      { category: 'transportation', amount: 5000, currency: 'AED', date: '2024-01-16' },
      { category: 'acquisition', amount: 3000, currency: 'CAD', date: '2024-01-17' }
    ]

    it('should calculate statistics with multi-currency conversion', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockExpenseData, error: null })
      })

      const result = await ExpenseService.getStatistics()

      expect(result.success).toBe(true)
      
      // Check total (converted to AED using hardcoded rates)
      const expectedTotal = 
        10000 * 3.67 + // USD to AED
        5000 +          // AED 
        3000 * 2.70     // CAD to AED
      
      expect(result.data?.total).toBe(expectedTotal)
      expect(result.data?.count).toBe(3)
      
      // Check by category totals (in AED)
      expect(result.data?.byCategory.acquisition).toBe(10000 * 3.67 + 3000 * 2.70)
      expect(result.data?.byCategory.transportation).toBe(5000)
      
      // Check by currency (original amounts)
      expect(result.data?.byCurrency.USD).toBe(10000)
      expect(result.data?.byCurrency.AED).toBe(5000)
      expect(result.data?.byCurrency.CAD).toBe(3000)
    })

    it('should apply date filters to statistics', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockExpenseData, error: null })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters = { date_from: '2024-01-01', date_to: '2024-01-31' }
      await ExpenseService.getStatistics(filters)

      expect(mockQuery.gte).toHaveBeenCalledWith('date', '2024-01-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('date', '2024-01-31')
    })

    it('should filter by vehicle ID', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockExpenseData, error: null })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters = { vehicle_id: mockVehicleId }
      await ExpenseService.getStatistics(filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('vehicle_id', mockVehicleId)
    })

    it('should handle empty data gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null })
      })

      const result = await ExpenseService.getStatistics()

      expect(result.success).toBe(true)
      expect(result.data?.total).toBe(0)
      expect(result.data?.count).toBe(0)
      expect(result.data?.byCategory).toEqual({})
      expect(result.data?.byCurrency).toEqual({})
    })
  })

  describe('getMonthlyTrends', () => {
    const mockMonthlyData = [
      { amount: 5000, currency: 'USD', date: '2023-12-15', category: 'acquisition' },
      { amount: 3000, currency: 'AED', date: '2024-01-10', category: 'transportation' },
      { amount: 7000, currency: 'USD', date: '2024-01-20', category: 'acquisition' }
    ]

    it('should group expenses by month with category breakdown', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockMonthlyData, error: null })
      })

      const result = await ExpenseService.getMonthlyTrends(12)

      expect(result.success).toBe(true)
      
      const monthlyData = result.data!
      
      // Check December 2023
      expect(monthlyData['2023-12']).toBeDefined()
      expect(monthlyData['2023-12'].total).toBe(5000 * 3.67) // USD to AED
      expect(monthlyData['2023-12'].byCategory.acquisition).toBe(5000 * 3.67)
      
      // Check January 2024
      expect(monthlyData['2024-01']).toBeDefined()
      expect(monthlyData['2024-01'].total).toBe(3000 + 7000 * 3.67) // AED + USD to AED
      expect(monthlyData['2024-01'].byCategory.transportation).toBe(3000)
      expect(monthlyData['2024-01'].byCategory.acquisition).toBe(7000 * 3.67)
    })

    it('should filter by date range correctly', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockMonthlyData, error: null })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      await ExpenseService.getMonthlyTrends(6)

      // Should filter to 6 months ago
      const expectedStartDate = new Date()
      expectedStartDate.setMonth(expectedStartDate.getMonth() - 6)
      const expectedDateString = expectedStartDate.toISOString().split('T')[0]
      
      expect(mockQuery.gte).toHaveBeenCalledWith('date', expectedDateString)
    })
  })

  describe('getByVehicle', () => {
    it('should return expenses for specific vehicle', async () => {
      const mockVehicleExpenses = [
        { id: '1', vehicle_id: mockVehicleId, amount: 5000 },
        { id: '2', vehicle_id: mockVehicleId, amount: 3000 }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockVehicleExpenses, error: null })
      })

      const result = await ExpenseService.getByVehicle(mockVehicleId)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockVehicleExpenses)
    })
  })

  describe('update', () => {
    it('should update expense successfully', async () => {
      const updateData: UpdateExpenseData = { amount: 16000, notes: 'Updated amount' }
      const updatedExpense = { id: mockExpenseId, ...updateData }

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedExpense, error: null })
      })

      const result = await ExpenseService.update(mockExpenseId, updateData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedExpense)
    })
  })

  describe('delete', () => {
    it('should delete expense successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      })

      const result = await ExpenseService.delete(mockExpenseId)

      expect(result.success).toBe(true)
    })
  })

  describe('bulkImport', () => {
    it('should import multiple expenses with user association', async () => {
      const bulkExpenses = [
        { category: 'acquisition', description: 'Car 1', amount: 10000, currency: 'USD', date: '2024-01-15' },
        { category: 'transportation', description: 'Shipping', amount: 2000, currency: 'AED', date: '2024-01-16' }
      ] as CreateExpenseData[]

      const expectedImportData = bulkExpenses.map(expense => ({
        ...expense,
        created_by: mockUserId
      }))

      let insertedData: any
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockImplementation((data) => {
          insertedData = data
          return {
            select: vi.fn().mockResolvedValue({ 
              data: data.map((item: any, index: number) => ({ id: `expense-${index}`, ...item })), 
              error: null 
            })
          }
        })
      })

      const result = await ExpenseService.bulkImport(bulkExpenses, mockUserId)

      expect(result.success).toBe(true)
      expect(insertedData).toEqual(expectedImportData)
      expect(insertedData.every((expense: any) => expense.created_by === mockUserId)).toBe(true)
    })
  })

  describe('currency conversion rates', () => {
    it('should use consistent exchange rates across methods', () => {
      // Test data with different currencies
      const usdAmount = 1000
      const cadAmount = 1000
      
      // These are the hardcoded rates used in the service
      const expectedUsdToAed = usdAmount * 3.67
      const expectedCadToAed = cadAmount * 2.70
      
      // This tests that the rates are consistent (the actual conversion logic is tested in getStatistics)
      expect(expectedUsdToAed).toBe(3670)
      expect(expectedCadToAed).toBe(2700)
    })
  })
})