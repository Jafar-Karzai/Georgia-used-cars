-- Storage bucket setup for Georgia Used Cars
-- Clean version - drops existing policies first

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Vehicle images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can delete vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view vehicle documents" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can upload vehicle documents" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can update vehicle documents" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can delete vehicle documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Finance managers can manage receipts" ON storage.objects;

-- Storage policies for vehicle-images bucket (public)
CREATE POLICY "Vehicle images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

CREATE POLICY "Authenticated users can upload vehicle images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authorized users can delete vehicle images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vehicle-images'
  AND auth.role() = 'authenticated'
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
);

CREATE POLICY "Authorized users can delete vehicle documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vehicle-documents'
  AND auth.role() = 'authenticated'
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
);

CREATE POLICY "Finance managers can manage receipts"
ON storage.objects FOR ALL
USING (
  bucket_id = 'receipts'
  AND auth.role() = 'authenticated'
);