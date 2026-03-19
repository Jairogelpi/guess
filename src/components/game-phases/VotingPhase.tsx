import { useMemo, useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { CardGrid } from '@/components/game/CardGrid'
import { Button } from '@/components/ui/Button'
import { colors, fonts, radii, shadows } from '@/constants/theme'

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
        <Text style={styles.waitingTitle}>{t('game.waitingVotesTitle')}</Text>
        <Text style={styles.waitingBody}>{t('game.waitingVotesBody')}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{t('game.voting')}</Text>
        <Text style={styles.infoBody}>{t('game.votingHint')}</Text>
      </View>

      <CardGrid
        cards={votableCards}
        selectedId={selectedId}
        onSelect={(c) => setSelectedId(c.id)}
      />

      <View style={styles.footer}>
        <Text style={styles.selectedHint}>
          {selectedId ? t('game.voteSelectedHint') : t('game.voteEmptyHint')}
        </Text>

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
    gap: 10,
    paddingHorizontal: 32,
  },
  waitingTitle: {
    color: colors.goldLight,
    fontSize: 16,
    fontFamily: fonts.title,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  waitingBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 8,
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
    fontSize: 15,
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
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  selectedHint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
})
