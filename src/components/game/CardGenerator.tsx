import { useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DixitCard } from '@/components/ui/DixitCard'
import { InteractiveCardTilt } from '@/components/ui/InteractiveCardTilt'
import { Modal } from '@/components/ui/Modal'
import { useImageGen } from '@/hooks/useImageGen'
import { usePromptSuggest } from '@/hooks/usePromptSuggest'
import { GalleryWildcardPicker } from '@/components/game/GalleryWildcardPicker'
import { hasAvailableWildcards } from '@/lib/galleryRules'
import { colors, fonts, radii } from '@/constants/theme'
import type { GalleryCard } from '@/types/game'

interface CardGeneratorProps {
  scope: 'round' | 'gallery'
  roomCode?: string
  roundId?: string
  onSelect: (imageUrl: string, prompt: string) => void
  wildcardsRemaining?: number
  onSelectGalleryCard?: (card: GalleryCard) => void
  initialPrompt?: string
}

export function CardGenerator({
  scope,
  roomCode,
  roundId,
  onSelect,
  wildcardsRemaining,
  onSelectGalleryCard,
  initialPrompt,
}: CardGeneratorProps) {
  const { t } = useTranslation()
  const [prompt, setPrompt] = useState(initialPrompt || '')
  const originalPromptRef = useRef<string>('')

  const [showGalleryPicker, setShowGalleryPicker] = useState(false)
  const generationCount = useRef(0)
  const { loading, imageUrl, brief, error, generate, reset } = useImageGen()
  const { loading: suggesting, suggest } = usePromptSuggest()
  const canUseGalleryWildcard = scope === 'round' && !!onSelectGalleryCard
  const generationCostsOne = generationCount.current > 0

  async function handleGenerate() {
    if (!prompt.trim()) return
    // Save original prompt if not yet saved before we generate the image
    if (!originalPromptRef.current) {
      originalPromptRef.current = prompt.trim()
    }
    generationCount.current += 1
    await generate({
      prompt: prompt.trim(),
      scope,
      roomCode,
      roundId,
    })
  }

  async function handleSuggest(basePrompt?: string) {
    if (basePrompt && !originalPromptRef.current) {
      originalPromptRef.current = basePrompt
    }
    const suggested = await suggest(basePrompt)
    if (suggested) {
      if (!basePrompt && !originalPromptRef.current) {
         originalPromptRef.current = t('game.autoSuggested', { defaultValue: 'CARTA AUTO-GENERADA' })
      }
      setPrompt(suggested)
    }
  }

  function handleReset() {
    reset()
  }

  return (
    <View style={styles.container}>
      {!imageUrl ? (
        <>
          <View style={styles.promptBlock}>
            <Input
              value={prompt}
              onChangeText={setPrompt}
              placeholder={t('game.promptPlaceholder')}
              maxLength={250}
              multiline
              numberOfLines={2}
              style={styles.promptInput}
            />
            {/* Fila 1: Sugerir + Mejorar — siempre simétricos, flex:1 cada uno */}
            <View style={styles.mainRow}>
              <TouchableOpacity
                onPress={() => handleSuggest()}
                disabled={suggesting}
                style={[styles.actionBtn, styles.actionBtnFlex, styles.actionBtnSuggest]}
                activeOpacity={0.65}
              >
                <MaterialCommunityIcons name="lightbulb-outline" size={16} color={colors.gold} />
                <Text style={styles.actionText} numberOfLines={1}>
                  {suggesting && !prompt.trim()
                    ? t('game.generatingIdea', 'Generando...')
                    : t('game.suggestIdea')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSuggest(prompt)}
                disabled={suggesting || !prompt.trim()}
                style={[styles.actionBtn, styles.actionBtnFlex, styles.actionBtnEnhance,
                  !prompt.trim() && styles.actionBtnDimmed]}
                activeOpacity={0.65}
              >
                <MaterialCommunityIcons name="auto-fix" size={16}
                  color={prompt.trim() ? colors.goldLight : 'rgba(244,192,119,0.35)'} />
                <Text style={[styles.actionText, !prompt.trim() && styles.actionTextDimmed]}
                  numberOfLines={1}>
                  {suggesting && prompt.trim()
                    ? t('game.enhancingIdea', 'Mejorando...')
                    : t('game.enhanceIdea', 'Mejorar a Dixit')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Fila 2: Galería — botón propio con color diferenciado */}
            {canUseGalleryWildcard && (
              <TouchableOpacity
                onPress={() => setShowGalleryPicker(true)}
                disabled={!hasAvailableWildcards(wildcardsRemaining)}
                style={[styles.actionBtn, styles.actionBtnGallery,
                  !hasAvailableWildcards(wildcardsRemaining) && styles.actionBtnDimmed]}
                activeOpacity={0.65}
                >
                  <MaterialCommunityIcons
                    name="image-multiple-outline"
                    size={16}
                    color={hasAvailableWildcards(wildcardsRemaining) ? colors.goldLight : 'rgba(244,192,119,0.35)'}
                  />
                <Text style={[styles.actionText, styles.actionTextGallery,
                  !hasAvailableWildcards(wildcardsRemaining) && styles.actionTextDimmed]}
                  numberOfLines={1}>
                  {t('game.useGalleryWildcard')}
                </Text>
                {!!wildcardsRemaining && wildcardsRemaining > 0 && (
                  <View style={styles.galleryBadge}>
                    <Text style={styles.galleryBadgeText}>{wildcardsRemaining}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Separador elegante antes del botón principal */}
          <View style={styles.generateSep} />

          {error && <Text style={styles.errorText}>{t(error)}</Text>}

          <Button onPress={handleGenerate} loading={loading} disabled={!prompt.trim()}>
            <View style={styles.generateBtnInner}>
              <Text style={styles.generateBtnLabel}>{t('game.generateCard')}</Text>
              <View style={styles.generateCostChip}>
                <MaterialCommunityIcons
                  name="auto-fix"
                  size={10}
                  color={generationCostsOne ? 'rgba(10,6,2,0.6)' : '#0a0602'}
                />
                <Text style={[styles.generateCostText, generationCostsOne && styles.generateCostTextPaid]}>
                  {generationCostsOne
                    ? t('game.generationCostsOne')
                    : t('game.firstGenerationFree')}
                </Text>
              </View>
            </View>
          </Button>
        </>
      ) : (
        <>
          <View style={styles.cardWrapper}>
            <InteractiveCardTilt
              profileName="hero"
              regionKey="card-generator-preview"
              floating
              style={styles.cardTilt}
            >
              <DixitCard uri={imageUrl} loading={loading} interactive={false} />
            </InteractiveCardTilt>
          </View>

          <Text style={styles.readyHint}>{t('game.generatedHint')}</Text>

          <View style={styles.actions}>
            <Button onPress={() => onSelect(imageUrl, originalPromptRef.current || prompt)}>
              {t('game.chooseCard')}
            </Button>
            <Button onPress={handleReset} variant="ghost">
              <View style={styles.generateBtnInner}>
                <Text style={styles.regenerateBtnLabel}>{t('game.regenerate')}</Text>
                <View style={styles.regenerateCostChip}>
                  <MaterialCommunityIcons
                    name="auto-fix"
                    size={10}
                    color={colors.gold}
                  />
                  <Text style={styles.regenerateCostChipText}>{t('game.generationCostsOne')}</Text>
                </View>
              </View>
            </Button>
          </View>
        </>
      )}

      <Modal
        visible={showGalleryPicker}
        onClose={() => setShowGalleryPicker(false)}
        title={t('game.useGalleryWildcard')}
      >
        <GalleryWildcardPicker
          onClose={() => setShowGalleryPicker(false)}
          onPick={(card) => {
            onSelectGalleryCard?.(card)
            setShowGalleryPicker(false)
          }}
        />
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  promptBlock: {
    gap: 8,
  },
  promptInput: {
    minHeight: 44,
    paddingVertical: 10,
    fontSize: 15,
    borderRadius: 16,
    borderColor: 'rgba(244, 192, 119, 0.55)',
  },
  mainRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 42,
    backgroundColor: 'rgba(26, 14, 8, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(244, 192, 119, 0.24)',
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  actionBtnFlex: {
    flex: 1,
  },
  actionBtnSuggest: {
    borderColor: 'rgba(230, 184, 0, 0.34)',
    backgroundColor: 'rgba(230, 184, 0, 0.08)',
  },
  actionBtnEnhance: {
    borderColor: 'rgba(244, 192, 119, 0.22)',
    backgroundColor: 'rgba(255, 241, 222, 0.03)',
  },
  actionBtnDimmed: {
    borderColor: 'rgba(244, 192, 119, 0.1)',
    backgroundColor: 'rgba(20, 12, 5, 0.42)',
  },
  actionBtnGallery: {
    borderWidth: 1,
    borderColor: 'rgba(244, 192, 119, 0.28)',
    backgroundColor: 'rgba(230, 184, 0, 0.06)',
  },
  actionText: {
    color: colors.gold,
    fontSize: 11,
    fontFamily: fonts.title,
    letterSpacing: 0.2,
  },
  actionTextDimmed: {
    color: 'rgba(244, 192, 119, 0.35)',
  },
  actionTextGallery: {
    color: colors.goldLight,
    flex: 1,
  },
  galleryBadge: {
    backgroundColor: 'rgba(230, 184, 0, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: 'rgba(244, 192, 119, 0.22)',
  },
  galleryBadgeText: {
    color: colors.goldLight,
    fontSize: 9,
    fontFamily: fonts.titleHeavy,
  },
  generateSep: {
    height: 1,
    backgroundColor: 'rgba(230, 184, 0, 0.12)',
    marginVertical: 2,
  },
  generateBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  generateBtnLabel: {
    color: '#0a0602',
    fontSize: 15,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  generateCostChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(10, 6, 2, 0.18)',
    borderRadius: radii.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  generateCostText: {
    color: '#0a0602',
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 0.5,
  },
  generateCostTextPaid: {
    color: 'rgba(10, 6, 2, 0.55)',
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
  },
  cardWrapper: {
    width: '60%',
    alignSelf: 'center',
  },
  cardTilt: {
    width: '100%',
  },
  readyHint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  regenerateBtnLabel: {
    color: colors.gold,
    fontSize: 15,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  regenerateCostChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(230, 184, 0, 0.08)',
    borderRadius: radii.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.2)',
  },
  regenerateCostChipText: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 0.5,
  },
})
