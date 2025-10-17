import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { InvoiceService, CreateInvoiceData, UpdateInvoiceData, InvoiceFilters, InvoiceLineItem } from '../invoices'
import { supabase } from '@/lib/supabase/client'

// Cast the mocked supabase to access mock functions
const mockSupabase = supabase as any

describe('InvoiceService', () => {
  const mockUserId = 'test-user-123'
  const mockInvoiceId = 'invoice-123'
  const mockCustomerId = 'customer-123'
  const mockVehicleId = 'vehicle-123'

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock Date for consistent testing
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('generateInvoiceNumber', () => {
    it('should generate first invoice number when no invoices exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      })

      const result = await InvoiceService.generateInvoiceNumber()

      expect(result).toBe('INV-2024-0001')
    })

    it('should generate next invoice number based on last invoice', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ 
          data: [{ invoice_number: 'INV-0005' }], 
          error: null 
        })
      })

      const result = await InvoiceService.generateInvoiceNumber()

      expect(result).toBe('INV-2024-0006')
    })

    it('should handle non-standard invoice number format', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ 
          data: [{ invoice_number: 'CUSTOM-001' }], 
          error: null 
        })
      })

      const result = await InvoiceService.generateInvoiceNumber()

      expect(result).toBe('INV-2024-0001')
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' } 
        })
      })

      const result = await InvoiceService.generateInvoiceNumber()

      expect(result).toBe('INV-2024-0001')
    })
  })

  describe('create', () => {
    const validInvoiceData: CreateInvoiceData = {
      customer_id: mockCustomerId,
      vehicle_id: mockVehicleId,
      line_items: [
        {
          description: '2021 Honda Civic',
          quantity: 1,
          unit_price: 25000,
          total: 25000
        }
      ],
      subtotal: 25000,
      vat_rate: 5,
      vat_amount: 1250,
      total_amount: 26250,
      currency: 'AED',
      due_date: '2024-02-15'
    }

    it('should create invoice with valid data', async () => {
      const mockInvoice = { 
        id: mockInvoiceId, 
        ...validInvoiceData,
        invoice_number: 'INV-2024-0001',
        status: 'draft'
      }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvoice, error: null })
      })

      const result = await InvoiceService.create(validInvoiceData, mockUserId)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockInvoice)
    })

    it('should generate invoice number if not provided', async () => {
      const mockInvoice = { 
        id: mockInvoiceId, 
        ...validInvoiceData,
        invoice_number: 'INV-2024-0001'
      }

      // Mock generateInvoiceNumber
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      })

      // Mock insert
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvoice, error: null })
      })

      const result = await InvoiceService.create(validInvoiceData, mockUserId)

      expect(result.success).toBe(true)
    })

    it('should use provided invoice number', async () => {
      const dataWithNumber = { ...validInvoiceData, invoice_number: 'CUSTOM-001' }
      const mockInvoice = { id: mockInvoiceId, ...dataWithNumber }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvoice, error: null })
      })

      const result = await InvoiceService.create(dataWithNumber, mockUserId)

      expect(result.success).toBe(true)
      expect(result.data?.invoice_number).toBe('CUSTOM-001')
    })

    it('should set default status to draft', async () => {
      let insertedData: any
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockImplementation((data) => {
          insertedData = data
          return {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: mockInvoiceId, ...data }, error: null })
          }
        })
      })

      await InvoiceService.create(validInvoiceData, mockUserId)

      expect(insertedData.status).toBe('draft')
      expect(insertedData.created_by).toBe(mockUserId)
    })
  })

  describe('calculateVAT', () => {
    it('should calculate VAT correctly', () => {
      const result = InvoiceService.calculateVAT(1000, 5)
      expect(result).toBe(50)
    })

    it('should round VAT to 2 decimal places', () => {
      const result = InvoiceService.calculateVAT(333.33, 5)
      expect(result).toBe(16.67)
    })

    it('should handle zero VAT rate', () => {
      const result = InvoiceService.calculateVAT(1000, 0)
      expect(result).toBe(0)
    })
  })

  describe('calculateTotals', () => {
    const lineItems: InvoiceLineItem[] = [
      { description: 'Item 1', quantity: 2, unit_price: 100, total: 200 },
      { description: 'Item 2', quantity: 1, unit_price: 300, total: 300 }
    ]

    it('should calculate totals correctly with VAT', () => {
      const result = InvoiceService.calculateTotals(lineItems, 5)

      expect(result.subtotal).toBe(500)
      expect(result.vatAmount).toBe(25)
      expect(result.total).toBe(525)
    })

    it('should calculate totals correctly without VAT', () => {
      const result = InvoiceService.calculateTotals(lineItems, 0)

      expect(result.subtotal).toBe(500)
      expect(result.vatAmount).toBe(0)
      expect(result.total).toBe(500)
    })

    it('should round all amounts to 2 decimal places', () => {
      const itemsWithDecimals: InvoiceLineItem[] = [
        { description: 'Item', quantity: 3, unit_price: 33.333, total: 99.999 }
      ]

      const result = InvoiceService.calculateTotals(itemsWithDecimals, 5)

      expect(result.subtotal).toBe(100) // rounded from 99.999
      expect(result.vatAmount).toBe(5) // 5% of 100
      expect(result.total).toBe(105)
    })
  })

  describe('getAll', () => {
    const mockInvoices = [
      { 
        id: '1', 
        invoice_number: 'INV-2024-0001',
        total_amount: 1000,
        payments: [{ amount: 500 }]
      },
      { 
        id: '2', 
        invoice_number: 'INV-2024-0002',
        total_amount: 2000,
        payments: []
      }
    ]

    it('should return all invoices with payment calculations', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: mockInvoices, 
          error: null, 
          count: 2 
        })
      })

      const result = await InvoiceService.getAll()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data?.[0].total_paid).toBe(500)
      expect(result.data?.[0].balance_due).toBe(500)
      expect(result.data?.[1].total_paid).toBe(0)
      expect(result.data?.[1].balance_due).toBe(2000)
    })

    it('should apply search filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [mockInvoices[0]], error: null, count: 1 })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: InvoiceFilters = { search: 'INV-001' }
      await InvoiceService.getAll(filters)

      expect(mockQuery.or).toHaveBeenCalledWith('invoice_number.ilike.%INV-001%,notes.ilike.%INV-001%')
    })

    it('should apply status filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [mockInvoices[0]], error: null, count: 1 })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: InvoiceFilters = { status: 'sent' }
      await InvoiceService.getAll(filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'sent')
    })

    it('should apply overdue filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: InvoiceFilters = { overdue_only: true }
      await InvoiceService.getAll(filters)

      expect(mockQuery.lt).toHaveBeenCalledWith('due_date', '2024-01-15')
      expect(mockQuery.neq).toHaveBeenCalledWith('status', 'fully_paid')
      expect(mockQuery.neq).toHaveBeenCalledWith('status', 'cancelled')
    })

    it('should apply date range filters', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: InvoiceFilters = { 
        created_from: '2024-01-01',
        created_to: '2024-01-31',
        due_from: '2024-02-01',
        due_to: '2024-02-28'
      }
      await InvoiceService.getAll(filters)

      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', '2024-01-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('created_at', '2024-01-31')
      expect(mockQuery.gte).toHaveBeenCalledWith('due_date', '2024-02-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('due_date', '2024-02-28')
    })
  })

  describe('getById', () => {
    it('should return invoice with payment calculations', async () => {
      const mockInvoiceData = {
        id: mockInvoiceId,
        invoice_number: 'INV-2024-0001',
        total_amount: 1000,
        payments: [
          { amount: 300 },
          { amount: 200 }
        ]
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvoiceData, error: null })
      })

      const result = await InvoiceService.getById(mockInvoiceId)

      expect(result.success).toBe(true)
      expect(result.data?.total_paid).toBe(500)
      expect(result.data?.balance_due).toBe(500)
    })

    it('should handle invoice not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'No rows returned' } 
        })
      })

      const result = await InvoiceService.getById('non-existent-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('No rows returned')
    })
  })

  describe('update', () => {
    it('should update invoice successfully', async () => {
      const updateData: UpdateInvoiceData = { notes: 'Updated notes' }
      const updatedInvoice = { id: mockInvoiceId, ...updateData }

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedInvoice, error: null })
      })

      const result = await InvoiceService.update(mockInvoiceId, updateData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedInvoice)
    })
  })

  describe('sendInvoice', () => {
    it('should update invoice status to sent with timestamp', async () => {
      const sentInvoice = { 
        id: mockInvoiceId, 
        status: 'sent',
        sent_at: '2024-01-15T10:00:00.000Z'
      }

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: sentInvoice, error: null })
      })

      const result = await InvoiceService.sendInvoice(mockInvoiceId)

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('sent')
      expect(result.data?.sent_at).toBe('2024-01-15T10:00:00.000Z')
    })
  })

  describe('createFromVehicleSale', () => {
    it('should create invoice from vehicle sale with correct calculations', async () => {
      // Mock vehicle data
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { 
            year: 2021, 
            make: 'Honda', 
            model: 'Civic', 
            vin: '1HGBH41JXMN109186' 
          }, 
          error: null 
        })
      })

      // Mock generateInvoiceNumber
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      })

      // Mock invoice creation
      const mockInvoice = { id: mockInvoiceId, invoice_number: 'INV-2024-0001' }
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvoice, error: null })
      })

      const result = await InvoiceService.createFromVehicleSale(
        mockVehicleId,
        mockCustomerId,
        25000,
        'AED',
        mockUserId
      )

      expect(result.success).toBe(true)
    })

    it('should apply UAE VAT rate for AED currency', async () => {
      // Mock vehicle data
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { year: 2021, make: 'Honda', model: 'Civic', vin: '123' }, 
          error: null 
        })
      })

      // Mock generateInvoiceNumber
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      })

      // Capture the inserted data
      let insertedData: any
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockImplementation((data) => {
          insertedData = data
          return {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: mockInvoiceId, ...data }, error: null })
          }
        })
      })

      await InvoiceService.createFromVehicleSale(
        mockVehicleId,
        mockCustomerId,
        20000,
        'AED',
        mockUserId
      )

      expect(insertedData.vat_rate).toBe(5)
      expect(insertedData.vat_amount).toBe(1000) // 5% of 20000
      expect(insertedData.total_amount).toBe(21000)
    })

    it('should not apply VAT for non-AED currency', async () => {
      // Mock vehicle data
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { year: 2021, make: 'Honda', model: 'Civic', vin: '123' }, 
          error: null 
        })
      })

      // Mock generateInvoiceNumber
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      })

      // Capture the inserted data
      let insertedData: any
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockImplementation((data) => {
          insertedData = data
          return {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: mockInvoiceId, ...data }, error: null })
          }
        })
      })

      await InvoiceService.createFromVehicleSale(
        mockVehicleId,
        mockCustomerId,
        20000,
        'USD',
        mockUserId
      )

      expect(insertedData.vat_rate).toBe(0)
      expect(insertedData.vat_amount).toBe(0)
      expect(insertedData.total_amount).toBe(20000)
    })

    it('should handle vehicle not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Vehicle not found' } 
        })
      })

      const result = await InvoiceService.createFromVehicleSale(
        'non-existent-vehicle',
        mockCustomerId,
        25000,
        'AED',
        mockUserId
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Vehicle not found')
    })
  })

  describe('updateStatusFromPayments', () => {
    it('should update status to fully_paid when total paid equals invoice amount', async () => {
      const mockInvoiceData = {
        id: mockInvoiceId,
        total_amount: 1000,
        total_paid: 1000,
        status: 'sent',
        due_date: '2024-02-15'
      }

      // Mock getById
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvoiceData, error: null })
      })

      // Mock update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { ...mockInvoiceData, status: 'fully_paid' }, 
          error: null 
        })
      })

      const result = await InvoiceService.updateStatusFromPayments(mockInvoiceId)

      expect(result.success).toBe(true)
    })

    it('should update status to partially_paid when partially paid', async () => {
      const mockInvoiceData = {
        id: mockInvoiceId,
        total_amount: 1000,
        total_paid: 500,
        status: 'sent',
        due_date: '2024-02-15'
      }

      // Mock getById
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvoiceData, error: null })
      })

      // Mock update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { ...mockInvoiceData, status: 'partially_paid' }, 
          error: null 
        })
      })

      const result = await InvoiceService.updateStatusFromPayments(mockInvoiceId)

      expect(result.success).toBe(true)
    })

    it('should update status to overdue when past due date and not fully paid', async () => {
      const mockInvoiceData = {
        id: mockInvoiceId,
        total_amount: 1000,
        total_paid: 500,
        status: 'sent',
        due_date: '2024-01-10' // Past due
      }

      // Mock getById
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvoiceData, error: null })
      })

      // Mock update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { ...mockInvoiceData, status: 'overdue' }, 
          error: null 
        })
      })

      const result = await InvoiceService.updateStatusFromPayments(mockInvoiceId)

      expect(result.success).toBe(true)
    })
  })

  describe('getStatistics', () => {
    it('should return comprehensive invoice statistics', async () => {
      const mockInvoiceData = [
        { total_amount: 1000, currency: 'AED', status: 'sent' },
        { total_amount: 2000, currency: 'AED', status: 'fully_paid' },
        { total_amount: 500, currency: 'USD', status: 'draft' }
      ]

      // Mock total result
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ 
          data: mockInvoiceData, 
          count: 3,
          error: null 
        })
      })

      // Mock status result
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ 
          data: mockInvoiceData, 
          count: 3,
          error: null 
        })
      })

      // Mock currency result
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ 
          data: mockInvoiceData, 
          count: 3,
          error: null 
        })
      })

      // Mock overdue result
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: [{ total_amount: 800 }], 
          count: 1,
          error: null 
        })
      })

      const result = await InvoiceService.getStatistics()

      expect(result.success).toBe(true)
      expect(result.data?.total).toBe(3)
      expect(result.data?.totalValue.AED).toBe(3000)
      expect(result.data?.totalValue.USD).toBe(500)
    })
  })

  describe('getOverdueInvoices', () => {
    it('should return overdue invoices only', async () => {
      const mockOverdueInvoices = [
        { id: '1', due_date: '2024-01-10', status: 'sent' },
        { id: '2', due_date: '2024-01-12', status: 'partially_paid' }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: mockOverdueInvoices, 
          error: null 
        })
      })

      const result = await InvoiceService.getOverdueInvoices()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockOverdueInvoices)
    })
  })

  describe('delete', () => {
    it('should delete invoice successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      })

      const result = await InvoiceService.delete(mockInvoiceId)

      expect(result.success).toBe(true)
    })

    it('should handle delete errors', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ 
          error: { message: 'Cannot delete invoice with payments' } 
        })
      })

      const result = await InvoiceService.delete(mockInvoiceId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot delete invoice with payments')
    })
  })
})