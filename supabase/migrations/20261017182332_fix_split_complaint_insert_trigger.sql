-- Fix: Split handle_complaint_insert into two responsibilities:
-- 1. BEFORE INSERT: set tracking_id (must happen before row is saved, since
--    tracking_id is NOT NULL with no default)
-- 2. AFTER INSERT: create the initial status_history row (must happen after
--    row is saved, so the FK constraint on complaint_status_history.complaint_id
--    -> complaints.id can be satisfied)

-- The handle_complaint_insert function currently does BOTH things in one
-- function. We need to split it.

CREATE OR REPLACE FUNCTION public.set_complaint_tracking_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.tracking_id IS NULL OR NEW.tracking_id = '' THEN
    NEW.tracking_id := public.generate_tracking_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_initial_status_history()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.complaint_status_history (complaint_id, old_status, new_status, updated_by, changed_by, note)
  VALUES (NEW.id, NULL, NEW.status, NEW.user_id, NEW.user_id, 'Complaint submitted');
  RETURN NEW;
END;
$$;

-- Drop the old trigger and the old combined function
DROP TRIGGER IF EXISTS trg_complaint_insert ON public.complaints;

-- BEFORE INSERT: set tracking_id
CREATE TRIGGER trg_complaint_set_tracking
BEFORE INSERT ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.set_complaint_tracking_id();

-- AFTER INSERT: create status history row
CREATE TRIGGER trg_complaint_insert
AFTER INSERT ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.create_initial_status_history();

-- Clean up: revoke execute on the new trigger functions (only called via triggers)
REVOKE EXECUTE ON FUNCTION public.set_complaint_tracking_id() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_initial_status_history() FROM anon, authenticated;

-- Drop the old combined function since it's no longer used
DROP FUNCTION IF EXISTS public.handle_complaint_insert() CASCADE;
