import fs from 'node:fs'
import path from 'node:path'

const gameScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'room', '[code]', 'game.tsx'),
  'utf8',
)

test('gameplay shell mounts live standings between the HUD and economy badges', () => {
  const unifiedHudIndex = gameScreenSource.indexOf('<UnifiedHUD')
  const narratorTurnIndex = gameScreenSource.indexOf("status === 'narrator_turn'")

  expect(unifiedHudIndex).toBeGreaterThan(-1)
  expect(narratorTurnIndex).toBeGreaterThan(unifiedHudIndex)
})

test('narrator waiting shell overrides the tactical helper copy to narrator-only guidance', () => {
  expect(gameScreenSource).toMatch(/status === 'narrator_turn'[\s\S]*?<WaitingCard/)
  expect(gameScreenSource).toContain("contextMessage={t('game.waitingForNarrator')}")
})
