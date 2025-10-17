import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface CreateInvoiceData {
  customerId: string
  vehicleId?: string
  invoiceNumber?: string
  lineItems: InvoiceLineItem[]
  subtotal: number
  vatRate: number
  vatAmount: number
  totalAmount: number
  currency: 'AED' | 'USD' | 'CAD'
  dueDate: string
  paymentTerms?: string
  notes?: string
  status?: 'draft' | 'sent' | 'partially_paid' | 'fully_paid' | 'overdue' | 'cancelled'
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {}

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
  vatRate?: number
}

export interface InvoiceFilters {
  search?: string
  status?: string
  customerId?: string
  vehicleId?: string
  currency?: string
  createdFrom?: string
  createdTo?: string
  dueFrom?: string
  dueTo?: string
  overdueOnly?: boolean
}

export interface InvoiceWithDetails {
  id: string
  invoiceNumber: string
  customerId: string
  vehicleId?: string | null
  subtotal: Prisma.Decimal
  vatRate: Prisma.Decimal
  vatAmount: Prisma.Decimal
  totalAmount: Prisma.Decimal
  currency: string
  status: string
  dueDate?: Date | null
  terms?: string | null
  notes?: string | null
  createdBy?: string | null
  createdAt: Date
  updatedAt: Date
  totalPaid?: number
  balanceDue?: number
  customer?: {
    id: string
    fullName: string
    email?: string | null
    phone?: string | null
    address?: string | null
    city?: string | null
    country?: string | null
  } | null
  vehicle?: {
    id: string
    year: number
    make: string
    model: string
    vin: string
    lotNumber?: string | null
  } | null
  payments?: Array<{
    id: string
    amount: Prisma.Decimal
    currency: string
    paymentDate: Date
    paymentMethod: string
  }>
}

