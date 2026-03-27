import { useEffect, useRef } from 'react'
import { Animated, View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii } from '@/constants/theme'
import { Avatar } from '@/components/ui/Avatar'

/** Single dot — pulses when pending, glows when done */
function StatusDot({ isSubmitted, isMe, delay }: { isSubmitted: boolean; isMe: boolean; delay: number }) {
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (isSubmitted) {
      // Snap to full glow, no loop
      Animated.timing(pulse, { toValue: 1, duration: 150, useNativeDriver: true }).start()
      return
    }
    // Slow breathing pulse while waiting
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 800 + delay * 120, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800 + delay * 120, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [isSubmitted, pulse, delay])

  return (
    <Animated.View
      style={[
        styles.dot,
        isSubmitted && styles.dotDone,
        isMe && styles.dotMe,
        { opacity: pulse },
      ]}
    >
      <View style={styles.dotInner} />
    </Animated.View>
  )
}

interface Props {
  narratorName: string
  narratorAvatar?: string
  clue?: string
  submittedCount: number
  expectedCount: number
  isCurrentUserNarrator: boolean
  currentUserId: string
  submittedPlayerIds: string[]
  contextMessage: string
}

export function WaitingCard({
  narratorName,
  narratorAvatar,
  clue,
  submittedCount,
  expectedCount,
  isCurrentUserNarrator,
  currentUserId,
  submittedPlayerIds,
  contextMessage,
}: Props) {
  const { t } = useTranslation()

  const remaining = expectedCount - submittedCount
  const waitingText = remaining > 0
    ? t('game.waitingMore', { count: remaining })
    : t('game.waiting')

  return (
    <View style={styles.card}>
      <View style={styles.narratorRow}>
        <Avatar uri={narratorAvatar} name={narratorName} size={48} />
        <View style={styles.narratorInfo}>
          <Text style={styles.narratorName}>{narratorName}</Text>
          <Text style={styles.narratorRole}>{t('game.narrator')}</Text>
        </View>
      </View>

      {clue !== undefined && (
        <View style={styles.clueRow}>
          <Text style={styles.clueLabel}>{t('game.narratorClue')}</Text>
          <Text style={styles.clueText}>"{clue}"</Text>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.dotsRow}>
        {Array.from({ length: expectedCount }).map((_, i) => {
          const playerId = submittedPlayerIds[i]
          const isSubmitted = i < submittedCount
          const isMe = !isCurrentUserNarrator && playerId === currentUserId
          return (
            <StatusDot
              key={i}
              isSubmitted={isSubmitted}
              isMe={isMe}
              delay={i}
            />
          )
        })}
        <View style={styles.countPill}>
          <Text style={styles.dotsLabel}>
            {submittedCount}/{expectedCount}
          </Text>
        </View>
      </View>

      <Text style={styles.contextMsg}>{contextMessage}</Text>
      <View style={styles.statusFooter}>
        <Text style={styles.waitingText}>{waitingText}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(20, 12, 5, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(230, 184, 0, 0.25)',
    borderRadius: radii.xl,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  narratorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  narratorInfo: { flex: 1, gap: 2 },
  narratorName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: fonts.titleHeavy,
  },
  narratorRole: {
    color: colors.gold,
    fontSize: 11,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  clueRow: {
    gap: 6,
    backgroundColor: 'rgba(25, 13, 10, 0.5)',
    padding: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.15)',
  },
  clueLabel: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 3,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  clueText: {
    color: colors.goldLight,
    fontSize: 16,
    fontFamily: fonts.titleHeavy,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(230, 184, 0, 0.15)',
    marginVertical: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(230, 184, 0, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  dotInner: {
    width: '100%',
    height: '100%',
    borderRadius: 99,
  },
  dotDone: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(230, 184, 0, 0.15)',
  },
  dotMe: {
    borderColor: colors.orange,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
  },
  countPill: {
    backgroundColor: 'rgba(230, 184, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.2)',
    marginLeft: 'auto',
  },
  dotsLabel: {
    color: colors.gold,
    fontSize: 11,
    fontFamily: fonts.titleHeavy,
  },
  contextMsg: {
    color: 'rgba(255, 241, 222, 0.7)',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.title,
    textAlign: 'center',
  },
  statusFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(230, 184, 0, 0.1)',
    paddingTop: 12,
    marginTop: 4,
  },
  waitingText: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fonts.titleHeavy,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.8,
  },
})
