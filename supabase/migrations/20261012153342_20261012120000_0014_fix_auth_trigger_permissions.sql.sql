/*
# Fix Auth Login "Database error querying schema"

## Problem
The previous migration (0013_revoke_public_trigger_function_execute.sql) revoked
EXECUTE on ALL SECURITY DEFINER functions from every role except postgres and
service_role. This included `handle_new_user()` — the trigger function that fires
AFTER INSERT on `auth.users` when a new user signs up.

The Supabase auth service (GoTrue) runs as `supabase_auth_admin`, which is neither
`postgres` nor `service_role`. When the auth service tried to execute the trigger
during login/signup, it got a permission denied error, which surfaced to the
frontend as "Database error querying schema" (HTTP 500 from the auth endpoint).

Additionally, the `profiles` table was missing an UPDATE policy, which can cause
issues when the auth service or user needs to update profile data.

## Changes

### 1. Restore EXECUTE on handle_new_user for auth service
- Grant EXECUTE on `handle_new_user()` to `supabase_auth_admin` so the auth
  service can fire the trigger during signup.
- Also grant to `authenticated` and `anon` as the trigger fires in the context
  of the requesting role. The function is SECURITY DEFINER (runs as postgres),
  so granting EXECUTE only allows calling it — the function's internal logic
  is still safe.
- Keep EXECUTE revoked from PUBLIC to prevent direct RPC calls.

### 2. Add UPDATE policy on profiles
- Add `profiles_update_own` policy so authenticated users can update their own
  profile (name, phone). Column-level grants already restrict which columns
  are writable.
- Admins can also update any profile via the `is_admin()` check.

### 3. Verify handle_new_user function definition
- Recreate the function to ensure it's intact and has the correct SECURITY
  DEFINER + search_path settings.

## Security Notes
- `handle_new_user()` is SECURITY DEFINER, owned by postgres. Granting EXECUTE
  only allows the function to be called — it does not grant direct table access.
- The function does an INSERT into profiles with ON CONFLICT DO NOTHING, which
  is safe.
- `is_admin()` remains executable by authenticated only (needed by RLS policies).
- All other internal trigger functions remain restricted to postgres/service_role.
*/

-- 1. Recreate handle_new_user to ensure it's correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Grant EXECUTE to the roles that need it for the auth trigger
-- supabase_auth_admin is the role GoTrue uses when creating users
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- 3. Add UPDATE policy on profiles (was missing)
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id OR is_admin())
WITH CHECK (auth.uid() = id OR is_admin());
