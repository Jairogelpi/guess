import { useMemo, useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { DecorativeTitle } from '@/components/branding/DecorativeTitle'
import { CardGrid } from '@/components/game/CardGrid'
import { ScoreBoard } from '@/components/game/ScoreBoard'
import { Button } from '@/components/ui/Button'
import { useGameActions } from '@/hooks/useGameActions'
import { useGameStore } from '@/stores/useGameStore'
import { colors } from '@/constants/theme'
import type { RoomPlayer, RoundScore } from '@/types/game'

interface Props {
  roomCode: string
  players: RoomPlayer[]
  roundScores?: RoundScore[]
}

export function ResultsPhase({ roomCode, players, roundScores = [] }: Props) {
  const { t } = useTranslation()
  const cards = useGameStore((s) => s.cards)
  const round = useGameStore((s) => s.round)
  const { gameAction } = useGameActions()
  const [advancing, setAdvancing] = useState(false)

  const playerNames = useMemo(
    () => Object.fromEntries(players.map((player) => [player.player_id, player.display_name])),
    [players],
  )
  const narratorCard = round ? cards.find((card) => card.player_id === round.narrator_id) : null

  async function handleNext() {
    setAdvancing(true)
    await gameAction(roomCode, 'next_round')
    setAdvancing(false)
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <DecorativeTitle variant="screen" tone="plain" style={styles.title}>
          {t('game.results')}
        </DecorativeTitle>
      </View>

      {narratorCard && round?.clue && (
        <View style={styles.narratorBlock}>
          <DecorativeTitle variant="eyebrow" tone="gold" style={styles.narratorLabel}>
            {t('game.narratorCard')}
          </DecorativeTitle>
          <Text style={styles.narratorClue}>"{round.clue}"</Text>
        </View>
      )}

      <CardGrid cards={cards} playerNames={playerNames} readonly />

      <View style={styles.scoreSection}>
        <DecorativeTitle variant="eyebrow" tone="muted" align="left" style={styles.scoreLabel}>
          {t('game.score')}
        </DecorativeTitle>
        <ScoreBoard players={players} roundScores={roundScores} />
      </View>

      <Button onPress={handleNext} loading={advancing}>
        {t('game.nextRound')}
      </Button>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { gap: 20, padding: 16 },
  titleRow: { alignItems: 'center' },
  title: {
    fontSize: 22,
    lineHeight: 28,
  },
  narratorBlock: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  narratorLabel: {
    letterSpacing: 2.8,
  },
  narratorClue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  scoreSection: { gap: 8 },
  scoreLabel: {
    paddingHorizontal: 4,
    letterSpacing: 2.6,
  },
})
