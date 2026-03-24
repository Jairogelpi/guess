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
import { PhaseGuidance } from '@/components/game/PhaseGuidance'
import { colors, fonts, radii } from '@/constants/theme'
import type { GalleryCard } from '@/types/game'

interface Props {
  roomCode: string
  roundNumber: number
  maxRounds: number
  wildcardsLeft: number
  generationTokens: number
}

export function NarratorPhase({ roomCode, wildcardsLeft, generationTokens }: Props) {
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
    handleUseWildcard,
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
    const payload: any = { clue: clue.trim() }
    if (selectedSlot?.galleryCardId) {
      payload.gallery_card_id = selectedSlot.galleryCardId
    } else {
      payload.card_id = selectedCardId
    }
    await gameAction(roomCode, 'submit_clue', payload)
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
      <PhaseGuidance 
        title={t('game.narratorPhaseTitle', 'FASE DE NARRADOR')}
        instruction={t('game.narratorInstruction', 'Crea hasta 3 cartas. Elige una para jugar y ponle una pista.')}
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
  content: { padding: 18, gap: 20 },
  cardPreview: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(20, 12, 5, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(230, 184, 0, 0.25)',
    borderRadius: radii.xl,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  cardPreviewLabel: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 4,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  cardPreviewWrap: {
    width: '55%',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  cardPreviewTilt: { zIndex: 2 },
  clueInputCard: {
    gap: 14,
    backgroundColor: 'rgba(20, 12, 5, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(230, 184, 0, 0.25)',
    borderRadius: radii.xl,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  clueInputLabel: {
    color: colors.gold,
    fontSize: 13,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  clueInput: {
    backgroundColor: 'rgba(10, 6, 2, 0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.2)',
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fonts.title,
  },
  clueHint: {
    color: 'rgba(255, 241, 222, 0.4)',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.title,
    textAlign: 'center',
  },
  actions: { gap: 12 },
  actionBtn: {
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
  actionBtnDisabled: {
    backgroundColor: 'rgba(230, 184, 0, 0.1)',
    borderColor: 'rgba(230, 184, 0, 0.2)',
    borderWidth: 1.5,
  },
  actionBtnText: {
    color: '#0a0602',
    fontSize: 16,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  ghostBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostBtnText: {
    color: 'rgba(255, 241, 222, 0.5)',
    fontSize: 14,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})
