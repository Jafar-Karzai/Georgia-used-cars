import { prisma } from '@/lib/prisma'
import { InvoiceService } from './invoices'
import { Prisma } from '@prisma/client'

export interface CreatePaymentData {
  invoiceId: string
  amount: number
  currency: 'AED' | 'USD' | 'CAD'
  paymentDate: string
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'other'
  transactionId?: string
  notes?: string
}

export interface UpdatePaymentData extends Partial<CreatePaymentData> {}

export interface PaymentFilters {
  search?: string
  invoiceId?: string
  paymentMethod?: string
  currency?: string
  dateFrom?: string
  dateTo?: string
  amountFrom?: number
  amountTo?: number
}

export class PaymentService {
  // Create a new payment
  static async create(paymentData: CreatePaymentData, createdBy: string) {
    try {
      const data = await prisma.payment.create({
        data: {
          invoiceId: paymentData.invoiceId,
          amount: new Prisma.Decimal(paymentData.amount.toString()),
          currency: paymentData.currency,
          paymentDate: new Date(paymentData.paymentDate),
          paymentMethod: paymentData.paymentMethod,
          transactionId: paymentData.transactionId,
          notes: paymentData.notes,
          recordedBy: createdBy
        }
      })

      // Update invoice status based on new payment
      await InvoiceService.updateStatusFromPayments(paymentData.invoiceId)

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get all payments with optional filtering
  static async getAll(filters?: PaymentFilters, page = 1, limit = 20) {
    try {
      const where: Prisma.PaymentWhereInput = {}

      if (filters?.search) {
        where.OR = [
          { transactionId: { contains: filters.search, mode: 'insensitive' } },
          { notes: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      if (filters?.invoiceId) where.invoiceId = filters.invoiceId
      if (filters?.paymentMethod) where.paymentMethod = filters.paymentMethod
      if (filters?.currency) where.currency = filters.currency

      if (filters?.dateFrom || filters?.dateTo) {
        where.paymentDate = {}
        if (filters?.dateFrom) where.paymentDate.gte = new Date(filters.dateFrom)
        if (filters?.dateTo) where.paymentDate.lte = new Date(filters.dateTo)
      }

      if (filters?.amountFrom || filters?.amountTo) {
        where.amount = {}
        if (filters?.amountFrom) where.amount.gte = new Prisma.Decimal(filters.amountFrom.toString())
        if (filters?.amountTo) where.amount.lte = new Prisma.Decimal(filters.amountTo.toString())
      }

      const total = await prisma.payment.count({ where })

      const skip = (page - 1) * limit
      const data = await prisma.payment.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              customerId: true,
              customer: { select: { fullName: true, email: true } },
              vehicle: { select: { year: true, make: true, model: true, vin: true } }
            }
          }
        },
        orderBy: { paymentDate: 'desc' },
        skip,
        take: limit
      })

      return {
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get payment by ID with detailed information
  static async getById(id: string) {
    try {
      const data = await prisma.payment.findUnique({
        where: { id },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              subtotal: true,
              vatAmount: true,
              currency: true,
              dueDate: true,
              status: true,
              customerId: true,
              vehicleId: true,
              customer: { select: { id: true, fullName: true, email: true, phone: true, address: true, city: true, country: true } },
              vehicle: { select: { id: true, year: true, make: true, model: true, vin: true, lotNumber: true } }
            }
          },
          profile: { select: { fullName: true, email: true } }
        }
      })

      if (!data) {
        return { success: false, error: 'Payment not found' }
      }

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Update payment
  static async update(id: string, updateData: UpdatePaymentData) {
    try {
      const currentPayment = await this.getById(id)
      if (!currentPayment.success || !currentPayment.data) {
        return { success: false, error: 'Payment not found' }
      }

      const data = await prisma.payment.update({
        where: { id },
        data: {
          invoiceId: updateData.invoiceId,
          amount: updateData.amount ? new Prisma.Decimal(updateData.amount.toString()) : undefined,
          currency: updateData.currency,
          paymentDate: updateData.paymentDate ? new Date(updateData.paymentDate) : undefined,
          paymentMethod: updateData.paymentMethod,
          transactionId: updateData.transactionId,
          notes: updateData.notes
        }
      })

      // Update invoice status based on updated payment
      const invoiceId = currentPayment.data.invoice?.id
      if (invoiceId) {
        await InvoiceService.updateStatusFromPayments(invoiceId)
      }

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Delete payment
  static async delete(id: string) {
    try {
      const paymentResult = await this.getById(id)
      if (!paymentResult.success || !paymentResult.data) {
        return { success: false, error: 'Payment not found' }
      }

      const invoiceId = paymentResult.data.invoice?.id

      await prisma.payment.delete({
        where: { id }
      })

      // Update invoice status after payment deletion
      if (invoiceId) {
        await InvoiceService.updateStatusFromPayments(invoiceId)
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get payments by invoice
  static async getByInvoice(invoiceId: string) {
    try {
      const data = await prisma.payment.findMany({
        where: { invoiceId },
        include: {
          profile: { select: { fullName: true } }
        },
        orderBy: { paymentDate: 'desc' }
      })

      return { success: true, data: data || [] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get payment statistics
  static async getStatistics(filters?: Partial<PaymentFilters>) {
    try {
      const where: Prisma.PaymentWhereInput = {}

      if (filters?.dateFrom) where.paymentDate = { gte: new Date(filters.dateFrom) }
      if (filters?.dateTo) {
        if (where.paymentDate) {
          ;(where.paymentDate as any).lte = new Date(filters.dateTo)
        } else {
          where.paymentDate = { lte: new Date(filters.dateTo) }
        }
      }

      const payments = await prisma.payment.findMany({
        where,
        select: { amount: true, currency: true, paymentMethod: true }
      })

      const currencyTotals: Record<string, number> = {}
      const methodCounts: Record<string, number> = {}
      const methodTotals: Record<string, number> = {}

      payments.forEach(payment => {
        currencyTotals[payment.currency] = (currencyTotals[payment.currency] || 0) + Number(payment.amount)
        methodCounts[payment.paymentMethod] = (methodCounts[payment.paymentMethod] || 0) + 1
        methodTotals[payment.paymentMethod] = (methodTotals[payment.paymentMethod] || 0) + Number(payment.amount)
      })

      return {
        success: true,
        data: {
          total: payments.length,
          totalValue: currencyTotals,
          byMethod: {
            counts: methodCounts,
            totals: methodTotals
          }
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get recent payments (last 30 days)
  static async getRecentPayments(limit = 10) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const data = await prisma.payment.findMany({
        where: {
          paymentDate: { gte: thirtyDaysAgo }
        },
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              customer: { select: { fullName: true } }
            }
          }
        },
        orderBy: { paymentDate: 'desc' },
        take: limit
      })

      return { success: true, data: data || [] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get payment trends (daily totals for last 30 days)
  static async getPaymentTrends() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const data = await prisma.payment.findMany({
        where: {
          paymentDate: { gte: thirtyDaysAgo }
        },
        select: { paymentDate: true, amount: true, currency: true },
        orderBy: { paymentDate: 'asc' }
      })

      const dailyTotals: Record<string, Record<string, number>> = {}

      data.forEach(payment => {
        const date = payment.paymentDate.toISOString().split('T')[0]
        if (!dailyTotals[date]) {
          dailyTotals[date] = {}
        }
        dailyTotals[date][payment.currency] = (dailyTotals[date][payment.currency] || 0) + Number(payment.amount)
        ;(dailyTotals[date] as any).total = ((dailyTotals[date] as any).total || 0) + Number(payment.amount)
      })

      return { success: true, data: dailyTotals }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Calculate payment allocation (how much of an invoice is paid)
  static async getInvoicePaymentSummary(invoiceId: string) {
    try {
      const invoiceResult = await InvoiceService.getById(invoiceId)
      const paymentsResult = await this.getByInvoice(invoiceId)

      if (!invoiceResult.success || !paymentsResult.success) {
        return { success: false, error: 'Failed to get invoice or payments' }
      }

      const invoice = invoiceResult.data!
      const payments = paymentsResult.data!

      const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
      const balanceDue = Number(invoice.totalAmount) - totalPaid
      const paymentPercentage = Number(invoice.totalAmount) > 0 ? (totalPaid / Number(invoice.totalAmount)) * 100 : 0

      return {
        success: true,
        data: {
          invoiceAmount: Number(invoice.totalAmount),
          totalPaid,
          balanceDue,
          paymentPercentage: Math.round(paymentPercentage * 100) / 100,
          paymentCount: payments.length,
          payments: payments.map(payment => ({
            id: payment.id,
            amount: Number(payment.amount),
            currency: payment.currency,
            paymentDate: payment.paymentDate,
            paymentMethod: payment.paymentMethod,
            transactionId: payment.transactionId
          }))
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Quick payment creation for common scenarios
  static async createQuickPayment(
    invoiceId: string,
    amount: number,
    paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card',
    createdBy: string,
    transactionId?: string,
    notes?: string
  ) {
    try {
      const invoiceResult = await InvoiceService.getById(invoiceId)
      if (!invoiceResult.success || !invoiceResult.data) {
        return { success: false, error: 'Invoice not found' }
      }

      const paymentData: CreatePaymentData = {
        invoiceId,
        amount,
        currency: invoiceResult.data.currency as any,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod,
        transactionId,
        notes
      }

      return await this.create(paymentData, createdBy)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Process full payment (pay entire invoice balance)
  static async processFullPayment(
    invoiceId: string,
    paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card',
    createdBy: string,
    transactionId?: string,
    notes?: string
  ) {
    try {
      const invoiceResult = await InvoiceService.getById(invoiceId)
      if (!invoiceResult.success || !invoiceResult.data) {
        return { success: false, error: 'Invoice not found' }
      }

      const invoice = invoiceResult.data
      const balanceDue = invoice.balanceDue || Number(invoice.totalAmount)

      if (balanceDue <= 0) {
        return { success: false, error: 'Invoice is already fully paid' }
      }

      return await this.createQuickPayment(invoiceId, balanceDue, paymentMethod, createdBy, transactionId, notes || 'Full payment')
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Refund payment
  static async createRefund(
    originalPaymentId: string,
    refundAmount: number,
    reason: string,
    createdBy: string
  ) {
    try {
      const paymentResult = await this.getById(originalPaymentId)
      if (!paymentResult.success || !paymentResult.data) {
        return { success: false, error: 'Original payment not found' }
      }

      const originalPayment = paymentResult.data
      const invoice = originalPayment.invoice

      if (!invoice) {
        return { success: false, error: 'Invoice not found for payment' }
      }

      if (refundAmount > Number(originalPayment.amount)) {
        return { success: false, error: 'Refund amount cannot exceed original payment amount' }
      }

      const refundData: CreatePaymentData = {
        invoiceId: invoice.id,
        amount: -Math.abs(refundAmount),
        currency: originalPayment.currency,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: originalPayment.paymentMethod,
        transactionId: `REFUND-${originalPayment.id}`,
        notes: `Refund for payment ${originalPayment.id}: ${reason}`
      }

      return await this.create(refundData, createdBy)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
