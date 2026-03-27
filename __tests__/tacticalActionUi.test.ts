import {
  getChallengeLeaderState,
  getPhaseTacticalActions,
  getPrimaryTacticalHelperReason,
} from '../src/lib/tacticalActions'

describe('getPrimaryTacticalHelperReason', () => {
  test('returns null when at least one tactical action remains enabled', () => {
    const actions = getPhaseTacticalActions({
      phase: 'voting',
      selectionActive: true,
      intuitionTokens: 1,
      isPhaseOwner: true,
      corruptedCardsRemaining: 2,
    })
    const challenge = getChallengeLeaderState({
      selectionActive: true,
      intuitionTokens: 1,
      playerId: 'p2',
      soloLeaderId: 'p1',
      challengeLeaderUsed: true,
    })

    expect(actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'bet_1', enabled: true, disabledReasonKey: null }),
        expect.objectContaining({
          id: 'bet_2',
          enabled: false,
          disabledReasonKey: 'game.tactics.notes.needTwoIntuition',
        }),
      ]),
    )
    expect(challenge).toEqual(
      expect.objectContaining({
        enabled: false,
        disabledReasonKey: 'game.tactics.notes.challengeSpent',
      }),
    )

    expect(getPrimaryTacticalHelperReason(actions, challenge)).toBeNull()
  })

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
