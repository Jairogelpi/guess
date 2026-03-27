import { TextInput, View, Text, StyleSheet } from 'react-native'
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from 'react-native'
import { brandColors, brandTypography } from '@/constants/brand'
import { colors, radii } from '@/constants/theme'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  wrapperStyle?: StyleProp<ViewStyle>
  labelStyle?: StyleProp<TextStyle>
  errorStyle?: StyleProp<TextStyle>
}

export function Input({
  label,
  error,
  style,
  wrapperStyle,
  labelStyle,
  errorStyle,
  ...props
}: InputProps) {
  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        {...props}
      />
      {error && <Text style={[styles.errorText, errorStyle]}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  label: {
    color: brandColors.goldSoft,
    fontFamily: brandTypography.eyebrow.fontFamily,
    fontSize: brandTypography.eyebrow.fontSize,
    lineHeight: brandTypography.eyebrow.lineHeight,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 58,
    backgroundColor: 'rgba(10, 5, 3, 0.74)',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 192, 119, 0.3)',
    borderRadius: radii.full,
    paddingHorizontal: 20,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  inputError: {
    borderColor: 'rgba(220, 38, 38, 0.7)',
  },
  errorText: {
    color: '#fda4af',
    fontSize: 12,
    letterSpacing: 0.4,
  },
})
