/*
# Fix missing auth.identities for demo users

1. Problem
   - Demo users have no entries in auth.identities, causing "Database error querying schema" on login.
   - The email column in auth.identities is generated, so we must not insert it directly.

2. Changes
   - Insert identity rows for admin@indiasaathi.ai, demo@indiasaathi.ai, priya@indiasaathi.ai
   - Omit the generated email column

3. Notes
   - Idempotent via WHERE NOT EXISTS
*/

-- Fix admin@indiasaathi.ai identity
INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
SELECT
  u.id,
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'name', 'Admin Officer',
    'email', 'admin@indiasaathi.ai',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(), now(), now(),
  gen_random_uuid()
FROM auth.users u
WHERE u.email = 'admin@indiasaathi.ai'
AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id);

-- Fix demo@indiasaathi.ai identity
INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
SELECT
  u.id,
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'name', 'Demo Citizen',
    'email', 'demo@indiasaathi.ai',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(), now(), now(),
  gen_random_uuid()
FROM auth.users u
WHERE u.email = 'demo@indiasaathi.ai'
AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id);

-- Fix priya@indiasaathi.ai identity
INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
SELECT
  u.id,
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'name', 'Priya Sharma',
    'email', 'priya@indiasaathi.ai',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(), now(), now(),
  gen_random_uuid()
FROM auth.users u
WHERE u.email = 'priya@indiasaathi.ai'
AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id);
