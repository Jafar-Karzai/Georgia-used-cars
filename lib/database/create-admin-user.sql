-- Update the first user to be super_admin
-- Replace 'admin@georgiaused.com' with the actual email you used

UPDATE profiles 
SET 
  role = 'super_admin',
  full_name = 'System Administrator',
  is_active = true
WHERE email = 'admin@georgiaused.com';

-- If the profile doesn't exist, you can insert it manually
-- First, get your user ID from the auth.users table
-- SELECT id, email FROM auth.users;

-- Then insert the profile (replace 'your-user-id-here' with actual ID)
-- INSERT INTO profiles (id, email, full_name, role, is_active)
-- VALUES ('your-user-id-here', 'admin@georgiaused.com', 'System Administrator', 'super_admin', true)
-- ON CONFLICT (id) DO UPDATE SET
--   role = 'super_admin',
--   full_name = 'System Administrator',
--   is_active = true;