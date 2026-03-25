import fs from 'node:fs'
import path from 'node:path'

const playersPhaseSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'game-phases', 'PlayersPhase.tsx'), 'utf8')
const narratorPhaseSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'game-phases', 'NarratorPhase.tsx'), 'utf8')
const fanHandSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'game', 'FanHand.tsx'), 'utf8')
const handGridSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'game', 'HandGrid.tsx'), 'utf8')

test('players and narrator phases both use the fixed HandActionDock', () => {
  expect(playersPhaseSource).toContain('<HandActionDock')
  expect(narratorPhaseSource).toContain('<HandActionDock')
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
