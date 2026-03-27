import { View, Text, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
// PromptArea is now rendered by HandActionDock, not by HandGrid directly.
import { InteractiveCardTilt } from '@/components/ui/InteractiveCardTilt'
import { DixitCard } from '@/components/ui/DixitCard'
import { colors, fonts, radii } from '@/constants/theme'

export interface HandSlot {
  id: string
  imageUri?: string
  isSelected: boolean
}

interface Props {
  slots: HandSlot[]
  activeSlotIndex: number | null
  onSlotPress: (index: number) => void
  onSelect: (index: number) => void
  wildcardsLeft: number
  generationTokens: number
  generating: boolean
}

export function HandGrid({
  slots,
  activeSlotIndex,
  onSlotPress,
  onSelect,
  wildcardsLeft,
  generationTokens,
  generating,
}: Props) {
  const { t } = useTranslation()
  const usedSlots = slots.filter(s => !!s.imageUri).length

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {slots.map((slot, i) => {
          const isActive = activeSlotIndex === i
          const hasImage = !!slot.imageUri

          return (
            <InteractiveCardTilt
              key={slot.id}
              profileName="hero"
              regionKey="hand-grid"
              onPress={() => {
                if (hasImage) {
                  onSelect(i)
                } else {
                  onSlotPress(i)
                }
              }}
              style={[
                styles.slotTilt,
                slot.isSelected && styles.slotTiltRaised,
                isActive && !hasImage && styles.slotActive,
              ]}
              floating={true}
            >
              <DixitCard
                uri={slot.imageUri}
                selected={slot.isSelected}
                loading={isActive && generating}
                interactive={false} // Handled by Tilt wrapper
              />
              {slot.isSelected && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>✓</Text>
                </View>
              )}
            </InteractiveCardTilt>
          )
        })}
      </View>

      <View style={styles.slotCounter}>
        <View style={styles.counterGroup}>
          <Text style={styles.slotCounterText}>
            {t('game.slotsUsed', { count: usedSlots, max: 3 })}
          </Text>
          <View style={styles.slotDots}>
            {[0, 1, 2].map(i => (
              <View 
                key={i} 
                style={[styles.slotDot, i < usedSlots && styles.slotDotActive]} 
              />
            ))}
          </View>
        </View>

        <View style={styles.vDivider} />

        <View style={styles.counterGroup}>
           <MaterialCommunityIcons name="database" size={12} color={colors.goldDim} />
           <Text style={styles.slotCounterText}>
             {t('game.tokensLabel', { defaultValue: 'TOKENS' })}
           </Text>
           <Text style={tokenValueStyle(generationTokens)}>{generationTokens}</Text>
        </View>
      </View>

      {/* PromptArea is now rendered by HandActionDock — not here. */}
    </View>
  )
}

function tokenValueStyle(tokens: number) {
  return {
    color: tokens > 0 ? colors.gold : colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.titleHeavy,
    marginLeft: 2,
  }
}

const styles = StyleSheet.create({
  container: { gap: 16, paddingBottom: 10 },
  grid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  slotTilt: {
    width: '31%',
    aspectRatio: 2 / 3,
  },
  slotTiltRaised: {
    zIndex: 10,
    transform: [{ translateY: -18 }, { scale: 1.1 }],
  },
  slotActive: {
    zIndex: 5,
    transform: [{ scale: 1.05 }],
  },
  selectedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ffb024',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 30,
  },
  selectedBadgeText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
  },
  slotCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(230, 184, 0, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    alignSelf: 'center',
    marginBottom: 8,
  },
  slotCounterText: {
    color: colors.goldDim,
    fontSize: 11,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  slotDots: {
    flexDirection: 'row',
    gap: 6,
  },
  slotDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(230, 184, 0, 0.15)',
  },
  slotDotActive: {
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  counterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(230, 184, 0, 0.15)',
    marginHorizontal: 4,
  },
})
