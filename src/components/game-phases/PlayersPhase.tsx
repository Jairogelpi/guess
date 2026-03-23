// src/components/game-phases/PlayersPhase.tsx
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { colors } from '@/constants/theme'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { useCardSelection } from '@/hooks/useCardSelection'
import { HandGrid } from '@/components/game/HandGrid'
import { ClueHero } from '@/components/game/ClueHero'
import { WaitingCard } from '@/components/game/WaitingCard'
import type { RoomPlayer } from '@/types/game'

interface Props {
  roomCode: string
  narratorName: string
  narratorAvatar?: string
  isNarrator: boolean
  players: RoomPlayer[]          // non-narrator players
  submittedPlayerIds: string[]
  roundNumber: number
  maxRounds: number
}

export function PlayersPhase({
  roomCode,
  narratorName,
  narratorAvatar,
  isNarrator,
  players,
  submittedPlayerIds,
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
    handleSelect,
  } = useCardSelection({ roomCode, round, userId })

  const [submitting, setSubmitting] = useState(false)

  const clue = round?.clue ?? undefined
  const hasSubmitted = isNarrator || !!myPlayedCardId
  const submittedCount = submittedPlayerIds.length

  async function handleSubmit() {
    if (!selectedSlot?.id || !selectedSlot.imageUri) return
    setSubmitting(true)
    const ok = await gameAction(roomCode, 'submit_card', { card_id: selectedSlot.id })
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
      <HandGrid
        slots={slots}
        activeSlotIndex={activeSlotIndex}
        onSlotPress={setActiveSlotIndex}
        onSelect={handleSelect}
        onGenerate={handleGenerate}
        onSuggestPrompt={handleSuggest}
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
  content: { padding: 14, gap: 14 },
  submitBtn: {
    backgroundColor: colors.orange,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: {
    color: '#fff7ea',
    fontSize: 14,
    fontWeight: '700',
  },
})
