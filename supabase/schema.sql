-- ==============================================================================
-- SCHEMA UTAMA SUPABASE GoCan (REVISED & HARDENED - TASK 1D)
-- File: supabase/schema.sql
-- ==============================================================================

-- 1. Buat Tabel Profiles (jika belum ada)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  full_name TEXT,
  phone TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('customer', 'canteen', 'runner', 'admin')) DEFAULT 'customer',
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Kolom pelengkap jika tabel profiles sudah ada sebelumnya
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Fungsi Helper is_admin() dengan Keamanan search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN (v_role = 'admin');
END;
$$;

-- 4. Fungsi & Trigger Pencegah Eskalasi Hak Akses (Tanpa session variable rentan)
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.approval_status IS DISTINCT FROM OLD.approval_status) THEN
    IF NOT (
      (session_user IN ('postgres', 'supabase_admin') AND auth.uid() IS NULL)
      OR public.is_admin()
      OR (auth.role() = 'service_role')
    ) THEN
      RAISE EXCEPTION 'Akses Ditolak: Anda tidak memiliki wewenang untuk mengubah role atau status persetujuan akun.';
    END IF;
  END IF;

  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER tr_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 5. Kebijakan RLS untuk Profiles (Strict Least Privilege)
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    EXECUTE '
      CREATE POLICY "profiles_select_policy"
        ON public.profiles
        FOR SELECT
        TO authenticated
        USING (
          auth.uid() = id
          OR public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.customer_id = auth.uid()
              AND o.runner_id = public.profiles.id
              AND o.status IN (''pending'', ''processing'', ''ready_for_pickup'', ''delivering'')
          )
          OR EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.runner_id = auth.uid()
              AND o.customer_id = public.profiles.id
              AND o.status IN (''pending'', ''processing'', ''ready_for_pickup'', ''delivering'')
          )
        )
    ';
  ELSE
    EXECUTE '
      CREATE POLICY "profiles_select_policy"
        ON public.profiles
        FOR SELECT
        TO authenticated
        USING (auth.uid() = id OR public.is_admin())
    ';
  END IF;
END $$;

CREATE POLICY "profiles_update_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- 6. Fungsi Trigger Menangani User Baru dari auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_requested_role TEXT;
  v_final_role TEXT;
  v_approval_status TEXT;
  v_full_name TEXT;
  v_phone_number TEXT;
BEGIN
  v_requested_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'customer'));

  IF v_requested_role = 'canteen' THEN
    v_final_role := 'canteen';
    v_approval_status := 'pending';
  ELSIF v_requested_role = 'runner' THEN
    v_final_role := 'runner';
    v_approval_status := 'pending';
  ELSE
    v_final_role := 'customer';
    v_approval_status := 'approved';
  END IF;

  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  v_phone_number := COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.raw_user_meta_data->>'phone', '');

  INSERT INTO public.profiles (
    id,
    email,
    name,
    full_name,
    phone,
    phone_number,
    avatar_url,
    role,
    approval_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_full_name,
    v_phone_number,
    v_phone_number,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    v_final_role,
    v_approval_status,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = CASE WHEN public.profiles.name = '' OR public.profiles.name IS NULL THEN EXCLUDED.name ELSE public.profiles.name END,
    full_name = CASE WHEN public.profiles.full_name = '' OR public.profiles.full_name IS NULL THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    phone = CASE WHEN public.profiles.phone = '' OR public.profiles.phone IS NULL THEN EXCLUDED.phone ELSE public.profiles.phone END,
    phone_number = CASE WHEN public.profiles.phone_number = '' OR public.profiles.phone_number IS NULL THEN EXCLUDED.phone_number ELSE public.profiles.phone_number END,
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Prosedur Administrasi Promosi Admin Terverifikasi
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT (
    (session_user IN ('postgres', 'supabase_admin') AND auth.uid() IS NULL)
    OR public.is_admin()
    OR (auth.role() = 'service_role')
  ) THEN
    RAISE EXCEPTION 'Akses Ditolak: Anda tidak memiliki wewenang untuk menetapkan role Admin.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = target_user_id AND email_confirmed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Gagal: Akun pengguna tidak ditemukan di auth.users atau email belum terverifikasi.';
  END IF;

  UPDATE public.profiles
  SET role = 'admin',
      approval_status = 'approved',
      updated_at = timezone('utc'::text, now())
  WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_user_to_admin(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(UUID) TO postgres, service_role;
