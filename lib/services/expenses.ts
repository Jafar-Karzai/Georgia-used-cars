import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export type ExpenseCategory = 'acquisition' | 'transportation' | 'import' | 'enhancement' | 'marketing' | 'operational'
export type CurrencyCode = 'USD' | 'CAD' | 'AED'

export interface Expense {
  id: string
  vehicleId?: string | null
  category: ExpenseCategory
  subcategory?: string | null
  description: string
  amount: any
  currency: CurrencyCode
  date: Date
  vendor?: string | null
  receiptUrl?: string | null
  notes?: string | null
  createdBy?: string | null
  createdAt: Date
  updatedAt: Date
  vehicle?: {
    vin: string
    year: number
    make: string
    model: string
  } | null
}

export interface CreateExpenseData {
  vehicleId?: string
  category: ExpenseCategory
  subcategory?: string
  description: string
  amount: number
  currency: CurrencyCode
  date: Date
  vendor?: string
  receiptUrl?: string
  notes?: string
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {}

export interface ExpenseFilters {
  vehicleId?: string
  category?: ExpenseCategory
  dateFrom?: string
  dateTo?: string
  currency?: CurrencyCode
  vendor?: string
  search?: string
}

export class ExpenseService {
  // Create a new expense
  static async create(expenseData: CreateExpenseData, userId: string) {
    try {
      const data = await prisma.expense.create({
        data: {
          vehicleId: expenseData.vehicleId,
          category: expenseData.category,
          subcategory: expenseData.subcategory,
          description: expenseData.description,
          amount: new Prisma.Decimal(expenseData.amount.toString()),
          currency: expenseData.currency,
          date: expenseData.date,
          vendor: expenseData.vendor,
          receiptUrl: expenseData.receiptUrl,
          notes: expenseData.notes,
          createdBy: userId
        }
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get all expenses with optional filtering
  static async getAll(filters?: ExpenseFilters, page = 1, limit = 20) {
    try {
      const where: Prisma.ExpenseWhereInput = {}

      if (filters?.vehicleId) where.vehicleId = filters.vehicleId
      if (filters?.category) where.category = filters.category
      if (filters?.currency) where.currency = filters.currency

      if (filters?.dateFrom || filters?.dateTo) {
        where.date = {}
        if (filters?.dateFrom) where.date.gte = new Date(filters.dateFrom)
        if (filters?.dateTo) where.date.lte = new Date(filters.dateTo)
      }

      if (filters?.vendor) {
        where.vendor = { contains: filters.vendor, mode: 'insensitive' }
      }

      if (filters?.search) {
        where.OR = [
          { description: { contains: filters.search, mode: 'insensitive' } },
          { vendor: { contains: filters.search, mode: 'insensitive' } },
          { notes: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      const total = await prisma.expense.count({ where })

      const skip = (page - 1) * limit
      const data = await prisma.expense.findMany({
        where,
        include: {
          vehicle: { select: { vin: true, year: true, make: true, model: true } }
        },
        orderBy: { date: 'desc' },
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

  // Get expense by ID
  static async getById(id: string) {
    try {
      const data = await prisma.expense.findUnique({
        where: { id },
        include: {
          vehicle: { select: { vin: true, year: true, make: true, model: true } }
        }
      })

      if (!data) {
        return { success: false, error: 'Expense not found' }
      }

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Update expense
  static async update(id: string, updateData: UpdateExpenseData) {
    try {
      const data = await prisma.expense.update({
        where: { id },
        data: {
          vehicleId: updateData.vehicleId,
          category: updateData.category,
          subcategory: updateData.subcategory,
          description: updateData.description,
          amount: updateData.amount ? new Prisma.Decimal(updateData.amount.toString()) : undefined,
          currency: updateData.currency,
          date: updateData.date,
          vendor: updateData.vendor,
          receiptUrl: updateData.receiptUrl,
          notes: updateData.notes
        },
        include: {
          vehicle: { select: { vin: true, year: true, make: true, model: true } }
        }
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Delete expense
  static async delete(id: string) {
    try {
      await prisma.expense.delete({
        where: { id }
      })

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get expenses for a specific vehicle
  static async getByVehicle(vehicleId: string) {
    try {
      const data = await prisma.expense.findMany({
        where: { vehicleId },
        orderBy: { date: 'desc' }
      })

      return { success: true, data: data || [] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get expense statistics
  static async getStatistics(filters?: { dateFrom?: string; dateTo?: string; vehicleId?: string }) {
    try {
      const where: Prisma.ExpenseWhereInput = {}

      if (filters?.dateFrom) where.date = { gte: new Date(filters.dateFrom) }
      if (filters?.dateTo) {
        if (where.date) {
          ;(where.date as any).lte = new Date(filters.dateTo)
        } else {
          where.date = { lte: new Date(filters.dateTo) }
        }
      }

      if (filters?.vehicleId) where.vehicleId = filters.vehicleId

      const expenses = await prisma.expense.findMany({
        where,
        select: { category: true, amount: true, currency: true }
      })

      const stats = {
        total: 0,
        byCategory: {} as Record<ExpenseCategory, number>,
        byCurrency: {} as Record<CurrencyCode, number>,
        count: expenses.length
      }

      expenses.forEach(expense => {
        // Convert to AED for total (simplified - in practice you'd use real exchange rates)
        const amountInAED =
          expense.currency === 'AED'
            ? Number(expense.amount)
            : expense.currency === 'USD'
              ? Number(expense.amount) * 3.67
              : expense.currency === 'CAD'
                ? Number(expense.amount) * 2.7
                : Number(expense.amount)

        stats.total += amountInAED

        // By category
        if (!stats.byCategory[expense.category]) {
          stats.byCategory[expense.category] = 0
        }
        stats.byCategory[expense.category] += amountInAED

        // By currency
        if (!stats.byCurrency[expense.currency]) {
          stats.byCurrency[expense.currency] = 0
        }
        stats.byCurrency[expense.currency] += Number(expense.amount)
      })

      return { success: true, data: stats }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get monthly expense trends
  static async getMonthlyTrends(months = 12) {
    try {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)

      const expenses = await prisma.expense.findMany({
        where: {
          date: { gte: startDate }
        },
        select: { amount: true, currency: true, date: true, category: true },
        orderBy: { date: 'asc' }
      })

      const monthlyData: Record<string, { total: number; byCategory: Record<ExpenseCategory, number> }> = {}

      expenses.forEach(expense => {
        const monthKey = expense.date.toISOString().substring(0, 7)

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            total: 0,
            byCategory: {} as Record<ExpenseCategory, number>
          }
        }

        const amountInAED =
          expense.currency === 'AED'
            ? Number(expense.amount)
            : expense.currency === 'USD'
              ? Number(expense.amount) * 3.67
              : expense.currency === 'CAD'
                ? Number(expense.amount) * 2.7
                : Number(expense.amount)

        monthlyData[monthKey].total += amountInAED

        if (!monthlyData[monthKey].byCategory[expense.category]) {
          monthlyData[monthKey].byCategory[expense.category] = 0
        }
        monthlyData[monthKey].byCategory[expense.category] += amountInAED
      })

      return { success: true, data: monthlyData }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Bulk import expenses
  static async bulkImport(expenses: CreateExpenseData[], userId: string) {
    try {
      const expensesWithUser = expenses.map(expense => ({
        vehicleId: expense.vehicleId,
        category: expense.category,
        subcategory: expense.subcategory,
        description: expense.description,
        amount: new Prisma.Decimal(expense.amount.toString()),
        currency: expense.currency,
        date: expense.date,
        vendor: expense.vendor,
        receiptUrl: expense.receiptUrl,
        notes: expense.notes,
        createdBy: userId
      }))

      const data = await prisma.expense.createMany({
        data: expensesWithUser
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
