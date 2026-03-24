-- Add generation tokens to players
ALTER TABLE room_players 
ADD COLUMN IF NOT EXISTS generation_tokens INT DEFAULT 15;

-- Add phase duration to rooms
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS phase_duration_seconds INT DEFAULT 60;

-- Add phase start tracking to rounds
ALTER TABLE rounds 
ADD COLUMN IF NOT EXISTS phase_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rounds
UPDATE rounds SET phase_started_at = created_at WHERE phase_started_at IS NULL;

-- Trigger to handle token consumption on card generation
CREATE OR REPLACE FUNCTION handle_card_generation_token() 
RETURNS TRIGGER AS $$
DECLARE
  v_room_id UUID;
  v_tokens INT;
BEGIN
  -- Get room_id from round
  SELECT room_id INTO v_room_id FROM rounds WHERE id = NEW.round_id;

  -- Get current tokens
  SELECT generation_tokens INTO v_tokens 
  FROM room_players 
  WHERE room_id = v_room_id AND player_id = NEW.player_id;

  IF v_tokens < 1 THEN
    RAISE EXCEPTION 'NO_TOKENS_LEFT';
  END IF;

  -- Consume 1 token for normal generation
  -- (Wildcards are handled via game-action edge function which will consume 2)
  UPDATE room_players 
  SET generation_tokens = generation_tokens - 1 
  WHERE room_id = v_room_id AND player_id = NEW.player_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_card_generate ON cards;
CREATE TRIGGER on_card_generate
BEFORE INSERT ON cards
FOR EACH ROW
WHEN (NEW.image_url IS NOT NULL) -- Only for newly generated cards
EXECUTE FUNCTION handle_card_generation_token();
