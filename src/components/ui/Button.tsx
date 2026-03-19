import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { ReactNode } from 'react'
import { colors, fonts, radii } from '@/constants/theme'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps {
  onPress: () => void
  children: ReactNode
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  style?: any
  textStyle?: any
}

export function Button({
  onPress,
  children,
  variant = 'primary',
  loading,
  disabled,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled ?? loading

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.82}
        style={[styles.base, isDisabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={
            isDisabled
              ? ['rgba(180,130,0,0.4)', 'rgba(140,100,0,0.4)']
              : [colors.orangeGrad1, colors.orange, colors.orangeGrad2]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.inner}>
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
        <View style={styles.inner}>
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
        <View style={styles.inner}>
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
      <View style={styles.inner}>
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
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  gradient: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
  },
  secondary: {
    backgroundColor: colors.surfaceMid,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  danger: {
    backgroundColor: colors.danger,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  disabled: {
    opacity: 0.45,
  },
  textPrimary: {
    color: colors.textPrimary,
    fontFamily: fonts.title,
    fontSize: 15,
    lineHeight: 18,
    letterSpacing: 0.8,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    width: '100%',
  },
  textSecondary: {
    color: colors.goldLight,
    fontFamily: fonts.title,
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: 0.7,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    width: '100%',
  },
  textGhost: {
    color: colors.goldLight,
    fontFamily: fonts.title,
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: 0.7,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    width: '100%',
  },
})
