ALTER TABLE rounds
  ADD COLUMN IF NOT EXISTS results_started_at timestamptz;

COMMENT ON COLUMN rounds.results_started_at IS
  'Set by server when round enters results phase. Used by all clients for synchronized 10s countdown.';
