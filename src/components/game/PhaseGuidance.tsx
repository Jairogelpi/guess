import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors, fonts, radii, shadows } from '@/constants/theme'

interface PhaseGuidanceProps {
  title: string
  instruction: string
  icon?: any
}

export function PhaseGuidance({ title, instruction, icon = 'lightbulb-outline' }: PhaseGuidanceProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.gold} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.instruction}>{instruction}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 14, 8, 0.65)',
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.2)',
    marginHorizontal: 16,
    marginBottom: 16,
    ...shadows.surface,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(230, 184, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.goldLight,
    fontFamily: fonts.titleHeavy,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  instruction: {
    color: colors.textSecondary,
    fontFamily: fonts.title,
    fontSize: 13,
    lineHeight: 18,
  },
})
