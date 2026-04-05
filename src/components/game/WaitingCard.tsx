import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors, fonts, radii } from '@/constants/theme'
import { Avatar } from '@/components/ui/Avatar'
import type { RoomPlayer } from '@/types/game'
import { buildWaitingProgress } from '@/lib/waitingProgress'

interface Props {
  narratorName: string
  narratorAvatar?: string
  clue?: string
  submittedCount: number
  expectedCount: number
  isCurrentUserNarrator: boolean
  currentUserId: string
  submittedPlayerIds: string[]
  orderedPlayers: RoomPlayer[]
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
  orderedPlayers,
  contextMessage,
}: Props) {
  const { t } = useTranslation()

  const remaining = expectedCount - submittedCount
  const waitingText = remaining > 0
    ? t('game.waitingMore', { count: remaining })
    : t('game.waiting')
  const waitingProgress = buildWaitingProgress(orderedPlayers, submittedPlayerIds)

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

      <View style={styles.progressHeader}>
        <View style={styles.countPill}>
          <Text style={styles.dotsLabel}>
            {submittedCount}/{expectedCount}
          </Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        {waitingProgress.displayPlayers.map((player) => {
          const isMe = !isCurrentUserNarrator && player.playerId === currentUserId
          return (
            <View
              key={player.playerId}
              style={[
                styles.playerSlot,
                player.isCurrentTarget && styles.playerSlotCurrent,
                player.submitted && styles.playerSlotDone,
                player.isCurrentTarget && styles.playerSlotPriority,
              ]}
            >
              <View style={styles.playerAvatarWrap}>
                <Avatar
                  uri={player.avatarUrl}
                  name={player.displayName}
                  size={32}
                  borderColor={
                    player.submitted
                      ? colors.gold
                      : player.isCurrentTarget
                        ? colors.orange
                        : isMe
                          ? 'rgba(249, 115, 22, 0.42)'
                        : 'rgba(230, 184, 0, 0.18)'
                  }
                  textColor={
                    player.submitted || player.isCurrentTarget
                      ? colors.goldLight
                      : 'rgba(255, 241, 222, 0.62)'
                  }
                />
                {player.submitted ? (
                  <View style={styles.doneBadge}>
                    <MaterialCommunityIcons name="check" size={10} color="#0a0602" />
                  </View>
                ) : null}
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.playerName,
                  player.submitted && styles.playerNameDone,
                  player.isCurrentTarget && styles.playerNameCurrent,
                ]}
              >
                {player.displayName}
              </Text>
              <Text
                style={[
                  styles.playerState,
                  player.submitted && styles.playerStateDone,
                  player.isCurrentTarget && styles.playerStateCurrent,
                ]}
              >
                {player.submitted
                  ? t('game.waitingDone')
                  : player.isCurrentTarget
                    ? t('game.waitingNowShort')
                    : t('game.waitingPending')}
              </Text>
            </View>
          )
        })}
      </View>

      {waitingProgress.currentTargetName ? (
        <Text style={styles.waitingNowText}>
          {t('game.waitingCurrentPlayer', { name: waitingProgress.currentTargetName })}
        </Text>
      ) : null}

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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  playerSlot: {
    minWidth: 76,
    flex: 1,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 241, 222, 0.035)',
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.08)',
  },
  playerSlotDone: {
    backgroundColor: 'rgba(230, 184, 0, 0.08)',
    borderColor: 'rgba(230, 184, 0, 0.2)',
  },
  playerSlotCurrent: {
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  playerSlotPriority: {
    transform: [{ scale: 1.03 }],
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
  playerAvatarWrap: {
    position: 'relative',
  },
  doneBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: 'rgba(10, 6, 2, 0.24)',
  },
  playerName: {
    color: 'rgba(255, 241, 222, 0.56)',
    fontSize: 11,
    lineHeight: 13,
    fontFamily: fonts.title,
    textAlign: 'center',
    width: '100%',
  },
  playerNameDone: {
    color: colors.goldLight,
  },
  playerNameCurrent: {
    color: '#ffd59b',
  },
  playerState: {
    color: 'rgba(255, 241, 222, 0.42)',
    fontSize: 9,
    lineHeight: 11,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  playerStateDone: {
    color: colors.gold,
  },
  playerStateCurrent: {
    color: colors.orange,
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
  waitingNowText: {
    color: '#ffd59b',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.title,
    textAlign: 'center',
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
