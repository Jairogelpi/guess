type RiskClueProfile = 'normal' | 'sniper' | 'narrow' | 'ambush'
type VoteBetTokens = 0 | 1 | 2

const RISK_CLUE_PROFILES: RiskClueProfile[] = ['normal', 'sniper', 'narrow', 'ambush']

export class TacticalPayloadError extends Error {
  constructor(readonly code: string) {
    super(code)
    this.name = 'TacticalPayloadError'
  }
}

interface BaseCardSelectionPayload {
  card_id?: string
  gallery_card_id?: string
  challenge_leader: boolean
}

export interface SubmitCluePayload extends BaseCardSelectionPayload {
  clue: string
  risk_clue_profile: RiskClueProfile
}

export interface SubmitCardPayload extends BaseCardSelectionPayload {
  is_corrupted: boolean
}

export interface SubmitVotePayload {
  card_id: string
  bet_tokens: VoteBetTokens
  challenge_leader: boolean
}

function ensureSingleCardSelection(payload: { card_id?: string; gallery_card_id?: string }) {
  const hasCard = typeof payload.card_id === 'string' && payload.card_id.length > 0
  const hasGalleryCard =
    typeof payload.gallery_card_id === 'string' && payload.gallery_card_id.length > 0

  if (!hasCard && !hasGalleryCard) {
    throw new TacticalPayloadError('INVALID_PAYLOAD')
  }

  if (hasCard && hasGalleryCard) {
    throw new TacticalPayloadError('INVALID_PAYLOAD')
  }
}

function normalizeChallengeLeader(value: unknown) {
  return value === true
}

function normalizeRiskClueProfile(value: unknown): RiskClueProfile {
  if (value == null) return 'normal'
  if (typeof value === 'string' && RISK_CLUE_PROFILES.includes(value as RiskClueProfile)) {
    return value as RiskClueProfile
  }
  throw new TacticalPayloadError('INVALID_TACTICAL_ACTION')
}

function normalizeBetTokens(value: unknown): VoteBetTokens {
  if (value == null) return 0
  if (value === 0 || value === 1 || value === 2) return value
  throw new TacticalPayloadError('INVALID_TACTICAL_ACTION')
}

export function parseSubmitCluePayload(rawPayload: unknown): SubmitCluePayload {
  const payload = (rawPayload ?? {}) as {
    clue?: unknown
    card_id?: unknown
    gallery_card_id?: unknown
    risk_clue_profile?: unknown
    challenge_leader?: unknown
  }

  const clue = typeof payload.clue === 'string' ? payload.clue.trim() : ''
  if (clue.length === 0 || clue.length > 200) {
    throw new TacticalPayloadError('INVALID_PAYLOAD')
  }

  ensureSingleCardSelection({
    card_id: typeof payload.card_id === 'string' ? payload.card_id : undefined,
    gallery_card_id:
      typeof payload.gallery_card_id === 'string' ? payload.gallery_card_id : undefined,
  })

  return {
    clue,
    card_id: typeof payload.card_id === 'string' ? payload.card_id : undefined,
    gallery_card_id:
      typeof payload.gallery_card_id === 'string' ? payload.gallery_card_id : undefined,
    risk_clue_profile: normalizeRiskClueProfile(payload.risk_clue_profile),
    challenge_leader: normalizeChallengeLeader(payload.challenge_leader),
  }
}

export function parseSubmitCardPayload(rawPayload: unknown): SubmitCardPayload {
  const payload = (rawPayload ?? {}) as {
    card_id?: unknown
    gallery_card_id?: unknown
    is_corrupted?: unknown
    challenge_leader?: unknown
  }

  ensureSingleCardSelection({
    card_id: typeof payload.card_id === 'string' ? payload.card_id : undefined,
    gallery_card_id:
      typeof payload.gallery_card_id === 'string' ? payload.gallery_card_id : undefined,
  })

  return {
    card_id: typeof payload.card_id === 'string' ? payload.card_id : undefined,
    gallery_card_id:
      typeof payload.gallery_card_id === 'string' ? payload.gallery_card_id : undefined,
    is_corrupted: payload.is_corrupted === true,
    challenge_leader: normalizeChallengeLeader(payload.challenge_leader),
  }
}

export function parseSubmitVotePayload(rawPayload: unknown): SubmitVotePayload {
  const payload = (rawPayload ?? {}) as {
    card_id?: unknown
    bet_tokens?: unknown
    challenge_leader?: unknown
  }

  if (typeof payload.card_id !== 'string' || payload.card_id.length === 0) {
    throw new TacticalPayloadError('INVALID_PAYLOAD')
  }

  return {
    card_id: payload.card_id,
    bet_tokens: normalizeBetTokens(payload.bet_tokens),
    challenge_leader: normalizeChallengeLeader(payload.challenge_leader),
  }
}

export function assertSufficientIntuitionTokens(
  intuitionTokens: number,
  reservedCost: number | boolean,
) {
  const cost = typeof reservedCost === 'boolean' ? (reservedCost ? 1 : 0) : reservedCost
  if (intuitionTokens < cost) {
    throw new TacticalPayloadError('NOT_ENOUGH_INTUITION_TOKENS')
  }
}

export function assertChallengeLeaderAvailable(
  challengeLeader: boolean,
  soloLeaderId: string | null,
  playerId: string,
  alreadyUsed: boolean,
) {
  if (!challengeLeader) return
  if (!soloLeaderId || soloLeaderId === playerId || alreadyUsed) {
    throw new TacticalPayloadError('CHALLENGE_LEADER_UNAVAILABLE')
  }
}
