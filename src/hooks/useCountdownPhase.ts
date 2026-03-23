import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { COUNTDOWN_SECONDS } from '@/constants/game'

interface Params {
  roomCode: string
  isHost: boolean
  isLastRound: boolean
}

/**
 * Encapsulates the server-synchronized countdown and round-advance logic
 * used by ResultsPhase.
 *
 * - Reads `resultsServerOffset` from the store to keep all clients in sync.
 * - Guards against double-advance (e.g., manual confirm + timer auto-advance).
 * - On the last round, navigates to the ended screen instead of calling next_round.
 */
export function useCountdownPhase({ roomCode, isHost, isLastRound }: Params) {
  const router = useRouter()
  const round = useGameStore((s) => s.round)
  const resultsServerOffset = useGameStore((s) => s.resultsServerOffset)
  const { gameAction } = useGameActions()

  const [confirmed, setConfirmed] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(COUNTDOWN_SECONDS)
  const hasAdvanced = useRef(false)  // prevents double-advance (manual confirm + auto-advance)

  // Tick every 250ms, computing remaining time from server-relative clock
  useEffect(() => {
    if (!round?.results_started_at) return
    const startedAt = Date.parse(round.results_started_at)

    const tick = () => {
      const serverNow = Date.now() + resultsServerOffset
      const elapsed = (serverNow - startedAt) / 1000
      setSecondsRemaining(Math.max(0, COUNTDOWN_SECONDS - elapsed))
    }

    tick()
    const interval = setInterval(tick, 250)
    return () => clearInterval(interval)
  }, [round?.results_started_at, resultsServerOffset])

  async function handleAdvance() {
    if (hasAdvanced.current) return  // guard against double-advance
    hasAdvanced.current = true
    setAdvancing(true)
    if (isLastRound) {
      router.replace(`/room/${roomCode}/ended`)
    } else {
      await gameAction(roomCode, 'next_round')
    }
    setAdvancing(false)
  }

  async function handleConfirm() {
    setConfirmed(true)
    if (isHost) await handleAdvance()
  }

  return { confirmed, advancing, secondsRemaining, handleConfirm, handleAdvance }
}
