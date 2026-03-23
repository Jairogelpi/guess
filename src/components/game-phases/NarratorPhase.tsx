// src/components/game-phases/NarratorPhase.tsx
import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { useCardSelection } from '@/hooks/useCardSelection'
import { HandGrid } from '@/components/game/HandGrid'
import { DixitCard } from '@/components/ui/DixitCard'
import { InteractiveCardTilt } from '@/components/ui/InteractiveCardTilt'
import { colors, fonts, radii } from '@/constants/theme'

interface Props {
  roomCode: string
  roundNumber: number
  maxRounds: number
}

export function NarratorPhase({ roomCode }: Props) {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const round = useGameStore((s) => s.round)
  const setNarratorStep = useGameStore((s) => s.setNarratorStep)
  const { gameAction } = useGameActions()

  const {
    slots,
    activeSlotIndex,
    setActiveSlotIndex,
    selectedSlot,
    hasSelection,
    isGenerating,
    handleGenerate,
    handleSuggest,
    handleSelect,
  } = useCardSelection({ roomCode, round, userId })

  const [step, setStep] = useState<1 | 2>(1)
  const [clue, setClue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Derived from the selected slot — no separate state needed
  const selectedCardId = selectedSlot?.id ?? null
  const selectedImageUri = selectedSlot?.imageUri ?? null

  function goToStep(s: 1 | 2) {
    setStep(s)
    setNarratorStep(s)
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
            <InteractiveCardTilt profileName="hero" regionKey="narrator-preview" style={styles.cardPreviewTilt}>
              <DixitCard uri={selectedImageUri} />
            </InteractiveCardTilt>
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
          <Pressable
            style={[styles.actionBtn, (!clue.trim() || submitting) && styles.actionBtnDisabled]}
            disabled={!clue.trim() || submitting}
            onPress={handleSubmit}
          >
            <Text style={styles.actionBtnText}>
              {submitting ? '...' : t('game.sendClueAndCard')}
            </Text>
          </Pressable>
          <Pressable style={styles.ghostBtn} onPress={() => goToStep(1)}>
            <Text style={styles.ghostBtnText}>
              {t('game.changeCard')}
            </Text>
          </Pressable>
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
        generating={isGenerating}
      />
      <Pressable
        style={[styles.actionBtn, !hasSelection && styles.actionBtnDisabled]}
        disabled={!hasSelection}
        onPress={() => { if (hasSelection) goToStep(2) }}
      >
        <Text style={styles.actionBtnText}>
          {t('game.nextWriteClue')}
        </Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 14, gap: 16 },
  cardPreview: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.goldBorderSubtle,
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
  cardPreviewTilt: { zIndex: 2 },
  clueInputCard: {
    gap: 10,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.goldBorderMid,
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
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.goldBorderSubtle,
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
    backgroundColor: colors.orange,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnDisabled: { opacity: 0.45 },
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
