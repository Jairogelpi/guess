// src/components/game-phases/PlayersPhase.tsx
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { colors, fonts, radii } from '@/constants/theme'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { useCardSelection } from '@/hooks/useCardSelection'
import { HandGrid } from '@/components/game/HandGrid'
import { PhaseGuidance } from '@/components/game/PhaseGuidance'
import { ClueHero } from '@/components/game/ClueHero'
import { WaitingCard } from '@/components/game/WaitingCard'
import type { RoomPlayer, GalleryCard } from '@/types/game'

interface Props {
  roomCode: string
  narratorName: string
  narratorAvatar?: string
  isNarrator: boolean
  players: RoomPlayer[]          // non-narrator players
  submittedPlayerIds: string[]
  roundNumber: number
  maxRounds: number
  wildcardsLeft: number
  generationTokens: number
}

export function PlayersPhase({
  roomCode,
  narratorName,
  narratorAvatar,
  isNarrator,
  players,
  submittedPlayerIds,
  wildcardsLeft,
  generationTokens,
}: Props) {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const round = useGameStore((s) => s.round)
  const myPlayedCardId = useGameStore((s) => s.myPlayedCardId)
  const setMyPlayedCardId = useGameStore((s) => s.setMyPlayedCardId)
  const { gameAction } = useGameActions()

  const {
    slots,
    activeSlotIndex,
    setActiveSlotIndex,
    selectedSlot,
    isGenerating,
    handleGenerate,
    handleSuggest,
    handleUseWildcard,
    handleSelect,
  } = useCardSelection({ roomCode, round, userId })

  const [submitting, setSubmitting] = useState(false)

  const clue = round?.clue ?? undefined
  const hasSubmitted = isNarrator || !!myPlayedCardId
  const submittedCount = submittedPlayerIds.length

  async function handleSubmit() {
    if (!selectedSlot?.id || !selectedSlot.imageUri) return
    setSubmitting(true)
    const payload: any = {}
    if (selectedSlot.galleryCardId) {
      payload.gallery_card_id = selectedSlot.galleryCardId
    } else {
      payload.card_id = selectedSlot.id
    }
    const ok = await gameAction(roomCode, 'submit_card', payload)
    if (ok) setMyPlayedCardId(selectedSlot.id)
    setSubmitting(false)
  }

  if (hasSubmitted) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {clue && <ClueHero clue={clue} />}
        <WaitingCard
          narratorName={narratorName}
          narratorAvatar={narratorAvatar}
          clue={clue}
          submittedCount={submittedCount}
          expectedCount={players.length}
          isCurrentUserNarrator={isNarrator}
          currentUserId={userId ?? ''}
          submittedPlayerIds={submittedPlayerIds}
          contextMessage={t('game.waitingForPlayers')}
        />
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {clue && <ClueHero clue={clue} />}
      <PhaseGuidance 
        title={t('game.playersPhaseTitle', 'TU TURNO')}
        instruction={t('game.playersInstruction', 'Crea hasta 3 cartas basadas en la pista. Elige la que mejor encaje.')}
      />
      <HandGrid
        slots={slots}
        activeSlotIndex={activeSlotIndex}
        onSlotPress={setActiveSlotIndex}
        onSelect={handleSelect}
        onGenerate={handleGenerate}
        onSuggestPrompt={handleSuggest}
        onUseWildcard={handleUseWildcard}
        wildcardsLeft={wildcardsLeft}
        generationTokens={generationTokens}
        generating={isGenerating}
        clue={clue}
      />
      <Pressable
        style={[styles.submitBtn, (!selectedSlot?.imageUri || submitting) && styles.submitBtnDisabled]}
        disabled={!selectedSlot?.imageUri || submitting}
        onPress={handleSubmit}
      >
        <Text style={styles.submitBtnText}>
          {submitting ? '...' : t('game.playThisCard')}
        </Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 18, gap: 20 },
  submitBtn: {
    backgroundColor: colors.gold,
    borderRadius: radii.xl,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnDisabled: {
    backgroundColor: 'rgba(230, 184, 0, 0.1)',
    borderColor: 'rgba(230, 184, 0, 0.2)',
    borderWidth: 1.5,
  },
  submitBtnText: {
    color: '#0a0602',
    fontSize: 16,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
})
