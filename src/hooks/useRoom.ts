import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { getVisibleLobbyPlayers } from '@/lib/lobbyState'
import type { Room, RoomPlayer } from '@/types/game'

export interface UseRoomResult {
  room: Room | null
  players: RoomPlayer[]
  hydratingPlayers: boolean
  roomNotFound: boolean
  roomLoadFailed: boolean
}

export function useRoom(code: string | null): UseRoomResult {
  const router = useRouter()
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [hydratingPlayers, setHydratingPlayers] = useState(true)
  const [roomNotFound, setRoomNotFound] = useState(false)
  const [roomLoadFailed, setRoomLoadFailed] = useState(false)

  const roomIdRef = useRef<string | null>(null)

  useEffect(() => {
    roomIdRef.current = room?.id ?? null
  }, [room?.id])

  useEffect(() => {
    if (!code) return

    const roomCode = code
    let cancelled = false

    async function loadRoom() {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode)
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

      if (resolved.status === 'playing') {
        router.replace(`/room/${code}/game`)
        return
      }
      if (resolved.status === 'ended') {
        router.replace(`/room/${code}/ended`)
        return
      }

      await loadPlayers(resolved.id)
    }

    async function loadPlayers(roomId: string) {
      if (cancelled) return
      const { data } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', roomId)

      if (cancelled) return
      if (data) setPlayers(getVisibleLobbyPlayers(data as RoomPlayer[]))
      setHydratingPlayers(false)
    }

    function refreshPlayers() {
      const id = roomIdRef.current
      if (!id) return
      supabase
        .from('room_players')
        .select('*')
        .eq('room_id', id)
        .then(({ data }) => {
          if (cancelled || !data) return
          setPlayers(getVisibleLobbyPlayers(data as RoomPlayer[]))
        })
    }

    const roomSub = supabase
      .channel(`room:${code}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${code}` },
        (payload) => {
          const updated = payload.new as Room
          setRoom(updated)
          if (updated.status === 'playing') {
            router.replace(`/room/${code}/game`)
          } else if (updated.status === 'ended') {
            router.replace(`/room/${code}/ended`)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_players' },
        refreshPlayers,
      )
      .subscribe()

    loadRoom()

    return () => {
      cancelled = true
      supabase.removeChannel(roomSub)
    }
  }, [code])

  return { room, players, hydratingPlayers, roomNotFound, roomLoadFailed }
}
