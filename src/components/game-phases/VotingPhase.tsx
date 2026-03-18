import { useMemo, useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { CardGrid } from '@/components/game/CardGrid'
import { Button } from '@/components/ui/Button'
import { colors } from '@/constants/theme'

interface Props {
  roomCode: string
  userId: string
}

export function VotingPhase({ roomCode, userId }: Props) {
  const { t } = useTranslation()
  const cards = useGameStore((s) => s.cards)
  const { gameAction } = useGameActions()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [voted, setVoted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const votableCards = useMemo(() => cards.filter((c) => c.player_id !== userId), [cards, userId])

  async function handleVote() {
    if (!selectedId) return
    setSubmitting(true)
    const ok = await gameAction(roomCode, 'submit_vote', { card_id: selectedId })
    if (ok) setVoted(true)
    setSubmitting(false)
  }

  if (voted) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator color={colors.gold} size="large" />
        <Text style={styles.waitingText}>{t('game.waiting')}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{t('game.voting')}</Text>
      </View>
      <CardGrid
        cards={votableCards}
        selectedId={selectedId}
        onSelect={(c) => setSelectedId(c.id)}
      />
      <View style={styles.footer}>
        <Button onPress={handleVote} loading={submitting} disabled={!selectedId}>
          {t('game.vote')}
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 8 },
  waiting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  waitingText: {
    color: colors.textSecondary,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
  },
  headerText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
})
