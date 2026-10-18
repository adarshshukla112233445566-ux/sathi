-- Fix the trg_complaint_insert trigger which is stuck as BEFORE INSERT STATEMENT.
-- Drop it completely and recreate with a different name to avoid any caching issues.

DROP TRIGGER IF EXISTS trg_complaint_insert ON public.complaints;
DROP TRIGGER IF EXISTS trg_complaint_status_init ON public.complaints;

CREATE TRIGGER trg_complaint_status_init
AFTER INSERT ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.create_initial_status_history();
