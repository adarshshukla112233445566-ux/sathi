/*
# Harden exposed database functions

1. Changes
- Keep the existing complaint and tracking behavior available to database triggers.
- Remove direct API execution for internal SECURITY DEFINER functions from anonymous and signed-in browser roles.
- Keep `is_admin()` available to authenticated policy checks because existing row-level security policies use it.

2. Modified objects
- `public.generate_tracking_id()` remains trigger-usable but is no longer directly callable through the public API.
- `public.handle_complaint_insert()` remains trigger-usable but is no longer directly callable through the public API.

3. Security
- Revoke EXECUTE from `anon` and `authenticated` for the two internal functions.
- No tables, columns, rows, or user data are deleted or changed.

4. Notes
- Database triggers execute these functions with the table owner privileges, so complaint creation keeps its existing behavior.
*/

REVOKE EXECUTE ON FUNCTION public.generate_tracking_id() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_complaint_insert() FROM anon, authenticated;
