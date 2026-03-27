-- Add is_corrupted to round_players to track if a player's card in a round is a trap
ALTER TABLE round_players ADD COLUMN is_corrupted BOOLEAN DEFAULT FALSE;

-- Add corrupted_cards_remaining to room_players to limit usage per match
ALTER TABLE room_players ADD COLUMN corrupted_cards_remaining INT DEFAULT 2;

-- Comment for clarity
COMMENT ON COLUMN round_players.is_corrupted IS 'Secret flag indicating if the card submitted by this player in this round is a corrupted trap.';
COMMENT ON COLUMN room_players.corrupted_cards_remaining IS 'Remaining number of times this player can use the Corrupted Card mechanic in this room.';
