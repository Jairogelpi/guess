import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useGameActions } from '@/hooks/useGameActions'
import type {
  MatchmakingQueueTicket,
  QuickMatchEnqueuePayload,
  QuickMatchMatchedPlayer,
} from '@/types/game'

type Phase = 'idle' | 'searching' | 'matched'

async function loadMatchedPlayers(roomCode: string): Promise<QuickMatchMatchedPlayer[]> {
  const { data: room } = await supabase.from('rooms').select('id').eq('code', roomCode).maybeSingle()
  if (!room?.id) return []

  const { data } = await supabase
    .from('room_players')
    .select('player_id, display_name, is_host, profiles(avatar_url)')
    .eq('room_id', room.id)
    .eq('is_active', true)
    .order('joined_at', { ascending: true })

  return (data ?? []).map((player) => ({
    playerId: player.player_id,
    displayName: player.display_name,
    avatarUrl: player.profiles?.avatar_url ?? null,
    isHost: player.is_host,
  }))
}

async function loadRoomStatus(roomCode: string): Promise<string | null> {
  const { data } = await supabase
    .from('rooms')
    .select('status')
    .eq('code', roomCode)
    .maybeSingle()

  return data?.status ?? null
}

export function useQuickMatch() {
  const { userId } = useAuth()
  const { enqueueQuickMatch, cancelQuickMatch, getQuickMatchStatus } = useGameActions()
  const [ticket, setTicket] = useState<MatchmakingQueueTicket | null>(null)
  const [matchedPlayers, setMatchedPlayers] = useState<QuickMatchMatchedPlayer[]>([])
  const [roomStatus, setRoomStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [countdownRemainingMs, setCountdownRemainingMs] = useState(0)

  const phase: Phase = useMemo(() => {
    if (!ticket) return 'idle'
    return ticket.status === 'matched' ? 'matched' : 'searching'
  }, [ticket])

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    setLoading(true)
    try {
      const result = await getQuickMatchStatus(options)
      setTicket(result?.ticket ?? null)
    } finally {
      setLoading(false)
    }
  }, [getQuickMatchStatus])

  const refreshRoomStatus = useCallback(async (roomCode: string) => {
    const nextStatus = await loadRoomStatus(roomCode)
    setRoomStatus(nextStatus)
    return nextStatus
  }, [])

  const enqueue = useCallback(async (payload: QuickMatchEnqueuePayload) => {
    setSubmitting(true)
    try {
      const result = await enqueueQuickMatch(payload)
      if (result?.ticket) setTicket(result.ticket)
      return result
    } finally {
      setSubmitting(false)
    }
  }, [enqueueQuickMatch])

  const cancel = useCallback(async () => {
    setSubmitting(true)
    try {
      const ok = await cancelQuickMatch()
      if (ok) {
        setTicket(null)
        setMatchedPlayers([])
        setRoomStatus(null)
      }
      return ok
    } finally {
      setSubmitting(false)
    }
  }, [cancelQuickMatch])

  useEffect(() => {
    if (!userId) return
    void getQuickMatchStatus({ silent: true }).then((result) => {
      setTicket(result?.ticket ?? null)
      setLoading(false)
    })
  }, [userId])

  useEffect(() => {
    if (!userId || !ticket) return

    const timer = setInterval(() => {
      void refresh({ silent: true })
    }, 2000)

    return () => clearInterval(timer)
  }, [refresh, ticket, userId])

  useEffect(() => {
    if (!userId) return

    const channel = supabase.channel(`quick-match:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matchmaking_queue',
          filter: `player_id=eq.${userId}`,
        },
        (payload) => {
          const next = (payload.new || payload.old || null) as MatchmakingQueueTicket | null
          if (!next || next.status === 'cancelled' || next.status === 'expired') {
            setTicket(null)
            setMatchedPlayers([])
            return
          }
          setTicket(next)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  useEffect(() => {
    const matchedRoomCode = ticket?.matched_room_code

    if (ticket?.status !== 'matched' || !matchedRoomCode) {
      setMatchedPlayers([])
      setRoomStatus(null)
      return
    }

    loadMatchedPlayers(matchedRoomCode)
      .then(setMatchedPlayers)
      .catch(() => setMatchedPlayers([]))

    void refreshRoomStatus(matchedRoomCode)
  }, [refreshRoomStatus, ticket?.matched_room_code, ticket?.status])

  useEffect(() => {
    const matchedRoomCode = ticket?.matched_room_code

    if (ticket?.status !== 'matched' || !matchedRoomCode) {
      setRoomStatus(null)
      return
    }

    const channel = supabase.channel(`quick-match-room:${matchedRoomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `code=eq.${matchedRoomCode}`,
        },
        (payload) => {
          const nextStatus = (payload.new as { status?: string } | null)?.status ?? null
          setRoomStatus(nextStatus)
        },
      )
      .subscribe()

    const timer = setInterval(() => {
      void refreshRoomStatus(matchedRoomCode)
      void loadMatchedPlayers(matchedRoomCode)
        .then(setMatchedPlayers)
        .catch(() => setMatchedPlayers([]))
    }, 1500)

    return () => {
      clearInterval(timer)
      supabase.removeChannel(channel)
    }
  }, [refreshRoomStatus, ticket?.matched_room_code, ticket?.status])

  useEffect(() => {
    const countdownStartsAt = ticket?.countdown_starts_at

    if (ticket?.status !== 'matched' || !countdownStartsAt) {
      setCountdownRemainingMs(0)
      return
    }

    const updateCountdown = () => {
      const endsAt = Date.parse(countdownStartsAt)
      setCountdownRemainingMs(Math.max(0, endsAt - Date.now()))
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 250)
    return () => clearInterval(timer)
  }, [ticket?.countdown_starts_at, ticket?.status])

  return {
    cancel,
    countdownRemainingMs,
    enqueue,
    loading,
    matchedPlayers,
    phase,
    refresh,
    roomStatus,
    submitting,
    ticket,
  }
}
