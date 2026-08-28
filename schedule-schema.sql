-- =============================================
-- 3-Layer Availability System — SQL Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Salon hours (Layer 1)
CREATE TABLE IF NOT EXISTS salon_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sun, 1=Mon...6=Sat
  open_time TEXT,        -- "09:00"
  close_time TEXT,       -- "20:00"
  is_closed BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(day_of_week)
);

ALTER TABLE salon_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read salon_hours"
  ON salon_hours FOR SELECT TO anon USING (true);

CREATE POLICY "Authenticated full access on salon_hours"
  ON salon_hours FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Stylist recurring schedule (Layer 2)
CREATE TABLE IF NOT EXISTS stylist_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber TEXT NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,    -- "09:00"
  end_time TEXT NOT NULL,      -- "17:00"
  is_working BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(barber, day_of_week)
);

ALTER TABLE stylist_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read stylist_schedule"
  ON stylist_schedule FOR SELECT TO anon USING (true);

CREATE POLICY "Authenticated full access on stylist_schedule"
  ON stylist_schedule FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Stylist days off / vacations (Layer 2 override)
CREATE TABLE IF NOT EXISTS stylist_days_off (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber TEXT NOT NULL,
  off_date DATE NOT NULL,
  reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(barber, off_date)
);

ALTER TABLE stylist_days_off ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read stylist_days_off"
  ON stylist_days_off FOR SELECT TO anon USING (true);

CREATE POLICY "Authenticated full access on stylist_days_off"
  ON stylist_days_off FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stylist_schedule_barber ON stylist_schedule (barber);
CREATE INDEX IF NOT EXISTS idx_stylist_days_off_barber_date ON stylist_days_off (barber, off_date);
CREATE INDEX IF NOT EXISTS idx_salon_hours_day ON salon_hours (day_of_week);

-- Seed default salon hours from constants.ts
INSERT INTO salon_hours (day_of_week, open_time, close_time, is_closed) VALUES
  (0, '13:00', '20:00', false),   -- Sunday
  (1, '10:00', '20:00', false),   -- Monday
  (2, NULL, NULL, true),           -- Tuesday (closed)
  (3, '10:00', '20:00', false),   -- Wednesday
  (4, '10:00', '20:00', false),   -- Thursday
  (5, '10:00', '21:00', false),   -- Friday
  (6, '10:00', '21:00', false)    -- Saturday
ON CONFLICT (day_of_week) DO NOTHING;
