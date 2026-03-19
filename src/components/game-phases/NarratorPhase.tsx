import { useState } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { DecorativeTitle } from '@/components/branding/DecorativeTitle'
import { CardGenerator } from '@/components/game/CardGenerator'
import { DixitCard } from '@/components/ui/DixitCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useGameActions } from '@/hooks/useGameActions'
import { useGameStore } from '@/stores/useGameStore'
import { colors } from '@/constants/theme'

interface Props {
  roomCode: string
}

export function NarratorPhase({ roomCode }: Props) {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const round = useGameStore((s) => s.round)
  const { gameAction, insertCard } = useGameActions()

  const [selectedCard, setSelectedCard] = useState<{ url: string; prompt: string } | null>(null)
  const [savedCardId, setSavedCardId] = useState<string | null>(null)
  const [clue, setClue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSelectCard(url: string, prompt: string) {
    if (!round || !userId) return
    const cardId = await insertCard(round.id, userId, url, prompt)
    if (cardId) {
      setSelectedCard({ url, prompt })
      setSavedCardId(cardId)
    }
  }

  async function handleSubmitClue() {
    if (!clue.trim() || !savedCardId) return
    setSubmitting(true)
    await gameAction(roomCode, 'submit_clue', { clue: clue.trim(), card_id: savedCardId })
    setSubmitting(false)
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.badge}>
        <DecorativeTitle variant="section" tone="gold" style={styles.badgeText}>
          {t('game.yourTurn')} · {t('game.narrator')}
        </DecorativeTitle>
      </View>

      {!selectedCard ? (
        <CardGenerator onSelect={handleSelectCard} />
      ) : (
        <View style={styles.clueBlock}>
          <View style={styles.selectedCardWrap}>
            <DixitCard uri={selectedCard.url} />
          </View>
          <Input
            label={t('game.writeClue')}
            value={clue}
            onChangeText={setClue}
            placeholder={t('game.cluePlaceholder')}
            maxLength={100}
          />
          <Button
            onPress={handleSubmitClue}
            loading={submitting}
            disabled={!clue.trim() || !savedCardId}
          >
            {t('game.submitClue')}
          </Button>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { gap: 20, padding: 16 },
  badge: {
    backgroundColor: colors.surfaceMid,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 7,
    alignSelf: 'center',
  },
  badgeText: {
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.8,
  },
  clueBlock: { gap: 16 },
  selectedCardWrap: {
    width: '55%',
    alignSelf: 'center',
  },
})
