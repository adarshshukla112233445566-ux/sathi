-- Fix: trg_complaint_insert is currently BEFORE INSERT calling create_initial_status_history(),
-- which causes a FK violation because the complaint row doesn't exist yet.
-- It must be AFTER INSERT. Drop and recreate it correctly.

DROP TRIGGER IF EXISTS trg_complaint_insert ON public.complaints;

CREATE TRIGGER trg_complaint_insert
AFTER INSERT ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.create_initial_status_history();

-- Verify: ensure there is no leftover handle_complaint_insert function
DROP FUNCTION IF EXISTS public.handle_complaint_insert() CASCADE;
