/*
# Nagpur Saathi AI - Initial Schema

1. Purpose
   Smart-city civic complaint platform. Citizens report problems (potholes,
   garbage, streetlights, etc.), an AI service analyzes category/severity/
   priority and routes to the correct municipal department, and admins manage
   the complaint lifecycle. Includes supporting modules: emergency services,
   hospitals, tourist locations, transport routes, and traffic incidents.

2. Tables
   - profiles          : extends auth.users with name, phone, role (CITIZEN/ADMIN)
   - departments       : municipal departments complaints route to
   - complaints        : civic complaints with AI analysis + tracking id
   - complaint_status_history : per-status audit trail per complaint
   - notifications     : user-facing notifications
   - emergency_services: police/ambulance/fire contacts
   - hospitals         : demo hospital directory
   - tourist_locations : demo Nagpur points of interest
   - transport_routes  : demo bus/metro routes
   - traffic_incidents : demo traffic alerts

3. Roles / RLS
   This app has a sign-in screen. Policies are scoped TO authenticated with
   ownership checks via auth.uid(). Admins (role = 'ADMIN' in profiles) get
   broader access to complaints/notifications for management. A helper
   function is_admin() checks the caller's profile role.

4. Tracking IDs
   Complaints get human-readable tracking IDs like NS-2026-000001 generated
   by a Postgres sequence + formatting in a trigger.
*/

-- ---------- profiles (table only, policies added after is_admin) ----------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'CITIZEN'
    CHECK (role IN ('CITIZEN','ADMIN')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ---------- helper: is current user an admin? ----------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

-- now profiles policies (is_admin exists)
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- ---------- departments ----------
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "departments_read_all" ON public.departments;
CREATE POLICY "departments_read_all" ON public.departments
  FOR SELECT TO anon, authenticated USING (true);

-- ---------- complaints ----------
CREATE TABLE IF NOT EXISTS public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'MEDIUM'
    CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  priority_score integer NOT NULL DEFAULT 50
    CHECK (priority_score >= 0 AND priority_score <= 100),
  status text NOT NULL DEFAULT 'SUBMITTED'
    CHECK (status IN ('SUBMITTED','AI_VERIFIED','ASSIGNED','IN_PROGRESS','RESOLVED')),
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude double precision,
  longitude double precision,
  address text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  ai_confidence integer NOT NULL DEFAULT 0
    CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
  ai_reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_complaints_user ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON public.complaints(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON public.complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_dept ON public.complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON public.complaints(created_at DESC);

DROP POLICY IF EXISTS "complaints_select_own_or_admin" ON public.complaints;
CREATE POLICY "complaints_select_own_or_admin" ON public.complaints
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "complaints_insert_own" ON public.complaints;
CREATE POLICY "complaints_insert_own" ON public.complaints
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "complaints_update_own_or_admin" ON public.complaints;
CREATE POLICY "complaints_update_own_or_admin" ON public.complaints
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "complaints_delete_own" ON public.complaints;
CREATE POLICY "complaints_delete_own" ON public.complaints
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---------- complaint_status_history ----------
CREATE TABLE IF NOT EXISTS public.complaint_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.complaint_status_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_history_complaint ON public.complaint_status_history(complaint_id);

DROP POLICY IF EXISTS "history_select_own_or_admin" ON public.complaint_status_history;
CREATE POLICY "history_select_own_or_admin" ON public.complaint_status_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.complaints c
           WHERE c.id = complaint_id
           AND (c.user_id = auth.uid() OR public.is_admin()))
  );

DROP POLICY IF EXISTS "history_insert_own_or_admin" ON public.complaint_status_history;
CREATE POLICY "history_insert_own_or_admin" ON public.complaint_status_history
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.complaints c
           WHERE c.id = complaint_id
           AND (c.user_id = auth.uid() OR public.is_admin()))
  );

-- ---------- notifications ----------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

