import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { PromptArea } from '@/components/game/PromptArea'
import { colors, fonts, radii, shadows } from '@/constants/theme'
import type { HandActionDockState } from '@/components/game/handActionState'
import type { GalleryCard } from '@/types/game'

interface Props {
  state: HandActionDockState
  promptValue: string
  onPromptChange: (v: string) => void
  onSuggestPrompt: () => void
  onUseWildcard: (card: GalleryCard) => void
  onPrimaryAction: () => void
  onGenerate: () => void
  wildcardsLeft: number
  generationTokens: number
  generating: boolean
  /** Optional eyebrow label shown above the dock */
  eyebrow?: string
}

export function HandActionDock({
  state,
  promptValue,
  onPromptChange,
  onSuggestPrompt,
  onUseWildcard,
  onPrimaryAction,
  onGenerate,
  wildcardsLeft,
  generationTokens,
  generating,
  eyebrow,
}: Props) {
  const { t } = useTranslation()

  return (
    <View style={styles.dock}>
      {eyebrow ? (
        <Text style={styles.eyebrow}>{eyebrow}</Text>
      ) : null}

      {state.mode === 'generate' && (
        <PromptArea
          promptValue={promptValue}
          onPromptChange={onPromptChange}
          onSuggestPrompt={onSuggestPrompt}
          onUseWildcard={onUseWildcard}
          onGenerate={onGenerate}
          wildcardsLeft={wildcardsLeft}
          generationTokens={generationTokens}
          generating={generating}
        />
      )}

      <TouchableOpacity
        style={[styles.cta, state.disabled && styles.ctaDisabled]}
        onPress={onPrimaryAction}
        disabled={state.disabled}
        activeOpacity={0.75}
      >
        {generating && state.mode !== 'generate' ? (
          <ActivityIndicator size="small" color="#fff7ea" />
        ) : (
          <Text style={styles.ctaLabel}>{state.ctaLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  dock: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: 'rgba(14, 8, 4, 0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(230, 184, 0, 0.12)',
    ...shadows.surface,
  },
  eyebrow: {
    color: colors.goldDim ?? colors.gold,
    fontSize: 11,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    opacity: 0.7,
  },
  cta: {
    backgroundColor: colors.orange,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.surface,
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaLabel: {
    color: '#fff7ea',
    fontSize: 15,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
})
