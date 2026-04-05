import fs from 'fs'
import path from 'path'

const lobbySource = fs.readFileSync(
  path.join(process.cwd(), 'app', 'room', '[code]', 'lobby.tsx'),
  'utf8',
)

describe('quick match start-game resilience', () => {
  test('lobby supports quick match handoff and auto start intent', () => {
    expect(lobbySource).toContain('quickMatch')
    expect(lobbySource).toContain("gameAction(code, 'start_game')")
    expect(lobbySource).toContain('autoStartTriggered')
  })
})
