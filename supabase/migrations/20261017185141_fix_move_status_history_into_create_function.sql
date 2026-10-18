-- Fix: The AFTER INSERT trigger approach isn't working — triggers on this table
-- keep getting created as BEFORE INSERT STATEMENT regardless of the DDL.
-- Instead, move the status history creation INTO the create_complaint function
-- itself, after the INSERT succeeds. Remove the trigger entirely.

DROP TRIGGER IF EXISTS trg_complaint_status_init ON public.complaints;
DROP TRIGGER IF EXISTS trg_complaint_insert ON public.complaints;

-- Keep the BEFORE INSERT trigger for tracking_id generation (that one works)
-- but handle status history inside the function.

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

  -- Insert initial status history row now that the complaint exists
  INSERT INTO public.complaint_status_history (complaint_id, old_status, new_status, updated_by, changed_by, note)
  VALUES (created.id, NULL, created.status, created.user_id, created.user_id, 'Complaint submitted');

  RETURN created;
END;
$$;

-- Re-grant since CREATE OR REPLACE may reset privileges
REVOKE ALL ON FUNCTION public.create_complaint(text,text,text,text,integer,uuid,double precision,double precision,text,text,text,integer,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_complaint(text,text,text,text,integer,uuid,double precision,double precision,text,text,text,integer,text) TO authenticated;
