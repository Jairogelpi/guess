import fs from 'fs'
import path from 'path'

const apiSource = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'api.ts'), 'utf8')
const gameActionsSource = fs.readFileSync(
  path.join(process.cwd(), 'src', 'hooks', 'useGameActions.ts'),
  'utf8',
)

describe('quick match api contracts', () => {
  test('api exposes enqueue, cancel, and status helpers', () => {
    expect(apiSource).toContain("('matchmaking-enqueue'")
    expect(apiSource).toContain("('matchmaking-cancel'")
    expect(apiSource).toContain("('matchmaking-status'")
  })

  test('useGameActions exposes quick match helpers', () => {
    expect(gameActionsSource).toContain('enqueueQuickMatch')
    expect(gameActionsSource).toContain('cancelQuickMatch')
    expect(gameActionsSource).toContain('getQuickMatchStatus')
  })
})
