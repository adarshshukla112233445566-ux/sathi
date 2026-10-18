/*
# Remove public execution from internal complaint trigger functions

1. Purpose
- Close the remaining database-linter findings caused by PostgreSQL's default PUBLIC EXECUTE privilege on SECURITY DEFINER functions.

2. Security changes
- Anonymous and signed-in browser roles can no longer call internal tracking, trigger, notification, sync, signup, or after-trigger functions through the Data API.
- `is_admin()` remains callable only by signed-in users because existing row-level security policies use it to evaluate administrator access.
- The authorized complaint creation and administrator update functions retain their authenticated-only grants.

3. Important notes
- No tables, columns, rows, policies, or application data are changed.
- Trigger behavior remains available to PostgreSQL internally.
*/

REVOKE EXECUTE ON FUNCTION public.generate_tracking_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_complaint_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_complaint_insert_after() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_complaint_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_complaint_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
