// app/room/[code]/game.tsx
import { useMemo } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'
import { useRoom } from '@/hooks/useRoom'
import { useRound } from '@/hooks/useRound'
import { useGameStore } from '@/stores/useGameStore'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { NarratorPhase } from '@/components/game-phases/NarratorPhase'
import { PlayersPhase } from '@/components/game-phases/PlayersPhase'
import { VotingPhase } from '@/components/game-phases/VotingPhase'
import { ResultsPhase } from '@/components/game-phases/ResultsPhase'
import { ContextStrip } from '@/components/game/ContextStrip'
import { WaitingCard } from '@/components/game/WaitingCard'
import { GameLoadingScreen } from '@/components/game/GameLoadingScreen'
import { GameLayout } from '@/components/layout/GameLayout'

export default function GameScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { t } = useTranslation()
  const { room, players } = useRoom(code ?? null)
  const { userId } = useAuth()

  useRound(room?.id)

  // All store reads MUST be before any early return (React rules of hooks)
  const round = useGameStore((s) => s.round)
  const cards = useGameStore((s) => s.cards)
  const narratorStep = useGameStore((s) => s.narratorStep)

  if (!round || !room || !userId || !code) {
    return <GameLoadingScreen />
  }

  const isNarrator = round.narrator_id === userId
  const isHost = room.host_id === userId
  const isLastRound = round.round_number === room.max_rounds
  const status = round.status

  const narratorPlayer = useMemo(
    () => players.find((p) => p.player_id === round.narrator_id),
    [players, round.narrator_id],
  )
  const narratorName = narratorPlayer?.display_name ?? t('game.narrator')
  // RoomPlayer has no avatar_url — pass undefined; WaitingCard/phases show initials fallback
  const narratorAvatar: string | undefined = undefined

  const nonNarratorPlayers = useMemo(
    () => players.filter((p) => p.player_id !== round.narrator_id),
    [players, round.narrator_id],
  )

  // Phase labels for ContextStrip
  const phaseLabels: Record<string, string> = {
    narrator_turn: t('game.phaseNarrator'),
    players_turn: t('game.phaseChoose'),
    voting: t('game.phaseVote'),
    results: t('game.phaseResults'),
  }

  // Submitted player IDs (derived from cards store — live via Realtime)
  const submittedPlayerIds = cards
    .filter((c) => c.player_id !== null && c.player_id !== round.narrator_id)
    .map((c) => c.player_id as string)

  // ContextStrip step pill: shown only for narrator during narrator_turn
  const showStep = status === 'narrator_turn' && isNarrator
  const stepCurrent = showStep ? narratorStep : undefined
  const stepTotal = showStep ? 2 : undefined

  return (
    <GameLayout>
      <ContextStrip
        roundNumber={round.round_number}
        maxRounds={room.max_rounds}
        phaseLabel={phaseLabels[status] ?? status}
        stepCurrent={stepCurrent}
        stepTotal={stepTotal}
      />

      {status === 'narrator_turn' &&
        (isNarrator ? (
          <NarratorPhase
            roomCode={code}
            roundNumber={round.round_number}
            maxRounds={room.max_rounds}
          />
        ) : (
          // Non-narrator players wait during narrator_turn — show WaitingCard directly
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
          </ScrollView>
        ))}

      {status === 'players_turn' && (
        <PlayersPhase
          roomCode={code}
          narratorName={narratorName}
          narratorAvatar={narratorAvatar}
          isNarrator={isNarrator}
          players={nonNarratorPlayers}
          submittedPlayerIds={submittedPlayerIds}
          roundNumber={round.round_number}
          maxRounds={room.max_rounds}
        />
      )}

      {status === 'voting' && (
        <VotingPhase
          roomCode={code}
          isNarrator={isNarrator}
          narratorName={narratorName}
          narratorAvatar={narratorAvatar}
          players={nonNarratorPlayers}
          // During voting, cards are masked (player_id: null) so we can't derive voted IDs
          // from cards. Pass empty array — WaitingCard dots show 0/N (known v1 limitation).
          // The voting phase transitions server-side when all votes are received.
          votedPlayerIds={[]}
        />
      )}

      {status === 'results' && (
        <ResultsPhase
          roomCode={code}
          isHost={isHost}
          isLastRound={isLastRound}
          players={players}
        />
      )}
    </GameLayout>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 14 },
})
