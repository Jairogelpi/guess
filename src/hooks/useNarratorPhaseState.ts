import { useEffect, useState } from 'react'
import type { TFunction } from 'i18next'
import { useAuth } from '@/hooks/useAuth'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import {
  getChallengeLeaderState,
  getTacticalActionDefinition,
  getSoloLeaderIdFromScores,
  type TacticalActionId,
} from '@/lib/tacticalActions'
import { buildNarratorSubmitSummary } from '@/lib/tacticalUiCopy'
import type { GalleryCard } from '@/types/game'

type Translate = TFunction

export type SelectedNarratorCard =
  | { kind: 'generated'; imageUrl: string; prompt: string; cardId: string }
  | { kind: 'gallery'; imageUrl: string; prompt: string; galleryCardId: string }

interface Params {
  roomCode: string
  intuitionTokens: number
  challengeLeaderUsed: boolean
  allPlayers: Array<{ player_id: string; score: number }>
  t: Translate
}

export function useNarratorPhaseState({
  roomCode,
  intuitionTokens,
  challengeLeaderUsed,
  allPlayers,
  t,
}: Params) {
  const { userId } = useAuth()
  const round = useGameStore((s) => s.round)
  const { gameAction, gameActionResult, insertCard } = useGameActions()

  const [selectedCard, setSelectedCard] = useState<SelectedNarratorCard | null>(null)
  const [clue, setClue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedAction, setSelectedAction] = useState<TacticalActionId | null>(null)
  const [challengeLeader, setChallengeLeader] = useState(false)
  const [tacticsExpanded, setTacticsExpanded] = useState(false)

  const selectedActionDefinition = selectedAction ? getTacticalActionDefinition(selectedAction) : null
  const challengeLeaderState = getChallengeLeaderState({
    selectionActive: true,
    intuitionTokens,
    playerId: userId ?? '',
    soloLeaderId: getSoloLeaderIdFromScores(allPlayers),
    challengeLeaderUsed,
  })

  const tacticActive = Boolean(selectedAction || challengeLeader)
  const selectedActionCost = selectedActionDefinition?.costTokens ?? 0
  const challengeLeaderCost = challengeLeader ? challengeLeaderState.costTokens : 0
  const totalTacticalCost = selectedActionCost + challengeLeaderCost
  const intuitionAfterSubmit = Math.max(0, intuitionTokens - totalTacticalCost)

  const tacticStatusText = selectedActionDefinition
    ? t('game.tactics.selectedAction', { name: t(selectedActionDefinition.nameKey) })
    : challengeLeader
      ? t('game.tactics.challengeLeaderSelected')
      : t('game.tactics.launcher.noneActive')

  const submitSummaryText = buildNarratorSubmitSummary({
    t,
    selectedActionName: selectedActionDefinition ? t(selectedActionDefinition.nameKey) : undefined,
    challengeLeader,
  })

  useEffect(() => {
    setSelectedAction(null)
    setChallengeLeader(false)
    setTacticsExpanded(false)
  }, [selectedCard])

  async function handleSelectCard(imageUrl: string, prompt: string) {
    if (!round || !userId) return
    const cardId = await insertCard(roomCode, imageUrl, prompt)
    if (cardId) {
      setSelectedCard({ kind: 'generated', imageUrl, prompt, cardId })
    }
  }

  function handleSelectGalleryCard(card: GalleryCard) {
    setSelectedCard({
      kind: 'gallery',
      imageUrl: card.image_url,
      prompt: card.prompt,
      galleryCardId: card.id,
    })
  }

  async function handleSubmitClue() {
    if (!clue.trim() || !selectedCard) return
    setSubmitting(true)

    const risk_clue_profile =
      selectedAction === 'risk_sniper' || selectedAction === 'risk_narrow' || selectedAction === 'risk_ambush'
        ? (selectedAction.replace('risk_', '') as 'sniper' | 'narrow' | 'ambush')
        : undefined

    if (selectedCard.kind === 'generated') {
      await gameAction(roomCode, 'submit_clue', {
        clue: clue.trim(),
        card_id: selectedCard.cardId,
        risk_clue_profile,
        challenge_leader: challengeLeader,
      })
    } else {
      await gameActionResult(roomCode, 'submit_clue', {
        clue: clue.trim(),
        gallery_card_id: selectedCard.galleryCardId,
        risk_clue_profile,
        challenge_leader: challengeLeader,
      })
    }

    setSubmitting(false)
  }

  return {
    userId: userId ?? undefined,
    round,
    selectedCard,
    setSelectedCard,
    clue,
    setClue,
    submitting,
    selectedAction,
    setSelectedAction,
    challengeLeader,
    setChallengeLeader,
    tacticsExpanded,
    setTacticsExpanded,
    challengeLeaderState,
    tacticActive,
    totalTacticalCost,
    intuitionAfterSubmit,
    tacticStatusText,
    submitSummaryText,
    handleSelectCard,
    handleSelectGalleryCard,
    handleSubmitClue,
  }
}
