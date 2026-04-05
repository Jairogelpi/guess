-- ============================================================
-- DB Cleanup & Hardening
-- 1. Limpieza de rooms/partidas abandonadas y assets expirados
-- 2. RLS en round_resolution_summaries
-- 3. Políticas para temporary_generation_assets
-- 4. Fix search_path en funciones con vulnerabilidad
-- 5. Índices sobre FK sin cubrir
-- ============================================================

-- ============================================================
-- 1. LIMPIEZA DE BASURA RESIDUAL
-- ============================================================

-- Rooms en lobby abandonadas (>24h sin iniciar partida)
DO $$
DECLARE
  stale_room_ids UUID[];
BEGIN
  SELECT ARRAY_AGG(id) INTO stale_room_ids
  FROM rooms
  WHERE status = 'lobby'
    AND created_at < now() - interval '24 hours';

  IF stale_room_ids IS NOT NULL THEN
    DELETE FROM lobby_messages   WHERE room_id = ANY(stale_room_ids);
    DELETE FROM room_players     WHERE room_id = ANY(stale_room_ids);
    -- rounds en esas rooms (por si acaso)
    DELETE FROM votes            WHERE round_id IN (SELECT id FROM rounds WHERE room_id = ANY(stale_room_ids));
    DELETE FROM round_scores     WHERE round_id IN (SELECT id FROM rounds WHERE room_id = ANY(stale_room_ids));
    DELETE FROM cards            WHERE round_id IN (SELECT id FROM rounds WHERE room_id = ANY(stale_room_ids));
    DELETE FROM round_resolution_summaries WHERE round_id IN (SELECT id FROM rounds WHERE room_id = ANY(stale_room_ids));
    DELETE FROM rounds           WHERE room_id = ANY(stale_room_ids);
    DELETE FROM rooms            WHERE id = ANY(stale_room_ids);
    RAISE NOTICE 'Eliminadas % rooms en lobby abandonadas', array_length(stale_room_ids, 1);
  END IF;
END $$;

-- Rooms en playing abandonadas (>48h sin actividad en rounds)
DO $$
DECLARE
  stale_room_ids UUID[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT r.id) INTO stale_room_ids
  FROM rooms r
  WHERE r.status = 'playing'
    AND NOT EXISTS (
      SELECT 1 FROM rounds rn
      WHERE rn.room_id = r.id
        AND rn.created_at > now() - interval '48 hours'
    )
    AND r.created_at < now() - interval '48 hours';

  IF stale_room_ids IS NOT NULL THEN
    DELETE FROM lobby_messages   WHERE room_id = ANY(stale_room_ids);
    DELETE FROM room_players     WHERE room_id = ANY(stale_room_ids);
    DELETE FROM votes            WHERE round_id IN (SELECT id FROM rounds WHERE room_id = ANY(stale_room_ids));
    DELETE FROM round_scores     WHERE round_id IN (SELECT id FROM rounds WHERE room_id = ANY(stale_room_ids));
    DELETE FROM cards            WHERE round_id IN (SELECT id FROM rounds WHERE room_id = ANY(stale_room_ids));
    DELETE FROM round_resolution_summaries WHERE round_id IN (SELECT id FROM rounds WHERE room_id = ANY(stale_room_ids));
    DELETE FROM rounds           WHERE room_id = ANY(stale_room_ids);
    DELETE FROM rooms            WHERE id = ANY(stale_room_ids);
    RAISE NOTICE 'Eliminadas % rooms en playing abandonadas', array_length(stale_room_ids, 1);
  END IF;
END $$;

-- Temporary generation assets expirados
DELETE FROM temporary_generation_assets
WHERE expires_at < now();

-- ============================================================
-- 2. RLS EN round_resolution_summaries (era ERROR: deshabilitado)
-- ============================================================

ALTER TABLE public.round_resolution_summaries ENABLE ROW LEVEL SECURITY;

-- Lectura: miembros de la sala pueden ver los resúmenes de sus rondas
CREATE POLICY rrs_select_member ON public.round_resolution_summaries
  FOR SELECT
  USING (
    is_room_member(
      (SELECT room_id FROM rounds WHERE id = round_resolution_summaries.round_id)
    )
  );

-- Escritura solo desde service role (edge functions) — sin policy INSERT para anon/authenticated
-- Los edge functions usan service_role key que bypasea RLS

