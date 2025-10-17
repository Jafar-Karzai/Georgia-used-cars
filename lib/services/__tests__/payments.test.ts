import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PaymentService, CreatePaymentData, UpdatePaymentData, PaymentFilters } from '../payments'
import { InvoiceService } from '../invoices'
import { supabase } from '@/lib/supabase/client'

// Cast the mocked supabase to access mock functions
const mockSupabase = supabase as any

// Mock InvoiceService
vi.mock('../invoices', () => ({
  InvoiceService: {
    updateStatusFromPayments: vi.fn(),
    getById: vi.fn()
  }
}))

const mockInvoiceService = InvoiceService as any

describe('PaymentService', () => {
  const mockUserId = 'test-user-123'
  const mockPaymentId = 'payment-123'
  const mockInvoiceId = 'invoice-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    const validPaymentData: CreatePaymentData = {
      invoiceId: mockInvoiceId,
      amount: 5000,
      currency: 'AED',
      paymentDate: '2024-01-15',
      paymentMethod: 'bank_transfer',
      transactionId: 'TXN-123456',
      notes: 'Payment for vehicle purchase'
    }

    it('should create payment with valid data', async () => {
      const mockPayment = {
        id: mockPaymentId,
        ...validPaymentData,
        recordedBy: mockUserId
      }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockPayment, error: null })
      })

      mockInvoiceService.updateStatusFromPayments.mockResolvedValue({ success: true })

      const result = await PaymentService.create(validPaymentData, mockUserId)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPayment)
      expect(mockInvoiceService.updateStatusFromPayments).toHaveBeenCalledWith(mockInvoiceId)
    })

    it('should associate payment with user', async () => {
      let insertedData: any
      
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockImplementation((data) => {
          insertedData = data
          return {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: mockPaymentId, ...data }, error: null })
          }
        })
      })

      mockInvoiceService.updateStatusFromPayments.mockResolvedValue({ success: true })

      await PaymentService.create(validPaymentData, mockUserId)

      expect(insertedData.recordedBy).toBe(mockUserId)
      expect(insertedData.invoiceId).toBe(mockInvoiceId)
    })

    it('should update invoice status after payment creation', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: mockPaymentId }, error: null })
      })

      mockInvoiceService.updateStatusFromPayments.mockResolvedValue({ success: true })

      await PaymentService.create(validPaymentData, mockUserId)

      expect(mockInvoiceService.updateStatusFromPayments).toHaveBeenCalledWith(mockInvoiceId)
    })

    it('should validate payment methods', async () => {
      const validMethods = ['cash', 'bank_transfer', 'check', 'credit_card', 'other']

      for (const method of validMethods) {
        const paymentWithMethod = {
          ...validPaymentData,
          paymentMethod: method as any
        }

        mockSupabase.from.mockReturnValue({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { id: `payment-${method}`, ...paymentWithMethod }, 
            error: null 
          })
        })

        mockInvoiceService.updateStatusFromPayments.mockResolvedValue({ success: true })

        const result = await PaymentService.create(paymentWithMethod, mockUserId)
        expect(result.success).toBe(true)
        expect(result.data?.paymentMethod).toBe(method)
      }
    })

    it('should support multiple currencies', async () => {
      const currencies = ['AED', 'USD', 'CAD']

      for (const currency of currencies) {
        const paymentWithCurrency = {
          ...validPaymentData,
          currency: currency as any
        }

        mockSupabase.from.mockReturnValue({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { id: `payment-${currency}`, ...paymentWithCurrency }, 
            error: null 
          })
        })

        mockInvoiceService.updateStatusFromPayments.mockResolvedValue({ success: true })

        const result = await PaymentService.create(paymentWithCurrency, mockUserId)
        expect(result.success).toBe(true)
        expect(result.data?.currency).toBe(currency)
      }
    })

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Invalid invoice_id foreign key' } 
        })
      })

      const result = await PaymentService.create(validPaymentData, mockUserId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid invoice_id foreign key')
    })
  })

  describe('getAll', () => {
    const mockPayments = [
      {
        id: '1',
        amount: 5000,
        currency: 'AED',
        paymentMethod: 'bank_transfer',
        invoice: { invoiceNumber: 'INV-001', customer: { fullName: 'John Doe' } }
      },
      {
        id: '2',
        amount: 3000,
        currency: 'USD',
        paymentMethod: 'cash',
        invoice: { invoiceNumber: 'INV-002', customer: { fullName: 'Jane Smith' } }
      }
    ]

    it('should return all payments with invoice details', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: mockPayments, 
          error: null, 
          count: 2 
        })
      })

      const result = await PaymentService.getAll()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPayments)
      expect(result.data?.[0].invoice).toBeDefined()
    })

    it('should filter by invoice ID', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: [mockPayments[0]], 
          error: null, 
          count: 1 
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: PaymentFilters = { invoiceId: mockInvoiceId }
      await PaymentService.getAll(filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('invoiceId', mockInvoiceId)
    })

    it('should filter by payment method', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: [mockPayments[0]], 
          error: null, 
          count: 1 
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: PaymentFilters = { paymentMethod: 'bank_transfer' }
      await PaymentService.getAll(filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('paymentMethod', 'bank_transfer')
    })

    it('should filter by currency', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: [mockPayments[0]], 
          error: null, 
          count: 1 
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: PaymentFilters = { currency: 'AED' }
      await PaymentService.getAll(filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('currency', 'AED')
    })

    it('should filter by date range', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: mockPayments, 
          error: null, 
          count: 2 
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: PaymentFilters = {
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31'
      }
      await PaymentService.getAll(filters)

      expect(mockQuery.gte).toHaveBeenCalledWith('paymentDate', '2024-01-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('paymentDate', '2024-01-31')
    })

    it('should filter by amount range', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: [mockPayments[0]], 
          error: null, 
          count: 1 
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: PaymentFilters = {
        amountFrom: 1000,
        amountTo: 10000
      }
      await PaymentService.getAll(filters)

      expect(mockQuery.gte).toHaveBeenCalledWith('amount', 1000)
      expect(mockQuery.lte).toHaveBeenCalledWith('amount', 10000)
    })

    it('should search across transaction ID and notes', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ 
          data: mockPayments, 
          error: null, 
          count: 2 
        })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: PaymentFilters = { search: 'TXN-123' }
      await PaymentService.getAll(filters)

      expect(mockQuery.or).toHaveBeenCalledWith('transactionId.ilike.%TXN-123%,notes.ilike.%TXN-123%')
    })
  })

  describe('getInvoicePaymentSummary', () => {
    it('should calculate payment allocation correctly', async () => {
      const mockInvoice = {
        id: mockInvoiceId,
        totalAmount: 10000,
        currency: 'AED'
      }

      const mockPayments = [
        { id: '1', amount: 3000, currency: 'AED', paymentDate: '2024-01-15', paymentMethod: 'cash' },
        { id: '2', amount: 2000, currency: 'AED', paymentDate: '2024-01-16', paymentMethod: 'bank_transfer', transactionId: 'TXN-456' }
      ]

      mockInvoiceService.getById.mockResolvedValue({ success: true, data: mockInvoice })
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPayments, error: null })
      })

      const result = await PaymentService.getInvoicePaymentSummary(mockInvoiceId)

      expect(result.success).toBe(true)
      expect(result.data?.invoiceAmount).toBe(10000)
      expect(result.data?.totalPaid).toBe(5000) // 3000 + 2000
      expect(result.data?.balanceDue).toBe(5000) // 10000 - 5000
      expect(result.data?.paymentPercentage).toBe(50) // (5000 / 10000) * 100
      expect(result.data?.paymentCount).toBe(2)
      expect(result.data?.payments).toHaveLength(2)
    })

    it('should handle fully paid invoices', async () => {
      const mockInvoice = {
        id: mockInvoiceId,
        totalAmount: 5000,
        currency: 'AED'
      }

      const mockPayments = [
        { id: '1', amount: 5000, currency: 'AED', paymentDate: '2024-01-15', paymentMethod: 'bank_transfer' }
      ]

      mockInvoiceService.getById.mockResolvedValue({ success: true, data: mockInvoice })
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPayments, error: null })
      })

      const result = await PaymentService.getInvoicePaymentSummary(mockInvoiceId)

      expect(result.success).toBe(true)
      expect(result.data?.totalPaid).toBe(5000)
      expect(result.data?.balanceDue).toBe(0)
      expect(result.data?.paymentPercentage).toBe(100)
    })

    it('should handle overpaid invoices', async () => {
      const mockInvoice = {
        id: mockInvoiceId,
        totalAmount: 3000,
        currency: 'AED'
      }

      const mockPayments = [
        { id: '1', amount: 5000, currency: 'AED', paymentDate: '2024-01-15', paymentMethod: 'bank_transfer' }
      ]

      mockInvoiceService.getById.mockResolvedValue({ success: true, data: mockInvoice })
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPayments, error: null })
      })

      const result = await PaymentService.getInvoicePaymentSummary(mockInvoiceId)

      expect(result.success).toBe(true)
      expect(result.data?.totalPaid).toBe(5000)
      expect(result.data?.balanceDue).toBe(-2000) // Negative balance indicates overpayment
      expect(result.data?.paymentPercentage).toBe(166.67) // (5000 / 3000) * 100, rounded
    })

    it('should handle zero amount invoices', async () => {
      const mockInvoice = {
        id: mockInvoiceId,
        totalAmount: 0,
        currency: 'AED'
      }

      mockInvoiceService.getById.mockResolvedValue({ success: true, data: mockInvoice })
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      })

      const result = await PaymentService.getInvoicePaymentSummary(mockInvoiceId)

      expect(result.success).toBe(true)
      expect(result.data?.paymentPercentage).toBe(0)
    })
  })

  describe('createQuickPayment', () => {
    it('should create payment with invoice currency', async () => {
      const mockInvoice = {
        id: mockInvoiceId,
        currency: 'USD',
        totalAmount: 10000
      }

      mockInvoiceService.getById.mockResolvedValue({ success: true, data: mockInvoice })

      let createdPaymentData: any
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockImplementation((data) => {
          createdPaymentData = data
          return {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: mockPaymentId, ...data }, error: null })
          }
        })
      })

      mockInvoiceService.updateStatusFromPayments.mockResolvedValue({ success: true })

      const result = await PaymentService.createQuickPayment(
        mockInvoiceId,
        5000,
        'bank_transfer',
        mockUserId,
        'TXN-789',
        'Quick payment'
      )

      expect(result.success).toBe(true)
      expect(createdPaymentData.amount).toBe(5000)
      expect(createdPaymentData.currency).toBe('USD') // Should use invoice currency
      expect(createdPaymentData.paymentMethod).toBe('bank_transfer')
      expect(createdPaymentData.transactionId).toBe('TXN-789')
    })

    it('should handle invoice not found', async () => {
      mockInvoiceService.getById.mockResolvedValue({ success: false, error: 'Invoice not found' })

      const result = await PaymentService.createQuickPayment(
        'non-existent-invoice',
        5000,
        'cash',
        mockUserId
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invoice not found')
    })
  })

  describe('processFullPayment', () => {
    it('should pay full balance of invoice', async () => {
      const mockInvoice = {
        id: mockInvoiceId,
        currency: 'AED',
        totalAmount: 10000,
        balanceDue: 7000 // 3000 already paid
      }

      mockInvoiceService.getById.mockResolvedValue({ success: true, data: mockInvoice })

      let createdPaymentData: any
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockImplementation((data) => {
          createdPaymentData = data
          return {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: mockPaymentId, ...data }, error: null })
          }
        })
      })

      mockInvoiceService.updateStatusFromPayments.mockResolvedValue({ success: true })

      const result = await PaymentService.processFullPayment(
        mockInvoiceId,
        'bank_transfer',
        mockUserId,
        'TXN-FULL'
      )

      expect(result.success).toBe(true)
      expect(createdPaymentData.amount).toBe(7000) // Balance due amount
      expect(createdPaymentData.notes).toBe('Full payment')
    })

    it('should handle already fully paid invoice', async () => {
      const mockInvoice = {
        id: mockInvoiceId,
        currency: 'AED',
        totalAmount: 10000,
        balanceDue: 0 // Fully paid
      }

      mockInvoiceService.getById.mockResolvedValue({ success: true, data: mockInvoice })

      const result = await PaymentService.processFullPayment(
        mockInvoiceId,
        'cash',
        mockUserId
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invoice is already fully paid')
    })
  })

  describe('createRefund', () => {
    it('should create negative payment for refund', async () => {
      const mockOriginalPayment = {
        id: mockPaymentId,
        amount: 5000,
        currency: 'AED',
        paymentMethod: 'bank_transfer',
        invoice: {
          id: mockInvoiceId
        }
      }

      // Mock getById for original payment
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOriginalPayment, error: null })
      })

      let refundPaymentData: any
      // Mock create for refund payment
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockImplementation((data) => {
          refundPaymentData = data
          return {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'refund-123', ...data }, error: null })
          }
        })
      })

      mockInvoiceService.updateStatusFromPayments.mockResolvedValue({ success: true })

      const result = await PaymentService.createRefund(
        mockPaymentId,
        3000,
        'Damaged vehicle',
        mockUserId
      )

      expect(result.success).toBe(true)
      expect(refundPaymentData.amount).toBe(-3000) // Negative amount
      expect(refundPaymentData.currency).toBe('AED')
      expect(refundPaymentData.transactionId).toBe(`REFUND-${mockPaymentId}`)
      expect(refundPaymentData.notes).toContain('Refund for payment')
      expect(refundPaymentData.notes).toContain('Damaged vehicle')
    })

    it('should not allow refund exceeding original payment', async () => {
      const mockOriginalPayment = {
        id: mockPaymentId,
        amount: 3000,
        currency: 'AED',
        paymentMethod: 'cash',
        invoice: {
          id: mockInvoiceId
        }
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOriginalPayment, error: null })
      })

      const result = await PaymentService.createRefund(
        mockPaymentId,
        5000, // More than original 3000
        'Refund reason',
        mockUserId
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Refund amount cannot exceed original payment amount')
    })

    it('should handle payment not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      })

      const result = await PaymentService.createRefund(
        'non-existent-payment',
        1000,
        'Refund reason',
        mockUserId
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Original payment not found')
    })
  })

  describe('getStatistics', () => {
    const mockPaymentData = [
      { amount: 5000, currency: 'AED', paymentMethod: 'bank_transfer' },
      { amount: 3000, currency: 'USD', paymentMethod: 'cash' },
      { amount: 2000, currency: 'AED', paymentMethod: 'bank_transfer' }
    ]

    it('should calculate payment statistics correctly', async () => {
      // Mock total result
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ 
          data: mockPaymentData, 
          count: 3,
          error: null 
        })
      })

      // Mock method result
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ 
          data: mockPaymentData, 
          count: 3,
          error: null 
        })
      })

      // Mock currency result
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ 
          data: mockPaymentData, 
          count: 3,
          error: null 
        })
      })

      const result = await PaymentService.getStatistics()

      expect(result.success).toBe(true)
      expect(result.data?.total).toBe(3)
      expect(result.data?.totalValue.AED).toBe(7000) // 5000 + 2000
      expect(result.data?.totalValue.USD).toBe(3000)
      expect(result.data?.byMethod.counts.bank_transfer).toBe(2)
      expect(result.data?.byMethod.counts.cash).toBe(1)
    })
  })

  describe('update and delete with invoice status updates', () => {
    it('should update invoice status after payment update', async () => {
      const mockCurrentPayment = {
        success: true,
        data: {
          id: mockPaymentId,
          invoice: { id: mockInvoiceId }
        }
      }

      // Mock getById (called in update method)
      vi.spyOn(PaymentService, 'getById').mockResolvedValue(mockCurrentPayment as any)

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: mockPaymentId }, error: null })
      })

      mockInvoiceService.updateStatusFromPayments.mockResolvedValue({ success: true })

      const result = await PaymentService.update(mockPaymentId, { amount: 6000 })

      expect(result.success).toBe(true)
      expect(mockInvoiceService.updateStatusFromPayments).toHaveBeenCalledWith(mockInvoiceId)
    })

    it('should update invoice status after payment deletion', async () => {
      const mockPaymentToDelete = {
        success: true,
        data: {
          id: mockPaymentId,
          invoice: { id: mockInvoiceId }
        }
      }

      // Mock getById (called in delete method)
      vi.spyOn(PaymentService, 'getById').mockResolvedValue(mockPaymentToDelete as any)

      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      })

      mockInvoiceService.updateStatusFromPayments.mockResolvedValue({ success: true })

      const result = await PaymentService.delete(mockPaymentId)

      expect(result.success).toBe(true)
      expect(mockInvoiceService.updateStatusFromPayments).toHaveBeenCalledWith(mockInvoiceId)
    })
  })
})