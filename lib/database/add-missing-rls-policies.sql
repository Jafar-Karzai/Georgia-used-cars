-- Add missing RLS policies for vehicle_photos, vehicle_status_history, and expenses

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