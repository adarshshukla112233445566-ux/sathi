/*
# Fix complaint insert trigger

The BEFORE INSERT trigger tried to write complaint_status_history before the
complaint row existed, causing an FK violation. Move tracking-id generation to
BEFORE INSERT (NEW only) and status-history creation to AFTER INSERT (row now
exists). Also fix updated_by to use auth.uid() instead of NEW.user_id so admin
updates are attributed correctly.
*/

DROP TRIGGER IF EXISTS trg_complaint_insert ON public.complaints;

CREATE OR REPLACE FUNCTION public.handle_complaint_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tracking_id IS NULL OR NEW.tracking_id = '' THEN
    NEW.tracking_id := public.generate_tracking_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_complaint_insert
  BEFORE INSERT ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.handle_complaint_insert();

DROP TRIGGER IF EXISTS trg_complaint_insert_after ON public.complaints;

CREATE OR REPLACE FUNCTION public.handle_complaint_insert_after()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.complaint_status_history (complaint_id, old_status, new_status, updated_by)
  VALUES (NEW.id, NULL, NEW.status, auth.uid());
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_complaint_insert_after
  AFTER INSERT ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.handle_complaint_insert_after();
