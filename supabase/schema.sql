-- Vajra Stationery & Xerox Services - Supabase Schema Definition (Phase 2 AI-Ready Inventory)

-- 1. Create or Upgrade products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_image TEXT,
  images TEXT[] DEFAULT '{}',
  image_hash TEXT,
  embedding_vector TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Others',
  brand TEXT,
  selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  shelf_location TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backwards compatibility & Phase 2 column aliases if migrating existing table:
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='selling_price') THEN
    ALTER TABLE public.products ADD COLUMN selling_price NUMERIC(10, 2) DEFAULT 0;
    UPDATE public.products SET selling_price = price WHERE selling_price = 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='quantity') THEN
    ALTER TABLE public.products ADD COLUMN quantity INTEGER DEFAULT 0;
    UPDATE public.products SET quantity = stock WHERE quantity = 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='shelf_location') THEN
    ALTER TABLE public.products ADD COLUMN shelf_location TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='primary_image') THEN
    ALTER TABLE public.products ADD COLUMN primary_image TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='images') THEN
    ALTER TABLE public.products ADD COLUMN images TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='image_hash') THEN
    ALTER TABLE public.products ADD COLUMN image_hash TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='embedding_vector') THEN
    ALTER TABLE public.products ADD COLUMN embedding_vector TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='status') THEN
    ALTER TABLE public.products ADD COLUMN status TEXT DEFAULT 'Active';
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read access" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow all write access" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access" ON public.products FOR DELETE USING (true);

-- 2. Create recognitions table (AI Recognition History & Self-Improving Learning)
CREATE TABLE IF NOT EXISTS public.recognitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_image TEXT,
  predicted_name TEXT NOT NULL,
  selected_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  confidence NUMERIC(5, 4) DEFAULT 0,
  recognition_source TEXT DEFAULT 'LOCAL', -- 'LOCAL' or 'GEMINI'
  recognition_time_ms INTEGER DEFAULT 0,
  device TEXT DEFAULT 'desktop', -- 'mobile' or 'desktop'
  user_corrected BOOLEAN DEFAULT false,
  matched BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.recognitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read access recognitions" ON public.recognitions FOR SELECT USING (true);
CREATE POLICY "Allow all write access recognitions" ON public.recognitions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access recognitions" ON public.recognitions FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access recognitions" ON public.recognitions FOR DELETE USING (true);

-- 3. Storage Bucket Setup ('product-images')
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Public Insert Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- 4. Stage 3 Enhancements: scan_count & user_accepted
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='scan_count') THEN
    ALTER TABLE public.products ADD COLUMN scan_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recognitions' AND column_name='user_accepted') THEN
    ALTER TABLE public.recognitions ADD COLUMN user_accepted BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recognitions' AND column_name='failure_reason') THEN
    ALTER TABLE public.recognitions ADD COLUMN failure_reason TEXT;
  END IF;
END $$;

-- 5. Stage 3 Learning Service Table
CREATE TABLE IF NOT EXISTS public.ai_learning_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predicted_name_norm TEXT UNIQUE NOT NULL,
  corrected_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  frequency INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_learning_corrections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read ai_learning_corrections" ON public.ai_learning_corrections FOR SELECT USING (true);
CREATE POLICY "Allow all write ai_learning_corrections" ON public.ai_learning_corrections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update ai_learning_corrections" ON public.ai_learning_corrections FOR UPDATE USING (true);

-- 6. RPC Function to increment scan_count safely
CREATE OR REPLACE FUNCTION public.increment_scan_count(prod_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET scan_count = COALESCE(scan_count, 0) + 1
  WHERE id = prod_id;
END;
$$ LANGUAGE plpgsql;
