// src/components/game-phases/VotingPhase.tsx
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { CardGrid } from '@/components/game/CardGrid'
import { ClueHero } from '@/components/game/ClueHero'
import { WaitingCard } from '@/components/game/WaitingCard'
import { Button } from '@/components/ui/Button'
import type { RoomPlayer } from '@/types/game'

interface Props {
  roomCode: string
  isNarrator: boolean
  narratorName: string
  narratorAvatar?: string
  players: RoomPlayer[]           // non-narrator players
  votedPlayerIds: string[]
}

export function VotingPhase({
  roomCode,
  isNarrator,
  narratorName,
  narratorAvatar,
  players,
  votedPlayerIds,
}: Props) {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const cards = useGameStore((s) => s.cards)
  const myVotedCardId = useGameStore((s) => s.myVotedCardId)
  const setMyVotedCardId = useGameStore((s) => s.setMyVotedCardId)
  const clue = useGameStore((s) => s.round?.clue) ?? undefined
  const { gameAction } = useGameActions()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const hasVoted = isNarrator || !!myVotedCardId
  // Memoized — avoids creating a new array reference on every render,
  // which would force CardGrid to re-render even when cards haven't changed.
  const votableCards = useMemo(
    () => cards.filter((c) => c.player_id !== userId),
    [cards, userId],
  )

  async function handleVote() {
    if (!selectedId) return
    setSubmitting(true)
    const ok = await gameAction(roomCode, 'submit_vote', { card_id: selectedId })
    if (ok) setMyVotedCardId(selectedId)
    setSubmitting(false)
  }

  if (hasVoted) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
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
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {clue && <ClueHero clue={clue} />}
      <CardGrid
        cards={votableCards}
        selectedId={selectedId}
        onSelect={(c) => setSelectedId(c.id)}
      />
      <Button onPress={handleVote} loading={submitting} disabled={!selectedId}>
        {t('game.vote')}
      </Button>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 14, gap: 14 },
})
