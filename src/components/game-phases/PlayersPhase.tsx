import { useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { CardGenerator } from '@/components/game/CardGenerator'
import { DixitCard } from '@/components/ui/DixitCard'
import { Button } from '@/components/ui/Button'
import { HandActionDock } from '@/components/game/HandActionDock'
import { deriveHandActionDockState } from '@/components/game/handActionState'
import type { HydratedHandSlot } from '@/components/game/handActionState'
import { colors, fonts, radii, shadows } from '@/constants/theme'
import type { GalleryCard } from '@/types/game'

interface Props {
  roomCode: string
  narratorClue: string | null
  isWaiting: boolean
  wildcardsRemaining: number
}

type SelectedPlayerCard =
  | { kind: 'generated'; imageUrl: string; prompt: string; cardId: string }
  | { kind: 'gallery'; imageUrl: string; prompt: string; galleryCardId: string }

export function PlayersPhase({ roomCode, narratorClue, isWaiting, wildcardsRemaining }: Props) {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const round = useGameStore((s) => s.round)
  const myPlayedCardId = useGameStore((s) => s.myPlayedCardId)
  const setMyPlayedCardId = useGameStore((s) => s.setMyPlayedCardId)
  const { gameAction, gameActionResult, insertCard } = useGameActions()

  const [selectedCard, setSelectedCard] = useState<SelectedPlayerCard | null>(null)
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

  async function handleSubmitCard() {
    if (!selectedCard) return
    setSubmitting(true)

    let ok = false

    if (selectedCard.kind === 'generated') {
      ok = await gameAction(roomCode, 'submit_card', { card_id: selectedCard.cardId })
      if (ok) setMyPlayedCardId(selectedCard.cardId)
    } else {
      const result = await gameActionResult<{ ok: true; cardId: string }>(roomCode, 'submit_card', {
        gallery_card_id: selectedCard.galleryCardId,
      })
      if (result?.cardId) {
        setMyPlayedCardId(result.cardId)
        ok = true
      }
    }

    if (!ok) setSubmitting(false)
  }

  if (isWaiting || myPlayedCardId) {
    const waitingTitle = !narratorClue
      ? t('game.waitingNarratorTitle')
      : myPlayedCardId
        ? t('game.waitingPlayersTitle')
        : t('game.waitingSubmissionTitle')

    const waitingBody = !narratorClue
      ? t('game.waitingNarratorBody')
      : myPlayedCardId
        ? t('game.waitingPlayersBody')
        : t('game.waitingSubmissionBody')

    return (
      <View style={styles.waiting}>
        <ActivityIndicator color={colors.gold} size="large" />
        <Text style={styles.waitingTitle}>{waitingTitle}</Text>
        <Text style={styles.waitingBody}>{waitingBody}</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{t('game.playersIntro')}</Text>
        <Text style={styles.infoBody}>{t('game.playersHint')}</Text>
      </View>

      {narratorClue && (
        <View style={styles.clueCard}>
          <Text style={styles.clueLabel}>{t('game.narratorClue')}</Text>
          <Text style={styles.clueText}>{narratorClue}</Text>
        </View>
      )}

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
        <View style={styles.selectionBlock}>
          <View style={styles.selectedCardWrap}>
            <DixitCard uri={selectedCard.imageUrl} />
          </View>

          <Text style={styles.selectedHint}>{t('game.playersSelectedHint')}</Text>
          {selectedCard.kind === 'gallery' && (
            <Text style={styles.wildcardHint}>{t('game.wildcardSpendHint')}</Text>
          )}

          <View style={styles.actions}>
            <HandActionDock
              state={deriveHandActionDockState({
                phase: 'players_turn',
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
              promptValue=""
              onPromptChange={() => {}}
              onSuggestPrompt={() => {}}
              onUseWildcard={() => {}}
              onPrimaryAction={handleSubmitCard}
              onGenerate={() => {}}
              wildcardsLeft={wildcardsRemaining}
              generationTokens={0}
              generating={submitting}
            />
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
    color: colors.gold,
    fontSize: 11,
    fontFamily: fonts.title,
    letterSpacing: 3,
  },
  clueText: {
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: fonts.title,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  selectionBlock: {
    gap: 16,
  },
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
