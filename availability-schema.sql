-- =============================================
-- Availability Table — Run this in Supabase SQL Editor
-- =============================================
CREATE TABLE IF NOT EXISTS availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber TEXT NOT NULL,
  slot_date DATE NOT NULL,
  slot_time TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(barber, slot_date, slot_time)
);

ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read availability"
  ON availability FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated full access on availability"
  ON availability FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_availability_barber_date ON availability (barber, slot_date);
CREATE INDEX IF NOT EXISTS idx_availability_date ON availability (slot_date);
