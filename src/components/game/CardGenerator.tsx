import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DixitCard } from '@/components/ui/DixitCard'
import { Modal } from '@/components/ui/Modal'
import { useImageGen } from '@/hooks/useImageGen'
import { usePromptSuggest } from '@/hooks/usePromptSuggest'
import { GalleryWildcardPicker } from '@/components/game/GalleryWildcardPicker'
import { hasAvailableWildcards } from '@/lib/galleryRules'
import { colors, fonts, radii, shadows } from '@/constants/theme'
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
  const [showGalleryPicker, setShowGalleryPicker] = useState(false)
  const { loading, imageUrl, brief, error, generate, reset } = useImageGen()
  const { loading: suggesting, suggest } = usePromptSuggest()
  const canUseGalleryWildcard = scope === 'round' && !!onSelectGalleryCard

  async function handleGenerate() {
    if (!prompt.trim()) return
    await generate({
      prompt: prompt.trim(),
      scope,
      roomCode,
      roundId,
    })
  }

  async function handleSuggest(basePrompt?: string) {
    const suggested = await suggest(basePrompt)
    if (suggested) setPrompt(suggested)
  }

  function handleReset() {
    reset()
  }

  return (
    <View style={styles.container}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{t('game.generatorTitle')}</Text>
        <Text style={styles.infoBody}>{t('game.generatorHint')}</Text>
      </View>

      {canUseGalleryWildcard && (
        <View style={styles.wildcardBar}>
          <Text style={styles.wildcardLabel}>
            {t('game.wildcardsRemaining', { count: wildcardsRemaining ?? 0 })}
          </Text>
          <Button
            variant="secondary"
            onPress={() => setShowGalleryPicker(true)}
            disabled={!hasAvailableWildcards(wildcardsRemaining)}
          >
            {t('game.useGalleryWildcard')}
          </Button>
        </View>
      )}

      {!imageUrl ? (
        <>
          <Input
            label={t('game.promptPlaceholder')}
            value={prompt}
            onChangeText={setPrompt}
            placeholder={t('game.promptPlaceholder')}
            maxLength={500}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.promptHint}>{t('game.promptHint')}</Text>

          <View style={styles.suggestRow}>
            <TouchableOpacity
              onPress={() => handleSuggest()}
              disabled={suggesting}
              style={styles.suggestBtn}
              activeOpacity={0.75}
            >
              <Text style={styles.suggestIcon}>✦</Text>
              <Text style={styles.suggestText}>
                {suggesting && !prompt.trim() ? t('game.generatingIdea', 'Generando...') : t('game.suggestIdea')}
              </Text>
            </TouchableOpacity>

            {prompt.trim().length > 0 && (
              <TouchableOpacity
                onPress={() => handleSuggest(prompt)}
                disabled={suggesting}
                style={[styles.suggestBtn, styles.enhanceBtn]}
                activeOpacity={0.75}
              >
                <Text style={styles.suggestIcon}>✨</Text>
                <Text style={styles.suggestText}>
                  {suggesting && prompt.trim() ? t('game.enhancingIdea', 'Mejorando...') : t('game.enhanceIdea', 'Mejorar a Dixit')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {error && <Text style={styles.errorText}>{t(error)}</Text>}

          <Button onPress={handleGenerate} loading={loading} disabled={!prompt.trim()}>
            {t('game.generateCard')}
          </Button>
        </>
      ) : (
        <>
          <View style={styles.cardWrapper}>
            <DixitCard uri={imageUrl} loading={loading} />
          </View>

          <Text style={styles.readyHint}>{t('game.generatedHint')}</Text>

          <View style={styles.actions}>
            <Button onPress={() => onSelect(imageUrl, brief ?? prompt)}>
              {t('game.chooseCard')}
            </Button>
            <Button onPress={handleReset} variant="ghost">
              {t('game.regenerate')}
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
  container: { gap: 14 },
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
    fontSize: 14,
    fontFamily: fonts.title,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  infoBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  wildcardBar: {
    gap: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: 'rgba(25, 13, 10, 0.54)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  wildcardLabel: {
    color: colors.goldLight,
    fontSize: 13,
    fontFamily: fonts.title,
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  promptHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    flexWrap: 'wrap',
  },
  suggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMid,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestIcon: {
    color: colors.gold,
    fontSize: 12,
  },
  suggestText: {
    color: colors.goldLight,
    fontSize: 13,
    fontFamily: fonts.title,
    letterSpacing: 0.5,
  },
  enhanceBtn: {
    backgroundColor: 'rgba(230, 184, 0, 0.15)',
    borderColor: 'rgba(230, 184, 0, 0.5)',
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
  },
  cardWrapper: {
    width: '60%',
    alignSelf: 'center',
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
})
