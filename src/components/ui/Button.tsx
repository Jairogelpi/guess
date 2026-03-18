import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { ReactNode } from 'react'
import type { StyleProp, TextStyle, ViewStyle } from 'react-native'
import { brandButtons, brandTypography } from '@/constants/brand'
import { colors, radii } from '@/constants/theme'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps {
  onPress: () => void
  children: ReactNode
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export function Button({
  onPress,
  children,
  variant = 'primary',
  loading,
  disabled,
  style,
  contentStyle,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled ?? loading
  const primaryGradient: [string, string] | [string, string, string] = isDisabled
    ? ['rgba(180,130,0,0.4)', 'rgba(140,100,0,0.4)']
    : [...brandButtons.primary.gradient]

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.82}
        style={[styles.base, isDisabled && styles.disabled, style]}
      >
        <LinearGradient colors={primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
          <View style={[styles.inner, contentStyle]}>
            {loading && <ActivityIndicator size="small" color={colors.textPrimary} />}
            {typeof children === 'string' ? (
              <Text style={[styles.textPrimary, textStyle]}>{children}</Text>
            ) : (
              children
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.82}
        style={[styles.base, styles.secondary, isDisabled && styles.disabled, style]}
      >
        <View style={[styles.inner, contentStyle]}>
          {loading && <ActivityIndicator size="small" color={colors.gold} />}
          {typeof children === 'string' ? (
            <Text style={[styles.textSecondary, textStyle]}>{children}</Text>
          ) : (
            children
          )}
        </View>
      </TouchableOpacity>
    )
  }

  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.75}
        style={[styles.base, styles.ghost, isDisabled && styles.disabled, style]}
      >
        <View style={[styles.inner, contentStyle]}>
          {loading && <ActivityIndicator size="small" color={colors.goldLight} />}
          {typeof children === 'string' ? (
            <Text style={[styles.textGhost, textStyle]}>{children}</Text>
          ) : (
            children
          )}
        </View>
      </TouchableOpacity>
    )
  }

  // danger
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.82}
      style={[styles.base, styles.danger, isDisabled && styles.disabled, style]}
    >
      <View style={[styles.inner, contentStyle]}>
        {loading && <ActivityIndicator size="small" color={colors.textPrimary} />}
        {typeof children === 'string' ? (
          <Text style={[styles.textPrimary, textStyle]}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  gradient: {
    borderWidth: 1.5,
    borderColor: brandButtons.primary.borderColor,
    borderRadius: radii.full,
    paddingHorizontal: 20,
    paddingVertical: 15,
    shadowColor: brandButtons.primary.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  inner: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondary: {
    backgroundColor: brandButtons.secondary.backgroundColor,
    borderWidth: 1,
    borderColor: brandButtons.secondary.borderColor,
    borderRadius: radii.full,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  ghost: {
    backgroundColor: brandButtons.ghost.backgroundColor,
    borderWidth: 1,
    borderColor: brandButtons.ghost.borderColor,
    borderRadius: radii.full,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  danger: {
    backgroundColor: brandButtons.danger.backgroundColor,
    borderWidth: 1,
    borderColor: brandButtons.danger.borderColor,
    borderRadius: radii.full,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  disabled: {
    opacity: 0.45,
  },
  textPrimary: {
    color: colors.textPrimary,
    fontFamily: brandTypography.buttonLabel.fontFamily,
    fontSize: brandTypography.buttonLabel.fontSize,
    lineHeight: brandTypography.buttonLabel.lineHeight,
    letterSpacing: brandTypography.buttonLabel.letterSpacing,
    textTransform: 'uppercase',
  },
  textSecondary: {
    color: brandButtons.secondary.textColor,
    fontFamily: brandTypography.buttonLabel.fontFamily,
    fontSize: brandTypography.buttonLabel.fontSize,
    lineHeight: brandTypography.buttonLabel.lineHeight,
    letterSpacing: brandTypography.buttonLabel.letterSpacing,
    textTransform: 'uppercase',
  },
  textGhost: {
    color: brandButtons.ghost.textColor,
    fontFamily: brandTypography.buttonLabel.fontFamily,
    fontSize: brandTypography.buttonLabel.fontSize,
    lineHeight: brandTypography.buttonLabel.lineHeight,
    letterSpacing: brandTypography.buttonLabel.letterSpacing,
    textTransform: 'uppercase',
  },
})
