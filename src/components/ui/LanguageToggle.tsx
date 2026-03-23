import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fonts, radii } from '@/constants/theme'

interface LanguageToggleProps {
  currentLang: 'es' | 'en'
  onChange: (lang: 'es' | 'en') => void
}

export function LanguageToggle({ currentLang, onChange }: LanguageToggleProps) {
  return (
    <View style={styles.langGroup} accessibilityRole="radiogroup">
      {(['es', 'en'] as const).map((lang) => {
        const active = currentLang === lang

        return (
          <Pressable
            key={lang}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            onPress={() => onChange(lang)}
            style={[styles.langButton, active && styles.langButtonActive]}
          >
            <Text style={[styles.langText, active && styles.langTextActive]}>
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
    padding: 3,
  },
  langButton: {
    minWidth: 30,
    height: 26,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  langButtonActive: {
    backgroundColor: 'rgba(255, 228, 186, 0.16)',
  },
  langText: {
    color: colors.textMuted,
    fontFamily: fonts.title,
    fontSize: 10,
    letterSpacing: 0.7,
  },
  langTextActive: {
    color: colors.textPrimary,
  },
})
