import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface CreateVehicleData {
  vin: string
  year: number
  make: string
  model: string
  trim?: string
  engine?: string
  mileage?: number
  exteriorColor?: string
  interiorColor?: string
  transmission?: string
  fuelType?: string
  bodyStyle?: string
  auctionHouse: string
  auctionLocation?: string
  saleDate?: Date
  lotNumber?: string
  primaryDamage?: string
  secondaryDamage?: string
  damageDescription?: string
  damageSeverity?: 'minor' | 'moderate' | 'major' | 'total_loss'
  repairEstimate?: number | string
  titleStatus?: string
  keysAvailable?: boolean
  runAndDrive?: boolean
  purchasePrice: number | string
  purchaseCurrency?: 'USD' | 'CAD' | 'AED'
  estimatedTotalCost?: number | string
  isPublic?: boolean
}

export interface UpdateVehicleData extends Partial<CreateVehicleData> {
  currentStatus?: string
  currentLocation?: string
  salePrice?: number | string
  saleCurrency?: 'USD' | 'CAD' | 'AED'
}

export interface VehicleFilters {
  status?: string
  make?: string
  model?: string
  yearMin?: number
  yearMax?: number
  priceMin?: number
  priceMax?: number
  auctionHouse?: string
  search?: string
  isPublic?: boolean
}

export class VehicleService {
  // Create a new vehicle
  static async create(vehicleData: CreateVehicleData, userId: string) {
    try {
      console.log('VehicleService.create called with:', vehicleData)
      console.log('User ID:', userId)

      const createData: Prisma.VehicleCreateInput = {
        vin: vehicleData.vin,
        year: vehicleData.year,
        make: vehicleData.make,
        model: vehicleData.model,
        trim: vehicleData.trim,
        engine: vehicleData.engine,
        mileage: vehicleData.mileage,
        exteriorColor: vehicleData.exteriorColor,
        interiorColor: vehicleData.interiorColor,
        transmission: vehicleData.transmission,
        fuelType: vehicleData.fuelType,
        bodyStyle: vehicleData.bodyStyle,
        auctionHouse: vehicleData.auctionHouse,
        auctionLocation: vehicleData.auctionLocation,
        saleDate: vehicleData.saleDate,
        lotNumber: vehicleData.lotNumber,
        primaryDamage: vehicleData.primaryDamage,
        secondaryDamage: vehicleData.secondaryDamage,
        damageDescription: vehicleData.damageDescription,
        damageSeverity: vehicleData.damageSeverity,
        repairEstimate: vehicleData.repairEstimate ? new Prisma.Decimal(vehicleData.repairEstimate.toString()) : undefined,
        titleStatus: vehicleData.titleStatus,
        keysAvailable: vehicleData.keysAvailable ?? false,
        runAndDrive: vehicleData.runAndDrive ?? false,
        purchasePrice: new Prisma.Decimal(vehicleData.purchasePrice.toString()),
        purchaseCurrency: vehicleData.purchaseCurrency ?? 'USD',
        estimatedTotalCost: vehicleData.estimatedTotalCost ? new Prisma.Decimal(vehicleData.estimatedTotalCost.toString()) : undefined,
        isPublic: vehicleData.isPublic,
        currentStatus: 'auction_won',
        createdByProfile: {
          connect: { id: userId }
        }
      }

      console.log('Creating vehicle with Prisma...')
      const vehicle = await prisma.vehicle.create({ data: createData })

      // Create initial status history entry
      console.log('Creating status history for vehicle:', vehicle.id)
      await this.addStatusHistory(vehicle.id, 'auction_won', 'Vehicle added to system', userId)

      console.log('Vehicle created successfully:', vehicle)
      return { success: true, data: vehicle }
    } catch (error: any) {
      console.error('Exception in VehicleService.create:', error)
      return { success: false, error: error.message }
    }
  }

