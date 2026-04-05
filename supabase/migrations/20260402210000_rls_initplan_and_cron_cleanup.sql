-- ============================================================
-- RLS auth_rls_initplan fix + pg_cron auto-cleanup
-- Wraps auth.uid() in (SELECT auth.uid()) para que el planner
-- evalúe el uid una sola vez por query en vez de por cada fila.
-- ============================================================

-- ============================================================
-- profiles
-- ============================================================
DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own        ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own        ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own        ON public.profiles;

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING ((SELECT auth.uid()) = id);

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================================
-- gallery_cards
-- ============================================================
DROP POLICY IF EXISTS "Players manage own gallery" ON public.gallery_cards;
DROP POLICY IF EXISTS gallery_cards_delete_own     ON public.gallery_cards;
DROP POLICY IF EXISTS gallery_cards_insert_own     ON public.gallery_cards;
DROP POLICY IF EXISTS gallery_cards_select_own     ON public.gallery_cards;
DROP POLICY IF EXISTS gallery_cards_update_own     ON public.gallery_cards;

CREATE POLICY gallery_cards_select_own ON public.gallery_cards
  FOR SELECT USING ((SELECT auth.uid()) = player_id);

CREATE POLICY gallery_cards_insert_own ON public.gallery_cards
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = player_id);

CREATE POLICY gallery_cards_update_own ON public.gallery_cards
  FOR UPDATE
  USING ((SELECT auth.uid()) = player_id)
  WITH CHECK ((SELECT auth.uid()) = player_id);

CREATE POLICY gallery_cards_delete_own ON public.gallery_cards
  FOR DELETE USING ((SELECT auth.uid()) = player_id);

-- ============================================================
-- room_players
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can join rooms" ON public.room_players;
DROP POLICY IF EXISTS room_players_insert_own              ON public.room_players;
DROP POLICY IF EXISTS room_players_update_own              ON public.room_players;
DROP POLICY IF EXISTS room_players_update_own_active       ON public.room_players;

CREATE POLICY room_players_insert_own ON public.room_players
  FOR INSERT WITH CHECK (player_id = (SELECT auth.uid()));

-- Una sola policy de UPDATE (consolida las dos redundantes)
CREATE POLICY room_players_update_own ON public.room_players
  FOR UPDATE
  USING (player_id = (SELECT auth.uid()))
  WITH CHECK (player_id = (SELECT auth.uid()));

-- ============================================================
-- rooms
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Host can update their room"           ON public.rooms;

CREATE POLICY rooms_insert_own ON public.rooms
  FOR INSERT WITH CHECK (host_id = (SELECT auth.uid()));

CREATE POLICY rooms_update_host ON public.rooms
  FOR UPDATE
  USING (host_id = (SELECT auth.uid()))
  WITH CHECK (host_id = (SELECT auth.uid()));

-- ============================================================
-- cards
-- ============================================================
DROP POLICY IF EXISTS "Players read cards in their room rounds" ON public.cards;
DROP POLICY IF EXISTS cards_insert_own                         ON public.cards;
DROP POLICY IF EXISTS cards_insert_own_member                  ON public.cards;
DROP POLICY IF EXISTS cards_select_played_in_room              ON public.cards;

CREATE POLICY cards_select_member ON public.cards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rounds r
      JOIN room_players rp ON rp.room_id = r.room_id
      WHERE r.id = cards.round_id
        AND rp.player_id = (SELECT auth.uid())
    )
  );

CREATE POLICY cards_select_played_in_room ON public.cards
  FOR SELECT
  USING (
    is_played = true
    AND EXISTS (
      SELECT 1 FROM rounds r
      JOIN room_players rp ON rp.room_id = r.room_id
      WHERE r.id = cards.round_id
        AND rp.player_id = (SELECT auth.uid())
        AND rp.is_active = true
    )
  );

CREATE POLICY cards_insert_own_member ON public.cards
  FOR INSERT
  WITH CHECK (
    player_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM rounds r
      WHERE r.id = cards.round_id
        AND is_room_member(r.room_id)
    )
  );

-- ============================================================
-- lobby_messages
-- ============================================================
DROP POLICY IF EXISTS "Players in room read messages"    ON public.lobby_messages;
DROP POLICY IF EXISTS "Players insert own messages"      ON public.lobby_messages;
DROP POLICY IF EXISTS lobby_messages_insert_member       ON public.lobby_messages;
DROP POLICY IF EXISTS lobby_messages_insert_own          ON public.lobby_messages;
DROP POLICY IF EXISTS lobby_messages_insert_room_members ON public.lobby_messages;
DROP POLICY IF EXISTS lobby_messages_select_in_room      ON public.lobby_messages;
DROP POLICY IF EXISTS lobby_messages_select_member       ON public.lobby_messages;
DROP POLICY IF EXISTS lobby_messages_select_room_members ON public.lobby_messages;

CREATE POLICY lobby_messages_select_member ON public.lobby_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_players rp
      WHERE rp.room_id = lobby_messages.room_id
        AND rp.player_id = (SELECT auth.uid())
        AND rp.is_active = true
    )
  );

CREATE POLICY lobby_messages_insert_member ON public.lobby_messages
  FOR INSERT
  WITH CHECK (
    player_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM room_players rp
      WHERE rp.room_id = lobby_messages.room_id
        AND rp.player_id = (SELECT auth.uid())
        AND rp.is_active = true
    )
  );

