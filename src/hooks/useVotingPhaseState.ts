import { useEffect, useMemo, useState } from 'react'
import type { TFunction } from 'i18next'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { CHALLENGE_LEADER_TOKEN_COST, type TacticalActionId } from '@/lib/tacticalActions'
import { buildVoteConfirmLabel, buildVoteStatusMeta, getVoteBetTokenCost } from '@/lib/tacticalUiCopy'

type Translate = TFunction

interface Params {
  roomCode: string
  isNarrator: boolean
  intuitionTokens: number
  t: Translate
}

interface VoteGuidanceStatus {
  title: string
  body: string
  hint?: string
  iconName: string
  iconColor: string
  pending: boolean
  committed: boolean
}

export function useVotingPhaseState({ roomCode, isNarrator, intuitionTokens, t }: Params) {
  const cards = useGameStore((s) => s.cards)
  const clue = useGameStore((s) => s.round?.clue) ?? undefined
  const myPlayedCardId = useGameStore((s) => s.myPlayedCardId)
  const myVotedCardId = useGameStore((s) => s.myVotedCardId)
  const setMyVotedCardId = useGameStore((s) => s.setMyVotedCardId)
  const { gameAction } = useGameActions()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedAction, setSelectedAction] = useState<TacticalActionId | null>(null)
  const [challengeLeader, setChallengeLeader] = useState(false)
  const [previewCardId, setPreviewCardId] = useState<string | null>(null)
  const [showTactics, setShowTactics] = useState(false)

  const hasVoted = isNarrator || !!myVotedCardId
  const effectiveSelectedId = selectedId ?? myVotedCardId
  const hasPendingVoteChange = !!selectedId && selectedId !== myVotedCardId
  const canSubmitSelection = !!selectedId

  const betTokenCost = getVoteBetTokenCost(selectedAction)
  const challengeTokenCost = challengeLeader ? CHALLENGE_LEADER_TOKEN_COST : 0
  const totalTacticalCost = betTokenCost + challengeTokenCost
  const remainingAfterSubmit = Math.max(0, intuitionTokens - totalTacticalCost)
  const hasSelectedTactics = totalTacticalCost > 0

  const votableCards = useMemo(
    () => cards.filter((card) => card.id !== myPlayedCardId),
    [cards, myPlayedCardId],
  )
  const previewCard = useMemo(
    () => votableCards.find((card) => card.id === previewCardId) ?? null,
    [previewCardId, votableCards],
  )
  const selectedCard = useMemo(
    () => votableCards.find((card) => card.id === effectiveSelectedId) ?? null,
    [effectiveSelectedId, votableCards],
  )

  const voteStatusMeta = buildVoteStatusMeta({
    t,
    hasSelectedTactics,
    betTokenCost,
    challengeLeader,
  })

  const guideSteps: [string, string, string] = [
    t('game.voteGuideStepOne', { defaultValue: 'Toca una carta para seleccionarla al instante.' }),
    t('game.voteGuideStepTwo', { defaultValue: 'Pulsa confirmar para enviar o cambiar tu voto.' }),
    t('game.voteGuideStepThree', { defaultValue: 'Mantener pulsado abre zoom y detalle de la carta.' }),
  ]

  const selectionStatus: VoteGuidanceStatus = {
    title: hasPendingVoteChange
      ? t('game.votePendingChange', { defaultValue: 'Cambio sin confirmar' })
      : myVotedCardId
        ? t('game.voteRegistered', { defaultValue: 'Tu voto ya esta enviado' })
        : t('game.voteNotSent', { defaultValue: 'Aun no has votado' }),
    body: selectedCard
      ? t('game.voteCurrentCard', {
          defaultValue: 'Carta elegida: {{prompt}}',
          prompt: selectedCard.prompt,
        })
      : t('game.voteTapAnyCard', {
          defaultValue: 'Pulsa una carta para verla grande y elegirla.',
        }),
    hint: myVotedCardId && !hasPendingVoteChange
      ? t('game.voteCanStillChange', {
          defaultValue: 'Puedes tocar otra carta en cualquier momento para cambiar tu voto.',
        })
      : undefined,
    iconName: hasPendingVoteChange ? 'alert-circle' : myVotedCardId ? 'check-circle' : 'cards-outline',
    iconColor: hasPendingVoteChange ? '#ffb35c' : myVotedCardId ? '#f4c66e' : 'rgba(255,241,222,0.65)',
    pending: hasPendingVoteChange,
    committed: !!myVotedCardId && !hasPendingVoteChange,
  }

  const confirmButtonLabel = useMemo(
    () => buildVoteConfirmLabel({ t, hasVoted, betTokenCost, challengeLeader }),
    [betTokenCost, challengeLeader, hasVoted, t],
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
      bet_tokens: betTokenCost,
      challenge_leader: challengeLeader,
    })
    if (ok) {
      setMyVotedCardId(selectedId)
      setShowTactics(false)
    }
    setSubmitting(false)
  }

  return {
    clue,
    myVotedCardId,
    selectedId,
    setSelectedId,
    selectedAction,
    setSelectedAction,
    challengeLeader,
    setChallengeLeader,
    previewCardId,
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
    selectedCard,
    guideSteps,
    selectionStatus,
    voteStatusMeta,
    confirmButtonLabel,
  }
}
