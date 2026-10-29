-- ==========================================================
-- 0. TABEL PROFILES & TRIGGER REGISTER USER BARU
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  full_name TEXT,
  phone TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('customer', 'canteen', 'runner', 'admin')) DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_phone TEXT;
  v_role TEXT;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.raw_user_meta_data->>'phone', '');
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');

  INSERT INTO public.profiles (
    id, email, name, full_name, phone, phone_number, role, updated_at
  )
  VALUES (
    NEW.id, NEW.email, v_name, v_name, v_phone, v_phone, v_role, timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    phone_number = EXCLUDED.phone_number,
    role = EXCLUDED.role,
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================================
-- 1. PASTIKAN TABEL & KOLOM CANTEENS LENGKAP
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.canteens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tambahkan kolom jika tabel canteens sudah terlanjur dibuat sebelumnya
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- ==========================================================
-- 2. PASTIKAN TABEL & KOLOM MENUS LENGKAP
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id UUID NOT NULL REFERENCES public.canteens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS canteen_id UUID REFERENCES public.canteens(id) ON DELETE CASCADE;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Makanan';
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- ==========================================================
-- 3. PASTIKAN TABEL & KOLOM ORDERS & ORDER_ITEMS
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
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
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS menu_id UUID REFERENCES public.menus(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) DEFAULT 0;

-- ==========================================================
-- 3B. TABEL DELIVERIES & PAYMENTS
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  runner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  building TEXT NOT NULL,
  meeting_point TEXT NOT NULL,
  class_info TEXT,
  additional_note TEXT,
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS) & POLICIES
-- ==========================================================
ALTER TABLE public.canteens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop policy lama agar tidak duplikat jika dijalankan ulang
DROP POLICY IF EXISTS "Allow public read access to canteens" ON public.canteens;
DROP POLICY IF EXISTS "Allow owners to update their canteen" ON public.canteens;
DROP POLICY IF EXISTS "Allow public read access to menus" ON public.menus;
DROP POLICY IF EXISTS "Allow canteen owners to manage menus" ON public.menus;
DROP POLICY IF EXISTS "Allow all authenticated to read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow customers to create orders" ON public.orders;
DROP POLICY IF EXISTS "Allow update orders" ON public.orders;
DROP POLICY IF EXISTS "Allow read order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow read deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Allow insert deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Allow update deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Allow read payments" ON public.payments;
DROP POLICY IF EXISTS "Allow insert payments" ON public.payments;
DROP POLICY IF EXISTS "Allow update payments" ON public.payments;

-- Buat Policy Baru
CREATE POLICY "Allow public read access to canteens" ON public.canteens FOR SELECT USING (true);
CREATE POLICY "Allow owners to update their canteen" ON public.canteens FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Allow public read access to menus" ON public.menus FOR SELECT USING (true);
CREATE POLICY "Allow canteen owners to manage menus" ON public.menus FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.canteens 
    WHERE canteens.id = menus.canteen_id AND canteens.owner_id = auth.uid()
  )
);

CREATE POLICY "Allow all authenticated to read orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow customers to create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Allow update orders" ON public.orders FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow read order items" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow read deliveries" ON public.deliveries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert deliveries" ON public.deliveries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update deliveries" ON public.deliveries FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow read payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update payments" ON public.payments FOR UPDATE TO authenticated USING (true);

-- ==========================================================
-- 5. SETUP SUPABASE STORAGE BUCKET & POLICIES
-- ==========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('gocan-assets', 'gocan-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access to gocan-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload gocan-assets" ON storage.objects;

CREATE POLICY "Public Access to gocan-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'gocan-assets');

CREATE POLICY "Authenticated users can upload gocan-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gocan-assets');

-- ==========================================================
-- 6. DATA DUMMY / SEEDING AWAL (3 Kantin & 9 Menu)
-- ==========================================================
DO $$
DECLARE
  v_canteen_1 UUID := gen_random_uuid();
  v_canteen_2 UUID := gen_random_uuid();
  v_canteen_3 UUID := gen_random_uuid();
BEGIN
  -- Insert 3 Kantin Dummy
  INSERT INTO public.canteens (id, name, description, location, phone_number, is_open, image_url)
  VALUES 
    (v_canteen_1, 'Kantin Bu Siti (Gedung A)', 'Aneka masakan nusantara, nasi rames lezat, dan aneka lauk pauk.', 'Lantai 1 Gedung A', '081234567801', true, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80'),
    (v_canteen_2, 'Ayam Geprek Kampus (Gedung B)', 'Spesialis ayam geprek sambal bawang pedas level 1-10 + es teh manis.', 'Foodcourt Gedung B Lt. 2', '081234567802', true, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80'),
    (v_canteen_3, 'Kantin Sehat Bu Nur (Gedung C)', 'Jus buah segar, aneka salad, smoothie bowl, dan sandwich sehat.', 'Lobby Gedung C', '081234567803', true, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80');

  -- Insert Menu untuk Kantin 1 (Bu Siti)
  INSERT INTO public.menus (canteen_id, name, description, price, category, is_available, image_url)
  VALUES
    (v_canteen_1, 'Nasi Rames Ayam Bakar', 'Nasi putih + ayam bakar bumbu kecap + sayur urap + sambal terasi.', 18000, 'Makanan', true, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'),
    (v_canteen_1, 'Nasi Goreng Spesial', 'Nasi goreng dengan telur ceplok, suwiran ayam, dan kerupuk.', 15000, 'Makanan', true, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80'),
    (v_canteen_1, 'Es Teh Manis Jumbo', 'Es teh manis segar ukuran jumbo pelepas dahaga.', 5000, 'Minuman', true, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80');

  -- Insert Menu untuk Kantin 2 (Ayam Geprek Kampus)
  INSERT INTO public.menus (canteen_id, name, description, price, category, is_available, image_url)
  VALUES
    (v_canteen_2, 'Paket Geprek Sambal Bawang', 'Ayam geprek krispi + sambal bawang gurih pedas + nasi hangat.', 16000, 'Makanan', true, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80'),
    (v_canteen_2, 'Paket Geprek Keju Mozzarella', 'Ayam geprek krispi leleh keju mozzarella + sambal matah + nasi.', 22000, 'Makanan', true, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80'),
    (v_canteen_2, 'Es Jeruk Peras', 'Jeruk peras murni segar dingin.', 6000, 'Minuman', true, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80');

  -- Insert Menu untuk Kantin 3 (Kantin Sehat Bu Nur)
  INSERT INTO public.menus (canteen_id, name, description, price, category, is_available, image_url)
  VALUES
    (v_canteen_3, 'Avocado Toast & Egg', 'Roti gandum panggang dengan alpukat segar dan telur mata sapi.', 20000, 'Makanan', true, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80'),
    (v_canteen_3, 'Dragonfruit Smoothie Bowl', 'Smoothie buah naga topping pisang, granola, dan chia seed.', 25000, 'Makanan', true, 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop&q=80'),
    (v_canteen_3, 'Jus Mangga Segar', 'Jus mangga kental manis alami tanpa pemanis buatan.', 10000, 'Minuman', true, 'https://images.unsplash.com/photo-1546173159-315724a31d90?w=600&auto=format&fit=crop&q=80');
END $$;
