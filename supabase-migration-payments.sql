-- Revenue / payments ledger
CREATE TABLE IF NOT EXISTS payments (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id           UUID NOT NULL,
  member_id        UUID,
  member_name      TEXT,
  amount           NUMERIC NOT NULL DEFAULT 0,
  payment_method   TEXT NOT NULL DEFAULT 'cash', -- cash | gcash | bank | other
  reference_number TEXT,
  plan             TEXT,
  notes            TEXT,
  performed_by     TEXT,
  -- partial payment support
  total_due        NUMERIC,
  balance_remaining NUMERIC NOT NULL DEFAULT 0,
  -- income type
  transaction_type TEXT NOT NULL DEFAULT 'membership', -- membership | walkin | manual
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_gym_id_idx     ON payments (gym_id);
CREATE INDEX IF NOT EXISTS payments_member_id_idx  ON payments (member_id);
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON payments (created_at DESC);

-- Expenses ledger
CREATE TABLE IF NOT EXISTS expenses (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id         UUID NOT NULL,
  amount         NUMERIC NOT NULL DEFAULT 0,
  category       TEXT NOT NULL DEFAULT 'other', -- rent | utilities | equipment | salaries | supplies | other
  description    TEXT,
  payment_method TEXT DEFAULT 'cash',
  recorded_by    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS expenses_gym_id_idx     ON expenses (gym_id);
CREATE INDEX IF NOT EXISTS expenses_created_at_idx ON expenses (created_at DESC);
