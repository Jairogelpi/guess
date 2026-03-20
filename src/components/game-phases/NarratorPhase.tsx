// src/components/game-phases/NarratorPhase.tsx
import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { useImageGen } from '@/hooks/useImageGen'
import { usePromptSuggest } from '@/hooks/usePromptSuggest'
import { HandGrid } from '@/components/game/HandGrid'
import { DixitCard } from '@/components/ui/DixitCard'
import { colors, fonts, radii } from '@/constants/theme'
import type { HandSlot } from '@/components/game/HandGrid'

interface Props {
  roomCode: string
  roundNumber: number
  maxRounds: number
}

const EMPTY_SLOTS: HandSlot[] = [
  { id: 'slot-0', isSelected: false },
  { id: 'slot-1', isSelected: false },
  { id: 'slot-2', isSelected: false },
]

export function NarratorPhase({ roomCode, roundNumber, maxRounds }: Props) {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const round = useGameStore((s) => s.round)
  const setNarratorStep = useGameStore((s) => s.setNarratorStep)
  const { gameAction, insertCard } = useGameActions()
  const { loading: generating, generate } = useImageGen()
  const { suggest } = usePromptSuggest()

  const [step, setStep] = useState<1 | 2>(1)
  const [slots, setSlots] = useState<HandSlot[]>(EMPTY_SLOTS)
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(0)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null)
  const [clue, setClue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selectedIndex = slots.findIndex((s) => s.isSelected)
  const hasSelection = selectedIndex !== -1

  function goToStep(s: 1 | 2) {
    setStep(s)
    setNarratorStep(s)
  }

  async function handleGenerate(index: number, prompt: string) {
    if (!round || !userId) return
    const result = await generate({ prompt, scope: 'round', roomCode, roundId: round.id })
    if (!result?.imageUrl) return
    const cardId = await insertCard(round.id, userId, result.imageUrl, result.brief ?? prompt)
    if (!cardId) return
    setSlots((prev) =>
      prev.map((s, i) => i === index ? { ...s, id: cardId, imageUri: result.imageUrl } : s),
    )
    if (!hasSelection) {
      setSlots((prev) => prev.map((s, i) => ({ ...s, isSelected: i === index })))
      setSelectedCardId(cardId)
      setSelectedImageUri(result.imageUrl)
    }
    setActiveSlotIndex(null)
  }

  async function handleSuggest(_index: number): Promise<string> {
    return (await suggest()) ?? ''
  }

  function handleSelect(index: number) {
    const slot = slots[index]
    if (!slot?.imageUri) return
    setSlots((prev) => prev.map((s, i) => ({ ...s, isSelected: i === index })))
    setSelectedCardId(slot.id)
    setSelectedImageUri(slot.imageUri)
  }

  async function handleSubmit() {
    if (!selectedCardId || !clue.trim()) return
    setSubmitting(true)
    await gameAction(roomCode, 'submit_clue', { clue: clue.trim(), card_id: selectedCardId })
    setSubmitting(false)
  }

  if (step === 2 && selectedImageUri) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.cardPreview}>
          <Text style={styles.cardPreviewLabel}>{t('game.chosenCard')}</Text>
          <View style={styles.cardPreviewWrap}>
            <DixitCard uri={selectedImageUri} />
          </View>
        </View>

        <View style={styles.clueInputCard}>
          <Text style={styles.clueInputLabel}>{t('game.writeYourClue')}</Text>
          <TextInput
            style={styles.clueInput}
            value={clue}
            onChangeText={setClue}
            placeholder={t('game.cluePlaceholder')}
            placeholderTextColor="rgba(255,241,222,0.25)"
            maxLength={100}
          />
          <Text style={styles.clueHint}>{t('game.clueHint')}</Text>
        </View>

        <View style={styles.actions}>
          <View style={[styles.actionBtn, (!clue.trim() || submitting) && styles.actionBtnDisabled]}>
            <Text
              style={styles.actionBtnText}
              onPress={handleSubmit}
            >
              {submitting ? '...' : t('game.sendClueAndCard')}
            </Text>
          </View>
          <View style={styles.ghostBtn}>
            <Text style={styles.ghostBtnText} onPress={() => goToStep(1)}>
              {t('game.changeCard')}
            </Text>
          </View>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <HandGrid
        slots={slots}
        activeSlotIndex={activeSlotIndex}
        onSlotPress={setActiveSlotIndex}
        onSelect={handleSelect}
        onGenerate={handleGenerate}
        onSuggestPrompt={handleSuggest}
        generating={generating}
      />
      <View style={[styles.actionBtn, !hasSelection && styles.actionBtnDisabled]}>
        <Text
          style={styles.actionBtnText}
          onPress={() => { if (hasSelection) goToStep(2) }}
        >
          {t('game.nextWriteClue')}
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 14, gap: 16 },
  cardPreview: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(25, 13, 10, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(244, 192, 119, 0.2)',
    borderRadius: radii.md,
    padding: 14,
  },
  cardPreviewLabel: {
    color: 'rgba(255, 241, 222, 0.3)',
    fontSize: 8,
    fontFamily: fonts.title,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cardPreviewWrap: { width: '45%' },
  clueInputCard: {
    gap: 10,
    backgroundColor: 'rgba(25, 13, 10, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(244, 192, 119, 0.35)',
    borderRadius: radii.md,
    padding: 14,
  },
  clueInputLabel: {
    color: colors.gold,
    fontSize: 8,
    fontFamily: fonts.title,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  clueInput: {
    backgroundColor: 'rgba(67, 34, 21, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(244, 192, 119, 0.2)',
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff7ea',
    fontSize: 13,
    fontFamily: fonts.title,
  },
  clueHint: {
    color: 'rgba(255, 241, 222, 0.3)',
    fontSize: 11,
    lineHeight: 16,
  },
  actions: { gap: 10 },
  actionBtn: {
    backgroundColor: '#f97316',
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnDisabled: { opacity: 0.35 },
  actionBtnText: {
    color: '#fff7ea',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.title,
  },
  ghostBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  ghostBtnText: {
    color: 'rgba(255, 241, 222, 0.35)',
    fontSize: 12,
    fontFamily: fonts.title,
  },
})
