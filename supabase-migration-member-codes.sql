-- Add member_code column to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS member_code TEXT;

-- Unique constraint: no two members in the same gym can share a code
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'members_gym_member_code_unique'
  ) THEN
    ALTER TABLE members
      ADD CONSTRAINT members_gym_member_code_unique UNIQUE (gym_id, member_code);
  END IF;
END $$;

-- Backfill existing members: assign codes ordered by created_at per gym
DO $$
DECLARE
  gym_rec  RECORD;
  mem_rec  RECORD;
  prefix   TEXT;
  counter  INT;
BEGIN
  FOR gym_rec IN
    SELECT gym_id, gym_name FROM gym_settings
  LOOP
    prefix  := UPPER(LEFT(COALESCE(TRIM(gym_rec.gym_name), 'G'), 1));
    counter := 1;

    FOR mem_rec IN
      SELECT id FROM members
      WHERE gym_id = gym_rec.gym_id
        AND member_code IS NULL
      ORDER BY created_at ASC
    LOOP
      UPDATE members
        SET member_code = prefix || LPAD(counter::TEXT, 4, '0')
      WHERE id = mem_rec.id;
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;
