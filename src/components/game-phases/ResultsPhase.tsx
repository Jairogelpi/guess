// src/components/game-phases/ResultsPhase.tsx
import { useEffect, useRef, useState } from 'react'
import { ScrollView, StyleSheet, View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { ResultsReveal } from '@/components/game/ResultsReveal'
import { CardGrid } from '@/components/game/CardGrid'
import { CountdownButton } from '@/components/game/CountdownButton'
import { ScoreBoard } from '@/components/game/ScoreBoard'
import { fonts } from '@/constants/theme'
import type { RoomPlayer, RoundScore } from '@/types/game'

const COUNTDOWN_SECONDS = 10

interface Props {
  roomCode: string
  isHost: boolean
  isLastRound: boolean
  players: RoomPlayer[]
  roundScores?: RoundScore[]
}

export function ResultsPhase({ roomCode, isHost, isLastRound, players, roundScores = [] }: Props) {
  const { t } = useTranslation()
  const router = useRouter()
  const cards = useGameStore((s) => s.cards)
  const round = useGameStore((s) => s.round)
  const resultsServerOffset = useGameStore((s) => s.resultsServerOffset)
  const { gameAction } = useGameActions()
  const [confirmed, setConfirmed] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(COUNTDOWN_SECONDS)
  const hasAdvanced = useRef(false)  // prevents double-advance (manual confirm + auto-advance)

  // Compute countdown from server-relative time
  useEffect(() => {
    if (!round?.results_started_at) return
    const startedAt = Date.parse(round.results_started_at)

    const tick = () => {
      const serverNow = Date.now() + resultsServerOffset
      const elapsed = (serverNow - startedAt) / 1000
      const remaining = Math.max(0, COUNTDOWN_SECONDS - elapsed)
      setSecondsRemaining(remaining)
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
      // Navigate to end-of-game screen (no next_round action needed — game is over)
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

  const narratorCard = round ? cards.find((c) => c.player_id === round.narrator_id) : null
  const playerNames = Object.fromEntries(players.map((p) => [p.player_id, p.display_name]))

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {narratorCard && round?.clue && (
        <ResultsReveal cardUri={narratorCard.image_url} clue={round.clue} />
      )}

      <CardGrid
        cards={cards}
        playerNames={playerNames}
        narratorPlayerId={round?.narrator_id}
        readonly
      />

      <View style={styles.scoreSection}>
        <Text style={styles.scoreLabel}>{t('game.score')}</Text>
        <ScoreBoard players={players} roundScores={roundScores} />
      </View>

      <CountdownButton
        secondsRemaining={secondsRemaining}
        totalSeconds={COUNTDOWN_SECONDS}
        isHost={isHost}
        confirmed={confirmed}
        confirmedCount={confirmed ? 1 : 0}
        totalCount={players.length}
        isLastRound={isLastRound}
        onConfirm={handleConfirm}
        onAutoAdvance={isHost ? handleAdvance : () => {}}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 14, gap: 16 },
  scoreSection: { gap: 8 },
  scoreLabel: {
    color: 'rgba(255, 241, 222, 0.3)',
    fontSize: 10,
    fontFamily: fonts.title,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
})
