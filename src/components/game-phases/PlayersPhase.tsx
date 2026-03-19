import { useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { DecorativeTitle } from '@/components/branding/DecorativeTitle'
import { CardGenerator } from '@/components/game/CardGenerator'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useGameActions } from '@/hooks/useGameActions'
import { useGameStore } from '@/stores/useGameStore'
import { colors } from '@/constants/theme'

interface Props {
  roomCode: string
  narratorClue: string | null
  isWaiting: boolean
}

export function PlayersPhase({ roomCode, narratorClue, isWaiting }: Props) {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const round = useGameStore((s) => s.round)
  const myPlayedCardId = useGameStore((s) => s.myPlayedCardId)
  const setMyPlayedCardId = useGameStore((s) => s.setMyPlayedCardId)
  const { gameAction, insertCard } = useGameActions()

  const [savedCardId, setSavedCardId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSelectCard(url: string, prompt: string) {
    if (!round || !userId) return
    const cardId = await insertCard(round.id, userId, url, prompt)
    if (cardId) setSavedCardId(cardId)
  }

  async function handleSubmitCard() {
    if (!savedCardId) return
    setSubmitting(true)
    const ok = await gameAction(roomCode, 'submit_card', { card_id: savedCardId })
    if (ok) setMyPlayedCardId(savedCardId)
    setSubmitting(false)
  }

  if (isWaiting || myPlayedCardId) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator color={colors.gold} size="large" />
        <Text style={styles.waitingText}>{t('game.waiting')}</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {narratorClue && (
        <View style={styles.clueCard}>
          <DecorativeTitle variant="eyebrow" tone="gold" style={styles.clueLabel}>
            {t('game.narratorClue')}
          </DecorativeTitle>
          <DecorativeTitle variant="screen" tone="plain" style={styles.clueText}>
            {narratorClue}
          </DecorativeTitle>
        </View>
      )}

      {!savedCardId ? (
        <CardGenerator onSelect={handleSelectCard} />
      ) : (
        <Button onPress={handleSubmitCard} loading={submitting}>
          {t('game.submitCard')}
        </Button>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { gap: 20, padding: 16 },
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
  clueCard: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  clueLabel: {
    letterSpacing: 2.8,
  },
  clueText: {
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: 0.4,
  },
})