-- ============================================================
-- 3. POLÍTICAS PARA temporary_generation_assets (RLS sin policies)
-- ============================================================

-- El dueño puede ver sus propios assets
CREATE POLICY tga_select_own ON public.temporary_generation_assets
  FOR SELECT
  USING (owner_id = auth.uid());

-- El dueño puede insertar sus propios assets
CREATE POLICY tga_insert_own ON public.temporary_generation_assets
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- El dueño puede actualizar sus propios assets (e.g. marcar deleted_at)
CREATE POLICY tga_update_own ON public.temporary_generation_assets
  FOR UPDATE
  USING (owner_id = auth.uid());

-- El dueño puede borrar sus propios assets
CREATE POLICY tga_delete_own ON public.temporary_generation_assets
  FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================
-- 4. FIX SEARCH_PATH EN FUNCIONES (vulnerabilidad WARN)
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_gallery_card_limit()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = public, pg_catalog
AS $$
DECLARE
  player_card_count integer;
BEGIN
  SELECT count(*)
  INTO player_card_count
  FROM public.gallery_cards
  WHERE player_id = NEW.player_id;

  IF player_card_count >= 8 THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'GALLERY_LIMIT_REACHED';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_card_generation_token()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = public, pg_catalog
AS $$
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
  FROM public.rounds
  WHERE id = NEW.round_id;

  SELECT generation_tokens INTO v_tokens
  FROM public.room_players
  WHERE room_id = v_room_id
    AND player_id = NEW.player_id;

  SELECT count(*) INTO v_existing_generated_cards
  FROM public.cards
  WHERE round_id = NEW.round_id
    AND player_id = NEW.player_id
    AND image_url IS NOT NULL
    AND COALESCE(is_played, FALSE) = FALSE;

  IF v_existing_generated_cards > 0 THEN
    IF COALESCE(v_tokens, 0) < 1 THEN
      RAISE EXCEPTION 'NO_TOKENS_LEFT';
    END IF;

    UPDATE public.room_players
    SET generation_tokens = generation_tokens - 1
    WHERE room_id = v_room_id
      AND player_id = NEW.player_id;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 5. ÍNDICES SOBRE FOREIGN KEYS SIN CUBRIR (performance)
-- ============================================================

-- cards.player_id
CREATE INDEX IF NOT EXISTS idx_cards_player_id
  ON public.cards (player_id);

-- gallery_cards.player_id
CREATE INDEX IF NOT EXISTS idx_gallery_cards_player_id
  ON public.gallery_cards (player_id);

-- lobby_messages.player_id
CREATE INDEX IF NOT EXISTS idx_lobby_messages_player_id
  ON public.lobby_messages (player_id);

-- lobby_messages.room_id
CREATE INDEX IF NOT EXISTS idx_lobby_messages_room_id
  ON public.lobby_messages (room_id);

-- rooms.host_id
CREATE INDEX IF NOT EXISTS idx_rooms_host_id
  ON public.rooms (host_id);

-- rooms.ended_by
CREATE INDEX IF NOT EXISTS idx_rooms_ended_by
  ON public.rooms (ended_by);

-- round_scores.player_id
CREATE INDEX IF NOT EXISTS idx_round_scores_player_id
  ON public.round_scores (player_id);

-- round_scores.round_id
CREATE INDEX IF NOT EXISTS idx_round_scores_round_id
  ON public.round_scores (round_id);

-- rounds.narrator_id
CREATE INDEX IF NOT EXISTS idx_rounds_narrator_id
  ON public.rounds (narrator_id);

-- rounds.room_id
CREATE INDEX IF NOT EXISTS idx_rounds_room_id
  ON public.rounds (room_id);

-- temporary_generation_assets.owner_id
CREATE INDEX IF NOT EXISTS idx_tga_owner_id
  ON public.temporary_generation_assets (owner_id);

-- votes.card_id
CREATE INDEX IF NOT EXISTS idx_votes_card_id
  ON public.votes (card_id);

-- Índice adicional útil: assets no expirados por owner (para el cleanup periódico)
CREATE INDEX IF NOT EXISTS idx_tga_expires_at
  ON public.temporary_generation_assets (expires_at)
  WHERE deleted_at IS NULL;
