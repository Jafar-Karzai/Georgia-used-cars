export type UserRole = 'super_admin' | 'manager' | 'inventory_manager' | 'finance_manager' | 'sales_agent' | 'viewer'

export type VehicleStatus = 
  | 'auction_won'
  | 'payment_processing'
  | 'pickup_scheduled'
  | 'in_transit_to_port'
  | 'at_port'
  | 'shipped'
  | 'in_transit'
  | 'at_uae_port'
  | 'customs_clearance'
  | 'released_from_customs'
  | 'in_transit_to_yard'
  | 'at_yard'
  | 'under_enhancement'
  | 'ready_for_sale'
  | 'reserved'
  | 'sold'
  | 'delivered'

export type DamageSeverity = 'minor' | 'moderate' | 'major' | 'total_loss'
export type ExpenseCategory = 'acquisition' | 'transportation' | 'import' | 'enhancement' | 'marketing' | 'operational'
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partially_paid' | 'fully_paid' | 'overdue' | 'cancelled'
export type InquirySource = 'website' | 'phone' | 'walk_in' | 'social_media' | 'referral' | 'email'
export type CurrencyCode = 'USD' | 'CAD' | 'AED'
export type SaleType = 'local_only' | 'export_only' | 'local_and_export'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
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

  // Auction information
  auction_house: string
  auction_location?: string
  sale_date?: string
  lot_number?: string

  // Damage assessment
  primary_damage?: string
  secondary_damage?: string
  damage_description?: string
  damage_severity?: DamageSeverity
  repair_estimate?: number

  // Status tracking
  current_status: VehicleStatus
  current_location?: string
  gps_coordinates?: { x: number; y: number }

  // Documentation
  title_status?: string
  keys_available: boolean
  run_and_drive: boolean

  // Financial
  purchase_price: number
  purchase_currency: CurrencyCode
  estimated_total_cost?: number
  sale_price?: number
  sale_currency?: CurrencyCode
  sale_price_includes_vat?: boolean
  sale_type?: SaleType
  drivetrain?: string

  // Visibility
  is_public?: boolean

  // Metadata
  created_by?: string
  created_at: string
  updated_at: string

  // Related data (enriched when fetching vehicle details)
  vehicle_photos?: VehiclePhoto[]
  documents?: Record<string, unknown>[]
  vehicle_status_history?: VehicleStatusHistory[]
  expenses?: Expense[]
}

export interface VehicleStatusHistory {
  id: string
  vehicle_id: string
  status: VehicleStatus
  location?: string
  notes?: string
  changed_by?: string
  changed_at: string
}

export interface VehiclePhoto {
  id: string
  vehicle_id: string
  url: string
  caption?: string
  is_primary: boolean
  sort_order: number
  uploaded_by?: string
  uploaded_at: string
}

/**
 * Consistent photo interface used across components
 * Always use snake_case to match database schema
 */
export interface Photo {
  id: string
  url: string
  is_primary: boolean
  sort_order?: number
}

export interface Expense {
  id: string
  vehicle_id?: string
  category: ExpenseCategory
  subcategory?: string
  description: string
  amount: number
  currency: CurrencyCode
  date: string
  vendor?: string
  receipt_url?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  email?: string
  full_name: string
  phone?: string
  address?: string
  city?: string
  country: string
  date_of_birth?: string
  preferred_language: string
  marketing_consent: boolean
  created_at: string
  updated_at: string
}

export interface Inquiry {
  id: string
  customer_id?: string
  source: InquirySource
  subject?: string
  message: string
  vehicle_id?: string
  budget_min?: number
  budget_max?: number
  assigned_to?: string
  status: string
  priority: string
  created_at: string
  updated_at: string
}

export interface Communication {
  id: string
  inquiry_id?: string
  customer_id?: string
  type: string
  direction: string
  subject?: string
  content: string
  handled_by?: string
  scheduled_at?: string
  completed_at?: string
  created_at: string
}

export interface Payment {
  id: string
  invoice_id: string
  amount: number
  currency: CurrencyCode
  payment_method: string
  payment_date: string
  reference_number?: string
  transaction_id?: string
  notes?: string
  recorded_by?: string
  created_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  vehicle_id?: string
  subtotal: number
  vat_rate: number
  vat_amount: number
  total_amount: number
  currency: CurrencyCode
  status: InvoiceStatus
  due_date?: string
  terms?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      vehicles: {
        Row: Vehicle
        Insert: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>>
      }
      vehicle_status_history: {
        Row: VehicleStatusHistory
        Insert: Omit<VehicleStatusHistory, 'id' | 'changed_at'>
        Update: Partial<Omit<VehicleStatusHistory, 'id' | 'changed_at'>>
      }
      vehicle_photos: {
        Row: VehiclePhoto
        Insert: Omit<VehiclePhoto, 'id' | 'uploaded_at'>
        Update: Partial<Omit<VehiclePhoto, 'id' | 'uploaded_at'>>
      }
      expenses: {
        Row: Expense
        Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>
      }
      customers: {
        Row: Customer
        Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>
      }
      inquiries: {
        Row: Inquiry
        Insert: Omit<Inquiry, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Inquiry, 'id' | 'created_at' | 'updated_at'>>
      }
      communications: {
        Row: Communication
        Insert: Omit<Communication, 'id' | 'created_at'>
        Update: Partial<Omit<Communication, 'id' | 'created_at'>>
      }
      invoices: {
        Row: Invoice
        Insert: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at'>>
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, 'id' | 'created_at'>
        Update: Partial<Omit<Payment, 'id' | 'created_at'>>
      }
    }
  }
}