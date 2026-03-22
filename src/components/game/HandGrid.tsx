// src/components/game/HandGrid.tsx
import { View, Text, Image, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii } from '@/constants/theme'
import { PromptArea } from '@/components/game/PromptArea'
import { InteractiveCardTilt } from '@/components/ui/InteractiveCardTilt'

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
  onGenerate: (index: number, prompt: string) => Promise<void>
  onSuggestPrompt: (index: number) => Promise<string>
  generating: boolean
  clue?: string
}

export function HandGrid({
  slots,
  activeSlotIndex,
  onSlotPress,
  onSelect,
  onGenerate,
  onSuggestPrompt,
  generating,
  clue,
}: Props) {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('game.yourHand')}</Text>
      <View style={styles.grid}>
        {slots.map((slot, i) => {
          const isActive = activeSlotIndex === i
          const hasImage = !!slot.imageUri

          return (
            <InteractiveCardTilt
              key={slot.id}
              profileName="lite"
              regionKey="hand-grid"
              onPress={() => {
                if (hasImage) {
                  onSelect(i)
                } else {
                  onSlotPress(i)
                }
              }}
              style={[styles.slotTilt, slot.isSelected && styles.slotTiltRaised]}
            >
              <View
                style={[
                  styles.slot,
                  hasImage && styles.slotGenerated,
                  slot.isSelected && styles.slotSelected,
                  isActive && !hasImage && styles.slotActive,
                ]}
              >
                {hasImage ? (
                  <Image
                    source={{ uri: slot.imageUri }}
                    style={styles.slotImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.emptyContent}>
                    <Text style={styles.plusIcon}>+</Text>
                    <Text style={styles.slotLabel}>
                      {t('game.cardSlot', { n: i + 1 })}
                    </Text>
                  </View>
                )}
                {slot.isSelected && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}
              </View>
            </InteractiveCardTilt>
          )
        })}
      </View>

      {activeSlotIndex !== null && !slots[activeSlotIndex]?.imageUri && (
        <PromptArea
          onGenerate={(prompt) => onGenerate(activeSlotIndex, prompt)}
          onSuggestPrompt={() => onSuggestPrompt(activeSlotIndex)}
          generating={generating}
          clue={clue}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  label: {
    color: 'rgba(255, 241, 222, 0.25)',
    fontSize: 8,
    fontFamily: fonts.title,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  slotTilt: {
    flex: 1,
  },
  slotTiltRaised: {
    zIndex: 3,
  },
  slot: {
    aspectRatio: 2 / 3,
    borderRadius: radii.md,
    backgroundColor: 'rgba(25, 13, 10, 0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 192, 119, 0.2)',
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotGenerated: {
    borderStyle: 'solid',
    borderColor: 'rgba(244, 192, 119, 0.35)',
    backgroundColor: 'rgba(58, 26, 8, 0.8)',
  },
  slotSelected: {
    borderStyle: 'solid',
    borderColor: colors.gold,
    borderWidth: 2.5,
  },
  slotActive: {
    borderColor: 'rgba(244, 192, 119, 0.5)',
    borderStyle: 'solid',
  },
  slotImage: {
    width: '100%',
    height: '100%',
  },
  emptyContent: {
    alignItems: 'center',
    gap: 4,
  },
  plusIcon: {
    fontSize: 22,
    color: 'rgba(244, 192, 119, 0.25)',
  },
  slotLabel: {
    fontSize: 7,
    color: 'rgba(255, 241, 222, 0.2)',
    fontFamily: fonts.title,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: colors.gold,
    borderRadius: 99,
    minWidth: 22,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    color: '#0a0602',
    fontSize: 8,
    fontWeight: '800',
  },
})
