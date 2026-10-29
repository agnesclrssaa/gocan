-- ==============================================================================
-- MIGRASI KEAMANAN FINAL GoCan: RBAC Hardening & Row Level Security (TASK 1D)
-- File: supabase/migrations/20261029_fix_auth_roles_rls.sql
-- Tanggal: 2026-10-29
-- ==============================================================================
-- AUDIT & PERBAIKAN:
-- 1. Penghapusan Total Mekanisme 'gocan.admin_privilege_grant':
--    - Mengeliminasi ketergantungan pada custom PostgreSQL session variable (set_config)
--      yang rentan dimanipulasi atau bocor pada connection pooler.
--    - Proteksi trigger mengandalkan pemisahan identitas hakiki:
--      * session_user IN ('postgres', 'supabase_admin') AND auth.uid() IS NULL (Direct SQL Editor)
--      * public.is_admin() (Admin sah via Supabase Auth)
--      * auth.role() = 'service_role' (Backend internal)
--    - session_user tidak dapat dipalsukan oleh SECURITY DEFINER maupun PostgREST HTTP.
-- 2. Pengamanan Fungsi promote_user_to_admin(UUID):
--    - Izin eksekusi dicabut total dari PUBLIC, anon, dan authenticated (menutup PostgREST RPC).
--    - Hanya dieksekusi oleh superuser di SQL Editor atau service_role.
--    - Wajib memverifikasi target_user_id di auth.users dengan email terkonfirmasi.
-- 3. Pembatasan SELECT profiles Berdasarkan Status Pesanan Aktif:
--    - Customer & Runner HANYA dapat membaca profil pihak lawan saat pesanan AKTIF
--      (status IN ('pending', 'processing', 'ready_for_pickup', 'delivering')).
--    - Saat pesanan 'completed' atau 'cancelled', hak akses profil otomatis berakhir
--      guna melindungi privasi (telepon & identitas) mahasiswa dan kurir.
-- 4. Audit & Pengetatan RLS Menyeluruh pada Semua Tabel Aplikasi:
--    - canteens: Publik dapat membaca, hanya Canteen approved / Admin yang dapat mengelola.
--    - menus: Publik dapat membaca, hanya Canteen approved / Admin yang dapat mengelola.
--    - orders: Customer hanya mengelola pesanannya (termasuk rollback delete saat gagal checkout),
--      Canteen hanya melihat & memproses pesanan stan miliknya, Runner hanya melihat pesanan miliknya
--      atau pesanan terbuka yang belum diambil, Admin memiliki kontrol penuh.
--    - order_items: Akses dibatasi ketat mengikuti izin tabel induk orders.
--    - deliveries: Hanya Customer pemilik, Runner yang bertugas, atau Admin yang dapat mengakses.
--    - payments: Akses dibatasi pada Customer dan Canteen terkait serta Admin.
-- 5. Konsistensi Skema:
--    - Memastikan kolom name, full_name, phone, phone_number, approval_status, updated_at
--      tersedia dan konsisten untuk kompatibilitas data lama.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Normalisasi Kolom Tabel profiles
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Sinkronisasi kolom alias name <-> full_name dan phone <-> phone_number
UPDATE public.profiles SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;
UPDATE public.profiles SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;
UPDATE public.profiles SET phone_number = phone WHERE phone_number IS NULL AND phone IS NOT NULL;
UPDATE public.profiles SET phone = phone_number WHERE phone IS NULL AND phone_number IS NOT NULL;

