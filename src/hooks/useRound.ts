import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useGameStore, type MaskedCard } from '@/stores/useGameStore'
import type { Round, Card } from '@/types/game'

export function useRound(roomId: string | undefined) {
  const { setRound, setCards } = useGameStore()

  async function refreshCards(roundId: string, status: string) {
    const { data } = await supabase
      .from('cards')
      .select('*')
      .eq('round_id', roundId)
      .eq('is_played', true)
    if (!data) return
    const cards = data as Card[]
    // Mask player_id during voting phase so UI can't tell who played what
    const masked: MaskedCard[] = cards.map((c) => ({
      ...c,
      player_id: status === 'voting' ? null : c.player_id,
    }))
    setCards(masked)
  }

  useEffect(() => {
    if (!roomId) return

    // Fetch latest round on mount
    supabase
      .from('rounds')
      .select('*')
      .eq('room_id', roomId)
      .order('round_number', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          const round = data as Round
          setRound(round)
          refreshCards(round.id, round.status)
        }
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
          const round = payload.new as Round
          setRound(round)
          refreshCards(round.id, round.status)
          // When round transitions to 'results', capture server time offset for synchronized countdown
          if (payload.new?.status === 'results' && payload.commit_timestamp) {
            const serverMs = Date.parse(payload.commit_timestamp)
            const localMs = Date.now()
            const offset = serverMs - localMs
            useGameStore.getState().setResultsServerOffset(offset)
          }
        },
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => {
        supabase
          .from('rounds')
          .select('id, status')
          .eq('room_id', roomId)
          .order('round_number', { ascending: false })
          .limit(1)
          .single()
          .then(({ data }) => {
            if (data) refreshCards(data.id, data.status)
          })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(sub)
    }
  }, [roomId])
}
