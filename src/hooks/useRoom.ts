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
    let cancelled = false

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
        .select('*')
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

      if (resolved.status === 'playing') {
        setHydratingPlayers(false)
        router.replace(`/room/${code}/game`)
        return
      }

      if (resolved.status === 'ended') {
        setHydratingPlayers(false)
        router.replace(`/room/${code}/ended`)
        return
      }

      await loadPlayers(resolved.id)
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
        () => {
          void refreshPlayers()
        },
      )
      .subscribe()

    void loadRoom()

    return () => {
      cancelled = true
      supabase.removeChannel(roomSub)
    }
  }, [code, router])

  return { room, players, hydratingPlayers, roomNotFound, roomLoadFailed }
}
