import fs from 'node:fs'
import path from 'node:path'

const gameScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'room', '[code]', 'game.tsx'),
  'utf8',
)

test('gameplay shell mounts live standings between the HUD and economy badges', () => {
  const gameStatusHudIndex = gameScreenSource.indexOf('<GameStatusHUD')
  const liveStandingsIndex = gameScreenSource.indexOf('<LiveStandingsStrip')
  const economyBadgesIndex = gameScreenSource.indexOf('<EconomyBadges')

  expect(gameStatusHudIndex).toBeGreaterThan(-1)
  expect(liveStandingsIndex).toBeGreaterThan(gameStatusHudIndex)
  expect(economyBadgesIndex).toBeGreaterThan(liveStandingsIndex)
})

test('narrator waiting shell overrides the tactical helper copy to narrator-only guidance', () => {
  expect(gameScreenSource).toMatch(
    /status === 'narrator_turn'[\s\S]*?<TacticalActionPicker[\s\S]*?helperTextOverrideKey="game\.tactics\.notes\.onlyNarratorRisk"/,
  )
})
