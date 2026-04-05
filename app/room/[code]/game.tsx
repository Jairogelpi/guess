// app/room/[code]/game.tsx
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '@/hooks/useAuth'
import { useRoom } from '@/hooks/useRoom'
import { useRound } from '@/hooks/useRound'
import { useGameActions } from '@/hooks/useGameActions'
import { useConfirmRoomExit } from '@/hooks/useConfirmRoomExit'
import { useGameStore } from '@/stores/useGameStore'
import { useUIStore } from '@/stores/useUIStore'
import { useGamePhaseOrchestration } from '@/hooks/useGamePhaseOrchestration'
import { buildLeaveRoomConfirmCopy } from '@/lib/leaveRoomConfirm'
import { getPlayerDepartureNotice } from '@/lib/playerDepartureNotice'
import { NarratorPhase } from '@/components/game-phases/NarratorPhase'
import { PlayersPhase } from '@/components/game-phases/PlayersPhase'
import { VotingPhase } from '@/components/game-phases/VotingPhase'
import { ResultsPhase } from '@/components/game-phases/ResultsPhase'
import { AppHeader } from '@/components/layout/AppHeader'
import { UnifiedHUD } from '@/components/game/UnifiedHUD'
import { WaitingCard } from '@/components/game/WaitingCard'
import { GameLoadingScreen } from '@/components/game/GameLoadingScreen'
import { GameLayout } from '@/components/layout/GameLayout'
import { GameErrorBoundary } from '@/components/game/GameErrorBoundary'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { colors } from '@/constants/theme'
import type { RoomPlayer } from '@/types/game'

export default function GameScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { t } = useTranslation()
  const router = useRouter()
  const { room, players } = useRoom(code ?? null)
  const { userId } = useAuth()
  const { leaveRoom } = useGameActions()
  const showToast = useUIStore((s) => s.showToast)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const previousPlayersRef = useRef<RoomPlayer[]>([])

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
    if (!userId) return

    const previousPlayers = previousPlayersRef.current

    if (previousPlayers.length > 0) {
      const departureNotice = getPlayerDepartureNotice(previousPlayers, players, userId, t)
      if (departureNotice) {
        showToast(departureNotice, 'info')
      }
    }

    previousPlayersRef.current = players
  }, [players, showToast, t, userId])

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
  const leaveCopy = buildLeaveRoomConfirmCopy(t)

  async function handleConfirmLeaveRoom() {
    if (!code) return
    setShowLeaveModal(false)
    allowNextNavigation()
    await leaveRoom(code)
    router.replace('/(tabs)')
  }

  return (
    <GameLayout>
      <AppHeader title={t('game.title', { defaultValue: 'PARTIDA' })} />

      <UnifiedHUD
        roundNumber={round.round_number}
        maxRounds={room.max_rounds}
        phaseLabel={phaseLabels[status] ?? t(status)}
        phaseStartedAt={round.phase_started_at}
        phaseDurationSeconds={room.phase_duration_seconds}
        players={players}
        currentUserId={userId}
        wildcardsLeft={wildcardsLeft}
        generationTokens={generationTokens}
        intuitionTokens={intuitionTokens}
        corruptedCardsRemaining={corruptedCardsRemaining}
      />

      {status === 'narrator_turn' && (
        <GameErrorBoundary phaseName="narrator_turn">
          {isNarrator ? (
            <NarratorPhase
              roomCode={code}
              wildcardsRemaining={wildcardsLeft}
              intuitionTokens={intuitionTokens}
              challengeLeaderUsed={challengeLeaderUsed}
              allPlayers={players}
            />
          ) : (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
              <WaitingCard
                narratorName={narratorName}
                narratorAvatar={narratorAvatar}
                clue={undefined}
                submittedCount={0}
                expectedCount={1}
                isCurrentUserNarrator={false}
                currentUserId={userId}
                submittedPlayerIds={[]}
                orderedPlayers={players.filter((p) => p.player_id === round.narrator_id)}
                contextMessage={t('game.waitingForNarrator')}
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
            narratorName={narratorName}
            narratorAvatar={narratorAvatar}
            submittedPlayerIds={submittedPlayerIds}
            expectedCount={nonNarratorPlayers.length}
            currentUserId={userId}
            waitingPlayers={nonNarratorPlayers}
          />
        </GameErrorBoundary>
      )}

      {status === 'voting' && (
        <GameErrorBoundary phaseName="voting">
          <VotingPhase
            roomCode={code}
            isNarrator={isNarrator}
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

      <View style={styles.leaveActionBar}>
        <Button
          variant="ghost"
          onPress={() => setShowLeaveModal(true)}
          style={styles.leaveActionButton}
          textStyle={styles.leaveActionText}
          testID="leave-game-button"
        >
          {t('roomExit.confirm')}
        </Button>
      </View>

      <Modal visible={showLeaveModal} onClose={() => setShowLeaveModal(false)} title={leaveCopy.title}>
        <View style={styles.modalBody}>
          <Text style={styles.modalText}>{leaveCopy.message}</Text>
          <Text style={styles.modalHint}>{t('roomExit.gameWarning')}</Text>
        </View>
        <View style={styles.modalActions}>
          <Button variant="ghost" onPress={() => setShowLeaveModal(false)} style={styles.modalButton}>
            {leaveCopy.cancelLabel}
          </Button>
          <Button variant="danger" onPress={() => void handleConfirmLeaveRoom()} style={styles.modalButton}>
            {leaveCopy.confirmLabel}
          </Button>
        </View>
      </Modal>
    </GameLayout>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 18 },
  leaveActionBar: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
  },
  leaveActionButton: {
    alignSelf: 'center',
    minWidth: 180,
    opacity: 0.96,
  },
  leaveActionText: {
    color: '#ffe8c8',
  },
  modalBody: {
    gap: 10,
  },
  modalText: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  modalHint: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 4,
  },
  modalButton: {
    flex: 1,
  },
})
