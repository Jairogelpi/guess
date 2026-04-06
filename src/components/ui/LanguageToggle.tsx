import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fonts, radii } from '@/constants/theme'

interface LanguageToggleProps {
  currentLang: 'es' | 'en'
  onChange: (lang: 'es' | 'en') => void
  scale?: number
}

export function LanguageToggle({ currentLang, onChange, scale = 1 }: LanguageToggleProps) {
  const groupPadding = Math.max(3, Math.round(4 * scale))
  const buttonMinWidth = Math.max(28, Math.round(34 * scale))
  const buttonHeight = Math.max(26, Math.round(30 * scale))
  const buttonPaddingHorizontal = Math.max(6, Math.round(8 * scale))
  const textFontSize = Math.max(10, Math.round(11 * scale))
  const textLetterSpacing = Math.max(0.5, 0.8 * scale)

  return (
    <View style={[styles.langGroup, { padding: groupPadding }]} accessibilityRole="radiogroup">
      {(['es', 'en'] as const).map((lang) => {
        const active = currentLang === lang

        return (
          <Pressable
            key={lang}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            onPress={() => onChange(lang)}
            style={[
              styles.langButton,
              {
                minWidth: buttonMinWidth,
                height: buttonHeight,
                paddingHorizontal: buttonPaddingHorizontal,
              },
              active && styles.langButtonActive,
            ]}
          >
            <Text
              style={[
                styles.langText,
                {
                  fontSize: textFontSize,
                  letterSpacing: textLetterSpacing,
                },
                active && styles.langTextActive,
              ]}
            >
              {lang.toUpperCase()}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  langGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 6, 2, 0.36)',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 228, 186, 0.18)',
  },
  langButton: {
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langButtonActive: {
    backgroundColor: 'rgba(255, 228, 186, 0.16)',
  },
  langText: {
    color: colors.textMuted,
    fontFamily: fonts.title,
  },
  langTextActive: {
    color: colors.textPrimary,
  },
})
