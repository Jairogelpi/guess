import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii } from '@/constants/theme'

interface Props {
  onGenerate: (prompt: string) => Promise<void>
  onSuggestPrompt: () => Promise<string>
  generating: boolean
  clue?: string   // shown above input for context
}

export function PromptArea({ onGenerate, onSuggestPrompt, generating, clue }: Props) {
  const { t } = useTranslation()
  const [prompt, setPrompt] = useState('')
  const [suggesting, setSuggesting] = useState(false)

  async function handleSuggest() {
    setSuggesting(true)
    try {
      const suggested = await onSuggestPrompt()
      if (suggested) setPrompt(suggested)
    } finally {
      setSuggesting(false)
    }
  }

  async function handleGenerate() {
    if (!prompt.trim() || generating) return
    await onGenerate(prompt.trim())
  }

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
          editable={!generating}
        />
        <TouchableOpacity
          style={[styles.suggestBtn, (suggesting || generating) && styles.btnDisabled]}
          onPress={handleSuggest}
          disabled={suggesting || generating}
        >
          {suggesting ? (
            <ActivityIndicator size="small" color={colors.goldLight} />
          ) : (
            <Text style={styles.suggestText}>{t('game.suggestIA')}</Text>
          )}
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.genBtn, (!prompt.trim() || generating) && styles.btnDisabled]}
        onPress={handleGenerate}
        disabled={!prompt.trim() || generating}
      >
        {generating ? (
          <ActivityIndicator size="small" color="#fff7ea" />
        ) : (
          <Text style={styles.genBtnText}>{t('game.generate')}</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.goldBorderSubtle,
    borderRadius: radii.md,
    padding: 10,
    gap: 8,
  },
  clueContext: {
    color: 'rgba(255, 241, 222, 0.35)',
    fontSize: 10,
    fontFamily: fonts.title,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.goldBorderSubtle,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: '#fff7ea',
    fontSize: 12,
    fontFamily: fonts.title,
  },
  suggestBtn: {
    backgroundColor: 'rgba(67, 34, 21, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(244, 192, 119, 0.3)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestText: {
    color: '#fbb024',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fonts.title,
  },
  genBtn: {
    backgroundColor: colors.orange,
    borderRadius: radii.sm,
    paddingVertical: 9,
    alignItems: 'center',
  },
  genBtnText: {
    color: '#fff7ea',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.title,
  },
  btnDisabled: {
    opacity: 0.45,
  },
})
