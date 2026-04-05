import { useEffect, useRef } from 'react'
import { Animated, View, Text, StyleSheet, ScrollView } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useVotingPhaseState } from '@/hooks/useVotingPhaseState'
import { GameBoard } from '@/components/game/GameBoard'
import { VotingActionSection } from '@/components/game/VotingActionSection'
import { VoteCardField } from '@/components/game/VoteCardField'
import { ClueHero } from '@/components/game/ClueHero'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DixitCard } from '@/components/ui/DixitCard'
import { colors, fonts, radii } from '@/constants/theme'
import type { TacticalActionId } from '@/lib/tacticalActions'
import type { RoomPlayer } from '@/types/game'

interface Props {
  roomCode: string
  isNarrator: boolean
  players: RoomPlayer[]
  votedPlayerIds: string[]
  intuitionTokens: number
  challengeLeaderUsed: boolean
  allPlayers: RoomPlayer[]
}

export function VotingPhase({
  roomCode,
  isNarrator,
  players,
  votedPlayerIds,
  intuitionTokens,
  challengeLeaderUsed,
  allPlayers,
}: Props) {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const {
    clue,
    myVotedCardId,
    selectedId,
    setSelectedId,
    selectedAction,
    setSelectedAction,
    challengeLeader,
    setChallengeLeader,
    setPreviewCardId,
    showTactics,
    setShowTactics,
    submitting,
    handleVote,
    hasVoted,
    effectiveSelectedId,
    hasPendingVoteChange,
    canSubmitSelection,
    betTokenCost,
    totalTacticalCost,
    remainingAfterSubmit,
    hasSelectedTactics,
    votableCards,
    previewCard,
    guideSteps,
    selectionStatus,
    voteStatusMeta,
    confirmButtonLabel,
  } = useVotingPhaseState({ roomCode, isNarrator, intuitionTokens, t })

  // Bouncing arrow — shown while no card is selected
  const bounceAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 5, duration: 500, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [bounceAnim])

  // ── Render ──
  return (
    <>
      <GameBoard
        center={
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.centerContent}
            showsVerticalScrollIndicator={false}
          >
            {clue && <ClueHero clue={clue} />}

            {!hasVoted && !selectedId && (
              <View style={styles.voteHint}>
                <Text style={styles.voteHintText}>
                  {t('game.voteInstruction', '¿Cuál es la carta del narrador?')}
                </Text>
                <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(230,184,0,0.45)" />
                </Animated.View>
              </View>
            )}

            <VoteCardField
              cards={votableCards}
              selectedId={effectiveSelectedId}
              committedId={myVotedCardId}
              pendingId={hasPendingVoteChange ? selectedId : null}
              onSelect={isNarrator ? undefined : (card) => setSelectedId(card.id)}
              onPreview={isNarrator ? undefined : (card) => setPreviewCardId(card.id)}
            />

            <VotingActionSection
              t={t}
              isNarrator={isNarrator}
              guideSteps={guideSteps}
              selectionStatus={selectionStatus}
              hasVoted={hasVoted}
              hasPendingVoteChange={hasPendingVoteChange}
              hasSelectedTactics={hasSelectedTactics}
              voteStatusMeta={voteStatusMeta}
              intuitionTokens={intuitionTokens}
              totalTacticalCost={totalTacticalCost}
              remainingAfterSubmit={remainingAfterSubmit}
              showTactics={showTactics}
              setShowTactics={setShowTactics}
              selectedId={selectedId}
              selectedAction={selectedAction}
              setSelectedAction={setSelectedAction}
              challengeLeader={challengeLeader}
              setChallengeLeader={setChallengeLeader}
              allPlayers={allPlayers}
              challengeLeaderUsed={challengeLeaderUsed}
              userId={userId ?? ''}
              canSubmitSelection={canSubmitSelection}
              submitting={submitting}
              handleVote={handleVote}
              confirmButtonLabel={confirmButtonLabel}
              players={players}
              votedPlayerIds={votedPlayerIds}
            />
          </ScrollView>
        }
      />
      <Modal
        visible={!!previewCard}
        onClose={() => setPreviewCardId(null)}
        title={t('game.votePreviewTitle', { defaultValue: 'Detalle de carta' })}
      >
        {previewCard ? (
          <View style={styles.previewContent}>
            <View style={styles.previewCardWrap}>
              <DixitCard uri={previewCard.image_url} interactive={false} glowing />
            </View>
            <View style={styles.previewCopy}>
              <Text style={styles.previewEyebrow}>
                {t('game.votePreviewEyebrow', { defaultValue: 'Descripción de la carta' })}
              </Text>
              <Text style={styles.previewText}>{previewCard.prompt}</Text>
            </View>
            <View style={styles.previewActions}>
              <Button
                variant="ghost"
                onPress={() => setPreviewCardId(null)}
                style={styles.previewButton}
              >
                {t('common.close', { defaultValue: 'Cerrar' })}
              </Button>
            </View>
          </View>
        ) : null}
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  centerContent: {
    padding: 14,
    gap: 12,
    paddingBottom: 28,
  },
  scroll: {
    flex: 1,
  },
  voteHint: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.16)',
    backgroundColor: 'rgba(24, 12, 4, 0.56)',
  },
  voteHintText: {
    color: 'rgba(244, 212, 122, 0.92)',
    fontSize: 18,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 0.8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  previewContent: {
    gap: 14,
  },
  previewCardWrap: {
    width: '78%',
    alignSelf: 'center',
  },
  previewCopy: {
    gap: 6,
    padding: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.18)',
    backgroundColor: 'rgba(20, 12, 5, 0.76)',
  },
  previewEyebrow: {
    color: 'rgba(255, 241, 222, 0.45)',
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  previewText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.title,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 10,
  },
  previewButton: {
    flex: 1,
  },
})
