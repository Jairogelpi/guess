import { Text, TouchableOpacity, View, StyleSheet } from 'react-native'
import type { ReactNode } from 'react'
import { brandColors, brandTypography, entryShell } from '@/constants/brand'
import { radii } from '@/constants/theme'

interface EntryUtilityPillProps {
  label?: string
  children?: ReactNode
  onPress?: () => void
}

export function EntryUtilityPill({ label, children, onPress }: EntryUtilityPillProps) {
  const content = (
    <View style={styles.pill}>
      {children ?? <Text style={styles.label}>{label}</Text>}
    </View>
  )

  if (!onPress) return content

  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress}>
      {content}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  pill: {
    minHeight: entryShell.utilityPill.height,
    paddingHorizontal: entryShell.utilityPill.horizontalPadding,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 200, 0.12)',
    backgroundColor: 'rgba(8, 10, 20, 0.42)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
  },
  label: {
    color: brandColors.textPrimary,
    fontFamily: brandTypography.eyebrow.fontFamily,
    fontSize: brandTypography.eyebrow.fontSize,
    lineHeight: brandTypography.eyebrow.lineHeight,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
})
