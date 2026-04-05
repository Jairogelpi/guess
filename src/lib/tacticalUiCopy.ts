import type { TFunction } from 'i18next'
import type { TacticalActionId } from '@/lib/tacticalActions'

type Translate = TFunction

interface VoteConfirmLabelParams {
  t: Translate
  hasVoted: boolean
  betTokenCost: number
  challengeLeader: boolean
}

interface VoteStatusMetaParams {
  t: Translate
  hasSelectedTactics: boolean
  betTokenCost: number
  challengeLeader: boolean
}

interface NarratorSummaryParams {
  t: Translate
  selectedActionName?: string
  challengeLeader: boolean
}

export function getVoteBetTokenCost(selectedAction: TacticalActionId | null) {
  return selectedAction === 'bet_2' ? 2 : selectedAction === 'bet_1' ? 1 : 0
}

export function buildVoteConfirmLabel({
  t,
  hasVoted,
  betTokenCost,
  challengeLeader,
}: VoteConfirmLabelParams) {
  if (hasVoted) {
    if (betTokenCost > 0 && challengeLeader) {
      return t('game.confirmVoteChangeWithAllTactics', {
        defaultValue: 'Confirmar cambio + apuesta {{bet}} + desafiar lider',
        bet: betTokenCost,
      })
    }
    if (betTokenCost > 0) {
      return t('game.confirmVoteChangeWithBet', {
        defaultValue: 'Confirmar cambio + apuesta {{bet}}',
        bet: betTokenCost,
      })
    }
    if (challengeLeader) {
      return t('game.confirmVoteChangeWithChallenge', {
        defaultValue: 'Confirmar cambio + desafiar lider',
      })
    }
    return t('game.confirmVoteChange', 'Confirmar cambio de voto')
  }

  if (betTokenCost > 0 && challengeLeader) {
    return t('game.confirmVoteWithAllTactics', {
      defaultValue: 'Confirmar voto + apuesta {{bet}} + desafiar lider',
      bet: betTokenCost,
    })
  }
  if (betTokenCost > 0) {
    return t('game.confirmVoteWithBet', {
      defaultValue: 'Confirmar voto + apuesta {{bet}}',
      bet: betTokenCost,
    })
  }
  if (challengeLeader) {
    return t('game.confirmVoteWithChallenge', {
      defaultValue: 'Confirmar voto + desafiar lider',
    })
  }
  return t('game.confirmVote', 'Confirmar voto')
}

export function buildVoteStatusMeta({
  t,
  hasSelectedTactics,
  betTokenCost,
  challengeLeader,
}: VoteStatusMetaParams) {
  if (!hasSelectedTactics) {
    return t('game.voteNoTactic', {
      defaultValue: 'Sin tactica seleccionada. Puedes votar normal o abrir tacticas.',
    })
  }

  if (challengeLeader && betTokenCost > 0) {
    return t('game.voteTacticSummaryBoth', {
      defaultValue: 'Seleccion actual: apuesta {{bet}} + desafiar lider.',
      bet: betTokenCost,
    })
  }

  if (challengeLeader) {
    return t('game.voteTacticSummaryChallenge', {
      defaultValue: 'Seleccion actual: desafiar lider.',
    })
  }

  return t('game.voteTacticSummaryBet', {
    defaultValue: 'Seleccion actual: apuesta {{bet}}.',
    bet: betTokenCost,
  })
}

export function buildNarratorSubmitSummary({
  t,
  selectedActionName,
  challengeLeader,
}: NarratorSummaryParams) {
  if (selectedActionName && challengeLeader) {
    return t('game.narratorSubmitSummaryAll', {
      defaultValue: 'Se enviara pista + {{riskName}} + desafiar lider.',
      riskName: selectedActionName,
    })
  }

  if (selectedActionName) {
    return t('game.narratorSubmitSummaryRisk', {
      defaultValue: 'Se enviara pista + {{riskName}}.',
      riskName: selectedActionName,
    })
  }

  if (challengeLeader) {
    return t('game.narratorSubmitSummaryChallenge', {
      defaultValue: 'Se enviara pista + desafiar lider.',
    })
  }

  return t('game.narratorSubmitSummaryBase', {
    defaultValue: 'Se enviara pista sin tactica.',
  })
}
