-- ============================================================
-- Power Fitness Gym – Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  photo_url TEXT,
  membership_type TEXT NOT NULL DEFAULT 'monthly',
  membership_start_date DATE NOT NULL,
  membership_end_date DATE NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 3. Allow all operations (admin controls access via password in the app)
CREATE POLICY "allow_all" ON members
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKET (do this in the Supabase Dashboard UI):
-- Go to Storage > New Bucket
-- Name: member-photos
-- Public bucket: YES (toggle on)
-- Click Create
-- ============================================================
