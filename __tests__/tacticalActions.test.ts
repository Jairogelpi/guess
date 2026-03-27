import {
  MAX_INTUITION_TOKENS,
  getChallengeLeaderState,
  getPhaseTacticalActions,
  getSoloLeaderIdFromScores,
  getTacticalActionDefinition,
  type TacticalActionId,
} from '../src/lib/tacticalActions'

describe('tacticalActions unified competitive UI contract', () => {
  test('shows all narrator clue-risk options and enables them only for the narrator role', () => {
    expect(
      getPhaseTacticalActions({
        phase: 'narrator_turn',
        selectionActive: true,
        intuitionTokens: 1,
        isPhaseOwner: true,
        corruptedCardsRemaining: 2,
      }).map((action) => [action.id, action.enabled]),
    ).toEqual([
      ['risk_normal', true],
      ['risk_sniper', true],
      ['risk_narrow', true],
      ['risk_ambush', true],
    ] satisfies Array<[TacticalActionId, boolean]>)

    expect(
      getPhaseTacticalActions({
        phase: 'narrator_turn',
        selectionActive: true,
        intuitionTokens: 1,
        isPhaseOwner: false,
        corruptedCardsRemaining: 2,
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'risk_sniper',
          enabled: false,
          disabledReasonKey: 'game.tactics.notes.onlyNarratorRisk',
        }),
      ]),
    )
  })

  test('shows corrupted card in players turn and blocks it when tokens or remaining uses are missing', () => {
    expect(
      getPhaseTacticalActions({
        phase: 'players_turn',
        selectionActive: true,
        intuitionTokens: 1,
        isPhaseOwner: true,
        corruptedCardsRemaining: 2,
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'corrupted_card',
          enabled: true,
          costTokens: 1,
        }),
      ]),
    )

    expect(
      getPhaseTacticalActions({
        phase: 'players_turn',
        selectionActive: true,
        intuitionTokens: 1,
        isPhaseOwner: true,
        corruptedCardsRemaining: 0,
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'corrupted_card',
          enabled: false,
          disabledReasonKey: 'game.tactics.notes.noCorruptedCardsLeft',
        }),
      ]),
    )
  })

  test('shows both bet options in voting and blocks bet_2 when intuition is too low', () => {
    expect(
      getPhaseTacticalActions({
        phase: 'voting',
        selectionActive: true,
        intuitionTokens: 1,
        isPhaseOwner: true,
        corruptedCardsRemaining: 2,
      }).map((action) => ({
        id: action.id,
        enabled: action.enabled,
      })),
    ).toEqual([
      { id: 'bet_1', enabled: true },
      { id: 'bet_2', enabled: false },
    ])
  })

  test('challenge leader is visible but blocked when there is no solo leader or it was already spent', () => {
    expect(
      getChallengeLeaderState({
        selectionActive: true,
        intuitionTokens: 1,
        playerId: 'p2',
        soloLeaderId: null,
        challengeLeaderUsed: false,
      }),
    ).toEqual(
      expect.objectContaining({
        id: 'challenge_leader',
        enabled: false,
        disabledReasonKey: 'game.tactics.notes.challengeNoLeader',
      }),
    )

    expect(
      getChallengeLeaderState({
        selectionActive: true,
        intuitionTokens: 1,
        playerId: 'p2',
        soloLeaderId: 'p1',
        challengeLeaderUsed: true,
      }),
    ).toEqual(
      expect.objectContaining({
        enabled: false,
        disabledReasonKey: 'game.tactics.notes.challengeSpent',
      }),
    )
  })

  test('keeps stable shared competitive constants and metadata for ambush and bet_2', () => {
    expect(MAX_INTUITION_TOKENS).toBe(10)
    expect(getSoloLeaderIdFromScores([
      { player_id: 'p1', score: 12 },
      { player_id: 'p2', score: 9 },
    ])).toBe('p1')
    expect(getTacticalActionDefinition('risk_ambush')).toEqual(
      expect.objectContaining({
        id: 'risk_ambush',
        icon: 'target-account',
        costTokens: 1,
      }),
    )
    expect(getTacticalActionDefinition('bet_2')).toEqual(
      expect.objectContaining({
        id: 'bet_2',
        icon: 'dice-multiple',
        costTokens: 2,
      }),
    )
  })
})
