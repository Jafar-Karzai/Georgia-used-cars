import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export interface CreateCustomerData {
  email?: string
  fullName: string
  phone?: string
  address?: string
  city?: string
  country?: string
  dateOfBirth?: Date
  preferredLanguage?: string
  marketingConsent?: boolean
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {}

export interface CustomerFilters {
  search?: string
  city?: string
  country?: string
  marketingConsent?: boolean
  createdFrom?: string
  createdTo?: string
}

export interface CustomerWithStats {
  id: string
  email?: string | null
  fullName: string
  phone?: string | null
  address?: string | null
  city?: string | null
  country: string
  dateOfBirth?: Date | null
  preferredLanguage: string
  marketingConsent: boolean
  createdAt: Date
  updatedAt: Date
  inquiryCount?: number
  lastInquiryDate?: Date
  totalPurchases?: number
  totalSpent?: number
}

export class CustomerService {
  // Create a new customer
  static async create(customerData: CreateCustomerData) {
    try {
      const data = await prisma.customer.create({
        data: {
          email: customerData.email,
          fullName: customerData.fullName,
          phone: customerData.phone,
          address: customerData.address,
          city: customerData.city,
          country: customerData.country || 'UAE',
          dateOfBirth: customerData.dateOfBirth,
          preferredLanguage: customerData.preferredLanguage || 'en',
          marketingConsent: customerData.marketingConsent ?? false
        }
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get all customers with optional filtering and stats
  static async getAll(filters?: CustomerFilters, page = 1, limit = 20) {
    try {
      const where: Prisma.CustomerWhereInput = {}

      // Apply filters
      if (filters?.search) {
        where.OR = [
          { fullName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      if (filters?.city) {
        where.city = { contains: filters.city, mode: 'insensitive' }
      }

      if (filters?.country) {
        where.country = filters.country
      }

      if (filters?.marketingConsent !== undefined) {
        where.marketingConsent = filters.marketingConsent
      }

      if (filters?.createdFrom) {
        where.createdAt = { gte: new Date(filters.createdFrom) }
      }

      if (filters?.createdTo) {
        if (where.createdAt) {
          ;(where.createdAt as any).lte = new Date(filters.createdTo)
        } else {
          where.createdAt = { lte: new Date(filters.createdTo) }
        }
      }

      // Get total count
      const total = await prisma.customer.count({ where })

      // Get paginated data
      const skip = (page - 1) * limit
      const customers = await prisma.customer.findMany({
        where,
        include: {
          inquiries: { select: { id: true, createdAt: true, status: true } },
          invoices: { select: { totalAmount: true, currency: true, status: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })

      // Process data to include stats
      const customersWithStats: CustomerWithStats[] = customers.map(customer => {
        const inquiries = customer.inquiries || []
        const invoices = customer.invoices || []

        return {
          ...customer,
          inquiryCount: inquiries.length,
          lastInquiryDate: inquiries.length > 0 ? inquiries[0].createdAt : undefined,
          totalPurchases: invoices.filter(inv => inv.status === 'fully_paid').length,
          totalSpent: invoices
            .filter(inv => inv.status === 'fully_paid')
            .reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
        }
      })

      return {
        success: true,
        data: customersWithStats,
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

  // Get customer by ID with detailed information
  static async getById(id: string) {
    try {
      const data = await prisma.customer.findUnique({
        where: { id },
        include: {
          inquiries: {
            include: {
              vehicle: { select: { year: true, make: true, model: true, vin: true } }
            }
          },
          invoices: {
            include: {
              vehicle: { select: { year: true, make: true, model: true, vin: true } },
              payments: true
            }
          },
          communications: {
            include: {
              profile: { select: { fullName: true } }
            }
          }
        }
      })

      if (!data) {
        return { success: false, error: 'Customer not found' }
      }

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Update customer
  static async update(id: string, updateData: UpdateCustomerData) {
    try {
      const data = await prisma.customer.update({
        where: { id },
        data: {
          email: updateData.email,
          fullName: updateData.fullName,
          phone: updateData.phone,
          address: updateData.address,
          city: updateData.city,
          country: updateData.country,
          dateOfBirth: updateData.dateOfBirth,
          preferredLanguage: updateData.preferredLanguage,
          marketingConsent: updateData.marketingConsent
        }
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Delete customer
  static async delete(id: string) {
    try {
      await prisma.customer.delete({
        where: { id }
      })

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Search customers by email or phone
  static async search(query: string) {
    try {
      const data = await prisma.customer.findMany({
        where: {
          OR: [
            { fullName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: { id: true, fullName: true, email: true, phone: true },
        take: 10
      })

      return { success: true, data: data || [] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get customer statistics
  static async getStatistics() {
    try {
      const total = await prisma.customer.count()

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const recent = await prisma.customer.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      })

      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      const active = await prisma.customer.count({
        where: {
          inquiries: {
            some: { createdAt: { gte: ninetyDaysAgo } }
          }
        }
      })

      return {
        success: true,
        data: {
          total,
          recent,
          active
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get customers by country
  static async getByCountry() {
    try {
      const customers = await prisma.customer.findMany({
        select: { country: true }
      })

      // Count by country
      const countryStats: Record<string, number> = {}
      customers.forEach(customer => {
        const country = customer.country || 'Unknown'
        countryStats[country] = (countryStats[country] || 0) + 1
      })

      return { success: true, data: countryStats }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get marketing consent statistics
  static async getMarketingStats() {
    try {
      const total = await prisma.customer.count()
      const consented = await prisma.customer.count({
        where: { marketingConsent: true }
      })
      const declined = await prisma.customer.count({
        where: { marketingConsent: false }
      })

      const stats = {
        total,
        consented,
        declined
      }

      return { success: true, data: stats }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Find or create customer by email
  static async findOrCreate(customerData: CreateCustomerData) {
    try {
      // First, try to find existing customer by email
      if (customerData.email) {
        const existing = await prisma.customer.findUnique({
          where: { email: customerData.email }
        })

        if (existing) {
          return { success: true, data: existing, created: false }
        }
      }

      // If not found, create new customer
      const result = await this.create(customerData)
      return { ...result, created: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Bulk import customers
  static async bulkImport(customers: CreateCustomerData[]) {
    try {
      const customersWithDefaults = customers.map(customer => ({
        email: customer.email,
        fullName: customer.fullName,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        country: customer.country || 'UAE',
        dateOfBirth: customer.dateOfBirth,
        preferredLanguage: customer.preferredLanguage || 'en',
        marketingConsent: customer.marketingConsent ?? false
      }))

      const data = await prisma.customer.createMany({
        data: customersWithDefaults
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get customer activity timeline
  static async getActivityTimeline(customerId: string) {
    try {
      const [inquiries, communications, invoices] = await Promise.all([
        prisma.inquiry.findMany({
          where: { customerId },
          include: { vehicle: { select: { year: true, make: true, model: true } } },
          orderBy: { createdAt: 'desc' }
        }),

        prisma.communication.findMany({
          where: { customerId },
          include: { profile: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' }
        }),

        prisma.invoice.findMany({
          where: { customerId },
          include: { vehicle: { select: { year: true, make: true, model: true } } },
          orderBy: { createdAt: 'desc' }
        })
      ])

      // Combine and sort all activities
      const activities = [
        ...inquiries.map(item => ({ ...item, type: 'inquiry' })),
        ...communications.map(item => ({ ...item, type: 'communication' })),
        ...invoices.map(item => ({ ...item, type: 'invoice' }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      return { success: true, data: activities }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
