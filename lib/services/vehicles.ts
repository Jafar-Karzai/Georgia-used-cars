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
  exterior_color?: string
  interior_color?: string
  transmission?: string
  fuel_type?: string
  body_style?: string
  drivetrain?: string
  auction_house: string
  auction_location?: string
  sale_date?: Date | string
  lot_number?: string
  expected_arrival_date?: Date | string
  actual_arrival_date?: Date | string
  primary_damage?: string
  secondary_damage?: string
  damage_description?: string
  damage_severity?: 'minor' | 'moderate' | 'major' | 'total_loss'
  repair_estimate?: number | string
  title_status?: string
  keys_available?: boolean
  run_and_drive?: boolean
  purchase_price: number | string
  purchase_currency?: 'USD' | 'CAD' | 'AED'
  estimated_total_cost?: number | string
  sale_price?: number | string
  sale_currency?: 'USD' | 'CAD' | 'AED'
  sale_price_includes_vat?: boolean
  sale_type?: 'local_only' | 'export_only' | 'local_and_export'
  is_public?: boolean
}

export interface UpdateVehicleData extends Partial<CreateVehicleData> {
  current_status?: 'auction_won' | 'payment_processing' | 'pickup_scheduled' | 'in_transit_to_port' | 'at_port' | 'shipped' | 'in_transit' | 'at_uae_port' | 'customs_clearance' | 'released_from_customs' | 'in_transit_to_yard' | 'at_yard' | 'under_enhancement' | 'ready_for_sale' | 'reserved' | 'sold' | 'delivered'
  current_location?: string
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

