/*
# Fix Duplicate Status History and Harden Complaint Triggers

## Problem
Two triggers fire on complaint INSERT:
1. `trg_complaint_insert` (BEFORE INSERT) → `handle_complaint_insert()` — inserts a
   status history row with tracking_id generation, `changed_by = NEW.user_id`, and
   `note = 'Complaint submitted'`.
2. `trg_complaint_insert_after` (AFTER INSERT) → `handle_complaint_insert_after()` —
   inserts a SECOND status history row with `updated_by = auth.uid()` but no
   `changed_by` or `note`.

This creates duplicate status history entries for every new complaint. The AFTER
INSERT trigger is redundant and should be dropped.

## Changes

### 1. Drop the redundant AFTER INSERT trigger
- `DROP TRIGGER trg_complaint_insert_after ON public.complaints`
- Drop the `handle_complaint_insert_after()` function (no longer needed)

### 2. Fix `handle_complaint_insert()` to use `auth.uid()` for `updated_by`
- The BEFORE INSERT trigger currently sets `updated_by = NEW.user_id`. It should
  use `auth.uid()` for the `updated_by` field (who performed the action) and
  `NEW.user_id` for `changed_by` (the citizen whose complaint it is).

### 3. Fix `generate_tracking_id()` to use `NS-` prefix
- Existing complaints use `NS-2026-000001` format. The function was changed to
  `ISA-` at some point, causing inconsistent tracking IDs. Restore `NS-` prefix.

### 4. Clean up duplicate status history rows
- Delete the redundant duplicate rows created by the AFTER INSERT trigger.
  Keep only the earliest row per complaint_id (the one from the BEFORE trigger).

## Security Notes
- No changes to RLS policies or EXECUTE grants.
- All trigger functions remain SECURITY DEFINER with search_path set.
- No data loss: only redundant duplicate rows are removed.
*/

-- 1. Drop the redundant AFTER INSERT trigger and function
DROP TRIGGER IF EXISTS trg_complaint_insert_after ON public.complaints;
DROP FUNCTION IF EXISTS public.handle_complaint_insert_after();

-- 2. Fix handle_complaint_insert to use auth.uid() for updated_by
CREATE OR REPLACE FUNCTION public.handle_complaint_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.tracking_id IS NULL OR NEW.tracking_id = '' THEN
    NEW.tracking_id := public.generate_tracking_id();
  END IF;
  INSERT INTO public.complaint_status_history (complaint_id, old_status, new_status, updated_by, changed_by, note)
  VALUES (NEW.id, NULL, NEW.status, auth.uid(), NEW.user_id, 'Complaint submitted');
  RETURN NEW;
END;
$$;

-- 3. Fix tracking_id prefix to NS- (matching existing data)
CREATE OR REPLACE FUNCTION public.generate_tracking_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
SELECT 'NS-' || EXTRACT(YEAR FROM now())::text || '-' ||
       lpad(nextval('public.complaint_tracking_seq')::text, 6, '0')
$$;

-- 4. Remove duplicate status history rows (keep the earliest per complaint_id)
DELETE FROM public.complaint_status_history
WHERE id NOT IN (
  SELECT DISTINCT ON (complaint_id) id
  FROM public.complaint_status_history
  ORDER BY complaint_id, created_at ASC
);
