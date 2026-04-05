import fs from 'node:fs'
import path from 'node:path'

const playersPhaseSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'game-phases', 'PlayersPhase.tsx'), 'utf8')
const narratorPhaseSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'game-phases', 'NarratorPhase.tsx'), 'utf8')
const narratorSelectedFlowSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'game', 'NarratorSelectedCardFlow.tsx'), 'utf8')
const votingPhaseSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'game-phases', 'VotingPhase.tsx'), 'utf8')
const resultsPhaseSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'game-phases', 'ResultsPhase.tsx'), 'utf8')
const roundRecapOverlaySource = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'game', 'RoundRecapOverlay.tsx'), 'utf8')
const fanHandSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'game', 'FanHand.tsx'), 'utf8')
const handGridSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'game', 'HandGrid.tsx'), 'utf8')

test('players and narrator phases both use the fixed HandActionDock', () => {
  expect(playersPhaseSource).toContain('<HandActionDock')
  expect(narratorSelectedFlowSource).toContain('<HandActionDock')
})

test('narrator selected state does not pass a duplicated eyebrow into HandActionDock', () => {
  expect(narratorPhaseSource).not.toContain("eyebrow={t('game.writeClue')}")
})

test('narrator phase keeps tactical choices in the same selected-card flow', () => {
  expect(narratorSelectedFlowSource).toContain('<TacticalActionPicker')
})

test('narrator selected flow no longer nests a second scroll container', () => {
  expect(narratorPhaseSource).not.toContain('<ScrollView style={styles.scroll} contentContainerStyle={styles.selectedFormContent}>')
})

test('voting phase keeps the large card list and preview modal in the same render tree', () => {
  expect(votingPhaseSource).toContain('<VoteCardField')
  expect(votingPhaseSource).toContain('<Modal')
  expect(votingPhaseSource).toContain('return (')
  expect(votingPhaseSource).toContain('<>')
})

test('voting phase keeps actions inside the scroll flow instead of a fixed action bar', () => {
  expect(votingPhaseSource).toContain('<ScrollView')
  expect(votingPhaseSource).not.toContain('actionBar={')
})

test('results phase keeps reveal, round gallery, and standings in one readable flow', () => {
  expect(resultsPhaseSource).toContain('<ResultsReveal')
  expect(resultsPhaseSource).toContain('<CardGrid')
  expect(resultsPhaseSource).toContain('<ScoreBoard')
  expect(resultsPhaseSource).toContain('<RoundRecapOverlay')
  expect(resultsPhaseSource.indexOf('<ResultsReveal')).toBeLessThan(resultsPhaseSource.indexOf('<CardGrid'))
  expect(resultsPhaseSource.indexOf('<CardGrid')).toBeLessThan(resultsPhaseSource.indexOf('<ScoreBoard'))
})

test('round recap overlay uses animated presence for the round summary panel', () => {
  expect(roundRecapOverlaySource).toContain('Animated.View')
  expect(roundRecapOverlaySource).toContain('buildRoundRecapHeadline')
})

test('the old standalone submit button copy is gone from players turn', () => {
  // The old PlayersPhase had t('game.submitCard') as the standalone button label.
  // After the refactor, the CTA lives inside HandActionDock and uses the dock state ctaLabel.
  // We check that the old i18n key invocation is gone from the phase file itself.
  expect(playersPhaseSource).not.toContain("t('game.submitCard')")
})

test('FanHand delegates layout math to the pure helper layer', () => {
  expect(fanHandSource).toContain("from '@/components/game/fanHandLayout'")
})

test('legacy HandGrid does not keep the old PromptArea-only contract alive', () => {
  expect(handGridSource).not.toContain('<PromptArea')
})
