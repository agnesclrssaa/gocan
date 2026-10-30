-- GoCan Supabase setup, consolidated from the previous schema/setup scripts
-- and the latest auth/RLS migration.
--
-- Run this single file in Supabase SQL Editor. It is safe to rerun for schema,
-- policies, triggers, storage, and realtime. Sample canteens/menus are inserted
-- only when their names do not already exist.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Tables and compatibility columns
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  full_name TEXT,
  phone TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer',
  approval_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.canteens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id UUID NOT NULL REFERENCES public.canteens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS canteen_id UUID REFERENCES public.canteens(id) ON DELETE CASCADE;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Makanan';
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  canteen_id UUID REFERENCES public.canteens(id) ON DELETE SET NULL,
  runner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  order_type TEXT DEFAULT 'delivery',
  payment_method TEXT DEFAULT 'cash',
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_food NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_payment NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_location TEXT,
  building TEXT,
  meeting_point TEXT,
  class_info TEXT,
  additional_note TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS canteen_id UUID REFERENCES public.canteens(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS runner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'delivery';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_food NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_payment NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_location TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS building TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS meeting_point TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS class_info TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS additional_note TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES public.menus(id) ON DELETE SET NULL,
  menu_name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  notes TEXT,
  subtotal NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS menu_id UUID REFERENCES public.menus(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS menu_name TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  runner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  building TEXT,
  meeting_point TEXT,
  class_info TEXT,
  additional_note TEXT,
  status TEXT DEFAULT 'waiting',
  building_name TEXT,
  class_room TEXT,
  runner_notes TEXT,
  delivery_status TEXT DEFAULT 'pending_runner',
  fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS runner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS building TEXT;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS meeting_point TEXT;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS class_info TEXT;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS additional_note TEXT;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'waiting';
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS building_name TEXT;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS class_room TEXT;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS runner_notes TEXT;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending_runner';
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS fee NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE OR REPLACE FUNCTION public.sync_delivery_compat_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.building := COALESCE(NEW.building, NEW.building_name);
  NEW.building_name := COALESCE(NEW.building_name, NEW.building);
  NEW.class_info := COALESCE(NEW.class_info, NEW.class_room);
  NEW.class_room := COALESCE(NEW.class_room, NEW.class_info);
  NEW.additional_note := COALESCE(NEW.additional_note, NEW.runner_notes);
  NEW.runner_notes := COALESCE(NEW.runner_notes, NEW.additional_note);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_sync_delivery_compat_columns ON public.deliveries;
CREATE TRIGGER tr_sync_delivery_compat_columns
  BEFORE INSERT OR UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.sync_delivery_compat_columns();

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS method TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unpaid';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- ---------------------------------------------------------------------------
-- 2. Profile normalization, auth helpers, and triggers
-- ---------------------------------------------------------------------------
UPDATE public.profiles SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;
UPDATE public.profiles SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;
UPDATE public.profiles SET phone_number = phone WHERE phone_number IS NULL AND phone IS NOT NULL;
UPDATE public.profiles SET phone = phone_number WHERE phone IS NULL AND phone_number IS NOT NULL;
UPDATE public.profiles SET approval_status = 'approved'
WHERE role IN ('customer', 'admin') AND (approval_status IS NULL OR approval_status = 'pending');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('customer', 'canteen', 'runner', 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_approval_status_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_approval_status_check
      CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

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

  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role = 'admin';
END;
$$;

CREATE OR REPLACE FUNCTION public.is_approved_runner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'runner'
      AND approval_status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_approved_canteen()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'canteen'
      AND approval_status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
    OR NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    IF NOT (
      (session_user IN ('postgres', 'supabase_admin') AND auth.uid() IS NULL)
      OR public.is_admin()
      OR auth.role() = 'service_role'
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
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

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
    id, email, name, full_name, phone, phone_number, avatar_url,
    role, approval_status, created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email, v_full_name, v_full_name, v_phone_number, v_phone_number,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    v_final_role, v_approval_status, timezone('utc'::text, now()), timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = CASE WHEN public.profiles.name IS NULL OR public.profiles.name = '' THEN EXCLUDED.name ELSE public.profiles.name END,
      full_name = CASE WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
      phone = CASE WHEN public.profiles.phone IS NULL OR public.profiles.phone = '' THEN EXCLUDED.phone ELSE public.profiles.phone END,
      phone_number = CASE WHEN public.profiles.phone_number IS NULL OR public.profiles.phone_number = '' THEN EXCLUDED.phone_number ELSE public.profiles.phone_number END,
      updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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
    OR auth.role() = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Akses Ditolak: Anda tidak memiliki wewenang untuk menetapkan role Admin.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = target_user_id AND email_confirmed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Gagal: Akun pengguna tidak ditemukan atau email belum terverifikasi.';
  END IF;

  UPDATE public.profiles
  SET role = 'admin', approval_status = 'approved', updated_at = timezone('utc'::text, now())
  WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_user_to_admin(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(UUID) TO postgres, service_role;
GRANT ALL ON TABLE public.profiles TO postgres, service_role;
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Replace legacy policies with the latest least-privilege RLS policies
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canteens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'canteens', 'menus', 'orders', 'order_items', 'deliveries', 'payments')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  END LOOP;
END $$;

CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.customer_id = auth.uid()
        AND o.runner_id = public.profiles.id
        AND o.status IN ('pending', 'processing', 'ready_for_pickup', 'delivering')
    )
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.runner_id = auth.uid()
        AND o.customer_id = public.profiles.id
        AND o.status IN ('pending', 'processing', 'ready_for_pickup', 'delivering')
    )
  );

CREATE POLICY profiles_update_policy ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY canteens_select_policy ON public.canteens
  FOR SELECT USING (true);

CREATE POLICY canteens_insert_policy ON public.canteens
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      auth.uid() = owner_id
      AND public.is_approved_canteen()
    )
  );

