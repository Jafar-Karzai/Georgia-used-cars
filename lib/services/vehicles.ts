import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import type { VehicleStatus, CurrencyCode } from '@/types/database'

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
  drivetrain?: string
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
  salePrice?: number | string
  saleCurrency?: 'USD' | 'CAD' | 'AED'
  salePriceIncludesVat?: boolean
  saleType?: 'local_only' | 'export_only' | 'local_and_export'
  isPublic?: boolean
}

export interface UpdateVehicleData extends Partial<CreateVehicleData> {
  currentStatus?: 'auction_won' | 'payment_processing' | 'pickup_scheduled' | 'in_transit_to_port' | 'at_port' | 'shipped' | 'in_transit' | 'at_uae_port' | 'customs_clearance' | 'released_from_customs' | 'in_transit_to_yard' | 'at_yard' | 'under_enhancement' | 'ready_for_sale' | 'reserved' | 'sold' | 'delivered'
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
  private static getAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return null
    return createClient(url, key)
  }
  // Create a new vehicle
  static async create(vehicleData: CreateVehicleData, userId: string) {
    try {
      console.log('VehicleService.create called with:', vehicleData)
      console.log('User ID:', userId)

      // Normalize snake_case input to camelCase expected by Prisma
      const src = vehicleData as unknown as Record<string, unknown>
      const normalized = {
        vin: src.vin,
        year: src.year,
        make: src.make,
        model: src.model,
        trim: src.trim,
        engine: src.engine,
        mileage: src.mileage,
        exteriorColor: src.exteriorColor ?? src.exterior_color,
        interiorColor: src.interiorColor ?? src.interior_color,
        transmission: src.transmission,
        fuelType: src.fuelType ?? src.fuel_type,
        bodyStyle: src.bodyStyle ?? src.body_style,
        drivetrain: src.drivetrain ?? src.drivetrain,
        auctionHouse: src.auctionHouse ?? src.auction_house,
        auctionLocation: src.auctionLocation ?? src.auction_location,
        saleDate: src.saleDate ?? (src.sale_date && typeof src.sale_date === 'string' ? new Date(src.sale_date) : undefined),
        lotNumber: src.lotNumber ?? src.lot_number,
        primaryDamage: src.primaryDamage ?? src.primary_damage,
        secondaryDamage: src.secondaryDamage ?? src.secondary_damage,
        damageDescription: src.damageDescription ?? src.damage_description,
        damageSeverity: src.damageSeverity ?? src.damage_severity,
        repairEstimate: src.repairEstimate ?? src.repair_estimate,
        titleStatus: src.titleStatus ?? src.title_status,
        keysAvailable: src.keysAvailable ?? src.keys_available ?? false,
        runAndDrive: src.runAndDrive ?? src.run_and_drive ?? false,
        purchasePrice: src.purchasePrice ?? src.purchase_price,
        purchaseCurrency: src.purchaseCurrency ?? src.purchase_currency ?? 'USD',
        estimatedTotalCost: src.estimatedTotalCost ?? src.estimated_total_cost,
        salePrice: src.salePrice ?? src.sale_price,
        saleCurrency: src.saleCurrency ?? src.sale_currency ?? 'AED',
        salePriceIncludesVat: src.salePriceIncludesVat ?? src.sale_price_includes_vat ?? false,
        saleType: src.saleType ?? src.sale_type ?? 'local_and_export',
        isPublic: src.isPublic ?? src.is_public,
      } as CreateVehicleData

      const createData: Prisma.VehicleCreateInput = {
        vin: normalized.vin,
        year: normalized.year,
        make: normalized.make,
        model: normalized.model,
        trim: normalized.trim,
        engine: normalized.engine,
        mileage: normalized.mileage,
        exteriorColor: normalized.exteriorColor,
        interiorColor: normalized.interiorColor,
        transmission: normalized.transmission,
        fuelType: normalized.fuelType,
        bodyStyle: normalized.bodyStyle,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        drivetrain: normalized.drivetrain as any,
        auctionHouse: normalized.auctionHouse!,
        auctionLocation: normalized.auctionLocation,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        saleDate: normalized.saleDate as any,
        lotNumber: normalized.lotNumber,
        primaryDamage: normalized.primaryDamage,
        secondaryDamage: normalized.secondaryDamage,
        damageDescription: normalized.damageDescription,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        damageSeverity: normalized.damageSeverity as any,
        repairEstimate: normalized.repairEstimate ? new Prisma.Decimal(normalized.repairEstimate.toString()) : undefined,
        titleStatus: normalized.titleStatus,
        keysAvailable: normalized.keysAvailable ?? false,
        runAndDrive: normalized.runAndDrive ?? false,
        purchasePrice: new Prisma.Decimal(normalized.purchasePrice!.toString()),
        purchaseCurrency: normalized.purchaseCurrency ?? 'USD',
        estimatedTotalCost: normalized.estimatedTotalCost ? new Prisma.Decimal(normalized.estimatedTotalCost.toString()) : undefined,
        salePrice: normalized.salePrice ? new Prisma.Decimal(normalized.salePrice.toString()) : undefined,
        saleCurrency: normalized.saleCurrency ?? 'AED',
        salePriceIncludesVat: normalized.salePriceIncludesVat ?? false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        saleType: (normalized.saleType as any) ?? 'local_and_export',
        isPublic: normalized.isPublic,
        currentStatus: 'auction_won',
        createdByProfile: {
          connect: { id: userId }
        }
      }

      console.log('Creating vehicle with Prisma...')
      const vehicle = await prisma.vehicle.create({ data: createData })

      // Create initial status history entry
      console.log('Creating status history for vehicle:', vehicle.id)
      await this.addStatusHistory(vehicle.id, 'auction_won' as VehicleStatus, 'Vehicle added to system', userId)

      console.log('Vehicle created successfully:', vehicle)
      return { success: true, data: vehicle }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Exception in VehicleService.create:', errorMessage)
      // Fallback via Supabase service role
      try {
        const admin = this.getAdmin()
        if (!admin) throw error
        const src = vehicleData as unknown as Record<string, unknown>
        const nowIso = new Date().toISOString()
        const insert = {
          vin: src.vin,
          year: src.year,
          make: src.make,
          model: src.model,
          trim: src.trim,
          engine: src.engine,
          mileage: src.mileage,
          exterior_color: src.exterior_color ?? src.exteriorColor,
          interior_color: src.interior_color ?? src.interiorColor,
          transmission: src.transmission,
          fuel_type: src.fuel_type ?? src.fuelType,
          body_style: src.body_style ?? src.bodyStyle,
          drivetrain: src.drivetrain ?? src.drivetrain,
          auction_house: src.auction_house ?? src.auctionHouse,
          auction_location: src.auction_location ?? src.auctionLocation,
          sale_date: src.sale_date ?? (src.saleDate && (typeof src.saleDate === 'string' || src.saleDate instanceof Date) ? new Date(src.saleDate).toISOString().slice(0,10) : null),
          lot_number: src.lot_number ?? src.lotNumber,
          primary_damage: src.primary_damage ?? src.primaryDamage,
          secondary_damage: src.secondary_damage ?? src.secondaryDamage,
          damage_description: src.damage_description ?? src.damageDescription,
          damage_severity: src.damage_severity ?? src.damageSeverity,
          repair_estimate: src.repair_estimate ?? src.repairEstimate,
          title_status: src.title_status ?? src.titleStatus,
          keys_available: src.keys_available ?? src.keysAvailable ?? false,
          run_and_drive: src.run_and_drive ?? src.runAndDrive ?? false,
          purchase_price: src.purchase_price ?? src.purchasePrice,
          purchase_currency: src.purchase_currency ?? src.purchaseCurrency ?? 'USD',
          estimated_total_cost: src.estimated_total_cost ?? src.estimatedTotalCost,
          sale_price: src.sale_price ?? src.salePrice,
          sale_currency: src.sale_currency ?? src.saleCurrency ?? 'AED',
          sale_price_includes_vat: src.sale_price_includes_vat ?? src.salePriceIncludesVat ?? false,
          sale_type: src.sale_type ?? src.saleType ?? 'local_and_export',
          is_public: src.is_public ?? src.isPublic ?? false,
          current_status: 'auction_won',
          created_by: userId,
          created_at: nowIso,
          updated_at: nowIso,
        }
        const { data: vehicle, error: vErr } = await admin
          .from('vehicles')
          .insert(insert)
          .select('*')
          .single()
        if (vErr) throw vErr
        await admin
          .from('vehicle_status_history')
          .insert({ vehicle_id: vehicle.id, status: 'auction_won', notes: 'Vehicle added to system', changed_by: userId })
        return { success: true, data: vehicle }
      } catch (fallbackErr: unknown) {
        const fallbackMessage = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error'
        const originalMessage = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: fallbackMessage || originalMessage }
      }
    }
  }

  // Get all vehicles with optional filtering
  static async getAll(filters?: VehicleFilters, page = 1, limit = 20) {
    try {
      console.log('🔍 Loading vehicles with filters:', filters)

      const where: Prisma.VehicleWhereInput = {}

      // Apply filters
      if (filters?.status) {
        where.currentStatus = filters.status as VehicleStatus
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
          vehiclePhotos: {
            select: {
              id: true,
              url: true,
              caption: true,
              isPrimary: true,
              sortOrder: true
            },
            orderBy: [
              { isPrimary: 'desc' },
              { sortOrder: 'asc' }
            ]
          },
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Query error:', errorMessage)
      // Fallback via Supabase service role to avoid Prisma/pool issues
      try {
        const admin = this.getAdmin()
        if (!admin) throw error

        // Build query
        let query = admin
          .from('vehicles')
          .select(
            'id, vin, year, make, model, trim, current_status, current_location, purchase_price, purchase_currency, sale_price, sale_currency, sale_date, auction_house, primary_damage, secondary_damage, damage_severity, is_public, vehicle_photos:vehicle_photos(id,url,caption,is_primary,sort_order)'
            , { count: 'exact' }
          )

        // Filters (snake_case)
        if (filters?.status) query = query.eq('current_status', filters.status)
        if (filters?.isPublic !== undefined) query = query.eq('is_public', filters.isPublic)
        if (filters?.make) query = query.ilike('make', `%${filters.make}%`)
        if (filters?.model) query = query.ilike('model', `%${filters.model}%`)
        if (filters?.auctionHouse) query = query.eq('auction_house', filters.auctionHouse)
        if (filters?.yearMin) query = query.gte('year', filters.yearMin)
        if (filters?.yearMax) query = query.lte('year', filters.yearMax)
        if (filters?.priceMin) query = query.gte('purchase_price', filters.priceMin)
        if (filters?.priceMax) query = query.lte('purchase_price', filters.priceMax)
        if (filters?.search) {
          // Basic OR search: vin/make/model
          query = query.or(`vin.ilike.%${filters.search}%,make.ilike.%${filters.search}%,model.ilike.%${filters.search}%`)
        }

        // Pagination
        const from = (page - 1) * limit
        const to = from + limit - 1
        const { data, error: qerr, count } = await query.range(from, to)
        if (qerr) throw qerr

        return {
          success: true,
          data: data || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            pages: Math.ceil((count || 0) / limit)
          }
        }
      } catch (fallbackErr: unknown) {
        const fallbackMessage = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error'
        return { success: false, error: fallbackMessage || errorMessage }
      }
    }
  }

  // Get public vehicles for website (no authentication required)
  // Automatically filters out sold and delivered vehicles
  static async getPublic(filters?: Omit<VehicleFilters, 'isPublic'>, page = 1, limit = 20) {
    try {
      // Add status filter to exclude sold and delivered before querying
      const publicFilters = {
        ...filters,
        isPublic: true,
        // Exclude sold and delivered statuses
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        excludeStatuses: ['sold', 'delivered'] as any
      }

      // Get filtered results from database (not from already-paginated data)
      const where: Prisma.VehicleWhereInput = { isPublic: true, currentStatus: { notIn: ['sold', 'delivered'] } }

      // Apply other filters
      if (publicFilters.status) {
        where.currentStatus = publicFilters.status as VehicleStatus
      }

      if (publicFilters.make) {
        where.make = { contains: publicFilters.make, mode: 'insensitive' }
      }

      if (publicFilters.model) {
        where.model = { contains: publicFilters.model, mode: 'insensitive' }
      }

      if (publicFilters.yearMin || publicFilters.yearMax) {
        where.year = {}
        if (publicFilters.yearMin) where.year.gte = publicFilters.yearMin
        if (publicFilters.yearMax) where.year.lte = publicFilters.yearMax
      }

      if (publicFilters.priceMin || publicFilters.priceMax) {
        where.purchasePrice = {}
        if (publicFilters.priceMin) where.purchasePrice.gte = new Prisma.Decimal(publicFilters.priceMin.toString())
        if (publicFilters.priceMax) where.purchasePrice.lte = new Prisma.Decimal(publicFilters.priceMax.toString())
      }

      if (publicFilters.auctionHouse) {
        where.auctionHouse = publicFilters.auctionHouse
      }

      if (publicFilters.search) {
        where.OR = [
          { vin: { contains: publicFilters.search, mode: 'insensitive' } },
          { make: { contains: publicFilters.search, mode: 'insensitive' } },
          { model: { contains: publicFilters.search, mode: 'insensitive' } }
        ]
      }

      // Get total count for pagination
      const total = await prisma.vehicle.count({ where })

      // Get paginated data
      const skip = (page - 1) * limit
      const data = await prisma.vehicle.findMany({
        where,
        include: {
          vehiclePhotos: {
            select: {
              id: true,
              url: true,
              caption: true,
              isPrimary: true,
              sortOrder: true
            },
            orderBy: [
              { isPrimary: 'desc' },
              { sortOrder: 'asc' }
            ]
          },
          expenses: { select: { id: true, category: true, description: true, amount: true, currency: true, date: true } }
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ getPublic query error:', errorMessage)
      // Fallback via Supabase service role
      try {
        const admin = this.getAdmin()
        if (!admin) throw error

        let query = admin
          .from('vehicles')
          .select(
            'id, vin, year, make, model, trim, current_status, current_location, purchase_price, purchase_currency, sale_price, sale_currency, sale_date, auction_house, primary_damage, secondary_damage, damage_severity, is_public, vehicle_photos:vehicle_photos(id,url,caption,is_primary,sort_order)',
            { count: 'exact' }
          )
          .eq('is_public', true)
          .not('current_status', 'in', '(sold,delivered)')

        // Apply filters
        if (filters?.status) query = query.eq('current_status', filters.status)
        if (filters?.make) query = query.ilike('make', `%${filters.make}%`)
        if (filters?.model) query = query.ilike('model', `%${filters.model}%`)
        if (filters?.auctionHouse) query = query.eq('auction_house', filters.auctionHouse)
        if (filters?.yearMin) query = query.gte('year', filters.yearMin)
        if (filters?.yearMax) query = query.lte('year', filters.yearMax)
        if (filters?.priceMin) query = query.gte('purchase_price', filters.priceMin)
        if (filters?.priceMax) query = query.lte('purchase_price', filters.priceMax)
        if (filters?.search) {
          query = query.or(`vin.ilike.%${filters.search}%,make.ilike.%${filters.search}%,model.ilike.%${filters.search}%`)
        }

        // Pagination
        const from = (page - 1) * limit
        const to = from + limit - 1
        const { data, count } = await query.range(from, to)

        return {
          success: true,
          data: data || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            pages: Math.ceil((count || 0) / limit)
          }
        }
      } catch (fallbackErr: unknown) {
        const fallbackMessage = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error'
        return { success: false, error: fallbackMessage || errorMessage }
      }
    }
  }

  // Get vehicle by ID
  static async getById(id: string) {
    try {
      const data = await prisma.vehicle.findUnique({
        where: { id },
        include: {
          vehiclePhotos: {
            orderBy: [
              { isPrimary: 'desc' },
              { sortOrder: 'asc' }
            ]
          },
          documents: true,
          statusHistory: { orderBy: { changedAt: 'desc' } },
          expenses: true
        }
      })

      if (!data) {
        return { success: false, error: 'Vehicle not found' }
      }

      return { success: true, data }
    } catch (error: unknown) {
      // Fallback using Supabase service role
      try {
        const admin = this.getAdmin()
        if (!admin) throw error

        const { data: vehicle, error: vErr } = await admin
          .from('vehicles')
          .select('*')
          .eq('id', id)
          .single()
        if (vErr || !vehicle) throw vErr || new Error('Vehicle not found')

        const [{ data: vehiclePhotos }, { data: documents }, { data: statusHistory }, { data: expenses }] = await Promise.all([
          admin.from('vehicle_photos').select('*').eq('vehicle_id', id).order('is_primary', { ascending: false }).order('sort_order', { ascending: true }),
          admin.from('vehicle_documents').select('*').eq('vehicle_id', id),
          admin.from('vehicle_status_history').select('*').eq('vehicle_id', id).order('changed_at', { ascending: false }),
          admin.from('expenses').select('*').eq('vehicle_id', id),
        ])

        const data = { ...vehicle, vehicle_photos: vehiclePhotos, documents, statusHistory: statusHistory, expenses }
        return { success: true, data }
      } catch (fallbackErr: unknown) {
        const fallbackMessage = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error'
        const originalMessage = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: fallbackMessage || originalMessage }
      }
    }
  }

  // Update vehicle
  static async update(id: string, updateData: UpdateVehicleData, userId: string) {
    try {
      // Normalize input to camelCase (form sends camelCase)
      const src = updateData as Record<string, unknown>

      // Helper to safely convert to Decimal for numeric fields
      const toDecimal = (value: unknown): Prisma.Decimal | undefined => {
        if (value === null || value === undefined) return undefined
        if (typeof value === 'number') return new Prisma.Decimal(value)
        if (typeof value === 'string') return new Prisma.Decimal(value)
        return undefined
      }

      const updateInput: Prisma.VehicleUpdateInput = {}

      // Build update input for string fields
      if (src.trim !== undefined) updateInput.trim = src.trim
      if (src.engine !== undefined) updateInput.engine = src.engine
      if (src.mileage !== undefined) updateInput.mileage = src.mileage
      if (src.exteriorColor !== undefined) updateInput.exteriorColor = src.exteriorColor
      if (src.interiorColor !== undefined) updateInput.interiorColor = src.interiorColor
      if (src.transmission !== undefined) updateInput.transmission = src.transmission
      if (src.fuelType !== undefined) updateInput.fuelType = src.fuelType
      if (src.bodyStyle !== undefined) updateInput.bodyStyle = src.bodyStyle
      if (src.drivetrain !== undefined) updateInput.drivetrain = src.drivetrain
      if (src.auctionLocation !== undefined) updateInput.auctionLocation = src.auctionLocation
      if (src.lotNumber !== undefined) updateInput.lotNumber = src.lotNumber
      if (src.primaryDamage !== undefined) updateInput.primaryDamage = src.primaryDamage
      if (src.secondaryDamage !== undefined) updateInput.secondaryDamage = src.secondaryDamage
      if (src.damageDescription !== undefined) updateInput.damageDescription = src.damageDescription
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (src.damageSeverity !== undefined) updateInput.damageSeverity = src.damageSeverity as any
      if (src.titleStatus !== undefined) updateInput.titleStatus = src.titleStatus
      if (src.currentStatus !== undefined) updateInput.currentStatus = src.currentStatus as VehicleStatus
      if (src.currentLocation !== undefined) updateInput.currentLocation = src.currentLocation as string
      if (src.saleCurrency !== undefined) updateInput.saleCurrency = src.saleCurrency as CurrencyCode
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (src.saleType !== undefined) updateInput.saleType = src.saleType as any
      if (src.purchaseCurrency !== undefined) updateInput.purchaseCurrency = src.purchaseCurrency as CurrencyCode
      if (src.auctionHouse !== undefined && typeof src.auctionHouse === 'string') updateInput.auctionHouse = src.auctionHouse

      // Build update input for boolean fields
      if (src.keysAvailable !== undefined && typeof src.keysAvailable === 'boolean') updateInput.keysAvailable = src.keysAvailable
      if (src.runAndDrive !== undefined && typeof src.runAndDrive === 'boolean') updateInput.runAndDrive = src.runAndDrive
      if (src.isPublic !== undefined && typeof src.is_public === 'boolean') updateInput.isPublic = src.is_public
      if (src.salePriceIncludesVat !== undefined && typeof src.salePriceIncludesVat === 'boolean') updateInput.salePriceIncludesVat = src.salePriceIncludesVat

      // Handle Date field
      if (src.saleDate !== undefined) {
        updateInput.saleDate = typeof src.sale_date === 'string' ? new Date(src.sale_date) : src.saleDate
      }

      // Handle Decimal fields (prices, costs, estimates)
      if (src.repairEstimate !== undefined) updateInput.repairEstimate = toDecimal(src.repairEstimate)
      if (src.estimatedTotalCost !== undefined) updateInput.estimatedTotalCost = toDecimal(src.estimatedTotalCost)
      if (src.salePrice !== undefined) updateInput.salePrice = toDecimal(src.salePrice)
      if (src.purchasePrice !== undefined) updateInput.purchasePrice = toDecimal(src.purchasePrice)

      // Execute the update
      const data = await prisma.vehicle.update({
        where: { id },
        data: updateInput
      })

      // If status changed, add to history
      if (src.currentStatus && typeof src.currentStatus === 'string') {
        await this.addStatusHistory(
          id,
          src.currentStatus as VehicleStatus,
          src.currentLocation && typeof src.currentLocation === 'string' ? `Location: ${src.currentLocation}` : undefined,
          userId
        )
      }

      return { success: true, data }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('VehicleService.update error:', errorMessage)

      // Fallback to Supabase for updates when Prisma has prepared statement issues
      try {
        const admin = this.getAdmin()
        if (!admin) throw error

        // Convert camelCase to snake_case for Supabase
        const src = updateData as Record<string, unknown>
        const snakeCaseUpdate: Record<string, unknown> = {}

        // Map camelCase fields to snake_case
        if (src.isPublic !== undefined) snakeCaseUpdate.is_public = src.isPublic
        if (src.trim !== undefined) snakeCaseUpdate.trim = src.trim
        if (src.engine !== undefined) snakeCaseUpdate.engine = src.engine
        if (src.mileage !== undefined) snakeCaseUpdate.mileage = src.mileage
        if (src.exteriorColor !== undefined) snakeCaseUpdate.exterior_color = src.exteriorColor
        if (src.interiorColor !== undefined) snakeCaseUpdate.interior_color = src.interiorColor
        if (src.transmission !== undefined) snakeCaseUpdate.transmission = src.transmission
        if (src.fuelType !== undefined) snakeCaseUpdate.fuel_type = src.fuelType
        if (src.bodyStyle !== undefined) snakeCaseUpdate.body_style = src.bodyStyle
        if (src.drivetrain !== undefined) snakeCaseUpdate.drivetrain = src.drivetrain
        if (src.auctionLocation !== undefined) snakeCaseUpdate.auction_location = src.auctionLocation
        if (src.lotNumber !== undefined) snakeCaseUpdate.lot_number = src.lotNumber
        if (src.primaryDamage !== undefined) snakeCaseUpdate.primary_damage = src.primaryDamage
        if (src.secondaryDamage !== undefined) snakeCaseUpdate.secondary_damage = src.secondaryDamage
        if (src.damageDescription !== undefined) snakeCaseUpdate.damage_description = src.damageDescription
        if (src.damageSeverity !== undefined) snakeCaseUpdate.damage_severity = src.damageSeverity
        if (src.titleStatus !== undefined) snakeCaseUpdate.title_status = src.titleStatus
        if (src.currentStatus !== undefined) snakeCaseUpdate.current_status = src.currentStatus
        if (src.currentLocation !== undefined) snakeCaseUpdate.current_location = src.currentLocation
        if (src.saleCurrency !== undefined) snakeCaseUpdate.sale_currency = src.saleCurrency
        if (src.saleType !== undefined) snakeCaseUpdate.sale_type = src.saleType
        if (src.purchaseCurrency !== undefined) snakeCaseUpdate.purchase_currency = src.purchaseCurrency
        if (src.auctionHouse !== undefined) snakeCaseUpdate.auction_house = src.auctionHouse
        if (src.keysAvailable !== undefined) snakeCaseUpdate.keys_available = src.keysAvailable
        if (src.runAndDrive !== undefined) snakeCaseUpdate.run_and_drive = src.runAndDrive
        if (src.salePriceIncludesVat !== undefined) snakeCaseUpdate.sale_price_includes_vat = src.salePriceIncludesVat
        if (src.saleDate !== undefined) snakeCaseUpdate.sale_date = typeof src.saleDate === 'string' ? new Date(src.saleDate).toISOString().slice(0, 10) : src.saleDate
        if (src.repairEstimate !== undefined) snakeCaseUpdate.repair_estimate = src.repairEstimate
        if (src.estimatedTotalCost !== undefined) snakeCaseUpdate.estimated_total_cost = src.estimatedTotalCost
        if (src.salePrice !== undefined) snakeCaseUpdate.sale_price = src.salePrice
        if (src.purchasePrice !== undefined) snakeCaseUpdate.purchase_price = src.purchasePrice

        // Add updated_at timestamp
        snakeCaseUpdate.updated_at = new Date().toISOString()

        console.log('Falling back to Supabase for update:', snakeCaseUpdate)

        const { data: updatedVehicle, error: updateError } = await admin
          .from('vehicles')
          .update(snakeCaseUpdate)
          .eq('id', id)
          .select()
          .single()

        if (updateError) throw updateError

        // If status changed, add to history
        if (src.currentStatus && typeof src.currentStatus === 'string') {
          await admin.from('vehicle_status_history').insert({
            vehicle_id: id,
            status: src.currentStatus,
            notes: src.currentLocation && typeof src.currentLocation === 'string' ? `Location: ${src.currentLocation}` : undefined,
            changed_by: userId
          })
        }

        return { success: true, data: updatedVehicle }
      } catch (fallbackError: unknown) {
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
        console.error('Supabase fallback also failed:', fallbackMessage)
        return { success: false, error: errorMessage }
      }
    }
  }

  // Delete vehicle
  static async delete(id: string) {
    try {
      await prisma.vehicle.delete({
        where: { id }
      })

      return { success: true }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }

  // Update vehicle status
  static async updateStatus(id: string, status: string, location?: string, notes?: string, userId?: string) {
    try {
      // Update vehicle status
      await prisma.vehicle.update({
        where: { id },
        data: {
          currentStatus: status as VehicleStatus,
          currentLocation: location
        }
      })

      // Add to status history
      await this.addStatusHistory(id, status as VehicleStatus, notes || (location ? `Location: ${location}` : undefined), userId)

      return { success: true }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }

  // Add status history entry
  static async addStatusHistory(vehicleId: string, status: VehicleStatus, notes?: string, userId?: string) {
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
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
    } catch (error: unknown) {
      try {
        const admin = this.getAdmin()
        if (!admin) throw error
        const { data, error: vErr } = await admin.from('vehicles').select('current_status, created_at')
        if (vErr) throw vErr
        const total = data?.length || 0
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        const recentAdditions = (data || []).filter(v => new Date((v as Record<string, unknown>).created_at as string).getTime() >= sevenDaysAgo).length
        const statusCounts: Record<string, number> = {}
        ;(data || []).forEach(v => {
          const s = (v as Record<string, unknown>).current_status || 'unknown'
          const key = String(s)
          statusCounts[key] = (statusCounts[key] || 0) + 1
        })
        return { success: true, data: { total, byStatus: statusCounts, recentAdditions } }
      } catch (fallbackErr: unknown) {
        const fallbackMessage = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error'
        const originalMessage = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: fallbackMessage || originalMessage }
      }
    }
  }
}
