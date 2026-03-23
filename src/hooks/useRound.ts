import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useGameStore } from '@/stores/useGameStore'
import { maskCard } from '@/lib/cardMasking'
import type { Round, Card } from '@/types/game'

/**
 * Subscribes to the active round for a given room.
 *
 * - Fetches the latest round on mount and writes it to `useGameStore`.
 * - Subscribes to `rounds` and `cards` changes via a single Supabase channel.
 * - Masks `player_id` on cards during the voting phase so the UI can't reveal
 *   who played which card before results are shown.
 * - Computes a server-time offset when the round transitions to `results` so
 *   the countdown timer stays in sync across all clients.
 * - Cancels all pending async work and removes the channel on unmount.
 *
 * State is written directly to `useGameStore`; this hook has no return value.
 */
export function useRound(roomId: string | undefined) {
  const { setRound, setCards } = useGameStore()

  useEffect(() => {
    if (!roomId) return
    let cancelled = false

    // Moved inside effect so it has access to `cancelled` and won't
    // update state after the component unmounts or roomId changes.
    async function refreshCards(roundId: string, status: string) {
      const { data } = await supabase
        .from('cards')
        .select('*')
        .eq('round_id', roundId)
        .eq('is_played', true)
      if (cancelled || !data) return
      const cards = data as Card[]
      setCards(cards.map((c) => maskCard(c, status)))
    }

    // Fetch latest round on mount
    supabase
      .from('rounds')
      .select('*')
      .eq('room_id', roomId)
      .order('round_number', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (cancelled || !data) return
        const round = data as Round
        setRound(round)
        refreshCards(round.id, round.status)
      })

    const sub = supabase
      .channel(`rounds:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rounds',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (cancelled) return
          const round = payload.new as Round
          setRound(round)
          refreshCards(round.id, round.status)
          // When round transitions to 'results', capture server time offset for synchronized countdown
          if (round.status === 'results' && payload.commit_timestamp) {
            const serverMs = Date.parse(payload.commit_timestamp)
            const localMs = Date.now()
            const offset = serverMs - localMs
            useGameStore.getState().setResultsServerOffset(offset)
          }
        },
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => {
        if (cancelled) return
        supabase
          .from('rounds')
          .select('id, status')
          .eq('room_id', roomId)
          .order('round_number', { ascending: false })
          .limit(1)
          .single()
          .then(({ data }) => {
            if (cancelled || !data) return
            refreshCards(data.id, data.status)
          })
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(sub)
    }
  }, [roomId])
}
