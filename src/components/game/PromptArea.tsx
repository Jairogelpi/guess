import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { GalleryWildcardPicker } from '@/components/game/GalleryWildcardPicker'
import { colors, fonts, radii, shadows } from '@/constants/theme'
import type { GalleryCard } from '@/types/game'

interface Props {
  onGenerate: (prompt: string) => Promise<void>
  onSuggestPrompt: () => Promise<string>
  onUseWildcard: (card: GalleryCard) => Promise<void>
  wildcardsLeft: number
  generationTokens: number
  generating: boolean
  clue?: string // shown above input for context
}

export function PromptArea({
  onGenerate,
  onSuggestPrompt,
  onUseWildcard,
  wildcardsLeft,
  generationTokens,
  generating,
  clue,
}: Props) {
  const { t } = useTranslation()
  const [prompt, setPrompt] = useState('')
  const [suggesting, setSuggesting] = useState(false)
  const [showWildcardPicker, setShowWildcardPicker] = useState(false)

  async function handleSuggest() {
    if (generationTokens < 1) return
    setSuggesting(true)
    try {
      const suggested = await onSuggestPrompt()
      if (suggested) setPrompt(suggested)
    } finally {
      setSuggesting(false)
    }
  }

  async function handleGenerate() {
    if (!prompt.trim() || generating || generationTokens < 1) return
    await onGenerate(prompt.trim())
  }

  async function handlePickWildcard(card: GalleryCard) {
    if (generationTokens < 2) return
    setShowWildcardPicker(false)
    await onUseWildcard(card)
  }

  const canGenerate = generationTokens >= 1
  const canUseWildcard = wildcardsLeft > 0 && generationTokens >= 2

  return (
    <View style={styles.container}>
      {clue && (
        <Text style={styles.clueContext}>
          {t('game.narratorClue')}: "{clue}"
        </Text>
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={prompt}
          onChangeText={setPrompt}
          placeholder={t('game.describeCard')}
          placeholderTextColor="rgba(255, 241, 222, 0.25)"
          multiline={false}
          editable={!generating && canGenerate}
        />

        {wildcardsLeft > 0 && (
          <TouchableOpacity
            style={[styles.wildcardBtn, !canUseWildcard && styles.btnDisabled]}
            onPress={() => setShowWildcardPicker(true)}
            disabled={generating || !canUseWildcard}
          >
            <MaterialCommunityIcons name="cards-playing" size={24} color={colors.goldLight} />
            <View style={styles.wildcardBadge}>
              <Text style={styles.wildcardBadgeText}>{wildcardsLeft}</Text>
            </View>
            <View style={styles.costBadge}>
               <Text style={styles.costBadgeText}>-2</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.suggestBtn, (suggesting || generating || !canGenerate) && styles.btnDisabled]}
          onPress={handleSuggest}
          disabled={suggesting || generating || !canGenerate}
        >
          {suggesting ? (
            <ActivityIndicator size="small" color={colors.goldLight} />
          ) : (
            <MaterialCommunityIcons name="auto-fix" size={20} color={colors.gold} />
          )}
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.genBtn, (!prompt.trim() || generating || !canGenerate) && styles.btnDisabled]}
        onPress={handleGenerate}
        disabled={!prompt.trim() || generating || !canGenerate}
      >
        {generating ? (
          <ActivityIndicator size="small" color="#fff7ea" />
        ) : (
          <View style={styles.row}>
            <Text style={styles.genBtnText}>{t('game.generate')}</Text>
            <View style={styles.btnCostBadge}>
              <Text style={styles.btnCostBadgeText}>1</Text>
              <MaterialCommunityIcons name="database" size={10} color="#fff" />
            </View>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showWildcardPicker}
        onClose={() => setShowWildcardPicker(false)}
        title={t('game.useWildcardTitle', 'Usar Comodín')}
      >
        <GalleryWildcardPicker onPick={handlePickWildcard} onClose={() => setShowWildcardPicker(false)} />
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(20, 12, 5, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(230, 184, 0, 0.25)',
    borderRadius: radii.xl,
    padding: 16,
    gap: 12,
    ...shadows.surface,
  },
  clueContext: {
    color: colors.gold,
    fontSize: 11,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 2,
    opacity: 0.6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(10, 6, 2, 0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.2)',
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.title,
  },
  suggestBtn: {
    backgroundColor: 'rgba(230, 184, 0, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.3)',
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genBtn: {
    backgroundColor: colors.orange,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadows.surface,
  },
  genBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  wildcardBtn: {
    backgroundColor: 'rgba(230, 184, 0, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.3)',
    borderRadius: radii.md,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wildcardBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.gold,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  wildcardBadgeText: {
    color: '#000',
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  costBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#ff4444',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  costBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: fonts.titleHeavy,
  },
  btnCostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  btnCostBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
  },
})
