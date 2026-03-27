import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, View, Text, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { GameBoard } from '@/components/game/GameBoard'
import { VoteCardField } from '@/components/game/VoteCardField'
import { ClueHero } from '@/components/game/ClueHero'
import { WaitingCard } from '@/components/game/WaitingCard'
import { TacticalActionPicker } from '@/components/game/TacticalActionPicker'
import { Button } from '@/components/ui/Button'
import { colors, fonts } from '@/constants/theme'
import type { TacticalActionId } from '@/lib/tacticalActions'
import type { RoomPlayer } from '@/types/game'

interface Props {
  roomCode: string
  isNarrator: boolean
  narratorName: string
  narratorAvatar?: string
  players: RoomPlayer[]
  votedPlayerIds: string[]
  intuitionTokens: number
  challengeLeaderUsed: boolean
  allPlayers: RoomPlayer[]
}

export function VotingPhase({
  roomCode,
  isNarrator,
  narratorName,
  narratorAvatar,
  players,
  votedPlayerIds,
  intuitionTokens,
  challengeLeaderUsed,
  allPlayers,
}: Props) {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const cards = useGameStore((s) => s.cards)
  const myPlayedCardId = useGameStore((s) => s.myPlayedCardId)
  const myVotedCardId = useGameStore((s) => s.myVotedCardId)
  const setMyVotedCardId = useGameStore((s) => s.setMyVotedCardId)
  const clue = useGameStore((s) => s.round?.clue) ?? undefined
  const { gameAction } = useGameActions()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedAction, setSelectedAction] = useState<TacticalActionId | null>(null)
  const [challengeLeader, setChallengeLeader] = useState(false)

  const hasVoted = isNarrator || !!myVotedCardId

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

  const votableCards = useMemo(
    () => cards.filter((card) => card.id !== myPlayedCardId),
    [cards, myPlayedCardId],
  )

  useEffect(() => {
    setSelectedAction(null)
    setChallengeLeader(false)
  }, [selectedId])

  async function handleVote() {
    if (!selectedId) return
    setSubmitting(true)
    const ok = await gameAction(roomCode, 'submit_vote', {
      card_id: selectedId,
      bet_tokens: selectedAction === 'bet_2' ? 2 : selectedAction === 'bet_1' ? 1 : 0,
      challenge_leader: challengeLeader,
    })
    if (ok) setMyVotedCardId(selectedId)
    setSubmitting(false)
  }

  // ── Waiting state ──
  if (hasVoted) {
    return (
      <GameBoard
        center={
          <View style={styles.centerContent}>
            {clue && <ClueHero clue={clue} />}
            <WaitingCard
              narratorName={narratorName}
              narratorAvatar={narratorAvatar}
              clue={clue}
              submittedCount={votedPlayerIds.length}
              expectedCount={players.length}
              isCurrentUserNarrator={isNarrator}
              currentUserId={userId ?? ''}
              submittedPlayerIds={votedPlayerIds}
              contextMessage={t('game.waitingForVotes')}
            />
          </View>
        }
      />
    )
  }

  // ── Active voting ──
  return (
    <GameBoard
      center={
        <View style={styles.centerContent}>
          {clue && <ClueHero clue={clue} />}

          {/* Guide — only shown before selection */}
          {!selectedId && (
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
            selectedId={selectedId}
            onSelect={(card) => setSelectedId(card.id)}
          />
        </View>
      }
      actionBar={
        <View style={styles.actionContent}>
          <TacticalActionPicker
            phase="voting"
            selectionActive={!!selectedId}
            intuitionTokens={intuitionTokens}
            isPhaseOwner={!isNarrator}
            playerId={userId ?? ''}
            players={allPlayers}
            challengeLeaderUsed={challengeLeaderUsed}
            corruptedCardsRemaining={0}
            selectedAction={selectedAction}
            selectedChallengeLeader={challengeLeader}
            onSelectAction={setSelectedAction}
            onSelectChallengeLeader={setChallengeLeader}
          />
          <Button onPress={handleVote} loading={submitting} disabled={!selectedId}>
            {t('game.vote')}
          </Button>
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 14,
    gap: 12,
  },
  voteHint: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    opacity: 0.85,
  },
  voteHintText: {
    color: 'rgba(230, 184, 0, 0.5)',
    fontSize: 12,
    fontFamily: fonts.title,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  actionContent: {
    gap: 10,
  },
})
