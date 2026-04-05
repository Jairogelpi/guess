import { memo } from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import type { TFunction } from 'i18next'
import { StyleSheet, Text, View } from 'react-native'
import { VoteGuidance } from '@/components/game/VoteGuidance'
import { TacticalCompactCard } from '@/components/game/TacticalCompactCard'
import { TacticalActionPicker } from '@/components/game/TacticalActionPicker'
import { Button } from '@/components/ui/Button'
import { colors, fonts, radii } from '@/constants/theme'
import type { TacticalActionId } from '@/lib/tacticalActions'
import type { RoomPlayer } from '@/types/game'

type Translate = TFunction

interface VoteSelectionStatus {
  title: string
  body: string
  hint?: string
  iconName: string
  iconColor: string
  pending: boolean
  committed: boolean
}

interface Props {
  t: Translate
  isNarrator: boolean
  guideSteps: [string, string, string]
  selectionStatus: VoteSelectionStatus
  hasVoted: boolean
  hasPendingVoteChange: boolean
  hasSelectedTactics: boolean
  voteStatusMeta: string
  intuitionTokens: number
  totalTacticalCost: number
  remainingAfterSubmit: number
  showTactics: boolean
  setShowTactics: (updater: (prev: boolean) => boolean) => void
  selectedId: string | null
  selectedAction: TacticalActionId | null
  setSelectedAction: (action: TacticalActionId | null) => void
  challengeLeader: boolean
  setChallengeLeader: (value: boolean) => void
  allPlayers: Array<{ player_id: string; score: number }>
  challengeLeaderUsed: boolean
  userId: string
  canSubmitSelection: boolean
  submitting: boolean
  handleVote: () => void
  confirmButtonLabel: string
  players: RoomPlayer[]
  votedPlayerIds: string[]
}

export const VotingActionSection = memo(function VotingActionSection({
  t,
  isNarrator,
  guideSteps,
  selectionStatus,
  hasVoted,
  hasPendingVoteChange,
  hasSelectedTactics,
  voteStatusMeta,
  intuitionTokens,
  totalTacticalCost,
  remainingAfterSubmit,
  showTactics,
  setShowTactics,
  selectedId,
  selectedAction,
  setSelectedAction,
  challengeLeader,
  setChallengeLeader,
  allPlayers,
  challengeLeaderUsed,
  userId,
  canSubmitSelection,
  submitting,
  handleVote,
  confirmButtonLabel,
  players,
  votedPlayerIds,
}: Props) {
  return (
    <View style={styles.actionContent}>
      {!isNarrator && <VoteGuidance steps={guideSteps} status={selectionStatus} />}

      {!hasVoted || hasPendingVoteChange ? (
        <>
          <TacticalCompactCard
            eyebrow={t('game.tactics.eyebrow', { defaultValue: 'TACTICAS' })}
            title={t('game.voteTacticsOptional', { defaultValue: 'Opcional para este voto' })}
            statusTitle={
              hasSelectedTactics
                ? t('game.tactics.selected', { defaultValue: 'TACTICA ACTIVA' })
                : t('game.tactics.noneSelected', { defaultValue: 'SIN TACTICA' })
            }
            statusMeta={voteStatusMeta}
            statusActive={hasSelectedTactics}
            stats={[
              {
                text: t('game.tacticsAvailable', {
                  defaultValue: 'Tokens: {{value}}',
                  value: intuitionTokens,
                }),
              },
              {
                text: t('game.tacticsCost', {
                  defaultValue: 'Costo: {{value}}',
                  value: totalTacticalCost,
                }),
              },
              {
                text: t('game.tacticsRemaining', {
                  defaultValue: 'Quedan: {{value}}',
                  value: remainingAfterSubmit,
                }),
                strong: true,
              },
            ]}
            toggleLabel={
              showTactics
                ? t('game.hideTactics', { defaultValue: 'Ocultar' })
                : t('game.showTactics', { defaultValue: 'Ver tacticas' })
            }
            expanded={showTactics}
            onToggle={() => setShowTactics((prev) => !prev)}
          />

          {showTactics && (
            <TacticalActionPicker
              phase="voting"
              selectionActive={!!selectedId}
              intuitionTokens={intuitionTokens}
              isPhaseOwner={!isNarrator}
              playerId={userId}
              players={allPlayers}
              challengeLeaderUsed={challengeLeaderUsed}
              corruptedCardsRemaining={0}
              selectedAction={selectedAction}
              selectedChallengeLeader={challengeLeader}
              onSelectAction={setSelectedAction}
              onSelectChallengeLeader={setChallengeLeader}
            />
          )}

          <Button onPress={handleVote} loading={submitting} disabled={!canSubmitSelection}>
            {confirmButtonLabel}
          </Button>
        </>
      ) : (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingContainerText}>
            {t('game.waitingForVotes', 'Esperando votos...')}
          </Text>
          <View style={styles.waitingAvatars}>
            {players.map((p) => {
              const isRealDone = votedPlayerIds.includes(p.player_id)
              const isMe = p.player_id === userId
              if (isMe && isNarrator) return null
              return (
                <View key={p.player_id} style={[styles.waitingAvatarWrap, isRealDone && styles.waitingAvatarDone]}>
                  {isRealDone && (
                    <View style={styles.waitingAvatarCheck}>
                      <MaterialCommunityIcons name="check" size={10} color="#0a0602" />
                    </View>
                  )}
                  <Text style={styles.waitingAvatarLetter}>
                    {p.display_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  actionContent: {
    gap: 10,
  },
  waitingContainer: {
    padding: 16,
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.25)',
    backgroundColor: 'rgba(20, 12, 5, 0.72)',
  },
  waitingContainerText: {
    color: colors.gold,
    fontSize: 14,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  waitingAvatars: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  waitingAvatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(230, 184, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingAvatarDone: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(230, 184, 0, 0.3)',
  },
  waitingAvatarLetter: {
    color: colors.goldLight,
    fontFamily: fonts.titleHeavy,
    fontSize: 14,
  },
  waitingAvatarCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
