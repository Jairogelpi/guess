import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import type { Room, RoomPlayer } from '@/types/game'

export function useRoom(code: string | null) {
  const router = useRouter()
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const roomIdRef = useRef<string | null>(null)

  // Keep ref in sync with room state
  useEffect(() => {
    roomIdRef.current = room?.id ?? null
  }, [room?.id])

  useEffect(() => {
    if (!code) return

    supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single()
      .then(({ data }) => {
        if (data) setRoom(data as Room)
      })

    const fetchPlayers = (roomId: string) =>
      supabase
        .from('room_players')
        .select('*')
        .eq('room_id', roomId)
        .then(({ data }) => {
          if (data) setPlayers(data as RoomPlayer[])
        })

    const roomSub = supabase
      .channel(`room:${code}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${code}` },
        (payload) => {
          const updated = payload.new as Room
          setRoom(updated)
          if (updated.status === 'ended') {
            router.replace(`/room/${code}/ended`)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_players' },
        () => {
          // Use ref to avoid stale closure — room state may not be
          // available yet when this callback was created.
          const id = roomIdRef.current
          if (id) fetchPlayers(id)
        },
      )
      .subscribe()

    // Once room is fetched, load players
    supabase
      .from('rooms')
      .select('id')
      .eq('code', code)
      .single()
      .then(({ data }) => {
        if (data) fetchPlayers(data.id)
      })

    return () => {
      supabase.removeChannel(roomSub)
    }
  }, [code])

  return { room, players }
}
