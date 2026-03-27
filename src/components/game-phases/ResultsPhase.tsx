// src/components/game-phases/ResultsPhase.tsx
import { useMemo } from 'react'
import { ScrollView, StyleSheet, View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/useGameStore'
import { useCountdownPhase } from '@/hooks/useCountdownPhase'
import { GameBoard } from '@/components/game/GameBoard'
import { ResultsReveal } from '@/components/game/ResultsReveal'
import { CardGrid } from '@/components/game/CardGrid'
import { CountdownButton } from '@/components/game/CountdownButton'
import { ScoreBoard } from '@/components/game/ScoreBoard'
import { colors, fonts } from '@/constants/theme'
import { COUNTDOWN_SECONDS } from '@/constants/game'
import type { RoomPlayer, RoundScore } from '@/types/game'

interface Props {
  roomCode: string
  isHost: boolean
  isLastRound: boolean
  players: RoomPlayer[]
  roundScores?: RoundScore[]
}

export function ResultsPhase({ roomCode, isHost, isLastRound, players, roundScores = [] }: Props) {
  const { t } = useTranslation()
  const cards = useGameStore((s) => s.cards)
  const round = useGameStore((s) => s.round)

  const { confirmed, secondsRemaining, handleConfirm, handleAdvance } =
    useCountdownPhase({ roomCode, isHost, isLastRound })

  const narratorCard = useMemo(
    () => round ? cards.find((c) => c.player_id === round.narrator_id) ?? null : null,
    [cards, round?.narrator_id],
  )
  const playerNames = useMemo(
    () => Object.fromEntries(players.map((p) => [p.player_id, p.display_name])),
    [players],
  )

  return (
    <GameBoard
      center={
        <ScrollView contentContainerStyle={styles.content}>
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
        </ScrollView>
      }
      actionBar={
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
      }
    />
  )
}

const styles = StyleSheet.create({
  content: { padding: 14, gap: 16 },
  scoreSection: { gap: 8 },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: fonts.title,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
})
