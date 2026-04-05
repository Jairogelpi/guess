// src/components/game-phases/ResultsPhase.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, StyleSheet, View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/useGameStore'
import { useCountdownPhase } from '@/hooks/useCountdownPhase'
import { GameBoard } from '@/components/game/GameBoard'
import { ResultsReveal } from '@/components/game/ResultsReveal'
import { CardGrid } from '@/components/game/CardGrid'
import { CountdownButton } from '@/components/game/CountdownButton'
import { ScoreBoard } from '@/components/game/ScoreBoard'
import { RoundRecapOverlay } from '@/components/game/RoundRecapOverlay'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/constants/theme'
import { COUNTDOWN_SECONDS } from '@/constants/game'
import type { RoomPlayer, RoundResolutionSummaryRecord, RoundScore } from '@/types/game'

interface Props {
  roomCode: string
  isHost: boolean
  isLastRound: boolean
  players: RoomPlayer[]
  roundScores?: RoundScore[]
}

const EMPTY_ROUND_SCORES: RoundScore[] = []

export function ResultsPhase({ roomCode, isHost, isLastRound, players, roundScores }: Props) {
  const { t } = useTranslation()
  const cards = useGameStore((s) => s.cards)
  const round = useGameStore((s) => s.round)
  const providedRoundScores = roundScores ?? EMPTY_ROUND_SCORES
  const [liveRoundScores, setLiveRoundScores] = useState<RoundScore[]>(providedRoundScores)
  const [summary, setSummary] = useState<RoundResolutionSummaryRecord['summary'] | null>(null)
  const [showRecap, setShowRecap] = useState(false)
  const recapShownForRound = useRef<string | null>(null)

  const { confirmed, secondsRemaining, handleConfirm, handleAdvance } =
    useCountdownPhase({ roomCode, isHost, isLastRound })

  const narratorCard = useMemo(
    () => round ? cards.find((c) => c.player_id === round.narrator_id) ?? null : null,
    [cards, round?.narrator_id],
  )
  const playerNames = useMemo(
    () => Object.fromEntries(players.map((p) => [p.player_id, p.display_name])),
    [players],
  )
  const effectiveRoundScores = providedRoundScores.length > 0 ? providedRoundScores : liveRoundScores

  useEffect(() => {
    setLiveRoundScores(providedRoundScores)
  }, [providedRoundScores])

  useEffect(() => {
    if (!round?.id) return
    let cancelled = false
    const roundId = round.id

    async function loadRoundResultData() {
      const [scoresResult, summaryResult] = await Promise.all([
        supabase.from('round_scores').select('*').eq('round_id', roundId),
        supabase.from('round_resolution_summaries').select('*').eq('round_id', roundId).single(),
      ])

      if (cancelled) return

      if (scoresResult.data && providedRoundScores.length === 0) {
        setLiveRoundScores(scoresResult.data as RoundScore[])
      }

      if (summaryResult.data) {
        setSummary((summaryResult.data as RoundResolutionSummaryRecord).summary)
      } else {
        setSummary(null)
      }
    }

    void loadRoundResultData()

    return () => {
      cancelled = true
    }
  }, [providedRoundScores.length, round?.id])

  useEffect(() => {
    if (!round?.id || recapShownForRound.current === round.id) return
    recapShownForRound.current = round.id
    setShowRecap(true)
    const timer = setTimeout(() => setShowRecap(false), 4200)
    return () => clearTimeout(timer)
  }, [round?.id])

  return (
    <>
      <GameBoard
        center={
          <ScrollView contentContainerStyle={styles.content}>
            {narratorCard && round?.clue && (
              <ResultsReveal cardUri={narratorCard.image_url} clue={round.clue} />
            )}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('game.roundCardsTitle')}</Text>
              <CardGrid
                cards={cards}
                playerNames={playerNames}
                narratorPlayerId={round?.narrator_id}
                readonly
              />
            </View>

            <View style={[styles.section, styles.scoreSection]}>
              <Text style={styles.sectionLabel}>{t('game.roundStandingsTitle')}</Text>
              <ScoreBoard players={players} roundScores={effectiveRoundScores} />
            </View>
          </ScrollView>
        }
        actionBar={
          <CountdownButton
            secondsRemaining={secondsRemaining}
            totalSeconds={COUNTDOWN_SECONDS}
            isHost={isHost}
            confirmed={confirmed}
            confirmedCount={confirmed ? 1 : 0}
            totalCount={players.length}
            isLastRound={isLastRound}
            onConfirm={handleConfirm}
            onAutoAdvance={isHost ? handleAdvance : () => {}}
          />
        }
      />
      <RoundRecapOverlay visible={showRecap} summary={summary} players={players} />
    </>
  )
}

const styles = StyleSheet.create({
  content: { padding: 14, gap: 18, paddingBottom: 28 },
  section: {
    gap: 10,
  },
  scoreSection: {
    marginTop: 4,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
})
