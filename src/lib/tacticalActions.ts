import type { RiskClueProfile, VoteBetTokens } from '@/types/game'

export const MAX_INTUITION_TOKENS = 10
export const CORRUPTED_CARD_TOKEN_COST = 1
export const AMBUSH_TOKEN_COST = 1
export const BET_ONE_TOKEN_COST = 1
export const BET_TWO_TOKEN_COST = 2
export const CHALLENGE_LEADER_TOKEN_COST = 1

export type TacticalPhase = 'narrator_turn' | 'players_turn' | 'voting'
export type TacticalActionId =
  | 'risk_normal'
  | 'risk_sniper'
  | 'risk_narrow'
  | 'risk_ambush'
  | 'corrupted_card'
  | 'bet_1'
  | 'bet_2'

export type TacticalDetailId = TacticalActionId | 'challenge_leader'

export interface TacticalActionDefinition {
  id: TacticalActionId
  phase: TacticalPhase
  icon: string
  nameKey: string
  shortDescriptionKey: string
  detailKey: string
  rewardKey: string
  riskKey: string
  costTokens: number
  riskClueProfile?: RiskClueProfile
  betTokens?: Exclude<VoteBetTokens, 0>
  isCorrupted?: boolean
}

export interface TacticalActionState extends TacticalActionDefinition {
  enabled: boolean
  disabledReasonKey: string | null
}

export interface TacticalActionContext {
  phase: TacticalPhase
  selectionActive: boolean
  intuitionTokens: number
  isPhaseOwner: boolean
  corruptedCardsRemaining: number
}

export interface ChallengeLeaderContext {
  selectionActive: boolean
  intuitionTokens: number
  playerId: string
  soloLeaderId: string | null
  challengeLeaderUsed: boolean
}

export interface ChallengeLeaderState {
  id: 'challenge_leader'
  icon: string
  nameKey: string
  shortDescriptionKey: string
  detailKey: string
  rewardKey: string
  riskKey: string
  costTokens: number
  enabled: boolean
  disabledReasonKey: string | null
}

const HELPER_REASON_PRIORITY = [
  'game.tactics.notes.selectionRequired',
  'game.tactics.notes.onlyNarratorRisk',
  'game.tactics.notes.needTwoIntuition',
  'game.tactics.notes.needOneIntuition',
  'game.tactics.notes.challengeNeedIntuition',
  'game.tactics.notes.noCorruptedCardsLeft',
  'game.tactics.notes.challengeSpent',
  'game.tactics.notes.challengeNoLeader',
  'game.tactics.notes.challengeSelfLeader',
] as const

const TACTICAL_ACTIONS: Record<TacticalActionId, TacticalActionDefinition> = {
  risk_normal: {
    id: 'risk_normal',
    phase: 'narrator_turn',
    icon: 'cards-heart-outline',
    nameKey: 'game.tactics.actions.risk_normal.name',
    shortDescriptionKey: 'game.tactics.actions.risk_normal.short',
    detailKey: 'game.tactics.actions.risk_normal.detail',
    rewardKey: 'game.tactics.actions.risk_normal.reward',
    riskKey: 'game.tactics.actions.risk_normal.risk',
    costTokens: 0,
    riskClueProfile: 'normal',
  },
  risk_sniper: {
    id: 'risk_sniper',
    phase: 'narrator_turn',
    icon: 'target',
    nameKey: 'game.tactics.actions.risk_sniper.name',
    shortDescriptionKey: 'game.tactics.actions.risk_sniper.short',
    detailKey: 'game.tactics.actions.risk_sniper.detail',
    rewardKey: 'game.tactics.actions.risk_sniper.reward',
    riskKey: 'game.tactics.actions.risk_sniper.risk',
    costTokens: 0,
    riskClueProfile: 'sniper',
  },
  risk_narrow: {
    id: 'risk_narrow',
    phase: 'narrator_turn',
    icon: 'bullseye-arrow',
    nameKey: 'game.tactics.actions.risk_narrow.name',
    shortDescriptionKey: 'game.tactics.actions.risk_narrow.short',
    detailKey: 'game.tactics.actions.risk_narrow.detail',
    rewardKey: 'game.tactics.actions.risk_narrow.reward',
    riskKey: 'game.tactics.actions.risk_narrow.risk',
    costTokens: 0,
    riskClueProfile: 'narrow',
  },
  risk_ambush: {
    id: 'risk_ambush',
    phase: 'narrator_turn',
    icon: 'target-account',
    nameKey: 'game.tactics.actions.risk_ambush.name',
    shortDescriptionKey: 'game.tactics.actions.risk_ambush.short',
    detailKey: 'game.tactics.actions.risk_ambush.detail',
    rewardKey: 'game.tactics.actions.risk_ambush.reward',
    riskKey: 'game.tactics.actions.risk_ambush.risk',
    costTokens: AMBUSH_TOKEN_COST,
    riskClueProfile: 'ambush',
  },
  corrupted_card: {
    id: 'corrupted_card',
    phase: 'players_turn',
    icon: 'cards-playing-diamond-multiple',
    nameKey: 'game.tactics.actions.corrupted_card.name',
    shortDescriptionKey: 'game.tactics.actions.corrupted_card.short',
    detailKey: 'game.tactics.actions.corrupted_card.detail',
    rewardKey: 'game.tactics.actions.corrupted_card.reward',
    riskKey: 'game.tactics.actions.corrupted_card.risk',
    costTokens: CORRUPTED_CARD_TOKEN_COST,
    isCorrupted: true,
  },
  bet_1: {
    id: 'bet_1',
    phase: 'voting',
    icon: 'dice-1',
    nameKey: 'game.tactics.actions.bet_1.name',
    shortDescriptionKey: 'game.tactics.actions.bet_1.short',
    detailKey: 'game.tactics.actions.bet_1.detail',
    rewardKey: 'game.tactics.actions.bet_1.reward',
    riskKey: 'game.tactics.actions.bet_1.risk',
    costTokens: BET_ONE_TOKEN_COST,
    betTokens: 1,
  },
  bet_2: {
    id: 'bet_2',
    phase: 'voting',
    icon: 'dice-multiple',
    nameKey: 'game.tactics.actions.bet_2.name',
    shortDescriptionKey: 'game.tactics.actions.bet_2.short',
    detailKey: 'game.tactics.actions.bet_2.detail',
    rewardKey: 'game.tactics.actions.bet_2.reward',
    riskKey: 'game.tactics.actions.bet_2.risk',
    costTokens: BET_TWO_TOKEN_COST,
    betTokens: 2,
  },
}

