import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { CardGenerator } from '@/components/game/CardGenerator'
import { DixitCard } from '@/components/ui/DixitCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { HandActionDock } from '@/components/game/HandActionDock'
import { deriveHandActionDockState } from '@/components/game/handActionState'
import type { HydratedHandSlot } from '@/components/game/handActionState'
import { colors, fonts, radii, shadows } from '@/constants/theme'
import type { GalleryCard } from '@/types/game'

interface Props {
  roomCode: string
  wildcardsRemaining: number
}

type SelectedNarratorCard =
  | { kind: 'generated'; imageUrl: string; prompt: string; cardId: string }
  | { kind: 'gallery'; imageUrl: string; prompt: string; galleryCardId: string }

export function NarratorPhase({ roomCode, wildcardsRemaining }: Props) {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const round = useGameStore((s) => s.round)
  const { gameAction, gameActionResult, insertCard } = useGameActions()

  const [selectedCard, setSelectedCard] = useState<SelectedNarratorCard | null>(null)
  const [clue, setClue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSelectCard(imageUrl: string, prompt: string) {
    if (!round || !userId) return
    const cardId = await insertCard(round.id, userId, imageUrl, prompt)
    if (cardId) {
      setSelectedCard({ kind: 'generated', imageUrl, prompt, cardId })
    }
  }

  function handleSelectGalleryCard(card: GalleryCard) {
    setSelectedCard({
      kind: 'gallery',
      imageUrl: card.image_url,
      prompt: card.prompt,
      galleryCardId: card.id,
    })
  }

  async function handleSubmitClue() {
    if (!clue.trim() || !selectedCard) return
    setSubmitting(true)

    if (selectedCard.kind === 'generated') {
      await gameAction(roomCode, 'submit_clue', { clue: clue.trim(), card_id: selectedCard.cardId })
    } else {
      await gameActionResult(roomCode, 'submit_clue', {
        clue: clue.trim(),
        gallery_card_id: selectedCard.galleryCardId,
      })
    }

    setSubmitting(false)
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{t('game.yourTurn')} - {t('game.narrator')}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{t('game.narratorIntro')}</Text>
        <Text style={styles.infoBody}>
          {!selectedCard ? t('game.narratorSelectHint') : t('game.narratorClueHint')}
        </Text>
      </View>

      {!selectedCard ? (
        <CardGenerator
          scope="round"
          roomCode={roomCode}
          roundId={round?.id}
          wildcardsRemaining={wildcardsRemaining}
          onSelect={handleSelectCard}
          onSelectGalleryCard={handleSelectGalleryCard}
        />
      ) : (
        <View style={styles.clueBlock}>
          <View style={styles.selectedCardWrap}>
            <DixitCard uri={selectedCard.imageUrl} />
          </View>

          <Text style={styles.selectedHint}>{t('game.narratorClueHelp')}</Text>
          {selectedCard.kind === 'gallery' && (
            <Text style={styles.wildcardHint}>{t('game.wildcardSpendHint')}</Text>
          )}

          <Input
            label={t('game.writeClue')}
            value={clue}
            onChangeText={setClue}
            placeholder={t('game.cluePlaceholder')}
            maxLength={100}
          />

          <HandActionDock
            state={deriveHandActionDockState({
              phase: 'narrator_turn',
              focusedSlot: {
                slotIndex: 0,
                kind: 'filled',
                cardId: selectedCard.kind === 'generated' ? selectedCard.cardId : null,
                imageUri: selectedCard.imageUrl,
                galleryCardId: selectedCard.kind === 'gallery' ? selectedCard.galleryCardId : null,
              } satisfies HydratedHandSlot,
              hasFreeGeneration: false,
              generationTokens: 0,
              generating: submitting,
            })}
            promptValue={clue}
            onPromptChange={setClue}
            onSuggestPrompt={() => {}}
            onUseWildcard={() => {}}
            onPrimaryAction={handleSubmitClue}
            onGenerate={() => {}}
            wildcardsLeft={wildcardsRemaining}
            generationTokens={0}
            generating={submitting}
            eyebrow={t('game.writeClue')}
          />
          <View style={styles.actions}>
            <Button onPress={() => setSelectedCard(null)} variant="ghost">
              {t('game.changeCard')}
            </Button>
          </View>
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
    color: colors.gold,
    fontSize: 13,
    fontFamily: fonts.title,
    letterSpacing: 0.5,
  },
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
  clueBlock: { gap: 16 },
  selectedCardWrap: {
    width: '55%',
    alignSelf: 'center',
  },
  selectedHint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  wildcardHint: {
    color: colors.goldLight,
    fontSize: 12,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
})
