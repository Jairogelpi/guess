type Dictionary = Record<string, unknown>

const es = require('../src/i18n/locales/es.json') as Dictionary
const en = require('../src/i18n/locales/en.json') as Dictionary

const requiredLobbyCopy = [
  'lobby.codeCopied',
  'lobby.preparation',
  'lobby.notFound',
  'lobby.loadFailed',
  'lobby.hostWaiting_one',
  'lobby.hostWaiting_other',
  'lobby.hostWaitingReady',
  'lobby.hostReady',
  'lobby.readySubmitted',
  'lobby.guestWaiting',
  'lobby.roomCode',
  'lobby.shareInviteLink',
  'lobby.roomRules',
  'lobby.guestReadyHint',
  'lobby.readyUp',
  'lobby.undoReady',
  'lobby.inviteMessage',
  'errors.PLAYERS_NOT_READY',
] as const

const requiredGameCopy = [
  'game.waitingForNarrator',
  'game.waitingForVotes',
  'game.waitingMore_one',
  'game.waitingMore_other',
  'game.waitingOrder',
  'game.waitingCurrentPlayer',
  'game.waitingConfirm',
  'game.endGame',
  'game.narratorCardReveal',
  'game.narratorBadge',
  'game.roundCardsTitle',
  'game.roundStandingsTitle',
  'game.roundRecapTitle',
  'game.roundRecapTopMovers',
  'game.roundRecapCurrentLeader',
  'game.roundRecapNoSummary',
  'game.tactics.eyebrow',
  'game.tactics.title',
  'game.tactics.intuitionTokens_one',
  'game.tactics.intuitionTokens_other',
  'game.tactics.selectedAction',
  'game.tactics.challengeLeaderSelected',
  'game.tactics.clearSelection',
  'game.tactics.sheetTitle',
  'game.tactics.costIntuition_one',
  'game.tactics.costIntuition_other',
  'game.tactics.detailLabel',
  'game.tactics.rewardLabel',
  'game.tactics.riskLabel',
  'game.tactics.activateChallenge',
  'game.tactics.useThisTactic',
  'game.tactics.actions.risk_normal.name',
  'game.tactics.actions.risk_normal.short',
  'game.tactics.actions.risk_normal.detail',
  'game.tactics.actions.risk_normal.reward',
  'game.tactics.actions.risk_normal.risk',
  'game.tactics.actions.risk_sniper.name',
  'game.tactics.actions.risk_sniper.short',
  'game.tactics.actions.risk_sniper.detail',
  'game.tactics.actions.risk_sniper.reward',
  'game.tactics.actions.risk_sniper.risk',
  'game.tactics.actions.risk_narrow.name',
  'game.tactics.actions.risk_narrow.short',
  'game.tactics.actions.risk_narrow.detail',
  'game.tactics.actions.risk_narrow.reward',
  'game.tactics.actions.risk_narrow.risk',
  'game.tactics.actions.risk_ambush.name',
  'game.tactics.actions.risk_ambush.short',
  'game.tactics.actions.risk_ambush.detail',
  'game.tactics.actions.risk_ambush.reward',
  'game.tactics.actions.risk_ambush.risk',
  'game.tactics.actions.corrupted_card.name',
  'game.tactics.actions.corrupted_card.short',
  'game.tactics.actions.corrupted_card.detail',
  'game.tactics.actions.corrupted_card.reward',
  'game.tactics.actions.corrupted_card.risk',
  'game.tactics.actions.bet_1.name',
  'game.tactics.actions.bet_1.short',
  'game.tactics.actions.bet_1.detail',
  'game.tactics.actions.bet_1.reward',
  'game.tactics.actions.bet_1.risk',
  'game.tactics.actions.bet_2.name',
  'game.tactics.actions.bet_2.short',
  'game.tactics.actions.bet_2.detail',
  'game.tactics.actions.bet_2.reward',
  'game.tactics.actions.bet_2.risk',
  'game.tactics.challengeLeader.name',
  'game.tactics.challengeLeader.short',
  'game.tactics.challengeLeader.detail',
  'game.tactics.challengeLeader.reward',
  'game.tactics.challengeLeader.risk',
  'game.tactics.notes.onlyNarratorRisk',
  'game.tactics.notes.selectionRequired',
  'game.tactics.notes.noCorruptedCardsLeft',
  'game.tactics.notes.needTwoIntuition',
  'game.tactics.notes.needOneIntuition',
  'game.tactics.notes.challengeSpent',
  'game.tactics.notes.challengeNoLeader',
  'game.tactics.notes.challengeSelfLeader',
  'game.tactics.notes.challengeNeedIntuition',
] as const

function getValue(source: Dictionary, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Dictionary)[segment]
  }, source)
}

describe('lobby translation coverage', () => {
  test.each([
    ['es', es],
    ['en', en],
  ])('%s locale contains the copy consumed by the lobby screen', (_locale, dictionary) => {
    for (const path of requiredLobbyCopy) {
      const value = getValue(dictionary, path)
      expect(typeof value).toBe('string')
      expect((value as string).trim().length).toBeGreaterThan(0)
    }
  })
})

describe('game translation coverage', () => {
  test.each([
    ['es', es],
    ['en', en],
  ])('%s locale contains the waiting and tactics copy consumed by the game screen', (_locale, dictionary) => {
    for (const path of requiredGameCopy) {
      const value = getValue(dictionary, path)
      expect(typeof value).toBe('string')
      expect((value as string).trim().length).toBeGreaterThan(0)
    }
  })
})