  // Get all vehicles with optional filtering
  static async getAll(filters?: VehicleFilters, page = 1, limit = 20) {
    try {
      console.log('🔍 Loading vehicles with filters:', filters)

      const where: Prisma.VehicleWhereInput = {}

      // Apply filters
      if (filters?.status) {
        where.currentStatus = filters.status
      }

      if (filters?.isPublic !== undefined) {
        where.isPublic = filters.isPublic
      }

      if (filters?.make) {
        where.make = { contains: filters.make, mode: 'insensitive' }
      }

      if (filters?.model) {
        where.model = { contains: filters.model, mode: 'insensitive' }
      }

      if (filters?.yearMin || filters?.yearMax) {
        where.year = {}
        if (filters?.yearMin) where.year.gte = filters.yearMin
        if (filters?.yearMax) where.year.lte = filters.yearMax
      }

      if (filters?.priceMin || filters?.priceMax) {
        where.purchasePrice = {}
        if (filters?.priceMin) where.purchasePrice.gte = new Prisma.Decimal(filters.priceMin.toString())
        if (filters?.priceMax) where.purchasePrice.lte = new Prisma.Decimal(filters.priceMax.toString())
      }

      if (filters?.auctionHouse) {
        where.auctionHouse = filters.auctionHouse
      }

      if (filters?.search) {
        where.OR = [
          { vin: { contains: filters.search, mode: 'insensitive' } },
          { make: { contains: filters.search, mode: 'insensitive' } },
          { model: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      // Get total count
      const total = await prisma.vehicle.count({ where })

      // Get paginated data
      const skip = (page - 1) * limit
      const data = await prisma.vehicle.findMany({
        where,
        include: {
          photos: { select: { url: true, isPrimary: true } },
          expenses: { select: { id: true, category: true, description: true, amount: true, currency: true, date: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })

      console.log('📊 Query result:', { dataLength: data.length, total })
      console.log('🚗 Vehicles found:', data.map(v => ({ id: v.id, vin: v.vin, make: v.make, model: v.model })))

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
      console.error('❌ Query error:', error)
      return { success: false, error: error.message }
    }
  }

  // Get public vehicles for website (no authentication required)
  static async getPublic(filters?: Omit<VehicleFilters, 'isPublic'>, page = 1, limit = 20) {
    try {
      const publicFilters = {
        ...filters,
        isPublic: true
      }
      return await this.getAll(publicFilters, page, limit)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get vehicle by ID
  static async getById(id: string) {
    try {
      const data = await prisma.vehicle.findUnique({
        where: { id },
        include: {
          photos: true,
          documents: true,
          statusHistory: { orderBy: { changedAt: 'desc' } },
          expenses: true
        }
      })

      if (!data) {
        return { success: false, error: 'Vehicle not found' }
      }

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Update vehicle
  static async update(id: string, updateData: UpdateVehicleData, userId: string) {
    try {
      const updateInput: Prisma.VehicleUpdateInput = {}

      // Map the update data fields to Prisma field names
      if (updateData.trim !== undefined) updateInput.trim = updateData.trim
      if (updateData.engine !== undefined) updateInput.engine = updateData.engine
      if (updateData.mileage !== undefined) updateInput.mileage = updateData.mileage
      if (updateData.exteriorColor !== undefined) updateInput.exteriorColor = updateData.exteriorColor
      if (updateData.interiorColor !== undefined) updateInput.interiorColor = updateData.interiorColor
      if (updateData.transmission !== undefined) updateInput.transmission = updateData.transmission
      if (updateData.fuelType !== undefined) updateInput.fuelType = updateData.fuelType
      if (updateData.bodyStyle !== undefined) updateInput.bodyStyle = updateData.bodyStyle
      if (updateData.auctionLocation !== undefined) updateInput.auctionLocation = updateData.auctionLocation
      if (updateData.saleDate !== undefined) updateInput.saleDate = updateData.saleDate
      if (updateData.lotNumber !== undefined) updateInput.lotNumber = updateData.lotNumber
      if (updateData.primaryDamage !== undefined) updateInput.primaryDamage = updateData.primaryDamage
      if (updateData.secondaryDamage !== undefined) updateInput.secondaryDamage = updateData.secondaryDamage
      if (updateData.damageDescription !== undefined) updateInput.damageDescription = updateData.damageDescription
      if (updateData.damageSeverity !== undefined) updateInput.damageSeverity = updateData.damageSeverity
      if (updateData.repairEstimate !== undefined) updateInput.repairEstimate = new Prisma.Decimal(updateData.repairEstimate.toString())
      if (updateData.titleStatus !== undefined) updateInput.titleStatus = updateData.titleStatus
      if (updateData.keysAvailable !== undefined) updateInput.keysAvailable = updateData.keysAvailable
      if (updateData.runAndDrive !== undefined) updateInput.runAndDrive = updateData.runAndDrive
      if (updateData.estimatedTotalCost !== undefined) updateInput.estimatedTotalCost = new Prisma.Decimal(updateData.estimatedTotalCost.toString())
      if (updateData.salePrice !== undefined) updateInput.salePrice = new Prisma.Decimal(updateData.salePrice.toString())
      if (updateData.saleCurrency !== undefined) updateInput.saleCurrency = updateData.saleCurrency
      if (updateData.isPublic !== undefined) updateInput.isPublic = updateData.isPublic
      if (updateData.currentLocation !== undefined) updateInput.currentLocation = updateData.currentLocation

      const data = await prisma.vehicle.update({
        where: { id },
        data: updateInput
      })

      // If status changed, add to history
      if (updateData.currentStatus) {
        await this.addStatusHistory(
          id,
          updateData.currentStatus,
          updateData.currentLocation ? `Location: ${updateData.currentLocation}` : undefined,
          userId
        )
      }

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Delete vehicle
  static async delete(id: string) {
    try {
      await prisma.vehicle.delete({
        where: { id }
      })

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Update vehicle status
  static async updateStatus(id: string, status: string, location?: string, notes?: string, userId?: string) {
    try {
      // Update vehicle status
      await prisma.vehicle.update({
        where: { id },
        data: {
          currentStatus: status,
          currentLocation: location
        }
      })

      // Add to status history
      await this.addStatusHistory(id, status, notes || (location ? `Location: ${location}` : undefined), userId)

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Add status history entry
  static async addStatusHistory(vehicleId: string, status: string, notes?: string, userId?: string) {
    try {
      await prisma.vehicleStatusHistory.create({
        data: {
          vehicleId,
          status,
          notes,
          changedBy: userId
        }
      })
    } catch (error) {
      console.error('Error adding status history:', error)
    }
  }

  // Get status history for vehicle
  static async getStatusHistory(vehicleId: string) {
    try {
      const data = await prisma.vehicleStatusHistory.findMany({
        where: { vehicleId },
        include: { profile: { select: { fullName: true } } },
        orderBy: { changedAt: 'desc' }
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Search vehicles by VIN
  static async searchByVin(vin: string) {
    try {
      const data = await prisma.vehicle.findMany({
        where: {
          vin: { contains: vin, mode: 'insensitive' }
        },
        take: 10
      })

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get vehicle statistics
  static async getStatistics() {
    try {
      const total = await prisma.vehicle.count()

      // Get vehicles grouped by status
      const vehiclesByStatus = await prisma.vehicle.findMany({
        select: { currentStatus: true }
      })

      // Get recent additions (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const recentAdditions = await prisma.vehicle.count({
        where: {
          createdAt: { gte: sevenDaysAgo }
        }
      })

      // Count vehicles by status
      const statusCounts: Record<string, number> = {}
      vehiclesByStatus.forEach(vehicle => {
        const status = vehicle.currentStatus || 'unknown'
        statusCounts[status] = (statusCounts[status] || 0) + 1
      })

      return {
        success: true,
        data: {
          total,
          byStatus: statusCounts,
          recentAdditions
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}