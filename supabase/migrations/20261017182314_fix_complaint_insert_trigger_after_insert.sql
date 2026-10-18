-- Fix: handle_complaint_insert was a BEFORE INSERT trigger, which caused
-- the FK constraint on complaint_status_history.complaint_id -> complaints.id
-- to fail because the complaint row didn't exist yet when the trigger tried
-- to insert the initial status history row.
-- Changing it to AFTER INSERT ensures the complaint row exists first.

DROP TRIGGER IF EXISTS trg_complaint_insert ON public.complaints;

CREATE TRIGGER trg_complaint_insert
AFTER INSERT ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.handle_complaint_insert();