CREATE POLICY canteens_update_policy ON public.canteens
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (
      auth.uid() = owner_id
      AND public.is_approved_canteen()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR (
      auth.uid() = owner_id
      AND public.is_approved_canteen()
    )
  );

CREATE POLICY canteens_delete_policy ON public.canteens
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY menus_select_policy ON public.menus
  FOR SELECT USING (true);

CREATE POLICY menus_modify_policy ON public.menus
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.canteens c
      WHERE c.id = menus.canteen_id AND c.owner_id = auth.uid()
        AND public.is_approved_canteen()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.canteens c
      WHERE c.id = menus.canteen_id AND c.owner_id = auth.uid()
        AND public.is_approved_canteen()
    )
  );

CREATE POLICY orders_select_policy ON public.orders
  FOR SELECT TO authenticated
  USING (
    auth.uid() = customer_id
    OR auth.uid() = runner_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.canteens c
      WHERE c.id = orders.canteen_id AND c.owner_id = auth.uid()
    )
    OR (
      orders.runner_id IS NULL
      AND orders.order_type = 'delivery'
      AND orders.status IN ('pending', 'processing', 'ready_for_pickup')
      AND public.is_approved_runner()
    )
  );

CREATE POLICY orders_insert_policy ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

CREATE POLICY orders_update_policy ON public.orders
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (auth.uid() = customer_id AND orders.status = 'pending')
    OR EXISTS (
      SELECT 1 FROM public.canteens c
      WHERE c.id = orders.canteen_id AND c.owner_id = auth.uid()
    )
    OR (
      auth.uid() = runner_id
      AND public.is_approved_runner()
    )
    OR (
      orders.runner_id IS NULL
      AND orders.order_type = 'delivery'
      AND public.is_approved_runner()
    )
  );

CREATE POLICY orders_delete_policy ON public.orders
  FOR DELETE TO authenticated
  USING (public.is_admin() OR (auth.uid() = customer_id AND orders.status = 'pending'));

CREATE POLICY order_items_select_policy ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          o.customer_id = auth.uid()
          OR o.runner_id = auth.uid()
          OR public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.canteens c
            WHERE c.id = o.canteen_id AND c.owner_id = auth.uid()
          )
          OR (
            o.runner_id IS NULL
            AND o.order_type = 'delivery'
            AND o.status IN ('pending', 'processing', 'ready_for_pickup')
            AND public.is_approved_runner()
          )
        )
    )
  );

CREATE POLICY order_items_insert_policy ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND o.customer_id = auth.uid()
    )
  );

CREATE POLICY order_items_modify_policy ON public.order_items
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.customer_id = auth.uid()
        AND o.status = 'pending'
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.customer_id = auth.uid()
        AND o.status = 'pending'
    )
  );

CREATE POLICY deliveries_select_policy ON public.deliveries
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR runner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = deliveries.order_id AND o.customer_id = auth.uid()
    )
    OR (
      runner_id IS NULL
      AND public.is_approved_runner()
    )
  );

CREATE POLICY deliveries_insert_policy ON public.deliveries
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = deliveries.order_id AND o.customer_id = auth.uid()
    )
  );

CREATE POLICY deliveries_update_policy ON public.deliveries
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (
      (runner_id = auth.uid() OR runner_id IS NULL)
      AND public.is_approved_runner()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR (
      (runner_id = auth.uid() OR runner_id IS NULL)
      AND public.is_approved_runner()
    )
  );

CREATE POLICY deliveries_delete_policy ON public.deliveries
  FOR DELETE TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = deliveries.order_id
        AND o.customer_id = auth.uid()
        AND o.status = 'pending'
    )
  );