DROP POLICY IF EXISTS "notif_select_own_or_admin" ON public.notifications;
CREATE POLICY "notif_select_own_or_admin" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "notif_insert_own_or_admin" ON public.notifications;
CREATE POLICY "notif_insert_own_or_admin" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "notif_update_own_or_admin" ON public.notifications;
CREATE POLICY "notif_update_own_or_admin" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ---------- emergency_services ----------
CREATE TABLE IF NOT EXISTS public.emergency_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('POLICE','AMBULANCE','FIRE','HOSPITAL')),
  name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.emergency_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "emergency_read_all" ON public.emergency_services;
CREATE POLICY "emergency_read_all" ON public.emergency_services
  FOR SELECT TO anon, authenticated USING (true);

-- ---------- hospitals ----------
CREATE TABLE IF NOT EXISTS public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  emergency_available boolean NOT NULL DEFAULT false,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hospitals_read_all" ON public.hospitals;
CREATE POLICY "hospitals_read_all" ON public.hospitals
  FOR SELECT TO anon, authenticated USING (true);

-- ---------- tourist_locations ----------
CREATE TABLE IF NOT EXISTS public.tourist_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('PARKS','HERITAGE','LAKES','TEMPLES','TOURIST_ATTRACTIONS')),
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tourist_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tourist_read_all" ON public.tourist_locations;
CREATE POLICY "tourist_read_all" ON public.tourist_locations
  FOR SELECT TO anon, authenticated USING (true);

-- ---------- transport_routes ----------
CREATE TABLE IF NOT EXISTS public.transport_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name text NOT NULL,
  route_type text NOT NULL CHECK (route_type IN ('BUS','METRO')),
  stops text[] NOT NULL DEFAULT '{}',
  estimated_duration_min integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transport_read_all" ON public.transport_routes;
CREATE POLICY "transport_read_all" ON public.transport_routes
  FOR SELECT TO anon, authenticated USING (true);

-- ---------- traffic_incidents ----------
CREATE TABLE IF NOT EXISTS public.traffic_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  road_name text NOT NULL,
  incident_type text NOT NULL CHECK (incident_type IN ('ACCIDENT','CONGESTION','ROAD_WORK','CLOSURE','ALERT')),
  severity text NOT NULL DEFAULT 'MEDIUM'
    CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  description text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.traffic_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "traffic_read_all" ON public.traffic_incidents;
CREATE POLICY "traffic_read_all" ON public.traffic_incidents
  FOR SELECT TO anon, authenticated USING (true);

-- ---------- tracking id generation ----------
CREATE SEQUENCE IF NOT EXISTS public.complaint_tracking_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_tracking_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'NS-' || EXTRACT(YEAR FROM now())::text || '-' ||
         lpad(nextval('public.complaint_tracking_seq')::text, 6, '0')
$$;

-- auto-set tracking_id + status history on insert
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
  INSERT INTO public.complaint_status_history (complaint_id, old_status, new_status, updated_by)
  VALUES (NEW.id, NULL, NEW.status, NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_complaint_insert ON public.complaints;
CREATE TRIGGER trg_complaint_insert
  BEFORE INSERT ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.handle_complaint_insert();

-- auto-update updated_at + status history on status change
CREATE OR REPLACE FUNCTION public.handle_complaint_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.complaint_status_history (complaint_id, old_status, new_status, updated_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_complaint_update ON public.complaints;
CREATE TRIGGER trg_complaint_update
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.handle_complaint_update();

-- auto-create notification when status changes
CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (NEW.user_id,
            'Complaint ' || NEW.tracking_id || ' updated',
            'Your complaint ' || NEW.tracking_id || ' is now ' || NEW.status || '.');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_complaint_notify ON public.complaints;
CREATE TRIGGER trg_complaint_notify
  AFTER UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_status_change();

-- auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'name', ''),
          COALESCE(NEW.raw_user_meta_data->>'phone', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