export class InvoiceService {
  // Generate next invoice number
  static async generateInvoiceNumber(): Promise<string> {
    try {
      const lastInvoice = await prisma.invoice.findFirst({
        select: { invoiceNumber: true },
        orderBy: { createdAt: 'desc' }
      })

      let nextNumber = 1

      if (lastInvoice?.invoiceNumber) {
        const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/)
        if (match) {
          nextNumber = parseInt(match[1]) + 1
        }
      }

      const year = new Date().getFullYear()
      return `INV-${year}-${nextNumber.toString().padStart(4, '0')}`
    } catch (error) {
      console.error('Error generating invoice number:', error)
      const year = new Date().getFullYear()
      return `INV-${year}-0001`
    }
  }

  // Create a new invoice
  static async create(invoiceData: CreateInvoiceData, createdBy: string) {
    try {
      // Generate invoice number if not provided
      const invoiceNumber = invoiceData.invoiceNumber || (await this.generateInvoiceNumber())

      const data = await prisma.invoice.create({
        data: {
          invoiceNumber,
          customerId: invoiceData.customerId,
          vehicleId: invoiceData.vehicleId,
          subtotal: new Prisma.Decimal(invoiceData.subtotal.toString()),
          vatRate: new Prisma.Decimal(invoiceData.vatRate.toString()),
          vatAmount: new Prisma.Decimal(invoiceData.vatAmount.toString()),
          totalAmount: new Prisma.Decimal(invoiceData.totalAmount.toString()),
          currency: invoiceData.currency,
          status: invoiceData.status || 'draft',
          dueDate: new Date(invoiceData.dueDate),
          terms: invoiceData.paymentTerms,
          notes: invoiceData.notes,
          createdBy
        }
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get all invoices with optional filtering
  static async getAll(filters?: InvoiceFilters, page = 1, limit = 20) {
    try {
      const where: Prisma.InvoiceWhereInput = {}

      if (filters?.search) {
        where.OR = [
          { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
          { notes: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      if (filters?.status) where.status = filters.status
      if (filters?.customerId) where.customerId = filters.customerId
      if (filters?.vehicleId) where.vehicleId = filters.vehicleId
      if (filters?.currency) where.currency = filters.currency

      if (filters?.createdFrom || filters?.createdTo) {
        where.createdAt = {}
        if (filters?.createdFrom) where.createdAt.gte = new Date(filters.createdFrom)
        if (filters?.createdTo) where.createdAt.lte = new Date(filters.createdTo)
      }

      if (filters?.dueFrom || filters?.dueTo) {
        where.dueDate = {}
        if (filters?.dueFrom) where.dueDate.gte = new Date(filters.dueFrom)
        if (filters?.dueTo) where.dueDate.lte = new Date(filters.dueTo)
      }

      if (filters?.overdueOnly) {
        const today = new Date().toISOString().split('T')[0]
        where.AND = [
          { dueDate: { lt: new Date(today) } },
          { status: { notIn: ['fully_paid', 'cancelled'] } }
        ]
      }

      const total = await prisma.invoice.count({ where })

      const skip = (page - 1) * limit
      const data = await prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { id: true, fullName: true, email: true, phone: true, address: true, city: true, country: true } },
          vehicle: { select: { id: true, year: true, make: true, model: true, vin: true, lotNumber: true } },
          payments: { select: { id: true, amount: true, currency: true, paymentDate: true, paymentMethod: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })

      const invoicesWithDetails: InvoiceWithDetails[] = data.map(invoice => {
        const payments = invoice.payments || []
        const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
        const balanceDue = Number(invoice.totalAmount) - totalPaid

        return {
          ...invoice,
          totalPaid,
          balanceDue
        }
      })

      return {
        success: true,
        data: invoicesWithDetails,
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

  // Get invoice by ID with detailed information
  static async getById(id: string) {
    try {
      const data = await prisma.invoice.findUnique({
        where: { id },
        include: {
          customer: { select: { id: true, fullName: true, email: true, phone: true, address: true, city: true, country: true } },
          vehicle: { select: { id: true, year: true, make: true, model: true, vin: true, lotNumber: true, salePrice: true } },
          payments: {
            select: {
              id: true,
              amount: true,
              currency: true,
              paymentDate: true,
              paymentMethod: true,
              transactionId: true,
              notes: true,
              createdAt: true
            }
          },
          createdByProfile: { select: { fullName: true, email: true } }
        }
      })

      if (!data) {
        return { success: false, error: 'Invoice not found' }
      }

      const payments = data.payments || []
      const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
      const balanceDue = Number(data.totalAmount) - totalPaid

      return {
        success: true,
        data: {
          ...data,
          totalPaid,
          balanceDue
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Update invoice
  static async update(id: string, updateData: UpdateInvoiceData) {
    try {
      const data = await prisma.invoice.update({
        where: { id },
        data: {
          customerId: updateData.customerId,
          vehicleId: updateData.vehicleId,
          subtotal: updateData.subtotal ? new Prisma.Decimal(updateData.subtotal.toString()) : undefined,
          vatRate: updateData.vatRate ? new Prisma.Decimal(updateData.vatRate.toString()) : undefined,
          vatAmount: updateData.vatAmount ? new Prisma.Decimal(updateData.vatAmount.toString()) : undefined,
          totalAmount: updateData.totalAmount ? new Prisma.Decimal(updateData.totalAmount.toString()) : undefined,
          currency: updateData.currency,
          status: updateData.status,
          dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
          terms: updateData.paymentTerms,
          notes: updateData.notes
        }
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Delete invoice
  static async delete(id: string) {
    try {
      await prisma.invoice.delete({
        where: { id }
      })

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Send invoice (update status to sent)
  static async sendInvoice(id: string) {
    try {
      const data = await prisma.invoice.update({
        where: { id },
        data: {
          status: 'sent'
        }
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get invoice statistics
  static async getStatistics(filters?: Partial<InvoiceFilters>) {
    try {
      const where: Prisma.InvoiceWhereInput = {}

      if (filters?.createdFrom) where.createdAt = { gte: new Date(filters.createdFrom) }
      if (filters?.createdTo) {
        if (where.createdAt) {
          ;(where.createdAt as any).lte = new Date(filters.createdTo)
        } else {
          where.createdAt = { lte: new Date(filters.createdTo) }
        }
      }

      const total = await prisma.invoice.count({ where })

      const invoices = await prisma.invoice.findMany({
        where,
        select: { status: true, totalAmount: true, currency: true, dueDate: true }
      })

      const todayStr = new Date().toISOString().split('T')[0]
      const today = new Date(todayStr)

      const statusCounts: Record<string, number> = {}
      const statusTotals: Record<string, number> = {}
      const currencyTotals: Record<string, number> = {}
      let overdueCount = 0
      let overdueAmount = 0

      invoices.forEach(invoice => {
        statusCounts[invoice.status] = (statusCounts[invoice.status] || 0) + 1
        statusTotals[invoice.status] = (statusTotals[invoice.status] || 0) + Number(invoice.totalAmount)
        currencyTotals[invoice.currency] = (currencyTotals[invoice.currency] || 0) + Number(invoice.totalAmount)

        if (invoice.dueDate && invoice.dueDate < today && invoice.status !== 'fully_paid' && invoice.status !== 'cancelled') {
          overdueCount++
          overdueAmount += Number(invoice.totalAmount)
        }
      })

      return {
        success: true,
        data: {
          total,
          totalValue: currencyTotals,
          byStatus: {
            counts: statusCounts,
            totals: statusTotals
          },
          overdue: {
            count: overdueCount,
            amount: overdueAmount
          }
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get invoices by customer
  static async getByCustomer(customerId: string) {
    try {
      const data = await prisma.invoice.findMany({
        where: { customerId },
        include: {
          vehicle: { select: { year: true, make: true, model: true, vin: true } },
          payments: { select: { amount: true, paymentDate: true, paymentMethod: true } }
        },
        orderBy: { createdAt: 'desc' }
      })

      return { success: true, data: data || [] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get invoices by vehicle
  static async getByVehicle(vehicleId: string) {
    try {
      const data = await prisma.invoice.findMany({
        where: { vehicleId },
        include: {
          customer: { select: { fullName: true, email: true, phone: true } },
          payments: { select: { amount: true, paymentDate: true, paymentMethod: true } }
        },
        orderBy: { createdAt: 'desc' }
      })

      return { success: true, data: data || [] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get overdue invoices
  static async getOverdueInvoices() {
    try {
      const today = new Date()
      const data = await prisma.invoice.findMany({
        where: {
          dueDate: { lt: today },
          status: { notIn: ['fully_paid', 'cancelled'] }
        },
        include: {
          customer: { select: { fullName: true, email: true, phone: true } },
          vehicle: { select: { year: true, make: true, model: true, vin: true } }
        },
        orderBy: { dueDate: 'asc' }
      })

      return { success: true, data: data || [] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Calculate VAT amount
  static calculateVAT(subtotal: number, vatRate: number): number {
    return Math.round((subtotal * vatRate / 100) * 100) / 100
  }

  // Calculate invoice totals from line items
  static calculateTotals(lineItems: InvoiceLineItem[], vatRate: number) {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
    const vatAmount = this.calculateVAT(subtotal, vatRate)
    const total = subtotal + vatAmount

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      total: Math.round(total * 100) / 100
    }
  }

  // Create invoice from vehicle sale
  static async createFromVehicleSale(
    vehicleId: string,
    customerId: string,
    salePrice: number,
    currency: 'AED' | 'USD' | 'CAD',
    createdBy: string,
    additionalItems: InvoiceLineItem[] = []
  ) {
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { year: true, make: true, model: true, vin: true }
      })

      if (!vehicle) {
        return { success: false, error: 'Vehicle not found' }
      }

      const lineItems: InvoiceLineItem[] = [
        {
          description: `${vehicle.year} ${vehicle.make} ${vehicle.model} - VIN: ${vehicle.vin}`,
          quantity: 1,
          unitPrice: salePrice,
          total: salePrice
        },
        ...additionalItems
      ]

      const vatRate = currency === 'AED' ? 5 : 0
      const totals = this.calculateTotals(lineItems, vatRate)

      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)

      const invoiceData: CreateInvoiceData = {
        customerId,
        vehicleId,
        lineItems,
        subtotal: totals.subtotal,
        vatRate,
        vatAmount: totals.vatAmount,
        totalAmount: totals.total,
        currency,
        dueDate: dueDate.toISOString().split('T')[0],
        paymentTerms: 'Net 30 days',
        status: 'draft'
      }

      return await this.create(invoiceData, createdBy)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Update invoice status based on payments
  static async updateStatusFromPayments(invoiceId: string) {
    try {
      const invoiceResult = await this.getById(invoiceId)
      if (!invoiceResult.success || !invoiceResult.data) {
        return { success: false, error: 'Invoice not found' }
      }

      const invoice = invoiceResult.data
      const totalPaid = invoice.totalPaid || 0
      const totalAmount = Number(invoice.totalAmount)

      let newStatus = invoice.status

      if (totalPaid === 0) {
        newStatus = invoice.status === 'draft' ? 'draft' : 'sent'
      } else if (totalPaid >= totalAmount) {
        newStatus = 'fully_paid'
      } else if (totalPaid > 0) {
        newStatus = 'partially_paid'
      }

      const today = new Date()
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null
      if (dueDate && dueDate < today && newStatus !== 'fully_paid') {
        newStatus = 'overdue'
      }

      if (newStatus !== invoice.status) {
        return await this.update(invoiceId, { status: newStatus })
      }

      return { success: true, data: invoice }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
