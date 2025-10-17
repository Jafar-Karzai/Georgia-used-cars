-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
CREATE TYPE user_role AS ENUM ('super_admin', 'manager', 'inventory_manager', 'finance_manager', 'sales_agent', 'viewer');
CREATE TYPE vehicle_status AS ENUM (
  'auction_won',
  'payment_processing', 
  'pickup_scheduled',
  'in_transit_to_port',
  'at_port',
  'shipped',
  'in_transit',
  'at_uae_port',
  'customs_clearance',
  'released_from_customs',
  'in_transit_to_yard',
  'at_yard',
  'under_enhancement',
  'ready_for_sale',
  'reserved',
  'sold',
  'delivered'
);
CREATE TYPE damage_severity AS ENUM ('minor', 'moderate', 'major', 'total_loss');
CREATE TYPE expense_category AS ENUM ('acquisition', 'transportation', 'import', 'enhancement', 'marketing', 'operational');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'viewed', 'partially_paid', 'fully_paid', 'overdue', 'cancelled');
CREATE TYPE inquiry_source AS ENUM ('website', 'phone', 'walk_in', 'social_media', 'referral', 'email');
CREATE TYPE currency_code AS ENUM ('USD', 'CAD', 'AED');

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vin VARCHAR(17) UNIQUE NOT NULL,
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT,
  engine TEXT,
  mileage INTEGER,
  exterior_color TEXT,
  interior_color TEXT,
  transmission TEXT,
  fuel_type TEXT,
  body_style TEXT,
  
  -- Auction information
  auction_house TEXT NOT NULL,
  auction_location TEXT,
  sale_date DATE,
  lot_number TEXT,
  
  -- Damage assessment
  primary_damage TEXT,
  secondary_damage TEXT,
  damage_description TEXT,
  damage_severity damage_severity,
  repair_estimate DECIMAL(10,2),
  
  -- Status tracking
  current_status vehicle_status NOT NULL DEFAULT 'auction_won',
  current_location TEXT,
  gps_coordinates POINT,
  
  -- Documentation
  title_status TEXT,
  keys_available BOOLEAN DEFAULT false,
  run_and_drive BOOLEAN DEFAULT false,
  
  -- Financial
  purchase_price DECIMAL(10,2) NOT NULL,
  purchase_currency currency_code NOT NULL DEFAULT 'USD',
  estimated_total_cost DECIMAL(10,2),
  sale_price DECIMAL(10,2),
  sale_currency currency_code DEFAULT 'AED',
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vehicle status history
CREATE TABLE vehicle_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  status vehicle_status NOT NULL,
  location TEXT,
  notes TEXT,
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vehicle photos
CREATE TABLE vehicle_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vehicle documents
CREATE TABLE vehicle_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  category expense_category NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency currency_code NOT NULL DEFAULT 'AED',
  date DATE NOT NULL,
  vendor TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'UAE',
  date_of_birth DATE,
  preferred_language TEXT DEFAULT 'en',
  marketing_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer inquiries
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  source inquiry_source NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id),
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  assigned_to UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Communication log
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  type TEXT NOT NULL, -- email, phone, meeting, whatsapp
  direction TEXT NOT NULL, -- inbound, outbound
  subject TEXT,
  content TEXT,
  handled_by UUID REFERENCES profiles(id),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  subtotal DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,4) NOT NULL DEFAULT 0.05, -- 5% UAE VAT
  vat_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency currency_code NOT NULL DEFAULT 'AED',
  status invoice_status NOT NULL DEFAULT 'draft',
  due_date DATE,
  terms TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  amount DECIMAL(10,2) NOT NULL,
  currency currency_code NOT NULL DEFAULT 'AED',
  payment_method TEXT NOT NULL,
  payment_date DATE NOT NULL,
  reference_number TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Currency exchange rates
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_currency currency_code NOT NULL,
  to_currency currency_code NOT NULL,
  rate DECIMAL(10,6) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_currency, to_currency, date)
);

-- System settings
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_status ON vehicles(current_status);
CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX idx_vehicles_created_at ON vehicles(created_at);
CREATE INDEX idx_vehicle_status_history_vehicle_id ON vehicle_status_history(vehicle_id);
CREATE INDEX idx_vehicle_status_history_status ON vehicle_status_history(status);
CREATE INDEX idx_expenses_vehicle_id ON expenses(vehicle_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_inquiries_customer_id ON inquiries(customer_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_assigned_to ON inquiries(assigned_to);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT := EXTRACT(year FROM NOW())::TEXT;
    sequence_num INTEGER;
    invoice_num TEXT;
BEGIN
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 6) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM invoices
    WHERE invoice_number LIKE year_part || '-%';
    
    invoice_num := year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (to be refined based on role requirements)
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Super admins can view all profiles" ON profiles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Vehicles policies
CREATE POLICY "All authenticated users can view vehicles" ON vehicles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Inventory managers can modify vehicles" ON vehicles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('super_admin', 'manager', 'inventory_manager')
  )
);

-- Vehicle photos policies
CREATE POLICY "All authenticated users can view vehicle photos" ON vehicle_photos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Inventory managers can manage vehicle photos" ON vehicle_photos FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('super_admin', 'manager', 'inventory_manager')
  )
);

-- Vehicle status history policies
CREATE POLICY "All authenticated users can view vehicle status history" ON vehicle_status_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Inventory managers can manage vehicle status history" ON vehicle_status_history FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('super_admin', 'manager', 'inventory_manager')
  )
);

-- Expenses policies
CREATE POLICY "All authenticated users can view expenses" ON expenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Finance managers can manage expenses" ON expenses FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('super_admin', 'manager', 'finance_manager', 'inventory_manager')
  )
);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('company_name', '"Georgia Used Cars"', 'Company name for invoices and branding'),
('company_address', '"Sharjah, UAE"', 'Company address'),
('vat_number', '""', 'UAE VAT registration number'),
('default_vat_rate', '0.05', 'Default VAT rate (5% for UAE)'),
('default_currency', '"AED"', 'Default currency for the system'),
('auto_invoice_numbering', 'true', 'Enable automatic invoice numbering');

-- Sample data (for development/testing)
INSERT INTO profiles (id, email, full_name, role) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@georgiaused.com', 'System Administrator', 'super_admin');

-- Create a function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'viewer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();