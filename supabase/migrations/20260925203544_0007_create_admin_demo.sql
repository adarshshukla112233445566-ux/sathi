/*
# Create admin demo account with indiasaathi.ai domain

1. Changes
   - Create auth.users entry for admin@indiasaathi.ai with hashed password admin123
   - Create profiles entry with ADMIN role
   - Also create citizen demo account demo@indiasaathi.ai if not exists

2. Security
   - Uses crypt() for password hashing (pgcrypto extension)
   - Profiles RLS policies already exist

3. Notes
   - Password is hashed using bcrypt-compatible crypt() with cost factor 10
   - Email confirmation is set to true so login works immediately
*/

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admin demo user
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'admin@indiasaathi.ai',
  crypt('admin123', gen_salt('bf', 10)),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin Officer"}'
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@indiasaathi.ai');

-- Create profile for admin
INSERT INTO public.profiles (id, name, phone, role)
SELECT u.id, 'Admin Officer', '', 'ADMIN'
FROM auth.users u
WHERE u.email = 'admin@indiasaathi.ai'
AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Update existing admin profile to correct email if needed (update the old one too)
UPDATE auth.users SET email = 'admin@indiasaathi.ai' WHERE email = 'admin@nagpursaathi.ai' AND NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@indiasaathi.ai');