-- ============================================================
-- rounds
-- ============================================================
DROP POLICY IF EXISTS rounds_select_in_room ON public.rounds;
DROP POLICY IF EXISTS rounds_select_member  ON public.rounds;

CREATE POLICY rounds_select_member ON public.rounds
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_players rp
      WHERE rp.room_id = rounds.room_id
        AND rp.player_id = (SELECT auth.uid())
        AND rp.is_active = true
    )
  );

-- ============================================================
-- round_scores
-- ============================================================
DROP POLICY IF EXISTS round_scores_select_in_room ON public.round_scores;
DROP POLICY IF EXISTS round_scores_select_member  ON public.round_scores;

CREATE POLICY round_scores_select_member ON public.round_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rounds r
      JOIN room_players rp ON rp.room_id = r.room_id
      WHERE r.id = round_scores.round_id
        AND rp.player_id = (SELECT auth.uid())
        AND rp.is_active = true
    )
  );

-- ============================================================
-- votes
-- ============================================================
DROP POLICY IF EXISTS votes_select_in_room ON public.votes;
DROP POLICY IF EXISTS votes_select_member  ON public.votes;

CREATE POLICY votes_select_member ON public.votes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rounds r
      JOIN room_players rp ON rp.room_id = r.room_id
      WHERE r.id = votes.round_id
        AND rp.player_id = (SELECT auth.uid())
        AND rp.is_active = true
    )
  );

-- ============================================================
-- temporary_generation_assets
-- ============================================================
DROP POLICY IF EXISTS tga_select_own ON public.temporary_generation_assets;
DROP POLICY IF EXISTS tga_insert_own ON public.temporary_generation_assets;
DROP POLICY IF EXISTS tga_update_own ON public.temporary_generation_assets;
DROP POLICY IF EXISTS tga_delete_own ON public.temporary_generation_assets;

CREATE POLICY tga_select_own ON public.temporary_generation_assets
  FOR SELECT USING (owner_id = (SELECT auth.uid()));

CREATE POLICY tga_insert_own ON public.temporary_generation_assets
  FOR INSERT WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY tga_update_own ON public.temporary_generation_assets
  FOR UPDATE USING (owner_id = (SELECT auth.uid()));

CREATE POLICY tga_delete_own ON public.temporary_generation_assets
  FOR DELETE USING (owner_id = (SELECT auth.uid()));

-- ============================================================
-- pg_cron: limpieza automática nocturna (3am UTC)
-- ============================================================

-- Función de limpieza reutilizable
CREATE OR REPLACE FUNCTION public.cleanup_stale_data()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_catalog
AS $$
DECLARE
  stale_ids UUID[];
BEGIN
  -- Rooms en lobby > 24h
  SELECT ARRAY_AGG(id) INTO stale_ids
  FROM rooms
  WHERE status = 'lobby'
    AND created_at < now() - interval '24 hours';

  IF stale_ids IS NOT NULL THEN
    DELETE FROM lobby_messages WHERE room_id = ANY(stale_ids);
    DELETE FROM room_players   WHERE room_id = ANY(stale_ids);
    DELETE FROM votes          WHERE round_id IN (SELECT id FROM rounds WHERE room_id = ANY(stale_ids));
    DELETE FROM round_scores   WHERE round_id IN (SELECT id FROM rounds WHERE room_id = ANY(stale_ids));
    DELETE FROM cards          WHERE round_id IN (SELECT id FROM rounds WHERE room_id = ANY(stale_ids));
    DELETE FROM round_resolution_summaries WHERE round_id IN (SELECT id FROM rounds WHERE room_id = ANY(stale_ids));
    DELETE FROM rounds         WHERE room_id = ANY(stale_ids);
    DELETE FROM rooms          WHERE id = ANY(stale_ids);
  END IF;

  -- Rooms en playing > 48h sin actividad
  SELECT ARRAY_AGG(DISTINCT r.id) INTO stale_ids
  FROM rooms r
  WHERE r.status = 'playing'
    AND r.created_at < now() - interval '48 hours'
    AND NOT EXISTS (
      SELECT 1 FROM rounds rn
      WHERE rn.room_id = r.id
        AND rn.created_at > now() - interval '48 hours'
    );

  IF stale_ids IS NOT NULL THEN
    DELETE FROM lobby_messages WHERE room_id = ANY(stale_ids);
    DELETE FROM room_players   WHERE room_id = ANY(stale_ids);
    DELETE FROM votes          WHERE round_id IN (SELECT id FROM rounds WHERE room_id = ANY(stale_ids));
    DELETE FROM round_scores   WHERE round_id IN (SELECT id FROM rounds WHERE room_id = ANY(stale_ids));
    DELETE FROM cards          WHERE round_id IN (SELECT id FROM rounds WHERE room_id = ANY(stale_ids));
    DELETE FROM round_resolution_summaries WHERE round_id IN (SELECT id FROM rounds WHERE room_id = ANY(stale_ids));
    DELETE FROM rounds         WHERE room_id = ANY(stale_ids);
    DELETE FROM rooms          WHERE id = ANY(stale_ids);
  END IF;

  -- Temp assets expirados
  DELETE FROM temporary_generation_assets
  WHERE expires_at < now();
END;
$$;

-- Programar el job nocturno (3:00 AM UTC)
SELECT cron.schedule(
  'nightly-stale-data-cleanup',
  '0 3 * * *',
  'SELECT public.cleanup_stale_data()'
);
