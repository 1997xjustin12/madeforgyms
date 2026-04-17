-- ============================================================
-- MadeForGyms — Multi-Tenant Migration
-- Run in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Create gyms table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gyms (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  owner_email TEXT,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON gyms FOR ALL USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- STEP 2: Create gym_applications table (signup requests)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gym_applications (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_name      TEXT NOT NULL,
  owner_name    TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  location      TEXT,
  message       TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes         TEXT,   -- your internal notes when reviewing
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gym_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON gym_applications FOR ALL USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- STEP 3: Create gym_admins table
-- Links a Supabase auth user to a gym
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gym_admins (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id     UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL,  -- Supabase auth.users id
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gym_id, user_id)
);

ALTER TABLE gym_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON gym_admins FOR ALL USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- STEP 4: Insert Power Fitness Gym as gym #1
-- ─────────────────────────────────────────────────────────────
INSERT INTO gyms (slug, name, owner_email, status)
VALUES ('powerfitnessgym', 'Power Fitness Gym', 'admin@powerfitnessgym.com', 'active')
ON CONFLICT (slug) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- STEP 5: Add gym_id to all existing tables
-- ─────────────────────────────────────────────────────────────

-- members
ALTER TABLE members ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;

-- gym_settings
ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;

-- attendance
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;

-- instructors
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;

-- coach_entries
ALTER TABLE coach_entries ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;

-- renewal_requests
ALTER TABLE renewal_requests ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;

-- coaching_subscriptions
ALTER TABLE coaching_subscriptions ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;

-- activity_logs
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;


-- ─────────────────────────────────────────────────────────────
-- STEP 6: Migrate all existing data → Power Fitness Gym
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  pfg_id UUID;
BEGIN
  SELECT id INTO pfg_id FROM gyms WHERE slug = 'powerfitnessgym';

  UPDATE members              SET gym_id = pfg_id WHERE gym_id IS NULL;
  UPDATE gym_settings         SET gym_id = pfg_id WHERE gym_id IS NULL;
  UPDATE attendance           SET gym_id = pfg_id WHERE gym_id IS NULL;
  UPDATE instructors          SET gym_id = pfg_id WHERE gym_id IS NULL;
  UPDATE coach_entries        SET gym_id = pfg_id WHERE gym_id IS NULL;
  UPDATE renewal_requests     SET gym_id = pfg_id WHERE gym_id IS NULL;
  UPDATE coaching_subscriptions SET gym_id = pfg_id WHERE gym_id IS NULL;
  UPDATE activity_logs        SET gym_id = pfg_id WHERE gym_id IS NULL;
END $$;


-- ─────────────────────────────────────────────────────────────
-- STEP 7: Make gym_id NOT NULL now that all rows are migrated
-- ─────────────────────────────────────────────────────────────
ALTER TABLE members               ALTER COLUMN gym_id SET NOT NULL;
ALTER TABLE gym_settings          ALTER COLUMN gym_id SET NOT NULL;
ALTER TABLE attendance            ALTER COLUMN gym_id SET NOT NULL;
ALTER TABLE instructors           ALTER COLUMN gym_id SET NOT NULL;
ALTER TABLE coach_entries         ALTER COLUMN gym_id SET NOT NULL;
ALTER TABLE renewal_requests      ALTER COLUMN gym_id SET NOT NULL;
ALTER TABLE coaching_subscriptions ALTER COLUMN gym_id SET NOT NULL;
ALTER TABLE activity_logs         ALTER COLUMN gym_id SET NOT NULL;


-- ─────────────────────────────────────────────────────────────
-- STEP 8: Add indexes for performance
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_members_gym_id               ON members(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_settings_gym_id          ON gym_settings(gym_id);
CREATE INDEX IF NOT EXISTS idx_attendance_gym_id            ON attendance(gym_id);
CREATE INDEX IF NOT EXISTS idx_instructors_gym_id           ON instructors(gym_id);
CREATE INDEX IF NOT EXISTS idx_coach_entries_gym_id         ON coach_entries(gym_id);
CREATE INDEX IF NOT EXISTS idx_renewal_requests_gym_id      ON renewal_requests(gym_id);
CREATE INDEX IF NOT EXISTS idx_coaching_subscriptions_gym_id ON coaching_subscriptions(gym_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_gym_id         ON activity_logs(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_admins_user_id           ON gym_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_admins_gym_id            ON gym_admins(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_applications_status      ON gym_applications(status);


-- ─────────────────────────────────────────────────────────────
-- STEP 9: Link your existing admin account to Power Fitness Gym
-- Replace 'YOUR-USER-ID-HERE' with your Supabase auth user ID
-- Find it in: Supabase Dashboard > Authentication > Users
-- ─────────────────────────────────────────────────────────────

INSERT INTO gym_admins (gym_id, user_id, email)
SELECT id, '4e98aac0-139f-46bd-9b8f-91baab316049', 'admin@powerfitnessgym.com'
FROM gyms WHERE slug = 'powerfitnessgym';

-- ^^^ Uncomment the lines above after replacing YOUR-USER-ID-HERE ^^^


-- ─────────────────────────────────────────────────────────────
-- DONE. Verify with:
-- SELECT * FROM gyms;
-- SELECT COUNT(*) FROM members WHERE gym_id IS NOT NULL;
-- SELECT COUNT(*) FROM gym_settings WHERE gym_id IS NOT NULL;
-- ─────────────────────────────────────────────────────────────
