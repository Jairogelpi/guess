import { useMemo, useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { CardGrid } from '@/components/game/CardGrid'
import { ScoreBoard } from '@/components/game/ScoreBoard'
import { Button } from '@/components/ui/Button'
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
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t('game.results')}</Text>
      </View>

      {narratorCard && round?.clue && (
        <View style={styles.narratorBlock}>
          <Text style={styles.narratorLabel}>✦ {t('game.narratorCard')} ✦</Text>
          <Text style={styles.narratorClue}>"{round.clue}"</Text>
        </View>
      )}

      <CardGrid cards={cards} playerNames={playerNames} readonly />

      <View style={styles.scoreSection}>
        <Text style={styles.scoreLabel}>{t('game.score')}</Text>
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
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
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
    letterSpacing: 3,
    fontWeight: '600',
  },
  narratorClue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scoreSection: { gap: 8 },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 2.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
})
