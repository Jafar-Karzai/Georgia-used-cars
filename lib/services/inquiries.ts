import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export interface CreateInquiryData {
  customerId: string
  vehicleId?: string
  source: 'website' | 'phone' | 'email' | 'social_media' | 'referral' | 'walk_in'
  subject: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status?: 'new' | 'in_progress' | 'responded' | 'resolved' | 'closed'
}

export interface UpdateInquiryData extends Partial<CreateInquiryData> {
  status?: 'new' | 'in_progress' | 'responded' | 'resolved' | 'closed'
  assignedTo?: string
  response?: string
}

export interface InquiryFilters {
  search?: string
  status?: string
  priority?: string
  source?: string
  assignedTo?: string
  customerId?: string
  vehicleId?: string
  createdFrom?: string
  createdTo?: string
}

export interface InquiryWithDetails {
  id: string
  customerId?: string
  vehicleId?: string
  source: string
  subject?: string
  message: string
  priority: string
  status: string
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
  customer?: any
  vehicle?: any
  assignedToProfile?: any
  communications?: any[]
  communicationsCount?: number
  lastCommunication?: Date
}

export class InquiryService {
  // Create a new inquiry
  static async create(inquiryData: CreateInquiryData) {
    try {
      const data = await prisma.inquiry.create({
        data: {
          customerId: inquiryData.customerId,
          vehicleId: inquiryData.vehicleId,
          source: inquiryData.source,
          subject: inquiryData.subject,
          message: inquiryData.message,
          priority: inquiryData.priority,
          status: inquiryData.status || 'new'
        }
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get all inquiries with optional filtering
  static async getAll(filters?: InquiryFilters, page = 1, limit = 20) {
    try {
      const where: Prisma.InquiryWhereInput = {}

      if (filters?.search) {
        where.OR = [
          { subject: { contains: filters.search, mode: 'insensitive' } },
          { message: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      if (filters?.status) where.status = filters.status
      if (filters?.priority) where.priority = filters.priority
      if (filters?.source) where.source = filters.source as any
      if (filters?.assignedTo) where.assignedTo = filters.assignedTo
      if (filters?.customerId) where.customerId = filters.customerId
      if (filters?.vehicleId) where.vehicleId = filters.vehicleId

      if (filters?.createdFrom || filters?.createdTo) {
        where.createdAt = {}
        if (filters?.createdFrom) where.createdAt.gte = new Date(filters.createdFrom)
        if (filters?.createdTo) where.createdAt.lte = new Date(filters.createdTo)
      }

      const total = await prisma.inquiry.count({ where })

      const skip = (page - 1) * limit
      const data = await prisma.inquiry.findMany({
        where,
        include: {
          customer: { select: { id: true, fullName: true, email: true, phone: true } },
          vehicle: { select: { id: true, year: true, make: true, model: true, vin: true } },
          assignedToProfile: { select: { id: true, fullName: true, email: true } },
          communications: { select: { id: true, createdAt: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })

      const inquiriesWithDetails = data.map(inquiry => {
        const communications = inquiry.communications || []
        return {
          ...inquiry,
          communicationsCount: communications.length,
          lastCommunication: communications.length > 0 ? communications[0].createdAt : undefined
        }
      })

      return {
        success: true,
        data: inquiriesWithDetails,
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

  // Get inquiry by ID with detailed information
  static async getById(id: string) {
    try {
      const data = await prisma.inquiry.findUnique({
        where: { id },
        include: {
          customer: { select: { id: true, fullName: true, email: true, phone: true, city: true, country: true } },
          vehicle: { select: { id: true, year: true, make: true, model: true, vin: true, lotNumber: true } },
          assignedToProfile: { select: { id: true, fullName: true, email: true } },
          communications: {
            select: {
              id: true,
              type: true,
              direction: true,
              subject: true,
              content: true,
              createdAt: true,
              handledBy: true,
              profile: { select: { fullName: true } }
            }
          }
        }
      })

      if (!data) {
        return { success: false, error: 'Inquiry not found' }
      }

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Update inquiry
  static async update(id: string, updateData: UpdateInquiryData) {
    try {
      const data = await prisma.inquiry.update({
        where: { id },
        data: {
          customerId: updateData.customerId,
          vehicleId: updateData.vehicleId,
          source: updateData.source,
          subject: updateData.subject,
          message: updateData.message,
          priority: updateData.priority,
          status: updateData.status,
          assignedTo: updateData.assignedTo
        }
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Delete inquiry
  static async delete(id: string) {
    try {
      await prisma.inquiry.delete({
        where: { id }
      })

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Assign inquiry to user
  static async assign(inquiryId: string, userId: string) {
    try {
      const data = await prisma.inquiry.update({
        where: { id: inquiryId },
        data: {
          assignedTo: userId,
          status: 'in_progress'
        }
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get inquiry statistics
  static async getStatistics(filters?: Partial<InquiryFilters>) {
    try {
      const where: Prisma.InquiryWhereInput = {}

      if (filters?.createdFrom) where.createdAt = { gte: new Date(filters.createdFrom) }
      if (filters?.createdTo) {
        if (where.createdAt) {
          ;(where.createdAt as any).lte = new Date(filters.createdTo)
        } else {
          where.createdAt = { lte: new Date(filters.createdTo) }
        }
      }

      const total = await prisma.inquiry.count({ where })

      const inquiries = await prisma.inquiry.findMany({
        where,
        select: { status: true, priority: true, source: true }
      })

      const statusCounts: Record<string, number> = {}
      const priorityCounts: Record<string, number> = {}
      const sourceCounts: Record<string, number> = {}

      inquiries.forEach(item => {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1
        priorityCounts[item.priority] = (priorityCounts[item.priority] || 0) + 1
        sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1
      })

      return {
        success: true,
        data: {
          total,
          byStatus: statusCounts,
          byPriority: priorityCounts,
          bySource: sourceCounts
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get inquiries by customer
  static async getByCustomer(customerId: string) {
    try {
      const data = await prisma.inquiry.findMany({
        where: { customerId },
        include: {
          vehicle: { select: { year: true, make: true, model: true, vin: true } },
          assignedToProfile: { select: { fullName: true } }
        },
        orderBy: { createdAt: 'desc' }
      })

      return { success: true, data: data || [] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get inquiries by vehicle
  static async getByVehicle(vehicleId: string) {
    try {
      const data = await prisma.inquiry.findMany({
        where: { vehicleId },
        include: {
          customer: { select: { fullName: true, email: true, phone: true } },
          assignedToProfile: { select: { fullName: true } }
        },
        orderBy: { createdAt: 'desc' }
      })

      return { success: true, data: data || [] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get my assigned inquiries
  static async getMyInquiries(userId: string, filters?: Partial<InquiryFilters>) {
    try {
      const allFilters = {
        ...filters,
        assignedTo: userId
      }

      return await this.getAll(allFilters)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get urgent inquiries
  static async getUrgentInquiries() {
    try {
      const data = await prisma.inquiry.findMany({
        where: {
          priority: 'urgent',
          status: { in: ['new', 'in_progress'] }
        },
        include: {
          customer: { select: { fullName: true, email: true, phone: true } },
          vehicle: { select: { year: true, make: true, model: true, vin: true } }
        },
        orderBy: { createdAt: 'asc' }
      })

      return { success: true, data: data || [] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Bulk update status
  static async bulkUpdateStatus(inquiryIds: string[], status: string) {
    try {
      const data = await prisma.inquiry.updateMany({
        where: { id: { in: inquiryIds } },
        data: { status }
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Mark as resolved
  static async markResolved(id: string, response?: string) {
    try {
      const updateData: any = { status: 'resolved' }
      if (response) {
        updateData.response = response
      }

      const data = await prisma.inquiry.update({
        where: { id },
        data: updateData
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
