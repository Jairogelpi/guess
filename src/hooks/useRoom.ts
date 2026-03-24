import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getVisibleLobbyPlayers } from '@/lib/lobbyState'
import type { Room, RoomPlayer } from '@/types/game'

export interface UseRoomResult {
  room: Room | null
  players: RoomPlayer[]
  hydratingPlayers: boolean
  roomNotFound: boolean
  roomLoadFailed: boolean
  refresh: () => Promise<void>
}

export function useRoom(code: string | null): UseRoomResult {
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [hydratingPlayers, setHydratingPlayers] = useState(true)
  const [roomNotFound, setRoomNotFound] = useState(false)
  const [roomLoadFailed, setRoomLoadFailed] = useState(false)
  const roomIdRef = useRef<string | null>(null)
  const refreshRef = useRef<() => Promise<void>>(async () => {})

  useEffect(() => {
    roomIdRef.current = room?.id ?? null
  }, [room?.id])

  useEffect(() => {
    let cancelled = false
    let pollTimer: ReturnType<typeof setInterval> | null = null

    setRoom(null)
    setPlayers([])
    setHydratingPlayers(true)
    setRoomNotFound(false)
    setRoomLoadFailed(false)
    roomIdRef.current = null

    if (!code) {
      setHydratingPlayers(false)
      return () => {
        cancelled = true
      }
    }

    const loadPlayers = async (roomId: string) => {
      const { data, error } = await supabase
        .from('room_players')
        .select(`
          *,
          profiles (
            avatar_url
          )
        `)
        .eq('room_id', roomId)

      if (cancelled) return

      if (error) {
        setRoomLoadFailed(true)
        setHydratingPlayers(false)
        return
      }

      setPlayers(getVisibleLobbyPlayers((data ?? []) as RoomPlayer[]))
      setHydratingPlayers(false)
    }

    const refreshPlayers = async () => {
      const id = roomIdRef.current
      if (!id) return

      const { data, error } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', id)

      if (cancelled || error || !data) return

      setPlayers(getVisibleLobbyPlayers(data as RoomPlayer[]))
    }

    const loadRoom = async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .single()

      if (cancelled) return

      if (error) {
        if (error.code === 'PGRST116') {
          setRoomNotFound(true)
        } else {
          setRoomLoadFailed(true)
        }
        setHydratingPlayers(false)
        return
      }

      const resolved = data as Room
      setRoom(resolved)
      roomIdRef.current = resolved.id

      await loadPlayers(resolved.id)
    }

    refreshRef.current = async () => {
      await loadRoom()
    }

    const roomSub = supabase
      .channel(`room:${code}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${code}` },
        (payload) => {
          const updated = payload.new as Room
          setRoom(updated)
          roomIdRef.current = updated.id
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_players' },
        () => {
          void refreshPlayers()
        },
      )
      .subscribe()

    void loadRoom()
    pollTimer = setInterval(() => {
      void refreshRef.current()
    }, 2000)

    return () => {
      cancelled = true
      if (pollTimer) clearInterval(pollTimer)
      supabase.removeChannel(roomSub)
    }
  }, [code])

  return {
    room,
    players,
    hydratingPlayers,
    roomNotFound,
    roomLoadFailed,
    refresh: () => refreshRef.current(),
  }
}
