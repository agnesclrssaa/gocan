-- ==========================================================
-- 1. PASTIKAN STRUKTUR TABEL ORDERS & ORDER_ITEMS LENGKAP
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  canteen_id UUID REFERENCES public.canteens(id) ON DELETE SET NULL,
  runner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'ready_for_pickup', 'delivering', 'completed', 'cancelled')) DEFAULT 'pending',
  order_type TEXT CHECK (order_type IN ('delivery', 'pickup')) DEFAULT 'delivery',
  payment_method TEXT DEFAULT 'cash',
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Pastikan kolom baru terpasang jika tabel orders sudah ada sebelumnya
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS canteen_id UUID REFERENCES public.canteens(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS runner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'delivery';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_location TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES public.menus(id) ON DELETE SET NULL,
  menu_name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS menu_id UUID REFERENCES public.menus(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS notes TEXT;

-- ==========================================================
-- 2. SETUP ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Reset policies orders
DROP POLICY IF EXISTS "Customer can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view relevant orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update relevant orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;

-- Customer bisa INSERT pesanannya sendiri
CREATE POLICY "Customer can create own orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

-- User yang login bisa membaca orders miliknya (customer, canteen owner, runner, admin)
CREATE POLICY "Users can view relevant orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = customer_id OR
    auth.uid() = runner_id OR
    EXISTS (
      SELECT 1 FROM public.canteens
      WHERE canteens.id = orders.canteen_id AND canteens.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Update status order (Canteen, Runner, Admin, atau Customer untuk cancel pending)
CREATE POLICY "Users can update relevant orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = customer_id OR
    auth.uid() = runner_id OR
    runner_id IS NULL OR -- runner bisa klaim order
    EXISTS (
      SELECT 1 FROM public.canteens
      WHERE canteens.id = orders.canteen_id AND canteens.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Reset policies order_items
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view order items" ON public.order_items;

CREATE POLICY "Users can insert order items"
  ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Users can view order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
    )
  );

-- ==========================================================
-- 3. AKTIFKAN REPLIKASI REALTIME SUPABASE
-- ==========================================================
-- Tambahkan tabel ke publikasi realtime agar listener websocket bereaksi
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;