      // Convert snake_case input to camelCase for Prisma
      const createData: Prisma.VehicleCreateInput = {
        vin: vehicleData.vin,
        year: vehicleData.year,
        make: vehicleData.make,
        model: vehicleData.model,
        trim: vehicleData.trim,
        engine: vehicleData.engine,
        mileage: vehicleData.mileage,
        exteriorColor: vehicleData.exterior_color,
        interiorColor: vehicleData.interior_color,
        transmission: vehicleData.transmission,
        fuelType: vehicleData.fuel_type,
        bodyStyle: vehicleData.body_style,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        drivetrain: vehicleData.drivetrain as any,
        auctionHouse: vehicleData.auction_house,
        auctionLocation: vehicleData.auction_location,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        saleDate: vehicleData.sale_date ? (typeof vehicleData.sale_date === 'string' ? new Date(vehicleData.sale_date) : vehicleData.sale_date) as any : undefined,
        lotNumber: vehicleData.lot_number,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expectedArrivalDate: vehicleData.expected_arrival_date ? (typeof vehicleData.expected_arrival_date === 'string' ? new Date(vehicleData.expected_arrival_date) : vehicleData.expected_arrival_date) as any : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        actualArrivalDate: vehicleData.actual_arrival_date ? (typeof vehicleData.actual_arrival_date === 'string' ? new Date(vehicleData.actual_arrival_date) : vehicleData.actual_arrival_date) as any : undefined,
        primaryDamage: vehicleData.primary_damage,
        secondaryDamage: vehicleData.secondary_damage,
        damageDescription: vehicleData.damage_description,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        damageSeverity: vehicleData.damage_severity as any,
        repairEstimate: vehicleData.repair_estimate ? new Prisma.Decimal(vehicleData.repair_estimate.toString()) : undefined,
        titleStatus: vehicleData.title_status,
        keysAvailable: vehicleData.keys_available ?? false,
        runAndDrive: vehicleData.run_and_drive ?? false,
        purchasePrice: new Prisma.Decimal(vehicleData.purchase_price.toString()),
        purchaseCurrency: vehicleData.purchase_currency ?? 'USD',
        estimatedTotalCost: vehicleData.estimated_total_cost ? new Prisma.Decimal(vehicleData.estimated_total_cost.toString()) : undefined,
        salePrice: vehicleData.sale_price ? new Prisma.Decimal(vehicleData.sale_price.toString()) : undefined,
        saleCurrency: vehicleData.sale_currency ?? 'AED',
        salePriceIncludesVat: vehicleData.sale_price_includes_vat ?? false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        saleType: (vehicleData.sale_type as any) ?? 'local_and_export',
        isPublic: vehicleData.is_public,
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
        const nowIso = new Date().toISOString()
        const insert = {
          vin: vehicleData.vin,
          year: vehicleData.year,
          make: vehicleData.make,
          model: vehicleData.model,
          trim: vehicleData.trim,
          engine: vehicleData.engine,
          mileage: vehicleData.mileage,
          exterior_color: vehicleData.exterior_color,
          interior_color: vehicleData.interior_color,
          transmission: vehicleData.transmission,
          fuel_type: vehicleData.fuel_type,
          body_style: vehicleData.body_style,
          drivetrain: vehicleData.drivetrain,
          auction_house: vehicleData.auction_house,
          auction_location: vehicleData.auction_location,
          sale_date: vehicleData.sale_date ? (typeof vehicleData.sale_date === 'string' ? vehicleData.sale_date : vehicleData.sale_date instanceof Date ? vehicleData.sale_date.toISOString().slice(0,10) : null) : null,
          lot_number: vehicleData.lot_number,
          expected_arrival_date: vehicleData.expected_arrival_date ? (typeof vehicleData.expected_arrival_date === 'string' ? vehicleData.expected_arrival_date : vehicleData.expected_arrival_date instanceof Date ? vehicleData.expected_arrival_date.toISOString().slice(0,10) : null) : null,
          actual_arrival_date: vehicleData.actual_arrival_date ? (typeof vehicleData.actual_arrival_date === 'string' ? vehicleData.actual_arrival_date : vehicleData.actual_arrival_date instanceof Date ? vehicleData.actual_arrival_date.toISOString().slice(0,10) : null) : null,
          primary_damage: vehicleData.primary_damage,
          secondary_damage: vehicleData.secondary_damage,
          damage_description: vehicleData.damage_description,
          damage_severity: vehicleData.damage_severity,
          repair_estimate: vehicleData.repair_estimate,
          title_status: vehicleData.title_status,
          keys_available: vehicleData.keys_available ?? false,
          run_and_drive: vehicleData.run_and_drive ?? false,
          purchase_price: vehicleData.purchase_price,
          purchase_currency: vehicleData.purchase_currency ?? 'USD',
          estimated_total_cost: vehicleData.estimated_total_cost,
          sale_price: vehicleData.sale_price,
          sale_currency: vehicleData.sale_currency ?? 'AED',
          sale_price_includes_vat: vehicleData.sale_price_includes_vat ?? false,
          sale_type: vehicleData.sale_type ?? 'local_and_export',
          is_public: vehicleData.is_public ?? false,
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
            'id, vin, year, make, model, trim, mileage, transmission, fuel_type, body_style, run_and_drive, current_status, current_location, purchase_price, purchase_currency, sale_price, sale_currency, sale_price_includes_vat, sale_type, sale_date, auction_house, primary_damage, secondary_damage, damage_severity, is_public, vehicle_photos:vehicle_photos(id,url,caption,is_primary,sort_order)'
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
        where.salePrice = {}
        if (publicFilters.priceMin) where.salePrice.gte = new Prisma.Decimal(publicFilters.priceMin.toString())
        if (publicFilters.priceMax) where.salePrice.lte = new Prisma.Decimal(publicFilters.priceMax.toString())
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

      // Get paginated data - explicitly exclude sensitive dealer information
      const skip = (page - 1) * limit
      const data = await prisma.vehicle.findMany({
        where,
        select: {
          id: true,
          vin: true,
          year: true,
          make: true,
          model: true,
          trim: true,
          engine: true,
          mileage: true,
          exteriorColor: true,
          interiorColor: true,
          transmission: true,
          fuelType: true,
          bodyStyle: true,
          drivetrain: true,
          runAndDrive: true,
          currentStatus: true,
          currentLocation: true,
          expectedArrivalDate: true,
          actualArrivalDate: true,
          titleStatus: true,
          keysAvailable: true,
          lotNumber: true,
          auctionLocation: true,
          damageDescription: true,
          // Exclude purchase_price and purchase_currency - dealer private info
          salePrice: true,
          saleCurrency: true,
          salePriceIncludesVat: true,
          saleType: true,
          saleDate: true,
          auctionHouse: true,
          primaryDamage: true,
          secondaryDamage: true,
          damageSeverity: true,
          isPublic: true,
          createdAt: true,
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
          }
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
            'id, vin, year, make, model, trim, engine, mileage, exterior_color, interior_color, transmission, fuel_type, body_style, drivetrain, run_and_drive, current_status, current_location, expected_arrival_date, actual_arrival_date, title_status, keys_available, lot_number, auction_location, damage_description, sale_price, sale_currency, sale_price_includes_vat, sale_type, sale_date, auction_house, primary_damage, secondary_damage, damage_severity, is_public, created_at, vehicle_photos:vehicle_photos(id,url,caption,is_primary,sort_order)',
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
        if (filters?.priceMin) query = query.gte('sale_price', filters.priceMin)
        if (filters?.priceMax) query = query.lte('sale_price', filters.priceMax)
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
      // Helper to safely convert to Decimal for numeric fields
      const toDecimal = (value: unknown): Prisma.Decimal | undefined => {
        if (value === null || value === undefined) return undefined
        if (typeof value === 'number') return new Prisma.Decimal(value)
        if (typeof value === 'string') return new Prisma.Decimal(value)
        return undefined
      }

      const updateInput: Prisma.VehicleUpdateInput = {}

      // Build update input for string fields (convert snake_case to camelCase for Prisma)
      if (updateData.trim !== undefined) updateInput.trim = updateData.trim
      if (updateData.engine !== undefined) updateInput.engine = updateData.engine
      if (updateData.mileage !== undefined) updateInput.mileage = updateData.mileage
      if (updateData.exterior_color !== undefined) updateInput.exteriorColor = updateData.exterior_color
      if (updateData.interior_color !== undefined) updateInput.interiorColor = updateData.interior_color
      if (updateData.transmission !== undefined) updateInput.transmission = updateData.transmission
      if (updateData.fuel_type !== undefined) updateInput.fuelType = updateData.fuel_type
      if (updateData.body_style !== undefined) updateInput.bodyStyle = updateData.body_style
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (updateData.drivetrain !== undefined) updateInput.drivetrain = updateData.drivetrain as any
      if (updateData.auction_location !== undefined) updateInput.auctionLocation = updateData.auction_location
      if (updateData.lot_number !== undefined) updateInput.lotNumber = updateData.lot_number
      if (updateData.primary_damage !== undefined) updateInput.primaryDamage = updateData.primary_damage
      if (updateData.secondary_damage !== undefined) updateInput.secondaryDamage = updateData.secondary_damage
      if (updateData.damage_description !== undefined) updateInput.damageDescription = updateData.damage_description
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (updateData.damage_severity !== undefined) updateInput.damageSeverity = updateData.damage_severity as any
      if (updateData.title_status !== undefined) updateInput.titleStatus = updateData.title_status
      if (updateData.current_status !== undefined) updateInput.currentStatus = updateData.current_status as VehicleStatus
      if (updateData.current_location !== undefined) updateInput.currentLocation = updateData.current_location as string
      if (updateData.sale_currency !== undefined) updateInput.saleCurrency = updateData.sale_currency as CurrencyCode
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (updateData.sale_type !== undefined) updateInput.saleType = updateData.sale_type as any
      if (updateData.purchase_currency !== undefined) updateInput.purchaseCurrency = updateData.purchase_currency as CurrencyCode
      if (updateData.auction_house !== undefined && typeof updateData.auction_house === 'string') updateInput.auctionHouse = updateData.auction_house

      // Build update input for boolean fields
      if (updateData.keys_available !== undefined && typeof updateData.keys_available === 'boolean') updateInput.keysAvailable = updateData.keys_available
      if (updateData.run_and_drive !== undefined && typeof updateData.run_and_drive === 'boolean') updateInput.runAndDrive = updateData.run_and_drive
      if (updateData.is_public !== undefined && typeof updateData.is_public === 'boolean') updateInput.isPublic = updateData.is_public
      if (updateData.sale_price_includes_vat !== undefined && typeof updateData.sale_price_includes_vat === 'boolean') updateInput.salePriceIncludesVat = updateData.sale_price_includes_vat

      // Handle Date fields
      if (updateData.sale_date !== undefined) {
        updateInput.saleDate = typeof updateData.sale_date === 'string' ? new Date(updateData.sale_date) : updateData.sale_date
      }
      if (updateData.expected_arrival_date !== undefined) {
        updateInput.expectedArrivalDate = typeof updateData.expected_arrival_date === 'string' ? new Date(updateData.expected_arrival_date) : updateData.expected_arrival_date
      }
      if (updateData.actual_arrival_date !== undefined) {
        updateInput.actualArrivalDate = typeof updateData.actual_arrival_date === 'string' ? new Date(updateData.actual_arrival_date) : updateData.actual_arrival_date
      }

      // Handle Decimal fields (prices, costs, estimates)
      if (updateData.repair_estimate !== undefined) updateInput.repairEstimate = toDecimal(updateData.repair_estimate)
      if (updateData.estimated_total_cost !== undefined) updateInput.estimatedTotalCost = toDecimal(updateData.estimated_total_cost)
      if (updateData.sale_price !== undefined) updateInput.salePrice = toDecimal(updateData.sale_price)
      if (updateData.purchase_price !== undefined) updateInput.purchasePrice = toDecimal(updateData.purchase_price)

      // Execute the update
      const data = await prisma.vehicle.update({
        where: { id },
        data: updateInput
      })

      // If status changed, add to history
      if (updateData.current_status && typeof updateData.current_status === 'string') {
        await this.addStatusHistory(
          id,
          updateData.current_status as VehicleStatus,
          updateData.current_location && typeof updateData.current_location === 'string' ? `Location: ${updateData.current_location}` : undefined,
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

        // Build snake_case update object for Supabase
        const snakeCaseUpdate: Record<string, unknown> = {}

        // Map snake_case fields directly
        if (updateData.is_public !== undefined) snakeCaseUpdate.is_public = updateData.is_public
        if (updateData.trim !== undefined) snakeCaseUpdate.trim = updateData.trim
        if (updateData.engine !== undefined) snakeCaseUpdate.engine = updateData.engine
        if (updateData.mileage !== undefined) snakeCaseUpdate.mileage = updateData.mileage
        if (updateData.exterior_color !== undefined) snakeCaseUpdate.exterior_color = updateData.exterior_color
        if (updateData.interior_color !== undefined) snakeCaseUpdate.interior_color = updateData.interior_color
        if (updateData.transmission !== undefined) snakeCaseUpdate.transmission = updateData.transmission
        if (updateData.fuel_type !== undefined) snakeCaseUpdate.fuel_type = updateData.fuel_type
        if (updateData.body_style !== undefined) snakeCaseUpdate.body_style = updateData.body_style
        if (updateData.drivetrain !== undefined) snakeCaseUpdate.drivetrain = updateData.drivetrain
        if (updateData.auction_location !== undefined) snakeCaseUpdate.auction_location = updateData.auction_location
        if (updateData.lot_number !== undefined) snakeCaseUpdate.lot_number = updateData.lot_number
        if (updateData.primary_damage !== undefined) snakeCaseUpdate.primary_damage = updateData.primary_damage
        if (updateData.secondary_damage !== undefined) snakeCaseUpdate.secondary_damage = updateData.secondary_damage
        if (updateData.damage_description !== undefined) snakeCaseUpdate.damage_description = updateData.damage_description
        if (updateData.damage_severity !== undefined) snakeCaseUpdate.damage_severity = updateData.damage_severity
        if (updateData.title_status !== undefined) snakeCaseUpdate.title_status = updateData.title_status
        if (updateData.current_status !== undefined) snakeCaseUpdate.current_status = updateData.current_status
        if (updateData.current_location !== undefined) snakeCaseUpdate.current_location = updateData.current_location
        if (updateData.sale_currency !== undefined) snakeCaseUpdate.sale_currency = updateData.sale_currency
        if (updateData.sale_type !== undefined) snakeCaseUpdate.sale_type = updateData.sale_type
        if (updateData.purchase_currency !== undefined) snakeCaseUpdate.purchase_currency = updateData.purchase_currency
        if (updateData.auction_house !== undefined) snakeCaseUpdate.auction_house = updateData.auction_house
        if (updateData.keys_available !== undefined) snakeCaseUpdate.keys_available = updateData.keys_available
        if (updateData.run_and_drive !== undefined) snakeCaseUpdate.run_and_drive = updateData.run_and_drive
        if (updateData.sale_price_includes_vat !== undefined) snakeCaseUpdate.sale_price_includes_vat = updateData.sale_price_includes_vat
        if (updateData.sale_date !== undefined) snakeCaseUpdate.sale_date = typeof updateData.sale_date === 'string' ? updateData.sale_date : updateData.sale_date instanceof Date ? updateData.sale_date.toISOString().slice(0, 10) : null
        if (updateData.expected_arrival_date !== undefined) snakeCaseUpdate.expected_arrival_date = typeof updateData.expected_arrival_date === 'string' ? updateData.expected_arrival_date : updateData.expected_arrival_date instanceof Date ? updateData.expected_arrival_date.toISOString().slice(0, 10) : null
        if (updateData.actual_arrival_date !== undefined) snakeCaseUpdate.actual_arrival_date = typeof updateData.actual_arrival_date === 'string' ? updateData.actual_arrival_date : updateData.actual_arrival_date instanceof Date ? updateData.actual_arrival_date.toISOString().slice(0, 10) : null
        if (updateData.repair_estimate !== undefined) snakeCaseUpdate.repair_estimate = updateData.repair_estimate
        if (updateData.estimated_total_cost !== undefined) snakeCaseUpdate.estimated_total_cost = updateData.estimated_total_cost
        if (updateData.sale_price !== undefined) snakeCaseUpdate.sale_price = updateData.sale_price
        if (updateData.purchase_price !== undefined) snakeCaseUpdate.purchase_price = updateData.purchase_price

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
        if (updateData.current_status && typeof updateData.current_status === 'string') {
          await admin.from('vehicle_status_history').insert({
            vehicle_id: id,
            status: updateData.current_status,
            notes: updateData.current_location && typeof updateData.current_location === 'string' ? `Location: ${updateData.current_location}` : undefined,
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
      // Auto-populate actualArrivalDate when vehicle arrives at yard
      const arrivalStatuses = ['at_yard', 'released_from_customs', 'in_transit_to_yard']
      const shouldSetArrivalDate = arrivalStatuses.includes(status)

      // Only set actualArrivalDate if it hasn't been set yet
      const updateData: { currentStatus: VehicleStatus; currentLocation?: string; actualArrivalDate?: Date } = {
        currentStatus: status as VehicleStatus,
        currentLocation: location
      }

      if (shouldSetArrivalDate) {
        // Check if actualArrivalDate is already set
        const vehicle = await prisma.vehicle.findUnique({
          where: { id },
          select: { actualArrivalDate: true }
        })

        if (vehicle && !vehicle.actualArrivalDate) {
          updateData.actualArrivalDate = new Date()
        }
      }

      // Update vehicle status
      await prisma.vehicle.update({
        where: { id },
        data: updateData
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
