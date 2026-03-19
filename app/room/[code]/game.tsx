import { View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'
import { useRoom } from '@/hooks/useRoom'
import { useRound } from '@/hooks/useRound'
import { useGameStore } from '@/stores/useGameStore'
import { NarratorPhase } from '@/components/game-phases/NarratorPhase'
import { PlayersPhase } from '@/components/game-phases/PlayersPhase'
import { VotingPhase } from '@/components/game-phases/VotingPhase'
import { ResultsPhase } from '@/components/game-phases/ResultsPhase'
import { RoundStatus } from '@/components/game/RoundStatus'
import { GameLayout } from '@/components/layout/GameLayout'

export default function GameScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { room, players } = useRoom(code ?? null)
  const { userId } = useAuth()

  // Pass room.id directly — no need for a separate query
  useRound(room?.id)
  const round = useGameStore((s) => s.round)

  if (!round || !room || !userId || !code) {
    return <View style={{ flex: 1, backgroundColor: '#120a06' }} />
  }

  const isNarrator = round.narrator_id === userId
  const status = round.status
  const currentPlayer = players.find((player) => player.player_id === userId)
  const wildcardsRemaining = currentPlayer?.wildcards_remaining ?? 0

  return (
    <GameLayout>
      <RoundStatus
        roundNumber={round.round_number}
        maxRounds={room.max_rounds}
        phase={status}
        wildcardsRemaining={wildcardsRemaining}
      />

      {status === 'narrator_turn' &&
        (isNarrator ? (
          <NarratorPhase roomCode={code} wildcardsRemaining={wildcardsRemaining} />
        ) : (
          <PlayersPhase roomCode={code} narratorClue={null} isWaiting wildcardsRemaining={wildcardsRemaining} />
        ))}

      {status === 'players_turn' && (
        <PlayersPhase
          roomCode={code}
          narratorClue={round.clue}
          isWaiting={isNarrator}
          wildcardsRemaining={wildcardsRemaining}
        />
      )}

      {status === 'voting' && <VotingPhase roomCode={code} userId={userId} />}

      {status === 'results' && (
        <ResultsPhase roomCode={code} players={players} />
      )}
    </GameLayout>
  )
}
