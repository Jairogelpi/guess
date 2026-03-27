import {
  getChallengeLeaderState,
  getPhaseTacticalActions,
  getPrimaryTacticalHelperReason,
} from '../src/lib/tacticalActions'

describe('getPrimaryTacticalHelperReason', () => {
  test('prefers selection-required over other blocked reasons', () => {
    const actions = getPhaseTacticalActions({
      phase: 'narrator_turn',
      selectionActive: false,
      intuitionTokens: 0,
      isPhaseOwner: false,
      corruptedCardsRemaining: 2,
    })
    const challenge = getChallengeLeaderState({
      selectionActive: false,
      intuitionTokens: 0,
      playerId: 'p2',
      soloLeaderId: 'p1',
      challengeLeaderUsed: false,
    })

    expect(getPrimaryTacticalHelperReason(actions, challenge)).toBe(
      'game.tactics.notes.selectionRequired',
    )
  })

  test('falls back to insufficient-tokens before exhausted-usage reasons', () => {
    const actions = getPhaseTacticalActions({
      phase: 'voting',
      selectionActive: true,
      intuitionTokens: 0,
      isPhaseOwner: true,
      corruptedCardsRemaining: 2,
    })
    const challenge = getChallengeLeaderState({
      selectionActive: true,
      intuitionTokens: 0,
      playerId: 'p2',
      soloLeaderId: 'p1',
      challengeLeaderUsed: true,
    })

    expect(getPrimaryTacticalHelperReason(actions, challenge)).toBe(
      'game.tactics.notes.needTwoIntuition',
    )
  })
})
