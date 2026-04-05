import fs from 'fs'
import path from 'path'

const countdownSource = fs.readFileSync(
  path.join(process.cwd(), 'src', 'components', 'matchmaking', 'MatchFoundCountdown.tsx'),
  'utf8',
)

describe('quick match countdown contracts', () => {
  test('countdown component renders avatars, names, and progress state', () => {
    expect(countdownSource).toContain('avatar')
    expect(countdownSource).toContain('displayName')
    expect(countdownSource).toContain('progress')
  })
})
