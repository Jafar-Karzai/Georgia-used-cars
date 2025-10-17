-- Add is_public column to vehicles table
ALTER TABLE vehicles 
ADD COLUMN is_public BOOLEAN DEFAULT false;

-- Add index for better performance when filtering public vehicles
CREATE INDEX idx_vehicles_is_public ON vehicles(is_public);

-- Update RLS policy to handle public vehicles
CREATE POLICY "Public vehicles are viewable by everyone" ON vehicles 
FOR SELECT USING (is_public = true);