CREATE POLICY payments_select_policy ON public.payments
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id AND o.customer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.canteens c ON c.id = o.canteen_id
      WHERE o.id = payments.order_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY payments_insert_policy ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id AND o.customer_id = auth.uid()
    )
  );

CREATE POLICY payments_update_policy ON public.payments
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.canteens c ON c.id = o.canteen_id
      WHERE o.id = payments.order_id AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.canteens c ON c.id = o.canteen_id
      WHERE o.id = payments.order_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY payments_delete_policy ON public.payments
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Realtime and public asset storage
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    RAISE EXCEPTION 'Publikasi supabase_realtime tidak ditemukan pada proyek ini.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('gocan-assets', 'gocan-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access to gocan-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload gocan-assets" ON storage.objects;
CREATE POLICY "Public Access to gocan-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'gocan-assets');
CREATE POLICY "Authenticated users can upload gocan-assets" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gocan-assets');

-- ---------------------------------------------------------------------------
-- 5. Optional demo data (safe to rerun; existing named rows are preserved)
-- ---------------------------------------------------------------------------
INSERT INTO public.canteens (name, description, location, phone_number, is_open, image_url)
SELECT seed.name, seed.description, seed.location, seed.phone_number, true, seed.image_url
FROM (VALUES
  ('Kantin Bu Siti (Gedung A)', 'Aneka masakan nusantara, nasi rames lezat, dan aneka lauk pauk.', 'Lantai 1 Gedung A', '081234567801', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80'),
  ('Ayam Geprek Kampus (Gedung B)', 'Spesialis ayam geprek sambal bawang pedas level 1-10 + es teh manis.', 'Foodcourt Gedung B Lt. 2', '081234567802', 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80'),
  ('Kantin Sehat Bu Nur (Gedung C)', 'Jus buah segar, aneka salad, smoothie bowl, dan sandwich sehat.', 'Lobby Gedung C', '081234567803', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80')
) AS seed(name, description, location, phone_number, image_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.canteens existing WHERE existing.name = seed.name
);

INSERT INTO public.menus (canteen_id, name, description, price, category, is_available, image_url)
SELECT c.id, seed.name, seed.description, seed.price, seed.category, true, seed.image_url
FROM (VALUES
  ('Kantin Bu Siti (Gedung A)', 'Nasi Rames Ayam Bakar', 'Nasi putih + ayam bakar bumbu kecap + sayur urap + sambal terasi.', 18000::NUMERIC, 'Makanan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'),
  ('Kantin Bu Siti (Gedung A)', 'Nasi Goreng Spesial', 'Nasi goreng dengan telur ceplok, suwiran ayam, dan kerupuk.', 15000::NUMERIC, 'Makanan', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80'),
  ('Kantin Bu Siti (Gedung A)', 'Es Teh Manis Jumbo', 'Es teh manis segar ukuran jumbo pelepas dahaga.', 5000::NUMERIC, 'Minuman', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80'),
  ('Ayam Geprek Kampus (Gedung B)', 'Paket Geprek Sambal Bawang', 'Ayam geprek krispi + sambal bawang gurih pedas + nasi hangat.', 16000::NUMERIC, 'Makanan', 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80'),
  ('Ayam Geprek Kampus (Gedung B)', 'Paket Geprek Keju Mozzarella', 'Ayam geprek krispi leleh keju mozzarella + sambal matah + nasi.', 22000::NUMERIC, 'Makanan', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80'),
  ('Ayam Geprek Kampus (Gedung B)', 'Es Jeruk Peras', 'Jeruk peras murni segar dingin.', 6000::NUMERIC, 'Minuman', 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80'),
  ('Kantin Sehat Bu Nur (Gedung C)', 'Avocado Toast & Egg', 'Roti gandum panggang dengan alpukat segar dan telur mata sapi.', 20000::NUMERIC, 'Makanan', 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80'),
  ('Kantin Sehat Bu Nur (Gedung C)', 'Dragonfruit Smoothie Bowl', 'Smoothie buah naga topping pisang, granola, dan chia seed.', 25000::NUMERIC, 'Makanan', 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop&q=80'),
  ('Kantin Sehat Bu Nur (Gedung C)', 'Jus Mangga Segar', 'Jus mangga kental manis alami tanpa pemanis buatan.', 10000::NUMERIC, 'Minuman', 'https://images.unsplash.com/photo-1546173159-315724a31d90?w=600&auto=format&fit=crop&q=80')
) AS seed(canteen_name, name, description, price, category, image_url)
JOIN public.canteens c ON c.name = seed.canteen_name
WHERE NOT EXISTS (
  SELECT 1 FROM public.menus existing
  WHERE existing.canteen_id = c.id AND existing.name = seed.name
);

COMMIT;
