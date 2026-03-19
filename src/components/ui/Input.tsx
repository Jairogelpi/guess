import { TextInput, View, Text, StyleSheet } from 'react-native'
import type { TextInputProps } from 'react-native'
import { colors, fonts, radii } from '@/constants/theme'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.title,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    borderRadius: radii.sm,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: colors.textPrimary,
    fontSize: 16,
  },
  inputError: {
    borderColor: 'rgba(220, 38, 38, 0.7)',
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
  },
})
