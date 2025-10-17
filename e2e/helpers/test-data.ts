import { faker } from '@faker-js/faker'

export interface TestVehicle {
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
  saleDate: string
  lotNumber?: string
  primaryDamage?: string
  secondaryDamage?: string
  damageDescription?: string
  damageSeverity?: string
  repairEstimate?: number
  titleStatus?: string
  keysAvailable?: boolean
  runAndDrive?: boolean
  purchasePrice: number
  purchaseCurrency: string
  estimatedTotalCost?: number
  currentLocation?: string
  isPublic?: boolean
}

export interface TestCustomer {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  customerType: 'individual' | 'business'
  taxId?: string
  companyName?: string
}

export interface TestInvoice {
  vehicleId: string
  customerId: string
  salePrice: number
  currency: string
  taxAmount?: number
  discountAmount?: number
  notes?: string
  paymentTerms?: string
  dueDate?: string
}

export interface TestPayment {
  invoiceId: string
  amount: number
  currency: string
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'other'
  paymentDate: string
  transactionId?: string
  notes?: string
}

export interface TestExpense {
  vehicleId: string
  category: 'shipping' | 'customs' | 'enhancement' | 'storage' | 'insurance' | 'other'
  amount: number
  currency: string
  description: string
  expenseDate: string
  receipt?: boolean
}

export function generateTestVehicle(overrides: Partial<TestVehicle> = {}): TestVehicle {
  const make = faker.vehicle.manufacturer()
  const model = faker.vehicle.model()
  const year = faker.date.past({ years: 10 }).getFullYear()
  
  return {
    vin: faker.vehicle.vin(),
    year,
    make,
    model,
    trim: faker.vehicle.type(),
    engine: `${faker.number.float({ min: 1.0, max: 6.0, fractionDigits: 1 })}L ${faker.helpers.arrayElement(['4-Cylinder', 'V6', 'V8'])}`,
    mileage: faker.number.int({ min: 10000, max: 150000 }),
    exteriorColor: faker.vehicle.color(),
    interiorColor: faker.helpers.arrayElement(['Black', 'Gray', 'Beige', 'Brown']),
    transmission: faker.helpers.arrayElement(['Automatic', 'Manual', 'CVT']),
    fuelType: faker.vehicle.fuel(),
    bodyStyle: faker.helpers.arrayElement(['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback']),
    auctionHouse: faker.helpers.arrayElement(['Copart', 'IAAI', 'Manheim', 'Barrett-Jackson']),
    auctionLocation: `${faker.location.city()}, ${faker.location.stateAbbr()}`,
    saleDate: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
    lotNumber: faker.string.alphanumeric(8).toUpperCase(),
    primaryDamage: faker.helpers.arrayElement(['Front End', 'Rear End', 'Side', 'Hail', 'Water/Flood', 'Fire']),
    secondaryDamage: faker.helpers.arrayElement(['Minor Dents', 'Scratches', 'Glass Damage', null]),
    damageDescription: faker.lorem.sentence(),
    damageSeverity: faker.helpers.arrayElement(['minor', 'moderate', 'severe']),
    repairEstimate: faker.number.int({ min: 500, max: 15000 }),
    titleStatus: faker.helpers.arrayElement(['Clean', 'Salvage', 'Rebuilt', 'Lemon']),
    keysAvailable: faker.datatype.boolean(),
    runAndDrive: faker.datatype.boolean(),
    purchasePrice: faker.number.int({ min: 5000, max: 50000 }),
    purchaseCurrency: 'USD',
    estimatedTotalCost: faker.number.int({ min: 8000, max: 65000 }),
    currentLocation: `${faker.location.city()}, ${faker.location.stateAbbr()}`,
    isPublic: false,
    ...overrides
  }
}

export function generateTestCustomer(overrides: Partial<TestCustomer> = {}): TestCustomer {
  const customerType = faker.helpers.arrayElement(['individual', 'business'] as const)
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  
  return {
    fullName: customerType === 'individual' ? `${firstName} ${lastName}` : faker.company.name(),
    email: faker.internet.email({ firstName, lastName }),
    phone: faker.phone.number(),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zipCode: faker.location.zipCode(),
    country: 'United States',
    customerType,
    taxId: customerType === 'business' ? faker.string.numeric(9) : undefined,
    companyName: customerType === 'business' ? faker.company.name() : undefined,
    ...overrides
  }
}

export function generateTestInvoice(vehicleId: string, customerId: string, overrides: Partial<TestInvoice> = {}): TestInvoice {
  const salePrice = faker.number.int({ min: 15000, max: 75000 })
  
  return {
    vehicleId,
    customerId,
    salePrice,
    currency: 'USD',
    taxAmount: Math.round(salePrice * 0.08), // 8% tax
    discountAmount: faker.helpers.maybe(() => faker.number.int({ min: 500, max: 2000 }), { probability: 0.3 }),
    notes: faker.lorem.sentence(),
    paymentTerms: faker.helpers.arrayElement(['Net 30', 'Due on delivery', 'Cash only']),
    dueDate: faker.date.future({ days: 30 }).toISOString().split('T')[0],
    ...overrides
  }
}

export function generateTestPayment(invoiceId: string, overrides: Partial<TestPayment> = {}): TestPayment {
  return {
    invoiceId,
    amount: faker.number.int({ min: 5000, max: 75000 }),
    currency: 'USD',
    paymentMethod: faker.helpers.arrayElement(['cash', 'bank_transfer', 'check', 'credit_card', 'other']),
    paymentDate: faker.date.recent({ days: 7 }).toISOString().split('T')[0],
    transactionId: faker.string.alphanumeric(12).toUpperCase(),
    notes: faker.lorem.sentence(),
    ...overrides
  }
}

export function generateTestExpense(vehicleId: string, overrides: Partial<TestExpense> = {}): TestExpense {
  const category = faker.helpers.arrayElement(['shipping', 'customs', 'enhancement', 'storage', 'insurance', 'other'] as const)
  
  return {
    vehicleId,
    category,
    amount: faker.number.int({ min: 200, max: 5000 }),
    currency: 'USD',
    description: `${category.charAt(0).toUpperCase() + category.slice(1)} expense - ${faker.lorem.words(3)}`,
    expenseDate: faker.date.recent({ days: 14 }).toISOString().split('T')[0],
    receipt: faker.datatype.boolean(),
    ...overrides
  }
}

// Test data for complete vehicle lifecycle
export function generateVehicleLifecycleData() {
  const vehicle = generateTestVehicle()
  const customer = generateTestCustomer()
  
  return {
    vehicle,
    customer,
    expenses: [
      generateTestExpense(vehicle.vin, { category: 'shipping', amount: 1200 }),
      generateTestExpense(vehicle.vin, { category: 'customs', amount: 800 }),
      generateTestExpense(vehicle.vin, { category: 'enhancement', amount: 2500 }),
      generateTestExpense(vehicle.vin, { category: 'storage', amount: 300 })
    ],
    invoice: generateTestInvoice(vehicle.vin, customer.email),
    payments: [] as TestPayment[] // Will be generated after invoice creation
  }
}