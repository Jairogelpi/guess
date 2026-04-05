import { useState, useEffect } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { CompactEconomy } from './EconomyBadges'
import { LiveStandingsModal } from './LiveStandingsModal'
import { EconomyExplanationModal } from './EconomyExplanationModal'
import { buildLiveStandingsEntries } from '../../lib/liveStandings'
import { colors, fonts, radii } from '@/constants/theme'
import type { RoomPlayer } from '@/types/game'

interface UnifiedHUDProps {
  roundNumber: number
  maxRounds: number
  phaseLabel: string
  phaseStartedAt?: string | null
  phaseDurationSeconds?: number
  players: RoomPlayer[]
  currentUserId: string | null
  wildcardsLeft: number
  generationTokens: number
  intuitionTokens: number
  corruptedCardsRemaining?: number
}

export function UnifiedHUD({
  roundNumber,
  maxRounds,
  phaseLabel,
  phaseStartedAt,
  phaseDurationSeconds = 60,
  players,
  currentUserId,
  wildcardsLeft,
  generationTokens,
  intuitionTokens,
  corruptedCardsRemaining,
}: UnifiedHUDProps) {
  const { t } = useTranslation()
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [showStandings, setShowStandings] = useState(false)
  const [showEconomyModal, setShowEconomyModal] = useState(false)

  // Timer logic
  useEffect(() => {
    if (!phaseStartedAt || !phaseDurationSeconds) {
      setSecondsLeft(null)
      return
    }
    const update = () => {
      const elapsed = Math.floor((Date.now() - new Date(phaseStartedAt).getTime()) / 1000)
      setSecondsLeft(Math.max(0, phaseDurationSeconds - elapsed))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [phaseStartedAt, phaseDurationSeconds])

  const entries = buildLiveStandingsEntries(players, currentUserId)
  const myEntry = entries.find(e => e.isCurrentUser)
  const isCritical = secondsLeft !== null && secondsLeft < 10

  return (
    <View style={styles.container}>
      {/* Top Row: Phase & Rank Chip */}
      <View style={styles.topRow}>
        <View style={styles.phaseBlock}>
          <Text style={styles.roundText}>
            {t('game.roundAbbr', { defaultValue: 'R' })} {roundNumber}/{maxRounds}
          </Text>
          <View style={styles.dot} />
          <Text style={styles.phaseText} numberOfLines={1}>
            {phaseLabel}
          </Text>
          {secondsLeft !== null && (
            <Text style={[styles.timer, isCritical && styles.timerCritical]}>
              {secondsLeft}s
            </Text>
          )}
        </View>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => setShowStandings(true)}
          style={styles.rankChipWrapper}
        >
          <LinearGradient
            colors={myEntry?.isLeader 
              ? ['#4a2510', '#1a0d05'] 
              : ['#2a1808', '#0f0804']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.rankChip, myEntry?.isLeader && styles.rankChipLeader]}
          >
            <Text style={styles.rankPrefix}>#</Text>
            <Text style={styles.rankValue}>{myEntry?.position ?? '?'}</Text>
            <MaterialCommunityIcons 
              name={myEntry?.isLeader ? "crown" : "trophy"} 
              size={13} 
              color={colors.gold} 
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Separator */}
      <View style={styles.divider} />

      {/* Bottom Row: Economy */}
      <View style={styles.bottomRow}>
        <CompactEconomy
          intuitionTokens={intuitionTokens}
          wildcardsLeft={wildcardsLeft}
          generationTokens={generationTokens}
          corruptedCardsRemaining={corruptedCardsRemaining}
          onPress={() => setShowEconomyModal(true)}
        />
      </View>

      {/* Modals */}
      <LiveStandingsModal
        visible={showStandings}
        onClose={() => setShowStandings(false)}
        players={players}
        currentUserId={currentUserId}
      />
      
      <EconomyExplanationModal
        visible={showEconomyModal}
        onClose={() => setShowEconomyModal(false)}
        corruptedCardsRemaining={corruptedCardsRemaining}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 8, 4, 0.45)', // More transparent for better blur
    marginHorizontal: 12,
    marginTop: 6,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    gap: 4,
    minHeight: 54,
    justifyContent: 'center',
    overflow: 'hidden', // Required for absolute BlurView
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  phaseBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    // Add horizontal padding to prevent overlap with absolute chip
    paddingHorizontal: 40, 
  },
  roundText: {
    color: 'rgba(255, 241, 222, 0.45)',
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 0.5,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(230, 184, 0, 0.2)',
  },
  phaseText: {
    color: colors.gold,
    fontSize: 13,
    fontFamily: fonts.titleHeavy,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: 'rgba(230, 184, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  timer: {
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: fonts.title,
    marginLeft: 4,
    minWidth: 28,
  },
  timerCritical: {
    color: '#ff4444',
    textShadowColor: 'rgba(255, 68, 68, 0.3)',
    textShadowRadius: 4,
  },
  rankChipWrapper: {
    position: 'absolute',
    right: 0,
  },
  rankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.4)',
    gap: 5,
    // Note: LinearGradient handles background color
  },
  rankChipLeader: {
    backgroundColor: 'rgba(40, 20, 5, 0.95)',
    borderColor: colors.gold,
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  rankPrefix: {
    color: 'rgba(230, 184, 0, 0.6)',
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
    marginTop: 2,
  },
  rankValue: {
    color: colors.gold,
    fontSize: 14,
    fontFamily: fonts.titleHeavy,
    marginTop: -1,
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(230, 184, 0, 0.06)',
    marginHorizontal: -4,
  },
  bottomRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