-- Constraint validasi
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('customer', 'canteen', 'runner', 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_approval_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_approval_status_check
      CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. Kebijakan Backfill Akun Lama yang Konservatif
-- ------------------------------------------------------------------------------
-- Customer mandiri & Admin diset 'approved'
UPDATE public.profiles
SET approval_status = 'approved'
WHERE role = 'customer' AND (approval_status IS NULL OR approval_status = 'pending');

UPDATE public.profiles
SET approval_status = 'approved'
WHERE role = 'admin' AND (approval_status IS NULL OR approval_status = 'pending');

-- Canteen & Runner lama TIDAK disetujui massal, tetap 'pending' sampai diverifikasi Admin

-- ------------------------------------------------------------------------------
-- 3. Fungsi Helper is_admin() dengan Perlindungan search_path
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 4. Trigger Pencegah Eskalasi Hak Akses (Tanpa session variable rentan)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Cegat jika ada percobaan mengubah role atau approval_status
  IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.approval_status IS DISTINCT FROM OLD.approval_status) THEN
    -- Verifikasi jalur administrasi yang sah:
    -- 1. Sesi koneksi langsung dari superuser database di SQL Editor (session_user = postgres/supabase_admin dan tanpa token auth JWT)
    -- 2. Admin terverifikasi via Supabase Auth (public.is_admin())
    -- 3. Proses backend via service_role key (auth.role() = 'service_role')
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

-- ------------------------------------------------------------------------------
-- 5. Trigger Pendaftaran Akun Baru (auth.users -> public.profiles)
-- ------------------------------------------------------------------------------
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

  -- Blokir registrasi publik menjadi 'admin'; paksa menjadi 'customer'
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
    -- role dan approval_status TIDAK BOLEH ditimpa saat conflict!
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 6. Prosedur Administrasi Promosi Admin Pertama (Tanpa session variable rentan)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- 1. Verifikasi wewenang eksekusi:
  -- Hanya direct superuser di SQL Editor (session_user postgres/supabase_admin),
  -- atau admin yang sudah sah, atau service_role internal.
  IF NOT (
    (session_user IN ('postgres', 'supabase_admin') AND auth.uid() IS NULL)
    OR public.is_admin()
    OR (auth.role() = 'service_role')
  ) THEN
    RAISE EXCEPTION 'Akses Ditolak: Anda tidak memiliki wewenang untuk menetapkan role Admin.';
  END IF;

  -- 2. Validasi target user di auth.users dengan email terverifikasi
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = target_user_id AND email_confirmed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Gagal: Akun pengguna tidak ditemukan di auth.users atau email belum terverifikasi.';
  END IF;

  -- 3. Update role dan approval_status
  UPDATE public.profiles
  SET role = 'admin',
      approval_status = 'approved',
      updated_at = timezone('utc'::text, now())
  WHERE id = target_user_id;
END;
$$;

-- Cabut total izin eksekusi dari role publik, anon, dan authenticated untuk menutup PostgREST RPC
REVOKE ALL ON FUNCTION public.promote_user_to_admin(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(UUID) TO postgres, service_role;

-- ------------------------------------------------------------------------------
-- 7. Audit & Pembersihan RLS Seluruh Tabel Aplikasi
-- ------------------------------------------------------------------------------

-- Pastikan RLS aktif di semua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'canteens') THEN
    ALTER TABLE public.canteens ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'menus') THEN
    ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deliveries') THEN
    ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Bersihkan policy lama di seluruh tabel terkait
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'canteens', 'menus', 'orders', 'order_items', 'deliveries', 'payments')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 8. Pemasangan Kebijakan RLS Baru (Strict Least Privilege)
-- ------------------------------------------------------------------------------

-- === A. TABEL PROFILES ===
-- SELECT:
-- 1. Profil milik sendiri (auth.uid() = id).
-- 2. Admin kampus (public.is_admin()).
-- 3. Customer membaca profil Runner HANYA saat pesanan masih AKTIF.
-- 4. Runner membaca profil Customer HANYA saat pesanan masih AKTIF.
-- Pesanan selesai ('completed') atau batal ('cancelled') TIDAK membuka akses profil.
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

