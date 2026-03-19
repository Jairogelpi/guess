// src/components/game-phases/PlayersPhase.tsx
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { useImageGen } from '@/hooks/useImageGen'
import { usePromptSuggest } from '@/hooks/usePromptSuggest'
import { HandGrid } from '@/components/game/HandGrid'
import { ClueHero } from '@/components/game/ClueHero'
import { WaitingCard } from '@/components/game/WaitingCard'
import type { HandSlot } from '@/components/game/HandGrid'
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

const EMPTY_SLOTS: HandSlot[] = [
  { id: 'slot-0', isSelected: false },
  { id: 'slot-1', isSelected: false },
  { id: 'slot-2', isSelected: false },
]

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
  const { gameAction, insertCard } = useGameActions()
  const { loading: generating, generate } = useImageGen()
  const { suggest } = usePromptSuggest()

  const [slots, setSlots] = useState<HandSlot[]>(EMPTY_SLOTS)
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(0)
  const [submitting, setSubmitting] = useState(false)

  const selectedSlot = slots.find((s) => s.isSelected)
  const clue = round?.clue ?? undefined
  const hasSubmitted = isNarrator || !!myPlayedCardId
  const submittedCount = submittedPlayerIds.length

  async function handleGenerate(index: number, prompt: string) {
    if (!round || !userId) return
    const result = await generate({ prompt, scope: 'round', roomCode, roundId: round.id })
    if (!result?.imageUrl) return
    const cardId = await insertCard(round.id, userId, result.imageUrl, result.brief ?? prompt)
    if (!cardId) return
    setSlots((prev) =>
      prev.map((s, i) => i === index ? { ...s, id: cardId, imageUri: result.imageUrl } : s),
    )
    if (!slots.some((s) => s.isSelected)) {
      setSlots((prev) => prev.map((s, i) => ({ ...s, isSelected: i === index })))
    }
    setActiveSlotIndex(null)
  }

  async function handleSuggest(_index: number): Promise<string> {
    return (await suggest()) ?? ''
  }

  function handleSelect(index: number) {
    setSlots((prev) => prev.map((s, i) => ({ ...s, isSelected: i === index })))
  }

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
        generating={generating}
        clue={clue}
      />
      <View style={[styles.submitBtn, (!selectedSlot?.imageUri || submitting) && styles.submitBtnDisabled]}>
        <Text
          style={styles.submitBtnText}
          onPress={handleSubmit}
        >
          {submitting ? '...' : t('game.playThisCard')}
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 14, gap: 14 },
  submitBtn: {
    backgroundColor: '#f97316',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.35 },
  submitBtnText: {
    color: '#fff7ea',
    fontSize: 14,
    fontWeight: '700',
  },
})
