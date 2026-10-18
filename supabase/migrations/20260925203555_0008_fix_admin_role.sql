/*
# Fix admin demo account role

1. Changes
   - Set role to ADMIN for admin@indiasaathi.ai profile
   - The old admin@nagpursaathi.ai was already updated to admin@indiasaathi.ai by previous migration

2. Notes
   - This ensures the admin demo login button works correctly
*/

UPDATE public.profiles SET role = 'ADMIN' WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@indiasaathi.ai'
);
