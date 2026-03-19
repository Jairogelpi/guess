import { useMemo, useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { CardGrid } from '@/components/game/CardGrid'
import { ScoreBoard } from '@/components/game/ScoreBoard'
import { Button } from '@/components/ui/Button'
import { colors, fonts, radii, shadows } from '@/constants/theme'
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
    () => Object.fromEntries(players.map((p) => [p.player_id, p.display_name])),
    [players],
  )
  const narratorCard = round ? cards.find((c) => c.player_id === round.narrator_id) : null

  async function handleNext() {
    setAdvancing(true)
    await gameAction(roomCode, 'next_round')
    setAdvancing(false)
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{t('game.results')}</Text>
        <Text style={styles.infoBody}>{t('game.resultsHint')}</Text>
      </View>

      {narratorCard && round?.clue && (
        <View style={styles.narratorBlock}>
          <Text style={styles.narratorLabel}>{t('game.narratorCard')}</Text>
          <Text style={styles.narratorClue}>"{round.clue}"</Text>
        </View>
      )}

      <CardGrid cards={cards} playerNames={playerNames} readonly />

      <View style={styles.scoreSection}>
        <Text style={styles.scoreLabel}>{t('game.score')}</Text>
        <ScoreBoard players={players} roundScores={roundScores} />
      </View>

      <Text style={styles.nextHint}>{t('game.resultsNextHint')}</Text>

      <Button onPress={handleNext} loading={advancing}>
        {t('game.nextRound')}
      </Button>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { gap: 20, padding: 16 },
  infoCard: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    backgroundColor: 'rgba(18, 10, 6, 0.72)',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 8,
    ...shadows.surface,
  },
  infoTitle: {
    color: colors.goldLight,
    fontSize: 16,
    fontFamily: fonts.title,
    letterSpacing: 1,
    textAlign: 'center',
  },
  infoBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
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
    color: colors.gold,
    fontSize: 11,
    fontFamily: fonts.title,
    letterSpacing: 3,
  },
  narratorClue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontFamily: fonts.title,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scoreSection: { gap: 8 },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 2.5,
    fontFamily: fonts.title,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  nextHint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
})
