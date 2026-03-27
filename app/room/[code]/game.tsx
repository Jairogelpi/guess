// app/room/[code]/game.tsx
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { useAuth } from '@/hooks/useAuth'
import { useRoom } from '@/hooks/useRoom'
import { useRound } from '@/hooks/useRound'
import { useGameActions } from '@/hooks/useGameActions'
import { useConfirmRoomExit } from '@/hooks/useConfirmRoomExit'
import { useGameStore } from '@/stores/useGameStore'
import { useGamePhaseOrchestration } from '@/hooks/useGamePhaseOrchestration'
import { NarratorPhase } from '@/components/game-phases/NarratorPhase'
import { PlayersPhase } from '@/components/game-phases/PlayersPhase'
import { VotingPhase } from '@/components/game-phases/VotingPhase'
import { ResultsPhase } from '@/components/game-phases/ResultsPhase'
import { TacticalActionPicker } from '@/components/game/TacticalActionPicker'
import { AppHeader } from '@/components/layout/AppHeader'
import { GameStatusHUD } from '@/components/game/GameStatusHUD'
import { LiveStandingsStrip } from '@/components/game/LiveStandingsStrip'
import { EconomyBadges } from '@/components/game/EconomyBadges'
import { WaitingCard } from '@/components/game/WaitingCard'
import { GameLoadingScreen } from '@/components/game/GameLoadingScreen'
import { GameLayout } from '@/components/layout/GameLayout'
import { GameErrorBoundary } from '@/components/game/GameErrorBoundary'

export default function GameScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { t } = useTranslation()
  const router = useRouter()
  const { room, players } = useRoom(code ?? null)
  const { userId } = useAuth()
  const { leaveRoom } = useGameActions()

  useRound(room?.id)

  const round = useGameStore((s) => s.round)

  const { allowNextNavigation } = useConfirmRoomExit({
    enabled: !!code,
    t,
    onConfirmExit: async () => {
      if (!code) return
      await leaveRoom(code)
      router.replace('/(tabs)')
    },
  })

  useEffect(() => {
    if (!code || !room) return
    if (room.status === 'ended') {
      allowNextNavigation()
      router.replace(`/room/${code}/ended`)
    }
  }, [allowNextNavigation, code, room, router])

  const {
    isNarrator, isHost, isLastRound, status,
    narratorName, narratorAvatar,
    nonNarratorPlayers, submittedPlayerIds,
    phaseLabels, stepCurrent, stepTotal,
  } = useGamePhaseOrchestration({
    userId: userId ?? '',
    players,
    hostId: room?.host_id ?? '',
    maxRounds: room?.max_rounds ?? 0,
  })

  if (!round || !room || !userId || !code) {
    return <GameLoadingScreen />
  }

  const currentPlayer = players.find(p => p.player_id === userId)
  const wildcardsLeft = currentPlayer?.wildcards_remaining ?? 0
  const generationTokens = currentPlayer?.generation_tokens ?? 0
  const intuitionTokens = currentPlayer?.intuition_tokens ?? 0
  const challengeLeaderUsed = currentPlayer?.challenge_leader_used ?? false
  const corruptedCardsRemaining = currentPlayer?.corrupted_cards_remaining ?? 0

  return (
    <GameLayout>
      <AppHeader title={t('game.title', { defaultValue: 'PARTIDA' })} />
      
      <GameStatusHUD
        roundNumber={round.round_number}
        maxRounds={room.max_rounds}
        phaseLabel={phaseLabels[status] ?? t(status)}
        stepCurrent={stepCurrent}
        stepTotal={stepTotal}
        phaseStartedAt={round.phase_started_at}
        phaseDurationSeconds={room.phase_duration_seconds ?? undefined}
      />

      <LiveStandingsStrip players={players} currentUserId={userId} />

      <EconomyBadges
        intuitionTokens={intuitionTokens}
        wildcardsLeft={wildcardsLeft}
        generationTokens={generationTokens}
        corruptedCardsRemaining={corruptedCardsRemaining}
      />

      {status === 'narrator_turn' && (
        <GameErrorBoundary phaseName="narrator_turn">
          {isNarrator ? (
            <NarratorPhase
              roomCode={code}
              wildcardsRemaining={wildcardsLeft}
            />
          ) : (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
              <WaitingCard
                narratorName={narratorName}
                narratorAvatar={narratorAvatar}
                clue={undefined}
                submittedCount={0}
                expectedCount={nonNarratorPlayers.length}
                isCurrentUserNarrator={false}
                currentUserId={userId}
                submittedPlayerIds={[]}
                contextMessage={t('game.waitingForNarrator')}
              />
              <TacticalActionPicker
                phase="narrator_turn"
                selectionActive={false}
                intuitionTokens={intuitionTokens}
                isPhaseOwner={false}
                playerId={userId}
                players={players}
                challengeLeaderUsed={challengeLeaderUsed}
                corruptedCardsRemaining={corruptedCardsRemaining}
                selectedAction={null}
                selectedChallengeLeader={false}
                onSelectAction={() => {}}
                onSelectChallengeLeader={() => {}}
              />
            </ScrollView>
          )}
        </GameErrorBoundary>
      )}

      {status === 'players_turn' && (
        <GameErrorBoundary phaseName="players_turn">
          <PlayersPhase
            roomCode={code}
            narratorClue={round.clue}
            isWaiting={isNarrator || submittedPlayerIds.includes(userId)}
            wildcardsRemaining={wildcardsLeft}
          />
        </GameErrorBoundary>
      )}

      {status === 'voting' && (
        <GameErrorBoundary phaseName="voting">
          <VotingPhase
            roomCode={code}
            isNarrator={isNarrator}
            narratorName={narratorName}
            narratorAvatar={narratorAvatar}
            players={nonNarratorPlayers}
            votedPlayerIds={[]}
            intuitionTokens={intuitionTokens}
            challengeLeaderUsed={challengeLeaderUsed}
            allPlayers={players}
          />
        </GameErrorBoundary>
      )}

      {status === 'results' && (
        <GameErrorBoundary phaseName="results">
          <ResultsPhase
            roomCode={code}
            isHost={isHost}
            isLastRound={isLastRound}
            players={players}
          />
        </GameErrorBoundary>
      )}
    </GameLayout>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 18 },
})
