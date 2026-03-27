-- Private matches default to unlimited time per phase.
-- NULL means no time limit; the backend won't auto-advance the phase.
ALTER TABLE rooms 
ALTER COLUMN phase_duration_seconds SET DEFAULT NULL;

-- Set existing rooms that still have the old default to unlimited
UPDATE rooms 
SET phase_duration_seconds = NULL 
WHERE phase_duration_seconds = 60 
  AND status IN ('waiting', 'playing');