-- === B. TABEL CANTEENS ===
-- SELECT: Terbuka untuk umum/authenticated agar pelanggan dapat menjelajah stan.
-- INSERT: Hanya Admin atau Mitra Canteen yang sudah approved.
-- UPDATE: Pemilik stan yang sudah approved atau Admin.
-- DELETE: Admin.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'canteens') THEN
    EXECUTE '
      CREATE POLICY "canteens_select_policy"
        ON public.canteens
        FOR SELECT
        USING (true);

      CREATE POLICY "canteens_insert_policy"
        ON public.canteens
        FOR INSERT
        TO authenticated
        WITH CHECK (
          public.is_admin()
          OR (
            auth.uid() = owner_id
            AND EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = auth.uid() AND p.role = ''canteen'' AND p.approval_status = ''approved''
            )
          )
        );

      CREATE POLICY "canteens_update_policy"
        ON public.canteens
        FOR UPDATE
        TO authenticated
        USING (
          public.is_admin()
          OR (
            auth.uid() = owner_id
            AND EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = auth.uid() AND p.role = ''canteen'' AND p.approval_status = ''approved''
            )
          )
        );

      CREATE POLICY "canteens_delete_policy"
        ON public.canteens
        FOR DELETE
        TO authenticated
        USING (public.is_admin());
    ';
  END IF;
END $$;

-- === C. TABEL MENUS ===
-- SELECT: Terbuka untuk umum/authenticated agar menu dapat dilihat di katalog.
-- INSERT/UPDATE/DELETE: Pemilik kantin yang sudah approved untuk kantin miliknya, atau Admin.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'menus') THEN
    EXECUTE '
      CREATE POLICY "menus_select_policy"
        ON public.menus
        FOR SELECT
        USING (true);

      CREATE POLICY "menus_modify_policy"
        ON public.menus
        FOR ALL
        TO authenticated
        USING (
          public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.canteens c
            JOIN public.profiles p ON p.id = c.owner_id
            WHERE c.id = menus.canteen_id
              AND c.owner_id = auth.uid()
              AND p.role = ''canteen''
              AND p.approval_status = ''approved''
          )
        )
        WITH CHECK (
          public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.canteens c
            JOIN public.profiles p ON p.id = c.owner_id
            WHERE c.id = menus.canteen_id
              AND c.owner_id = auth.uid()
              AND p.role = ''canteen''
              AND p.approval_status = ''approved''
          )
        );
    ';
  END IF;
END $$;

-- === D. TABEL ORDERS ===
-- SELECT:
-- - Customer pemilik pesanan
-- - Canteen pemilik stan tujuan
-- - Runner yang ditugaskan ATAU Runner approved yang sedang mencari order delivery terbuka
-- - Admin
-- INSERT: Customer membuat pesanan miliknya sendiri.
-- UPDATE:
-- - Customer membatalkan pesanannya sendiri yang masih berstatus pending
-- - Canteen memproses pesanan stan miliknya
-- - Runner mengambil order terbuka atau memperbarui status pengantaran miliknya
-- - Admin
-- DELETE:
-- - Customer menghapus order orphan saat checkout gagal (status pending)
-- - Admin
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    EXECUTE '
      CREATE POLICY "orders_select_policy"
        ON public.orders
        FOR SELECT
        TO authenticated
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
            AND orders.order_type = ''delivery''
            AND orders.status IN (''pending'', ''processing'', ''ready_for_pickup'')
            AND EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = auth.uid() AND p.role = ''runner'' AND p.approval_status = ''approved''
            )
          )
        );

      CREATE POLICY "orders_insert_policy"
        ON public.orders
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = customer_id);

      CREATE POLICY "orders_update_policy"
        ON public.orders
        FOR UPDATE
        TO authenticated
        USING (
          public.is_admin()
          OR (auth.uid() = customer_id AND orders.status = ''pending'')
          OR EXISTS (
            SELECT 1 FROM public.canteens c
            WHERE c.id = orders.canteen_id AND c.owner_id = auth.uid()
          )
          OR (
            auth.uid() = runner_id
            AND EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = auth.uid() AND p.role = ''runner'' AND p.approval_status = ''approved''
            )
          )
          OR (
            orders.runner_id IS NULL
            AND orders.order_type = ''delivery''
            AND EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = auth.uid() AND p.role = ''runner'' AND p.approval_status = ''approved''
            )
          )
        );

      CREATE POLICY "orders_delete_policy"
        ON public.orders
        FOR DELETE
        TO authenticated
        USING (
          public.is_admin()
          OR (auth.uid() = customer_id AND orders.status = ''pending'')
        );
    ';
  END IF;
