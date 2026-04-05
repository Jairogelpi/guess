-- ============================================================
-- Cron optimization + anon profile cleanup + ended rooms purge
-- ============================================================

-- ============================================================
-- 1. Reducir cleanup-temp-images de cada minuto a cada 10 min
--    (sigue siendo la edge function — necesaria para borrar storage)
-- ============================================================
SELECT cron.alter_job(
  job_id   := 1,
  schedule := '*/10 * * * *'
);

-- ============================================================
-- 2. Actualizar cleanup_stale_data() con:
--    - Purga de rows de temp_assets ya procesados por edge fn
--    - Limpieza de rooms ended > 7 días
--    - Limpieza de perfiles anónimos huérfanos > 7 días
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_stale_data()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_catalog
AS $$
DECLARE
  stale_ids  UUID[];
  anon_ids   UUID[];
BEGIN

  -- 1. Rooms en lobby > 24h
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

  -- 2. Rooms en playing > 48h sin actividad
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

  -- 3. Rooms ended > 7 días (ya no son útiles)
  SELECT ARRAY_AGG(id) INTO stale_ids
  FROM rooms
  WHERE status = 'ended'
    AND ended_at < now() - interval '7 days';

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

  -- 4. Temp assets ya procesados por la edge function (deleted_at set)
  --    La edge function borra el storage; aquí limpiamos el registro BD
  DELETE FROM temporary_generation_assets
  WHERE deleted_at IS NOT NULL
    AND deleted_at < now() - interval '1 hour';

  -- 5. Perfiles anónimos huérfanos > 7 días
  --    Sin sala activa ni galería — el CASCADE borra profiles automáticamente
  SELECT ARRAY_AGG(p.id) INTO anon_ids
  FROM profiles p
  WHERE p.is_anon = true
    AND p.created_at < now() - interval '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM room_players rp WHERE rp.player_id = p.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM gallery_cards gc WHERE gc.player_id = p.id
    );

  IF anon_ids IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = ANY(anon_ids);
    -- profiles se borra por CASCADE desde auth.users
  END IF;

END;
$$;
