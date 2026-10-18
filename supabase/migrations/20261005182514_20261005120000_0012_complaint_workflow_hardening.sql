/*
# Harden the persistent India Saathi complaint workflow

1. Purpose
- Preserve existing complaint data while adding location, city, priority, admin note, resolution, and timeline note fields.
- Make complaint creation and administrator updates server-authorized database operations.
- Keep citizens limited to their own complaints and administrators able to manage all complaints.

2. Modified tables and columns
- `complaints.location`, `city`, `priority`, `admin_note`, and `resolution`.
- `complaint_status_history.note` and `changed_by`.
- Existing department foreign keys, tracking IDs, timestamps, and triggers remain.

3. Statuses
- Support SUBMITTED, UNDER_REVIEW, ASSIGNED, IN_PROGRESS, RESOLVED, and REJECTED.
- Existing AI_VERIFIED rows are normalized to UNDER_REVIEW without deleting complaint data.

4. Security
- Complaint creation uses `create_complaint`, deriving the citizen from `auth.uid()`.
- Admin mutations use `admin_update_complaint`, checking the caller role server-side.
- Direct browser writes to protected complaint audit fields are revoked.
- Complaint photos use a private bucket with user-folder upload and owner/admin read policies.

5. Important notes
- No tables, columns, or user rows are dropped.
- The migration is idempotent and safe to re-apply.
*/

ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT 'Nagpur',
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS admin_note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS resolution text NOT NULL DEFAULT '';
ALTER TABLE public.complaint_status_history
  ADD COLUMN IF NOT EXISTS note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_status_check;
UPDATE public.complaints SET status = 'UNDER_REVIEW' WHERE status = 'AI_VERIFIED';
ALTER TABLE public.complaints ADD CONSTRAINT complaints_status_check
  CHECK (status IN ('SUBMITTED','UNDER_REVIEW','ASSIGNED','IN_PROGRESS','RESOLVED','REJECTED'));
UPDATE public.complaints SET location = address WHERE location = '' AND address <> '';
UPDATE public.complaints SET priority = priority_score WHERE priority IS DISTINCT FROM priority_score;
CREATE INDEX IF NOT EXISTS idx_complaints_city ON public.complaints(city);
CREATE INDEX IF NOT EXISTS idx_complaints_location ON public.complaints(location);
CREATE INDEX IF NOT EXISTS idx_complaints_priority_requested ON public.complaints(priority DESC);

CREATE OR REPLACE FUNCTION public.sync_complaint_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.location = '' AND NEW.address <> '' THEN NEW.location := NEW.address; END IF;
  IF NEW.address = '' AND NEW.location <> '' THEN NEW.address := NEW.location; END IF;
  NEW.priority := NEW.priority_score;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_complaint_sync_fields ON public.complaints;
CREATE TRIGGER trg_complaint_sync_fields BEFORE INSERT OR UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.sync_complaint_fields();

