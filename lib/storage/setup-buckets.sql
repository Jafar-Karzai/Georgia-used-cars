-- Storage bucket setup for Georgia Used Cars
-- Run this in Supabase SQL Editor after creating storage buckets in the dashboard

-- Create storage buckets (run this in Storage section of Supabase dashboard first):
-- 1. Go to Storage in Supabase dashboard
-- 2. Create bucket named "vehicle-images" (public: true)
-- 3. Create bucket named "vehicle-documents" (public: false)
-- 4. Create bucket named "receipts" (public: false)

-- Storage policies for vehicle-images bucket (public)
CREATE POLICY "Vehicle images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

CREATE POLICY "Authenticated users can upload vehicle images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'vehicles'
);

CREATE POLICY "Users can update their own vehicle images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vehicle-images'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Authorized users can delete vehicle images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vehicle-images'
  AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'inventory_manager')
    )
  )
);

-- Storage policies for vehicle-documents bucket (private)
CREATE POLICY "Authenticated users can view vehicle documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vehicle-documents'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authorized users can upload vehicle documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'vehicles'
);

CREATE POLICY "Authorized users can update vehicle documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vehicle-documents'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authorized users can delete vehicle documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vehicle-documents'
  AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'inventory_manager', 'finance_manager')
    )
  )
);

-- Storage policies for receipts bucket (private)
CREATE POLICY "Authenticated users can view receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authorized users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'expenses'
);

CREATE POLICY "Finance managers can manage receipts"
ON storage.objects FOR ALL
USING (
  bucket_id = 'receipts'
  AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'finance_manager')
    )
  )
);