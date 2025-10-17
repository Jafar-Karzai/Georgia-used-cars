import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export interface CreateCommunicationData {
  customerId: string
  inquiryId?: string
  type: 'email' | 'phone' | 'sms' | 'whatsapp' | 'meeting' | 'note'
  direction: 'inbound' | 'outbound'
  subject?: string
  content: string
  handledBy: string
  scheduledAt?: Date
  completedAt?: Date
}

export interface UpdateCommunicationData extends Partial<CreateCommunicationData> {}

export interface CommunicationFilters {
  search?: string
  type?: string
  direction?: string
  customerId?: string
  inquiryId?: string
  handledBy?: string
  createdFrom?: string
  createdTo?: string
}

export class CommunicationService {
  // Create a new communication record
  static async create(communicationData: CreateCommunicationData) {
    try {
      const data = await prisma.communication.create({
        data: {
          customerId: communicationData.customerId,
          inquiryId: communicationData.inquiryId,
          type: communicationData.type,
          direction: communicationData.direction,
          subject: communicationData.subject,
          content: communicationData.content,
          handledBy: communicationData.handledBy,
          scheduledAt: communicationData.scheduledAt,
          completedAt: communicationData.completedAt
        }
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get all communications with optional filtering
  static async getAll(filters?: CommunicationFilters, page = 1, limit = 20) {
    try {
      const where: Prisma.CommunicationWhereInput = {}

      if (filters?.search) {
        where.OR = [
          { subject: { contains: filters.search, mode: 'insensitive' } },
          { content: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      if (filters?.type) where.type = filters.type as any
      if (filters?.direction) where.direction = filters.direction as any
      if (filters?.customerId) where.customerId = filters.customerId
      if (filters?.inquiryId) where.inquiryId = filters.inquiryId
      if (filters?.handledBy) where.handledBy = filters.handledBy

      if (filters?.createdFrom || filters?.createdTo) {
        where.createdAt = {}
        if (filters?.createdFrom) where.createdAt.gte = new Date(filters.createdFrom)
        if (filters?.createdTo) where.createdAt.lte = new Date(filters.createdTo)
      }

      const total = await prisma.communication.count({ where })

      const skip = (page - 1) * limit
      const data = await prisma.communication.findMany({
        where,
        include: {
          customer: { select: { id: true, fullName: true, email: true, phone: true } },
          inquiry: { select: { id: true, subject: true, status: true } },
          profile: { select: { id: true, fullName: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
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

  // Get communication by ID
  static async getById(id: string) {
    try {
      const data = await prisma.communication.findUnique({
        where: { id },
        include: {
          customer: { select: { id: true, fullName: true, email: true, phone: true, city: true, country: true } },
          inquiry: { select: { id: true, subject: true, status: true, priority: true } },
          profile: { select: { id: true, fullName: true, email: true } }
        }
      })

      if (!data) {
        return { success: false, error: 'Communication not found' }
      }

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Update communication
  static async update(id: string, updateData: UpdateCommunicationData) {
    try {
      const data = await prisma.communication.update({
        where: { id },
        data: {
          customerId: updateData.customerId,
          inquiryId: updateData.inquiryId,
          type: updateData.type as any,
          direction: updateData.direction as any,
          subject: updateData.subject,
          content: updateData.content,
          handledBy: updateData.handledBy,
          scheduledAt: updateData.scheduledAt,
          completedAt: updateData.completedAt
        }
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Delete communication
  static async delete(id: string) {
    try {
      await prisma.communication.delete({
        where: { id }
      })

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get communications by customer
  static async getByCustomer(customerId: string) {
    try {
      const data = await prisma.communication.findMany({
        where: { customerId },
        include: {
          inquiry: { select: { subject: true, status: true } },
          profile: { select: { fullName: true } }
        },
        orderBy: { createdAt: 'desc' }
      })

      return { success: true, data: data || [] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get communications by inquiry
  static async getByInquiry(inquiryId: string) {
    try {
      const data = await prisma.communication.findMany({
        where: { inquiryId },
        include: {
          customer: { select: { fullName: true, email: true, phone: true } },
          profile: { select: { fullName: true } }
        },
        orderBy: { createdAt: 'desc' }
      })

      return { success: true, data: data || [] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get my communications (handled by user)
  static async getMyCommunications(userId: string, filters?: Partial<CommunicationFilters>) {
    try {
      const allFilters = {
        ...filters,
        handledBy: userId
      }

      return await this.getAll(allFilters)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get communication statistics
  static async getStatistics(filters?: Partial<CommunicationFilters>) {
    try {
      const where: Prisma.CommunicationWhereInput = {}

      if (filters?.createdFrom) where.createdAt = { gte: new Date(filters.createdFrom) }
      if (filters?.createdTo) {
        if (where.createdAt) {
          ;(where.createdAt as any).lte = new Date(filters.createdTo)
        } else {
          where.createdAt = { lte: new Date(filters.createdTo) }
        }
      }

      const total = await prisma.communication.count({ where })

      const communications = await prisma.communication.findMany({
        where,
        select: { type: true, direction: true }
      })

      const typeCounts: Record<string, number> = {}
      const directionCounts: Record<string, number> = {}

      communications.forEach(item => {
        typeCounts[item.type] = (typeCounts[item.type] || 0) + 1
        directionCounts[item.direction] = (directionCounts[item.direction] || 0) + 1
      })

      return {
        success: true,
        data: {
          total,
          byType: typeCounts,
          byDirection: directionCounts
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Log phone call
  static async logPhoneCall(customerId: string, content: string, direction: 'inbound' | 'outbound', handledBy: string, inquiryId?: string) {
    return this.create({
      customerId,
      inquiryId,
      type: 'phone',
      direction,
      content,
      handledBy
    })
  }

  // Log email communication
  static async logEmail(customerId: string, subject: string, content: string, direction: 'inbound' | 'outbound', handledBy: string, inquiryId?: string) {
    return this.create({
      customerId,
      inquiryId,
      type: 'email',
      direction,
      subject,
      content,
      handledBy
    })
  }

  // Log WhatsApp message
  static async logWhatsApp(customerId: string, content: string, direction: 'inbound' | 'outbound', handledBy: string, inquiryId?: string) {
    return this.create({
      customerId,
      inquiryId,
      type: 'whatsapp',
      direction,
      content,
      handledBy
    })
  }

  // Log meeting/appointment
  static async logMeeting(customerId: string, content: string, handledBy: string, scheduledAt?: Date, inquiryId?: string) {
    return this.create({
      customerId,
      inquiryId,
      type: 'meeting',
      direction: 'outbound',
      content,
      handledBy,
      scheduledAt
    })
  }

  // Add internal note
  static async addNote(customerId: string, content: string, handledBy: string, inquiryId?: string) {
    return this.create({
      customerId,
      inquiryId,
      type: 'note',
      direction: 'outbound',
      content,
      handledBy
    })
  }

  // Get recent communications (last 7 days)
  static async getRecentCommunications(limit = 10) {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const data = await prisma.communication.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo }
        },
        include: {
          customer: { select: { fullName: true, email: true } },
          profile: { select: { fullName: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return { success: true, data: data || [] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get communication trends (daily counts for last 30 days)
  static async getCommunicationTrends() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const data = await prisma.communication.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        select: { createdAt: true, type: true },
        orderBy: { createdAt: 'asc' }
      })

      const dailyCounts: Record<string, Record<string, number>> = {}

      data.forEach(comm => {
        const date = comm.createdAt.toISOString().split('T')[0]
        if (!dailyCounts[date]) {
          dailyCounts[date] = {}
        }
        dailyCounts[date][comm.type] = (dailyCounts[date][comm.type] || 0) + 1
        ;(dailyCounts[date] as any).total = ((dailyCounts[date] as any).total || 0) + 1
      })

      return { success: true, data: dailyCounts }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Mark communication as completed (for scheduled items)
  static async markCompleted(id: string) {
    try {
      const data = await prisma.communication.update({
        where: { id },
        data: { completedAt: new Date() }
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