CREATE OR REPLACE FUNCTION public.handle_complaint_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.tracking_id IS NULL OR NEW.tracking_id = '' THEN NEW.tracking_id := public.generate_tracking_id(); END IF;
  INSERT INTO public.complaint_status_history (complaint_id, old_status, new_status, updated_by, changed_by, note)
  VALUES (NEW.id, NULL, NEW.status, NEW.user_id, NEW.user_id, 'Complaint submitted');
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.handle_complaint_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.complaint_status_history (complaint_id, old_status, new_status, updated_by, changed_by, note)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), auth.uid(), COALESCE(NEW.admin_note, ''));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_complaint(
  p_title text, p_description text, p_category text, p_severity text DEFAULT 'MEDIUM',
  p_priority_score integer DEFAULT 50, p_department_id uuid DEFAULT NULL,
  p_latitude double precision DEFAULT NULL, p_longitude double precision DEFAULT NULL,
  p_location text DEFAULT '', p_city text DEFAULT 'Nagpur', p_image_url text DEFAULT '',
  p_ai_confidence integer DEFAULT 0, p_ai_reason text DEFAULT ''
)
RETURNS public.complaints LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE created public.complaints;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF length(trim(COALESCE(p_title, ''))) < 5 THEN RAISE EXCEPTION 'Invalid complaint title'; END IF;
  IF length(trim(COALESCE(p_description, ''))) < 10 THEN RAISE EXCEPTION 'Invalid complaint description'; END IF;
  IF p_severity NOT IN ('CRITICAL','HIGH','MEDIUM','LOW') THEN RAISE EXCEPTION 'Invalid severity'; END IF;
  IF p_priority_score < 0 OR p_priority_score > 100 THEN RAISE EXCEPTION 'Invalid priority'; END IF;
  IF p_ai_confidence < 0 OR p_ai_confidence > 100 THEN RAISE EXCEPTION 'Invalid confidence'; END IF;
  IF p_latitude IS NOT NULL AND (p_latitude < -90 OR p_latitude > 90) THEN RAISE EXCEPTION 'Invalid latitude'; END IF;
  IF p_longitude IS NOT NULL AND (p_longitude < -180 OR p_longitude > 180) THEN RAISE EXCEPTION 'Invalid longitude'; END IF;
  INSERT INTO public.complaints (title, description, category, severity, priority_score, department_id, user_id, latitude, longitude, address, location, city, image_url, ai_confidence, ai_reason)
  VALUES (trim(p_title), trim(p_description), p_category, p_severity, p_priority_score, p_department_id, auth.uid(), p_latitude, p_longitude,
    COALESCE(NULLIF(trim(p_location), ''), p_city), COALESCE(NULLIF(trim(p_location), ''), p_city), COALESCE(NULLIF(trim(p_city), ''), 'Nagpur'), COALESCE(p_image_url, ''), p_ai_confidence, COALESCE(p_ai_reason, ''))
  RETURNING * INTO created;
  RETURN created;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_complaint(
  p_complaint_id uuid, p_status text, p_department_id uuid DEFAULT NULL,
  p_priority_score integer DEFAULT NULL, p_admin_note text DEFAULT NULL,
  p_resolution text DEFAULT NULL, p_timeline_note text DEFAULT ''
)
RETURNS public.complaints LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE updated public.complaints;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_status NOT IN ('SUBMITTED','UNDER_REVIEW','ASSIGNED','IN_PROGRESS','RESOLVED','REJECTED') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  IF p_priority_score IS NOT NULL AND (p_priority_score < 0 OR p_priority_score > 100) THEN RAISE EXCEPTION 'Invalid priority'; END IF;
  UPDATE public.complaints SET status = p_status, department_id = p_department_id,
    priority_score = COALESCE(p_priority_score, priority_score), admin_note = COALESCE(p_admin_note, admin_note),
    resolution = COALESCE(p_resolution, resolution), updated_at = now()
  WHERE id = p_complaint_id RETURNING * INTO updated;
  IF updated.id IS NULL THEN RAISE EXCEPTION 'Complaint not found'; END IF;
  IF p_timeline_note <> '' THEN
    UPDATE public.complaint_status_history SET note = p_timeline_note
    WHERE complaint_id = updated.id AND new_status = updated.status
      AND created_at = (SELECT max(created_at) FROM public.complaint_status_history WHERE complaint_id = updated.id AND new_status = updated.status);
  END IF;
  RETURN updated;
END;
$$;

REVOKE ALL ON FUNCTION public.create_complaint(text,text,text,text,integer,uuid,double precision,double precision,text,text,text,integer,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_complaint(text,text,text,text,integer,uuid,double precision,double precision,text,text,text,integer,text) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_update_complaint(uuid,text,uuid,integer,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_complaint(uuid,text,uuid,integer,text,text,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_tracking_id() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_complaint_insert() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_complaint_update() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_status_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_complaint_fields() FROM anon, authenticated;

REVOKE ALL ON public.complaints FROM anon, authenticated;
GRANT SELECT ON public.complaints TO authenticated;
REVOKE ALL ON public.complaint_status_history FROM anon, authenticated;
GRANT SELECT ON public.complaint_status_history TO authenticated;
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (name, phone) ON public.profiles TO authenticated;
DROP POLICY IF EXISTS "complaints_insert_own" ON public.complaints;
DROP POLICY IF EXISTS "complaints_update_own_or_admin" ON public.complaints;
DROP POLICY IF EXISTS "complaints_delete_own" ON public.complaints;
DROP POLICY IF EXISTS "history_insert_own_or_admin" ON public.complaint_status_history;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

DROP POLICY IF EXISTS "complaints_bucket_read" ON storage.objects;
DROP POLICY IF EXISTS "complaints_bucket_upload" ON storage.objects;
DROP POLICY IF EXISTS "complaints_bucket_update" ON storage.objects;
DROP POLICY IF EXISTS "complaints_bucket_delete" ON storage.objects;
UPDATE storage.buckets SET public = false, file_size_limit = 5242880, allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'] WHERE id = 'complaints';
CREATE POLICY "complaints_bucket_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'complaints' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));
CREATE POLICY "complaints_bucket_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'complaints' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "complaints_bucket_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'complaints' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'complaints' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "complaints_bucket_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'complaints' AND (storage.foldername(name))[1] = auth.uid()::text);
