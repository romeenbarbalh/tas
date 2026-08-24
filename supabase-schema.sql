-- =============================================
-- The Ark Studio — Supabase Database Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT DEFAULT '',
  services TEXT[] NOT NULL DEFAULT '{}',
  total_price INTEGER NOT NULL DEFAULT 0,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  barber TEXT DEFAULT '',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Gallery items table
CREATE TABLE IF NOT EXISTS gallery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image' CHECK (file_type IN ('image', 'video')),
  alt_fr TEXT NOT NULL DEFAULT '',
  alt_en TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

-- 4. Policies: allow anonymous INSERT on bookings (public form)
CREATE POLICY "Allow anonymous insert on bookings"
  ON bookings FOR INSERT
  TO anon
  WITH CHECK (true);

-- 5. Policies: authenticated users can do everything
CREATE POLICY "Authenticated full access on bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated full access on gallery_items"
  ON gallery_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Public read access for gallery (the main website shows gallery)
CREATE POLICY "Public read access on gallery_items"
  ON gallery_items FOR SELECT
  TO anon
  USING (true);

-- 7. Storage bucket for media (images + videos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage policies: authenticated can upload/delete
CREATE POLICY "Authenticated upload on media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "Authenticated delete on media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'media');

-- 9. Storage: public read
CREATE POLICY "Public read on media"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'media');

-- 10. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings (booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_gallery_sort ON gallery_items (sort_order);