END $$;

-- === E. TABEL ORDER_ITEMS ===
-- SELECT: Terikat pada akses pesanan terkait di tabel orders.
-- INSERT: Customer untuk pesanannya sendiri.
-- UPDATE/DELETE: Customer (status pending) atau Admin.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    EXECUTE '
      CREATE POLICY "order_items_select_policy"
        ON public.order_items
        FOR SELECT
        TO authenticated
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
                  AND o.order_type = ''delivery''
                  AND o.status IN (''pending'', ''processing'', ''ready_for_pickup'')
                  AND EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role = ''runner'' AND p.approval_status = ''approved''
                  )
                )
              )
          )
        );

      CREATE POLICY "order_items_insert_policy"
        ON public.order_items
        FOR INSERT
        TO authenticated
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id AND o.customer_id = auth.uid()
          )
        );

      CREATE POLICY "order_items_modify_policy"
        ON public.order_items
        FOR ALL
        TO authenticated
        USING (
          public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
              AND o.customer_id = auth.uid()
              AND o.status = ''pending''
          )
        );
    ';
  END IF;
END $$;

-- === F. TABEL DELIVERIES ===
-- SELECT: Customer pemilik order, Runner yang ditugaskan atau Runner approved yang mencari order, Admin.
-- INSERT: Customer saat checkout order delivery.
-- UPDATE: Runner approved yang mengklaim/memperbarui status, atau Admin.
-- DELETE: Admin atau Customer jika pesanan masih pending.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deliveries') THEN
    EXECUTE '
      CREATE POLICY "deliveries_select_policy"
        ON public.deliveries
        FOR SELECT
        TO authenticated
        USING (
          public.is_admin()
          OR runner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = deliveries.order_id AND o.customer_id = auth.uid()
          )
          OR (
            runner_id IS NULL
            AND EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = auth.uid() AND p.role = ''runner'' AND p.approval_status = ''approved''
            )
          )
        );

      CREATE POLICY "deliveries_insert_policy"
        ON public.deliveries
        FOR INSERT
        TO authenticated
        WITH CHECK (
          public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = deliveries.order_id AND o.customer_id = auth.uid()
          )
        );

      CREATE POLICY "deliveries_update_policy"
        ON public.deliveries
        FOR UPDATE
        TO authenticated
        USING (
          public.is_admin()
          OR (
            (runner_id = auth.uid() OR runner_id IS NULL)
            AND EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = auth.uid() AND p.role = ''runner'' AND p.approval_status = ''approved''
            )
          )
        );

      CREATE POLICY "deliveries_delete_policy"
        ON public.deliveries
        FOR DELETE
        TO authenticated
        USING (
          public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = deliveries.order_id
              AND o.customer_id = auth.uid()
              AND o.status = ''pending''
          )
        );
    ';
  END IF;
END $$;

-- === G. TABEL PAYMENTS ===
-- SELECT: Customer pemilik order, Canteen penerima, Admin.
-- INSERT: Customer saat checkout, Admin.
-- UPDATE: Canteen atau Admin.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    EXECUTE '
      CREATE POLICY "payments_select_policy"
        ON public.payments
        FOR SELECT
        TO authenticated
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

      CREATE POLICY "payments_insert_policy"
        ON public.payments
        FOR INSERT
        TO authenticated
        WITH CHECK (
          public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = payments.order_id AND o.customer_id = auth.uid()
          )
        );

      CREATE POLICY "payments_update_policy"
        ON public.payments
        FOR UPDATE
        TO authenticated
        USING (
          public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.canteens c ON c.id = o.canteen_id
            WHERE o.id = payments.order_id AND c.owner_id = auth.uid()
          )
        );

      CREATE POLICY "payments_delete_policy"
        ON public.payments
        FOR DELETE
        TO authenticated
        USING (public.is_admin());
    ';
  END IF;
END $$;

COMMIT;
