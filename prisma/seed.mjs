import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

async function getOrCreateAdminProfile() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@georgiaused.com'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const createIfMissing = (process.env.SEED_CREATE_ADMIN || 'false').toLowerCase() === 'true'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123'

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[seed] SUPABASE_URL or SERVICE_ROLE_KEY missing; skipping admin lookup. Provide IDs manually if needed.')
    return null
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Try to find existing auth user
  const { data: usersPage1, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listErr) {
    console.warn('[seed] Failed to list Supabase users:', listErr.message)
  }
  const found = usersPage1?.users?.find(u => (u.email || '').toLowerCase() === adminEmail.toLowerCase())

  let adminUser = found || null

  if (!adminUser && createIfMissing) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    })
    if (error) throw new Error(`[seed] Failed to create admin auth user: ${error.message}`)
    adminUser = data.user
    console.log('[seed] Created admin auth user:', adminUser?.id)
  }

  if (!adminUser) {
    console.warn(`[seed] Admin auth user not found. Ensure ${adminEmail} exists in Supabase Auth or set SEED_CREATE_ADMIN=true`)
    return null
  }

  // Upsert profile in Prisma DB (must be same Postgres as Supabase)
  const profile = await prisma.profile.upsert({
    where: { id: adminUser.id },
    update: {
      email: adminEmail,
      fullName: 'System Administrator',
      role: 'super_admin',
      isActive: true,
    },
    create: {
      id: adminUser.id,
      email: adminEmail,
      fullName: 'System Administrator',
      role: 'super_admin',
      isActive: true,
    },
  })

  console.log('[seed] Upserted admin profile:', profile.id)
  return profile
}

async function seedVehicles(adminId) {
  const now = new Date()
  const vehicles = [
    {
      vin: '1HGCM82633A004352', year: 2018, make: 'Toyota', model: 'Camry',
      trim: 'SE', engine: '2.5L I4', mileage: 62000, exteriorColor: 'White', interiorColor: 'Black',
      transmission: 'Automatic', fuelType: 'Gasoline', bodyStyle: 'Sedan', auctionHouse: 'Copart',
      auctionLocation: 'Atlanta, GA', lotNumber: 'A123456', primaryDamage: 'Front End',
      damageSeverity: 'moderate', repairEstimate: '2500', currentStatus: 'ready_for_sale',
      titleStatus: 'Salvage', keysAvailable: true, runAndDrive: true, purchasePrice: '7500',
      purchaseCurrency: 'USD', estimatedTotalCost: '11000', isPublic: true,
    },
    {
      vin: '1FA6P8CF3K5123456', year: 2019, make: 'Ford', model: 'Mustang',
      trim: 'GT', engine: '5.0L V8', mileage: 42000, exteriorColor: 'Blue', interiorColor: 'Black',
      transmission: 'Manual', fuelType: 'Gasoline', bodyStyle: 'Coupe', auctionHouse: 'IAAI',
      auctionLocation: 'Phoenix, AZ', lotNumber: 'I654321', primaryDamage: 'Rear End',
      damageSeverity: 'minor', repairEstimate: '1800', currentStatus: 'in_transit',
      titleStatus: 'Rebuilt', keysAvailable: true, runAndDrive: true, purchasePrice: '14500',
      purchaseCurrency: 'USD', estimatedTotalCost: '17000', isPublic: false,
    },
  ]

  for (const v of vehicles) {
    const created = await prisma.vehicle.create({
      data: {
        ...v,
        purchasePrice: v.purchasePrice,
        estimatedTotalCost: v.estimatedTotalCost,
        createdBy: adminId,
        statusHistory: {
          create: [{ status: v.currentStatus || 'auction_won', notes: 'Seeded status', changedBy: adminId }],
        },
      },
    })
    console.log('[seed] Created vehicle:', created.id, created.vin)
  }
}

async function main() {
  try {
    const adminProfile = await getOrCreateAdminProfile()
    const adminId = adminProfile?.id || null

    if (!adminId) {
      console.warn('[seed] Skipping vehicle seeding because admin profile is missing.')
      return
    }

    await seedVehicles(adminId)
  } catch (e) {
    console.error(e)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()

