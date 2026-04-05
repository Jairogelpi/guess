CREATE OR REPLACE FUNCTION handle_card_generation_token()
RETURNS TRIGGER AS $$
DECLARE
  v_room_id UUID;
  v_tokens INT;
  v_existing_generated_cards INT;
BEGIN
  -- Gallery wildcards spend their own cost inside the edge function.
  IF COALESCE(NEW.is_played, FALSE) THEN
    RETURN NEW;
  END IF;

  SELECT room_id INTO v_room_id
  FROM rounds
  WHERE id = NEW.round_id;

  SELECT generation_tokens INTO v_tokens
  FROM room_players
  WHERE room_id = v_room_id
    AND player_id = NEW.player_id;

  SELECT count(*) INTO v_existing_generated_cards
  FROM cards
  WHERE round_id = NEW.round_id
    AND player_id = NEW.player_id
    AND image_url IS NOT NULL
    AND COALESCE(is_played, FALSE) = FALSE;

  IF v_existing_generated_cards > 0 THEN
    IF COALESCE(v_tokens, 0) < 1 THEN
      RAISE EXCEPTION 'NO_TOKENS_LEFT';
    END IF;

    UPDATE room_players
    SET generation_tokens = generation_tokens - 1
    WHERE room_id = v_room_id
      AND player_id = NEW.player_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_card_generate ON cards;
CREATE TRIGGER on_card_generate
BEFORE INSERT ON cards
FOR EACH ROW
WHEN (NEW.image_url IS NOT NULL)
EXECUTE FUNCTION handle_card_generation_token();
