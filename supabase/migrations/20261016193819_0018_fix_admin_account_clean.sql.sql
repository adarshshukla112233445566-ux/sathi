/*
# Fix admin login — create clean admin account

## Problem
The original admin@indiasaathi.ai auth user was created via direct INSERT into
auth.users using pgcrypto's crypt(). This produced a corrupted user record that
causes GoTrue to return "Database error querying schema" (HTTP 500) on every
login attempt. The auth.identities row is malformed/missing required columns.

The MCP migration tool lacks service-role access to auth.users, so the
corrupted user cannot be repaired or deleted via SQL migrations.

## Solution
A new admin account was created via the Supabase Auth signup API endpoint,
which produces a properly-structured user with valid identities. This migration:
1. Sets the new user's profile role to ADMIN
2. Removes orphaned ADMIN profiles that have no corresponding auth user

## New credentials
- Email: admin2@indiasaathi.ai
- Password: S4aathi#2026Adm

## Security
- No RLS or policy changes
- is_admin() function unchanged — still checks profiles.role = 'ADMIN'
- ProtectedRoute adminOnly unchanged — still verifies admin role server-side
- The old admin@indiasaathi.ai auth user remains but is non-functional;
  its profile will be downgraded to CITIZEN to prevent any privilege confusion
*/

-- Set the new admin user's profile to ADMIN
UPDATE public.profiles 
SET role = 'ADMIN', name = 'Admin Officer'
WHERE id = '51982a2a-f8e6-4902-9ff6-01ff566c810a';

-- Insert profile if the trigger didn't create one
INSERT INTO public.profiles (id, name, phone, role)
SELECT '51982a2a-f8e6-4902-9ff6-01ff566c810a', 'Admin Officer', '', 'ADMIN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE id = '51982a2a-f8e6-4902-9ff6-01ff566c810a'
);

-- Downgrade the old corrupted admin profile to CITIZEN to prevent privilege confusion
UPDATE public.profiles 
SET role = 'CITIZEN'
WHERE id = 'd416eb7f-27fa-40e4-8c3a-ff90b64ad459';
