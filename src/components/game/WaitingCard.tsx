import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii } from '@/constants/theme'

interface Props {
  narratorName: string
  narratorAvatar?: string
  clue?: string               // undefined = narrator hasn't submitted yet
  submittedCount: number
  expectedCount: number       // always excludes narrator
  isCurrentUserNarrator: boolean
  currentUserId: string
  submittedPlayerIds: string[]
  contextMessage: string      // already-translated message
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
      {/* Narrator row */}
      <View style={styles.narratorRow}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>{narratorName[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={styles.narratorInfo}>
          <Text style={styles.narratorName}>{narratorName}</Text>
          <Text style={styles.narratorRole}>{t('game.narrator')}</Text>
        </View>
      </View>

      {/* Clue (if available) */}
      {clue !== undefined && (
        <View style={styles.clueRow}>
          <Text style={styles.clueLabel}>{t('game.narratorClue')}</Text>
          <Text style={styles.clueText}>"{clue}"</Text>
        </View>
      )}

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: expectedCount }).map((_, i) => {
          const playerId = submittedPlayerIds[i]
          const isSubmitted = i < submittedCount
          const isMe = !isCurrentUserNarrator && playerId === currentUserId
          return (
            <View
              key={i}
              style={[
                styles.dot,
                isSubmitted && styles.dotDone,
                isMe && styles.dotMe,
              ]}
            />
          )
        })}
        <Text style={styles.dotsLabel}>
          {submittedCount}/{expectedCount}
        </Text>
      </View>

      <Text style={styles.contextMsg}>{contextMessage}</Text>
      <Text style={styles.waitingText}>{waitingText}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(25, 13, 10, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(244, 192, 119, 0.18)',
    borderRadius: radii.md,
    padding: 14,
    gap: 10,
  },
  narratorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(244, 192, 119, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.title,
  },
  narratorInfo: { flex: 1 },
  narratorName: {
    color: '#fff7ea',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fonts.title,
  },
  narratorRole: {
    color: 'rgba(255, 241, 222, 0.4)',
    fontSize: 10,
    fontFamily: fonts.title,
  },
  clueRow: { gap: 3 },
  clueLabel: {
    color: colors.gold,
    fontSize: 8,
    fontFamily: fonts.title,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  clueText: {
    color: '#fff7ea',
    fontSize: 13,
    fontStyle: 'italic',
    fontFamily: fonts.title,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(244, 192, 119, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 192, 119, 0.2)',
  },
  dotDone: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  dotMe: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  dotsLabel: {
    color: 'rgba(255, 241, 222, 0.3)',
    fontSize: 10,
    fontFamily: fonts.title,
    marginLeft: 4,
  },
  contextMsg: {
    color: 'rgba(255, 241, 222, 0.5)',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.title,
  },
  waitingText: {
    color: 'rgba(255, 241, 222, 0.35)',
    fontSize: 11,
    fontFamily: fonts.title,
    textAlign: 'center',
    fontStyle: 'italic',
  },
})