export function getTacticalActionDefinition(actionId: TacticalActionId) {
  return TACTICAL_ACTIONS[actionId]
}

function getBlockedReason(action: TacticalActionDefinition, context: TacticalActionContext) {
  if (action.phase === 'narrator_turn' && !context.isPhaseOwner) {
    return 'game.tactics.notes.onlyNarratorRisk'
  }

  if (!context.selectionActive) {
    return 'game.tactics.notes.selectionRequired'
  }

  if (action.id === 'corrupted_card' && context.corruptedCardsRemaining <= 0) {
    return 'game.tactics.notes.noCorruptedCardsLeft'
  }

  if (context.intuitionTokens < action.costTokens) {
    return action.costTokens >= 2
      ? 'game.tactics.notes.needTwoIntuition'
      : 'game.tactics.notes.needOneIntuition'
  }

  return null
}

export function getPhaseTacticalActions(context: TacticalActionContext): TacticalActionState[] {
  return Object.values(TACTICAL_ACTIONS)
    .filter((action) => action.phase === context.phase)
    .map((action) => {
      const disabledReasonKey = getBlockedReason(action, context)
      return {
        ...action,
        enabled: disabledReasonKey === null,
        disabledReasonKey,
      }
    })
}

export function getChallengeLeaderState({
  selectionActive,
  intuitionTokens,
  playerId,
  soloLeaderId,
  challengeLeaderUsed,
}: ChallengeLeaderContext): ChallengeLeaderState {
  let disabledReasonKey: string | null = null

  if (!selectionActive) {
    disabledReasonKey = 'game.tactics.notes.selectionRequired'
  } else if (challengeLeaderUsed) {
    disabledReasonKey = 'game.tactics.notes.challengeSpent'
  } else if (!soloLeaderId) {
    disabledReasonKey = 'game.tactics.notes.challengeNoLeader'
  } else if (soloLeaderId === playerId) {
    disabledReasonKey = 'game.tactics.notes.challengeSelfLeader'
  } else if (intuitionTokens < CHALLENGE_LEADER_TOKEN_COST) {
    disabledReasonKey = 'game.tactics.notes.challengeNeedIntuition'
  }

  return {
    id: 'challenge_leader',
    icon: 'sword-cross',
    nameKey: 'game.tactics.challengeLeader.name',
    shortDescriptionKey: 'game.tactics.challengeLeader.short',
    detailKey: 'game.tactics.challengeLeader.detail',
    rewardKey: 'game.tactics.challengeLeader.reward',
    riskKey: 'game.tactics.challengeLeader.risk',
    costTokens: CHALLENGE_LEADER_TOKEN_COST,
    enabled: disabledReasonKey === null,
    disabledReasonKey,
  }
}

export function getPrimaryTacticalHelperReason(
  phaseActions: TacticalActionState[],
  challengeLeaderState: ChallengeLeaderState,
) {
  if (phaseActions.some((action) => action.enabled) || challengeLeaderState.enabled) {
    return null
  }

  const blockedReasons = [
    ...phaseActions.map((action) => action.disabledReasonKey).filter(Boolean),
    challengeLeaderState.disabledReasonKey,
  ].filter(Boolean) as string[]

  return HELPER_REASON_PRIORITY.find((reason) => blockedReasons.includes(reason)) ?? null
}

export function getSoloLeaderIdFromScores(players: Array<{ player_id: string; score: number }>) {
  const sorted = [...players].sort((left, right) => right.score - left.score)
  if (sorted.length === 0) return null
  if (sorted.length > 1 && sorted[0]!.score === sorted[1]!.score) return null
  return sorted[0]!.player_id
}
