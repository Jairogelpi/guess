import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DixitCard } from '@/components/ui/DixitCard'
import { useImageGen } from '@/hooks/useImageGen'
import { usePromptSuggest } from '@/hooks/usePromptSuggest'
import { colors, radii } from '@/constants/theme'

interface CardGeneratorProps {
  onSelect: (url: string, prompt: string) => void
}

export function CardGenerator({ onSelect }: CardGeneratorProps) {
  const { t } = useTranslation()
  const [prompt, setPrompt] = useState('')
  const { loading, url, brief, error, generate, reset } = useImageGen()
  const { loading: suggesting, suggest } = usePromptSuggest()

  async function handleGenerate() {
    if (!prompt.trim()) return
    await generate(prompt.trim())
  }

  async function handleSuggest() {
    const suggested = await suggest()
    if (suggested) setPrompt(suggested)
  }

  function handleReset() {
    reset()
    setPrompt('')
  }

  return (
    <View style={styles.container}>
      {!url ? (
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

          {/* Suggest button */}
          <TouchableOpacity
            onPress={handleSuggest}
            disabled={suggesting}
            style={styles.suggestBtn}
            activeOpacity={0.75}
          >
            <Text style={styles.suggestIcon}>✦</Text>
            <Text style={styles.suggestText}>
              {suggesting ? t('game.generatingIdea') : t('game.suggestIdea')}
            </Text>
          </TouchableOpacity>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button onPress={handleGenerate} loading={loading} disabled={!prompt.trim()}>
            {t('game.generateCard')}
          </Button>
        </>
      ) : (
        <>
          <View style={styles.cardWrapper}>
            <DixitCard uri={url} loading={loading} />
          </View>

          <View style={styles.actions}>
            <Button onPress={handleReset} variant="ghost" style={styles.flex}>
              {t('game.regenerate')}
            </Button>
            <Button onPress={() => onSelect(url, brief ?? prompt)} style={styles.flex}>
              {t('game.chooseCard')}
            </Button>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 14 },
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
    fontWeight: '600',
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
  },
  cardWrapper: {
    width: '60%',
    alignSelf: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  flex: { flex: 1 },
})
